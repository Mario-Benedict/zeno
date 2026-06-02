<?php

namespace App\Http\Controllers;

use App\Models\LlmChat\LlmChatMessage;
use App\Models\LlmChat\LlmChatSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\LlmChat\LlmModel;

use Illuminate\Support\Str;
use Gemini\Laravel\Facades\Gemini;
use Gemini\Data\Content;
use Gemini\Enums\Role;
use Inertia\Inertia;

use App\Models\Project;

class LlmChatController extends Controller
{
  public function index(Project $project)
  {
    $sessions = LlmChatSession::where('llm_chat_account_id', Auth::id())->orderBy('updated_at', 'desc')->get();
    return Inertia::render('LlmChat/Index', [
        'project' => $project,
        'sessions' => $sessions
    ]);
  }

  public function switch(Project $project, $llm_chat_session_id)
  {
    $sessions = LlmChatSession::where('llm_chat_account_id', Auth::id())->orderBy('updated_at', 'desc')->get();

    $activeSession = LlmChatSession::where('llm_chat_session_id', $llm_chat_session_id)
      ->where('llm_chat_account_id', Auth::id())
      ->firstOrFail();

    $content = LlmChatMessage::where('llm_chat_session_id', $activeSession->llm_chat_session_id)->orderBy('created_at', 'asc')->get();

    return Inertia::render('LlmChat/Index', [
        'project' => $project,
        'sessions' => $sessions,
        'content' => $content,
        'llm_chat_session_id' => $llm_chat_session_id,
        'activeSession' => $activeSession
    ]);
  }

  public function ask(Request $request, Project $project)
  {
    $request->validate([
      'question' => 'required|string'
    ]);

    $question = $request->question;

    // 1. Ambil model gemini-2.5-flash dari DB. Kalau belum ada, kita ambil sembarang yang ada.
    $model = LlmModel::where('llm_model_name', 'gemini-2.5-flash')->first();

    // Fallback jika di database tidak ditemukan model gemini-2.5-flash
    if (!$model) {
        $model = LlmModel::first();
    }

    // 2. Bikin Sesi Chat Baru
    $newSessionId = Str::uuid()->toString();
    $session = LlmChatSession::create([
        'llm_chat_session_id' => $newSessionId,
        'llm_chat_account_id' => Auth::id(),
        'llm_chat_session_name' => substr($question, 0, 15) . '...', // Nama chat diambil dari 15 huruf pertama
        'llm_chat_current_model_id' => $model->llm_model_id
    ]);

    // 3. Simpan Pesan Kamu (User) ke Database
    LlmChatMessage::create([
        'llm_chat_message_id' => Str::uuid()->toString(),
        'llm_chat_session_id' => $newSessionId,
        'role' => 'user',
        'content' => $question
    ]);

    // 4. Tanya AI pakai nama model dari Database
    try {
        $result = Gemini::generativeModel($model->llm_model_name)->generateContent($question);
        $aiResponse = $result->text();

        // 5. Simpan Pesan AI ke Database
        LlmChatMessage::create([
            'llm_chat_message_id' => Str::uuid()->toString(),
            'llm_chat_session_id' => $newSessionId,
            'role' => 'model', // Sesuai kesepakatan ERD
            'content' => $aiResponse
        ]);

    } catch (\Exception $e) {
        // Kalau error dari Google, simpan pesan errornya
        LlmChatMessage::create([
            'llm_chat_message_id' => Str::uuid()->toString(),
            'llm_chat_session_id' => $newSessionId,
            'role' => 'model',
            'content' => 'Error API Gemini: ' . $e->getMessage()
        ]);
    }

    // 6. Selesai! Lempar user ke halaman Sesi yang baru saja dibuat
    return redirect()->route('chat.switch', ['project' => $project->project_slug, 'llm_chat_session_id' => $newSessionId]);
  }

  // Fungsi tambahan untuk meneruskan chat di sesi yang SAMA
  public function reply(Request $request, Project $project, $llm_chat_session_id)
  {
      $request->validate(['question' => 'required|string']);

      // 0. Ambil Sesi saat ini untuk mengetahui model apa yang dipakai (dari relasi llmModels)
      $session = LlmChatSession::with('llmModels')->findOrFail($llm_chat_session_id);
      $modelName = $session->llmModels ? $session->llmModels->llm_model_name : 'gemini-2.5-flash';

      // 1. Ambil history sebelum pesan baru ditambahkan dari DB berdasarkan Sesi ini
      // Kita ambil urut dari yang terlama menggunakan oldest()
      $history = LlmChatMessage::where('llm_chat_session_id', $llm_chat_session_id)
          ->orderBy('created_at', -1)
          ->take(10)
          ->get()
          ->reverse()
          ->map(function($chat) {
              return Content::parse(part: $chat->content, role: $chat->role === 'user' ? Role::USER : Role::MODEL);
          })->toArray();

      // 2. Mulai sesi chat dengan membawa context history tersebut
      $chatInstance = Gemini::generativeModel($modelName)->startChat(history: $history);

      // 3. Simpan Pesan Baru Kamu di Database
      LlmChatMessage::create([
          'llm_chat_message_id' => Str::uuid()->toString(),
          'llm_chat_session_id' => $llm_chat_session_id,
          'role' => 'user',
          'content' => $request->question
      ]);

      // 4. Tanya AI pakai instance yang sudah ada history-nya
      try {
          $response = $chatInstance->sendMessage($request->question);
          $aiResponse = $response->text();

          // 5. Simpan balasan AI ke DB
          LlmChatMessage::create([
              'llm_chat_message_id' => Str::uuid()->toString(),
              'llm_chat_session_id' => $llm_chat_session_id,
              'role' => 'model',
              'content' => $aiResponse
          ]);
      } catch (\Exception $e) {
          LlmChatMessage::create([
              'llm_chat_message_id' => Str::uuid()->toString(),
              'llm_chat_session_id' => $llm_chat_session_id,
              'role' => 'model',
              'content' => 'Error API Gemini: ' . $e->getMessage()
          ]);
      }

      // 6. Kembali ke layar itu
      return redirect()->route('chat.switch', ['project' => $project->project_slug, 'llm_chat_session_id' => $llm_chat_session_id]);
  }
}

<?php

use App\Models\User;
use App\Models\LlmChat\LlmModel;
use App\Models\LlmChat\LlmChatSession;
use App\Models\LlmChat\LlmChatMessage;
use Illuminate\Support\Str;
use Gemini\Laravel\Facades\Gemini;
use Gemini\Responses\GenerativeModel\GenerateContentResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Bersihkan collection mongo setiap kali selesai tes
    LlmChatMessage::truncate();
});

it('prevents guests from accessing chat index', function () {
    $response = $this->get('/llmchat');
    $response->assertStatus(302);
});

it('allows authenticated users to access chat index', function () {
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/llmchat');
    $response->assertStatus(200);
});

it('bisa membuat chat session baru dan menyimpan ke MongoDB', function () {
    $user = User::factory()->create();

    $modelId = Str::uuid()->toString();
    LlmModel::create([
        'llm_model_id' => $modelId,
        'llm_model_provider' => 'google',
        'llm_model_name' => 'gemini-2.5-flash',
    ]);

    Gemini::fake([
        GenerateContentResponse::fake([
            'candidates' => [
                [
                    'content' => [
                        'parts' => [
                            ['text' => 'Halo, saya AI Gemini!']
                        ]
                    ]
                ]
            ]
        ])
    ]);

    // Act
    $response = $this->actingAs($user)->post('/llmchat/new', [
        'question' => 'Halo, apa kabar?'
    ]);

    $response->assertStatus(302); // Redirect back

    $session = LlmChatSession::where('llm_chat_account_id', $user->id)->first();
    expect($session)->not->toBeNull();
    expect($session->llm_chat_session_name)->toBe("Halo, apa kabar...");

    $messages = LlmChatMessage::where('llm_chat_session_id', $session->llm_chat_session_id)->oldest()->get();
    expect($messages)->toHaveCount(2);

    expect($messages[0]->role)->toBe('user');
    expect($messages[0]->content)->toBe('Halo, apa kabar?');

    expect($messages[1]->role)->toBe('model');
    expect($messages[1]->content)->toBe('Halo, saya AI Gemini!');
});

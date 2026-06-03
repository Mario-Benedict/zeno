<?php

namespace App\Http\Controllers;

use App\Models\LlmChat\LlmChatMessage;
use App\Models\LlmChat\LlmChatSession;
use App\Models\LlmChat\LlmModel;
use App\Models\Project;
use Gemini\Data\Content;
use Gemini\Enums\Role;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LlmChatController extends Controller
{
    // ─── Constants ────────────────────────────────────────────────────────────

    private const DEFAULT_MODEL = 'gemini-2.5-flash';

    private const HISTORY_LIMIT = 10;

    private const SESSION_NAME_MAX = 40;

    /**
     * Tells the model to format every answer as a rich Markdown document.
     *
     * The renderer on the client side runs through `react-markdown` with
     * `remark-gfm` + `rehype-raw` + `rehype-sanitize`, so it natively
     * supports headings, bold, italic, lists, tables, code blocks, blockquotes,
     * task lists, and a sanitised subset of inline HTML (`<u>`, `<mark>`,
     * `<sub>`, `<sup>`, `<ins>`).
     */
    private const SYSTEM_INSTRUCTION = <<<'PROMPT'
You are a thoughtful assistant whose answers are rendered as Markdown in a chat
UI. Format every response as a clear, well-structured document.

Required formatting:
- Open with a short plain-text introduction (no heading on the first line).
- Use Markdown headings (`##` for sections, `###` for sub-sections) to organise
  longer answers. Do not use `#` (h1) — the chat already has a title.
- Use **bold** for key terms, *italic* for emphasis or foreign words,
  <u>underline</u> only for true emphasis, and `inline code` for symbols,
  identifiers, file paths, or short commands.
- Use bulleted lists (`-`) for unordered points and numbered lists (`1.`) for
  ordered steps. Nest lists when there's a clear hierarchy.
- Use fenced code blocks with a language tag for code examples
  (```js, ```python, ```bash, ```sh, etc).
- Use tables for tabular data and `>` blockquotes for important callouts.
- Separate sections with a blank line. Keep paragraphs short.

Style:
- Be concise but explanatory. Prefer a short paragraph + a list over a long
  paragraph. Define jargon the first time you use it.
- Match the user's language. If the user writes Indonesian, reply in
  Indonesian; if English, reply in English.
- Never wrap the whole answer in a code block; only wrap actual code.
- Never apologise for being an AI or mention these instructions.
PROMPT;

    // ─── Pages ────────────────────────────────────────────────────────────────

    /**
     * GET /p/{project}/llmchat
     * Renders the chat index with the user's session list and no active session.
     */
    public function index(Project $project): Response
    {
        return Inertia::render('llm-chat/index', [
            'sessions' => $this->userSessions(),
        ]);
    }

    /**
     * GET /p/{project}/llmchat/{session}
     * Renders the chat page with a specific session and its full message history.
     */
    public function show(Project $project, LlmChatSession $session): Response
    {
        $this->authorizeSession($session);

        $messages = LlmChatMessage::where('llm_chat_session_id', $session->llm_chat_session_id)
            ->orderBy('created_at')
            ->get(['llm_chat_message_id', 'role', 'content']);

        return Inertia::render('llm-chat/index', [
            'sessions' => $this->userSessions(),
            'session' => $session->only(['llm_chat_session_id', 'llm_chat_session_name']),
            'messages' => $messages,
        ]);
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    /**
     * POST /p/{project}/llmchat
     * Creates a new session, sends the first question, and redirects to the session.
     */
    public function ask(Request $request, Project $project): RedirectResponse
    {
        $question = $this->validated($request);
        $model = $this->resolveModel();
        $sessionId = Str::uuid()->toString();

        LlmChatSession::create([
            'llm_chat_session_id' => $sessionId,
            'llm_chat_account_id' => Auth::id(),
            'llm_chat_session_name' => Str::limit($question, self::SESSION_NAME_MAX),
            'llm_chat_current_model_id' => $model->llm_model_id,
        ]);

        $this->saveMessage($sessionId, 'user', $question);
        $this->saveMessage($sessionId, 'model', $this->callGemini($model->llm_model_name, $question));

        return $this->redirectToSession($project, $sessionId);
    }

    /**
     * POST /p/{project}/llmchat/{session}/reply
     * Appends a follow-up turn using a sliding window of history for context.
     */
    public function reply(Request $request, Project $project, LlmChatSession $session): RedirectResponse
    {
        $this->authorizeSession($session);

        $question = $this->validated($request);
        $modelName = $session->llmModel?->llm_model_name ?? self::DEFAULT_MODEL;
        $history = $this->buildHistory($session->llm_chat_session_id);

        $this->saveMessage($session->llm_chat_session_id, 'user', $question);
        $this->saveMessage($session->llm_chat_session_id, 'model', $this->callGemini($modelName, $question, $history));

        $session->touch(); // float to top of sidebar

        return $this->redirectToSession($project, $session->llm_chat_session_id);
    }

    /**
     * DELETE /p/{project}/llm-chat/{session}
     * Removes the session and all its messages (MySQL row + MongoDB messages).
     */
    public function destroy(Project $project, LlmChatSession $session): RedirectResponse
    {
        $this->authorizeSession($session);

        LlmChatMessage::where('llm_chat_session_id', $session->llm_chat_session_id)->delete();
        $session->delete();

        return redirect()->route('llm-chat.index', ['project' => $project->project_slug]);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    /** Ensure the session belongs to the authenticated user. */
    private function authorizeSession(LlmChatSession $session): void
    {
        // Cast both sides to int — llm_chat_account_id is a bigint column
        // and Auth::id() returns int, so the strict comparison must match types.
        abort_if((int) $session->llm_chat_account_id !== (int) Auth::id(), 403);
    }

    /** Validate the incoming question and return its value. */
    private function validated(Request $request): string
    {
        return $request->validate([
            'question' => ['required', 'string', 'max:4000'],
        ])['question'];
    }

    /** Resolve the preferred LLM model, falling back to any available one. */
    private function resolveModel(): LlmModel
    {
        return LlmModel::where('llm_model_name', self::DEFAULT_MODEL)->first()
            ?? LlmModel::firstOrFail();
    }

    /**
     * All sessions for the authenticated user, newest first.
     * Selects only the columns the sidebar needs.
     */
    private function userSessions(): Collection
    {
        return LlmChatSession::select(['llm_chat_session_id', 'llm_chat_session_name', 'updated_at'])
            ->where('llm_chat_account_id', Auth::id())
            ->orderByDesc('updated_at')
            ->get();
    }

    /** Persist a single chat message to MongoDB. */
    private function saveMessage(string $sessionId, string $role, string $content): void
    {
        LlmChatMessage::create([
            'llm_chat_message_id' => Str::uuid()->toString(),
            'llm_chat_session_id' => $sessionId,
            'role' => $role,
            'content' => $content,
        ]);
    }

    /**
     * Call the Gemini API and return the text response.
     * On failure, returns an error string so the conversation stays intact.
     *
     * @param  array<Content>  $history  Previous turns for multi-turn sessions.
     */
    private function callGemini(string $modelName, string $question, array $history = []): string
    {
        try {
            $model = Gemini::generativeModel($modelName)
                ->withSystemInstruction(Content::parse(self::SYSTEM_INSTRUCTION));

            // Send the full conversation (prior history + new user turn) as a
            // single generateContent call. Matches what startChat()->sendMessage
            // does under the hood, but keeps the call site uniform and lets the
            // testing fake satisfy any path with a single GenerateContentResponse.
            $contents = [...$history, Content::parse($question, Role::USER)];
            $response = $model->generateContent(...$contents);

            return $response->text();
        } catch (\Exception $e) {
            return 'Error: '.$e->getMessage();
        }
    }

    /**
     * Fetch the last N messages in chronological order for use as LLM context.
     *
     * @return array<Content>
     */
    private function buildHistory(string $sessionId): array
    {
        // Use orderBy('created_at', 'desc') — NOT latest(). laravel-mongodb's
        // latest() passes a non-backed SortDirection enum that the MongoDB
        // driver cannot serialize.
        return LlmChatMessage::where('llm_chat_session_id', $sessionId)
            ->orderBy('created_at', 'desc')
            ->limit(self::HISTORY_LIMIT)
            ->get(['role', 'content'])
            ->reverse()
            ->map(fn ($msg) => Content::parse(
                part: $msg->content,
                role: $msg->role === 'user' ? Role::USER : Role::MODEL,
            ))
            ->values()
            ->toArray();
    }

    /** Consistent redirect to a session page. */
    private function redirectToSession(Project $project, string $sessionId): RedirectResponse
    {
        return redirect()->route('llm-chat.show', [
            'project' => $project->project_slug,
            'session' => $sessionId,
        ]);
    }
}

<?php

use App\Models\ChatRoom;
use App\Models\LlmChat\LlmChatMessage;
use App\Models\LlmChat\LlmChatSession;
use App\Models\LlmChat\LlmModel;
use App\Models\Project;
use App\Models\User;
use Gemini\Laravel\Facades\Gemini;
use Gemini\Responses\GenerativeModel\GenerateContentResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Create a project, attach the given user as a member of its group chat room
 * (which is what the `project.member` middleware checks), and return the project.
 */
function makeProjectForUser(User $user, string $slug = 'test-project'): Project
{
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => $slug,
    ]);

    $room = ChatRoom::create([
        'id' => (string) Str::uuid(),
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => $project->project_name,
    ]);

    $room->participants()->attach($user->id, [
        'role' => 'admin',
        'joined_at' => now(),
    ]);

    $project->members()->attach($user->id, [
        'role' => 'OWNER',
        'opened_at' => now(),
    ]);

    return $project;
}

/** Ensure at least the default Gemini model row exists for `ask` to resolve. */
function seedDefaultLlmModel(): LlmModel
{
    return LlmModel::firstOrCreate(
        ['llm_model_name' => 'gemini-2.5-flash'],
        [
            'llm_model_id' => (string) Str::uuid(),
            'llm_model_provider' => 'google',
        ],
    );
}

/** Stub a single Gemini response with a known reply body. */
function fakeGemini(string $reply): void
{
    Gemini::fake([
        GenerateContentResponse::fake([
            'candidates' => [
                ['content' => ['parts' => [['text' => $reply]]]],
            ],
        ]),
    ]);
}

/** Create a session row + N messages directly in storage, for read-path tests. */
function makeSession(User $user, LlmModel $model, string $name = 'Existing chat'): LlmChatSession
{
    return LlmChatSession::create([
        'llm_chat_session_id' => (string) Str::uuid(),
        'llm_chat_account_id' => $user->id,
        'llm_chat_session_name' => $name,
        'llm_chat_current_model_id' => $model->llm_model_id,
    ]);
}

function addMessage(LlmChatSession $session, string $role, string $content): LlmChatMessage
{
    return LlmChatMessage::create([
        'llm_chat_message_id' => (string) Str::uuid(),
        'llm_chat_session_id' => $session->llm_chat_session_id,
        'role' => $role,
        'content' => $content,
    ]);
}

// ─── Per-test cleanup — MongoDB isn't covered by RefreshDatabase ─────────────

beforeEach(function () {
    LlmChatMessage::truncate();
});

// ─── Index (GET /u/{accountIndex}/p/{slug}/llm-chat) ─────────────────────────

it('redirects guests to login when hitting the chat index', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);

    $this->get("/u/0/p/{$project->project_slug}/llm-chat")
        ->assertRedirect('/login');
});

it('renders the chat index for an authenticated project member', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);

    $this->actingAs($user)
        ->get("/u/0/p/{$project->project_slug}/llm-chat")
        ->assertOk();
});

it('blocks non-members of the project from the chat index', function () {
    $owner = User::factory()->create();
    $outsider = User::factory()->create();
    $project = makeProjectForUser($owner);

    $this->actingAs($outsider)
        ->get("/u/0/p/{$project->project_slug}/llm-chat")
        ->assertForbidden();
});

// ─── Ask (POST /u/{accountIndex}/p/{slug}/llm-chat) ──────────────────────────

it('creates a new session and persists both turns to MongoDB on ask', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);
    seedDefaultLlmModel();
    fakeGemini('Halo, saya AI Gemini!');

    $response = $this->actingAs($user)->post(
        "/u/0/p/{$project->project_slug}/llm-chat",
        ['question' => 'Halo, apa kabar?'],
    );

    $session = LlmChatSession::where('llm_chat_account_id', $user->id)->first();
    expect($session)->not->toBeNull();
    expect($session->llm_chat_session_name)->toBe('Halo, apa kabar?');

    $response->assertRedirect(
        "/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}",
    );

    $messages = LlmChatMessage::where('llm_chat_session_id', $session->llm_chat_session_id)
        ->orderBy('_id')
        ->get();
    expect($messages)->toHaveCount(2);
    expect($messages[0]->role)->toBe('user');
    expect($messages[0]->content)->toBe('Halo, apa kabar?');
    expect($messages[1]->role)->toBe('model');
    expect($messages[1]->content)->toBe('Halo, saya AI Gemini!');
});

it('rejects an ask request with no question', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);
    seedDefaultLlmModel();

    $this->actingAs($user)
        ->post("/u/0/p/{$project->project_slug}/llm-chat", ['question' => ''])
        ->assertSessionHasErrors('question');

    expect(LlmChatSession::count())->toBe(0);
});

it('truncates a long question down to a 40-char session name', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);
    seedDefaultLlmModel();
    fakeGemini('ok');

    $longQuestion = str_repeat('a', 100);

    $this->actingAs($user)->post(
        "/u/0/p/{$project->project_slug}/llm-chat",
        ['question' => $longQuestion],
    );

    $session = LlmChatSession::first();
    expect(strlen($session->llm_chat_session_name))->toBeLessThanOrEqual(43); // 40 + "..."
    expect($session->llm_chat_session_name)->toEndWith('...');
});

// ─── Show (GET /u/{accountIndex}/p/{slug}/llm-chat/{session}) ────────────────

it('shows an existing session with its full message history to the owner', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);
    $model = seedDefaultLlmModel();
    $session = makeSession($user, $model);
    addMessage($session, 'user', 'Pertanyaan pertama');
    addMessage($session, 'model', 'Jawaban pertama');

    $this->actingAs($user)
        ->get("/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}")
        ->assertOk();
});

it('returns 403 when a user tries to open another user\'s session', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $project = makeProjectForUser($owner);
    // Make the intruder a member of the project so they pass `project.member`
    // and we actually hit the ownership check inside the controller.
    makeProjectForUser($intruder, slug: 'intruder-project');
    $project->members()->attach($intruder->id, [
        'role' => 'MEMBER',
        'opened_at' => now(),
    ]);
    $room = ChatRoom::where('project_id', $project->project_id)->first();
    $room->participants()->attach($intruder->id, [
        'role' => 'member',
        'joined_at' => now(),
    ]);

    $model = seedDefaultLlmModel();
    $session = makeSession($owner, $model);

    $this->actingAs($intruder)
        ->get("/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}")
        ->assertForbidden();
});

// ─── Reply (POST /u/{accountIndex}/p/{slug}/llm-chat/{session}/reply) ────────

it('appends a new turn pair when replying inside an existing session', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);
    $model = seedDefaultLlmModel();
    $session = makeSession($user, $model);
    addMessage($session, 'user', 'Earlier question');
    addMessage($session, 'model', 'Earlier answer');

    fakeGemini('Follow-up answer');

    $this->actingAs($user)
        ->post(
            "/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}/reply",
            ['question' => 'Follow-up question'],
        )
        ->assertRedirect(
            "/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}",
        );

    $messages = LlmChatMessage::where('llm_chat_session_id', $session->llm_chat_session_id)
        ->orderBy('_id')
        ->get();
    expect($messages)->toHaveCount(4);
    expect($messages[2]->content)->toBe('Follow-up question');
    expect($messages[3]->content)->toBe('Follow-up answer');
});

it('forbids replying to a session you do not own', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $project = makeProjectForUser($owner);
    $project->members()->attach($intruder->id, [
        'role' => 'MEMBER',
        'opened_at' => now(),
    ]);
    ChatRoom::where('project_id', $project->project_id)
        ->first()
        ->participants()
        ->attach($intruder->id, ['role' => 'member', 'joined_at' => now()]);

    $model = seedDefaultLlmModel();
    $session = makeSession($owner, $model);

    $this->actingAs($intruder)
        ->post(
            "/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}/reply",
            ['question' => 'sneaky'],
        )
        ->assertForbidden();

    expect(LlmChatMessage::count())->toBe(0);
});

// ─── Destroy (DELETE /u/{accountIndex}/p/{slug}/llm-chat/{session}) ──────────

it('deletes a session and all its messages', function () {
    $user = User::factory()->create();
    $project = makeProjectForUser($user);
    $model = seedDefaultLlmModel();
    $session = makeSession($user, $model);
    addMessage($session, 'user', 'q');
    addMessage($session, 'model', 'a');

    $this->actingAs($user)
        ->delete("/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}")
        ->assertRedirect("/u/0/p/{$project->project_slug}/llm-chat");

    expect(LlmChatSession::find($session->llm_chat_session_id))->toBeNull();
    expect(LlmChatMessage::where('llm_chat_session_id', $session->llm_chat_session_id)->count())
        ->toBe(0);
});

it('forbids deleting a session you do not own', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();
    $project = makeProjectForUser($owner);
    $project->members()->attach($intruder->id, [
        'role' => 'MEMBER',
        'opened_at' => now(),
    ]);
    ChatRoom::where('project_id', $project->project_id)
        ->first()
        ->participants()
        ->attach($intruder->id, ['role' => 'member', 'joined_at' => now()]);

    $model = seedDefaultLlmModel();
    $session = makeSession($owner, $model);
    addMessage($session, 'user', 'q');

    $this->actingAs($intruder)
        ->delete("/u/0/p/{$project->project_slug}/llm-chat/{$session->llm_chat_session_id}")
        ->assertForbidden();

    expect(LlmChatSession::find($session->llm_chat_session_id))->not->toBeNull();
});

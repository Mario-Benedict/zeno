<?php

use App\Models\CalendarEvent;
use App\Models\ChatRoom;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatMessageService;
use App\Services\MongoDB\MongoConnection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    Storage::fake('public');

    $this->owner = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Doomed Project',
        'project_slug' => 'doomed-project',
    ]);
    $this->project->members()->attach($this->owner->id, ['role' => 'OWNER']);

    $this->room = ChatRoom::create([
        'project_id' => $this->project->project_id,
        'type' => 'group',
        'name' => $this->project->project_name,
    ]);
    $this->room->participants()->attach($this->owner->id, [
        'role' => 'admin',
        'joined_at' => now(),
    ]);

    $sent = app(ChatMessageService::class)->send($this->room, $this->owner, [
        'type' => 'image',
        'body' => '',
        'attachments' => [[
            'file' => UploadedFile::fake()->image('shared.png'),
            'type' => 'image',
        ]],
    ]);
    $this->attachmentPath = $sent['attachments'][0]['path'];

    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);
    $this->card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Do the thing',
        'is_completed' => false,
    ]);

    $this->note = Note::create([
        'project_id' => $this->project->project_id,
        'user_id' => $this->owner->id,
        'title' => 'A note',
        'content' => [],
    ]);
    $this->noteImagePath = Storage::disk('public')->putFile(
        "notes/{$this->note->note_id}/images",
        UploadedFile::fake()->image('embedded.png'),
    );

    $this->calendarEvent = CalendarEvent::create([
        'project_id' => $this->project->project_id,
        'title' => 'Kickoff',
        'start_time' => now()->addDay(),
        'end_time' => now()->addDay()->addHour(),
        'created_by' => $this->owner->id,
        'recurrence' => 'none',
    ]);
    $this->calendarEvent->participants()->attach($this->owner->id);

    $avatar = UploadedFile::fake()->image('avatar.png');
    $this->project->update(['avatar_url' => $avatar->store('project-avatars', 'public')]);
});

it('cascades every MySQL row tied to the project when it is deleted', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->delete("/u/0/p/{$this->project->project_slug}")
        ->assertRedirect();

    $this->assertDatabaseMissing('projects', ['project_id' => $this->project->project_id]);
    $this->assertDatabaseMissing('project_user', ['project_id' => $this->project->project_id]);
    $this->assertDatabaseMissing('kanban_boards', ['kanban_board_id' => $this->board->kanban_board_id]);
    $this->assertDatabaseMissing('kanban_board_cards', ['kanban_board_card_id' => $this->card->kanban_board_card_id]);
    $this->assertDatabaseMissing('chat_rooms', ['id' => $this->room->id]);
    $this->assertDatabaseMissing('chat_room_participants', ['chat_room_id' => $this->room->id]);
    $this->assertDatabaseMissing('notes', ['note_id' => $this->note->note_id]);
    $this->assertDatabaseMissing('calendar_events', ['id' => $this->calendarEvent->id]);
});

it('deletes the project chat room MongoDB messages and their attachment files', function () {
    /** @var mixed $this */
    Storage::disk('public')->assertExists($this->attachmentPath);

    $mongo = app(MongoConnection::class)->collection('chat_messages');
    expect($mongo->countDocuments(['room_id' => $this->room->id]))->toBe(1);

    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->delete("/u/0/p/{$this->project->project_slug}")
        ->assertRedirect();

    expect($mongo->countDocuments(['room_id' => $this->room->id]))->toBe(0);
    Storage::disk('public')->assertMissing($this->attachmentPath);
});

it('deletes note images and the project avatar file from storage', function () {
    /** @var mixed $this */
    Storage::disk('public')->assertExists($this->noteImagePath);
    Storage::disk('public')->assertExists($this->project->avatar_url);
    $avatarPath = $this->project->avatar_url;

    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->delete("/u/0/p/{$this->project->project_slug}")
        ->assertRedirect();

    Storage::disk('public')->assertMissing($this->noteImagePath);
    Storage::disk('public')->assertMissing($avatarPath);
});

afterEach(function () {
    app(MongoConnection::class)->collection('chat_messages')->deleteMany([]);
});

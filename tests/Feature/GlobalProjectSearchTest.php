<?php

use App\Models\CalendarEvent;
use App\Models\CardLabel;
use App\Models\ChatRoom;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardAttachment;
use App\Models\KanbanBoardCardChecklist;
use App\Models\KanbanBoardCardChecklistItem;
use App\Models\KanbanBoardCardComment;
use App\Models\Note;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\User;
use App\Services\ChatMessageService;
use App\Services\ProjectSearchService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shares authorized current-project search results with account-indexed deep links', function () {
    $sessionUser = User::factory()->create();
    $searchingUser = User::factory()->create();
    $otherMember = User::factory()->create();

    $project = Project::create([
        'project_name' => 'Search Project',
        'project_slug' => 'search-project',
    ]);
    $project->members()->attach($searchingUser->id, ['role' => 'OWNER']);
    $project->members()->attach($otherMember->id, ['role' => 'MEMBER']);

    $otherProject = Project::create([
        'project_name' => 'Other Search Project',
        'project_slug' => 'other-search-project',
    ]);
    $otherProject->members()->attach($searchingUser->id, ['role' => 'OWNER']);

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $project->project_id,
        'kanban_board_name' => 'Task Board',
        'kanban_board_position' => 0,
    ]);
    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Task Card',
        'kanban_board_card_description' => 'Task card description',
        'is_completed' => false,
    ]);

    $note = Note::create([
        'project_id' => $project->project_id,
        'user_id' => $searchingUser->id,
        'title' => 'Task Note',
        'content' => [],
        'excerpt' => 'Task note excerpt',
        'is_shared' => false,
    ]);
    $privateNote = Note::create([
        'project_id' => $project->project_id,
        'user_id' => $otherMember->id,
        'title' => 'Task Private Note',
        'content' => [],
        'excerpt' => 'Not shared with the searching user',
        'is_shared' => false,
    ]);

    $eventStart = CarbonImmutable::parse('2026-07-20 09:00:00', 'UTC');
    $event = CalendarEvent::create([
        'project_id' => $project->project_id,
        'title' => 'Task Calendar',
        'description' => 'Task calendar description',
        'start_time' => $eventStart,
        'end_time' => $eventStart->addHour(),
        'created_by' => $searchingUser->id,
        'recurrence' => 'none',
    ]);

    $reminder = Reminder::create([
        'reminder_project_id' => $project->project_id,
        'reminder_user_id' => $searchingUser->id,
        'reminder_title' => 'Task Reminder',
        'reminder_description' => 'Task reminder description',
        'reminder_due_at' => $eventStart,
    ]);
    $privateReminder = Reminder::create([
        'reminder_project_id' => $project->project_id,
        'reminder_user_id' => $otherMember->id,
        'reminder_title' => 'Task Private Reminder',
        'reminder_due_at' => $eventStart,
    ]);

    $room = ChatRoom::create([
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => 'Task Room',
    ]);
    $room->participants()->attach($searchingUser->id, [
        'role' => 'member',
        'joined_at' => now(),
    ]);
    $privateRoom = ChatRoom::create([
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => 'Task Private Room',
    ]);
    $privateRoom->participants()->attach($otherMember->id, [
        'role' => 'member',
        'joined_at' => now(),
    ]);

    $otherBoard = KanbanBoard::create([
        'kanban_board_project_id' => $otherProject->project_id,
        'kanban_board_name' => 'Task Other Board',
        'kanban_board_position' => 0,
    ]);
    $otherCard = KanbanBoardCard::create([
        'kanban_board_id' => $otherBoard->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Task Other Card',
        'is_completed' => false,
    ]);
    $otherNote = Note::create([
        'project_id' => $otherProject->project_id,
        'user_id' => $searchingUser->id,
        'title' => 'Task Other Note',
        'content' => [],
        'is_shared' => true,
    ]);
    $otherEvent = CalendarEvent::create([
        'project_id' => $otherProject->project_id,
        'title' => 'Task Other Calendar',
        'start_time' => $eventStart,
        'end_time' => $eventStart->addHour(),
        'created_by' => $searchingUser->id,
        'recurrence' => 'none',
    ]);
    $otherReminder = Reminder::create([
        'reminder_project_id' => $otherProject->project_id,
        'reminder_user_id' => $searchingUser->id,
        'reminder_title' => 'Task Other Reminder',
        'reminder_due_at' => $eventStart,
    ]);

    $this->mock(ChatMessageService::class, function ($mock) use ($room) {
        $mock->shouldReceive('getRecentSearchableMessages')
            ->once()
            ->with([$room->id])
            ->andReturn([[
                'id' => '64b7f3a2c12e4f0011223344',
                'room_id' => $room->id,
                'body' => 'Task message',
            ]]);
    });

    $response = $this->actingAs($sessionUser)
        ->withSession([
            'accounts' => [
                ['user_id' => $sessionUser->id],
                ['user_id' => $searchingUser->id],
            ],
            'account_active_index' => 0,
        ])
        ->get("/u/1/p/{$project->project_slug}/calendar?global_search=task")
        ->assertOk();

    $search = $response->inertiaProps('globalSearch');
    $results = collect($search['results']);
    $resultsById = $results->keyBy('id');
    $resultIds = $results->pluck('id')->all();
    $basePath = "/u/1/p/{$project->project_slug}";

    expect($search['query'])->toBe('task');
    expect($resultIds)->toContain(
        'navigation:board',
        'board:'.$board->kanban_board_id,
        'card:'.$card->kanban_board_card_id,
        'chat:'.$room->id,
        'message:64b7f3a2c12e4f0011223344',
        'note:'.$note->note_id,
        'calendar:'.$event->id,
        'reminder:'.$reminder->reminder_id,
    );
    expect($resultIds)->not->toContain(
        'chat:'.$privateRoom->id,
        'note:'.$privateNote->note_id,
        'reminder:'.$privateReminder->reminder_id,
        'board:'.$otherBoard->kanban_board_id,
        'card:'.$otherCard->kanban_board_card_id,
        'note:'.$otherNote->note_id,
        'calendar:'.$otherEvent->id,
        'reminder:'.$otherReminder->reminder_id,
    );

    expect($resultsById->get('navigation:board')['href'])->toBe($basePath.'/kanban');
    expect($resultsById->get('board:'.$board->kanban_board_id)['href'])
        ->toBe($basePath.'/kanban?board='.$board->kanban_board_id);
    expect($resultsById->get('card:'.$card->kanban_board_card_id)['href'])
        ->toBe($basePath.'/kanban?card='.$card->kanban_board_card_id);
    expect($resultsById->get('chat:'.$room->id)['href'])
        ->toBe($basePath.'/chat?room='.$room->id);
    expect($resultsById->get('message:64b7f3a2c12e4f0011223344')['href'])
        ->toBe($basePath.'/chat?room='.$room->id.'&message=64b7f3a2c12e4f0011223344');
    expect($resultsById->get('note:'.$note->note_id)['href'])
        ->toBe($basePath.'/notes?note='.$note->note_id);
    expect($resultsById->get('calendar:'.$event->id)['href'])
        ->toBe($basePath.'/calendar?date=2026-07-20&event='.$event->id);
    expect($resultsById->get('reminder:'.$reminder->reminder_id)['href'])
        ->toBe($basePath.'/reminders?reminder='.$reminder->reminder_id);
});

it('searches complete note documents and detailed card relations', function () {
    $user = User::factory()->create();
    $cardMember = User::factory()->create(['name' => 'Zephyr Member']);
    $project = Project::create([
        'project_name' => 'Detailed Search Project',
        'project_slug' => 'detailed-search-project',
    ]);
    $project->members()->attach($user->id, ['role' => 'OWNER']);
    $project->members()->attach($cardMember->id, ['role' => 'MEMBER']);

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $project->project_id,
        'kanban_board_name' => 'Ordinary Board',
        'kanban_board_position' => 0,
    ]);
    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ordinary Card',
        'is_completed' => false,
    ]);

    $label = CardLabel::create([
        'card_label_project_id' => $project->project_id,
        'card_label_name' => 'Cobalt Label',
        'card_label_color_hex' => '#2563eb',
    ]);
    $card->labels()->attach($label->card_label_id);
    $card->members()->attach($cardMember->id);

    $checklist = KanbanBoardCardChecklist::create([
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_checklist_name' => 'Launch Steps',
    ]);
    KanbanBoardCardChecklistItem::create([
        'kanban_board_card_checklist_id' => $checklist->kanban_board_card_checklist_id,
        'kanban_board_card_checklist_item_name' => 'Verify Beacon',
        'is_completed' => false,
    ]);
    KanbanBoardCardAttachment::create([
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_attachment_name' => 'quartz.pdf',
        'kanban_board_card_attachment_url' => 'cards/quartz.pdf',
    ]);
    KanbanBoardCardComment::create([
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_comment_from' => $user->id,
        'kanban_board_card_comment_message' => 'Discuss nebula rollout',
    ]);

    $deepNeedle = 'ultravioletneedle';
    $note = Note::create([
        'project_id' => $project->project_id,
        'user_id' => $user->id,
        'title' => 'Ordinary Note',
        'excerpt' => str_repeat('preview ', 30),
        'content' => [
            'type' => 'doc',
            'content' => [[
                'type' => 'paragraph',
                'content' => [[
                    'type' => 'text',
                    'text' => str_repeat('content ', 30).$deepNeedle,
                ]],
            ]],
        ],
        'is_shared' => false,
    ]);

    $this->mock(ChatMessageService::class, function ($mock) {
        $mock->shouldReceive('getRecentSearchableMessages')
            ->zeroOrMoreTimes()
            ->andReturn([]);
    });

    $service = app(ProjectSearchService::class);
    foreach ([
        'cobalt',
        'zephyr',
        'launch',
        'beacon',
        'quartz',
        'nebula',
    ] as $query) {
        $ids = collect($service->search($project, $user, 0, $query)['results'])
            ->pluck('id');

        expect($ids)->toContain('card:'.$card->kanban_board_card_id);
    }

    $noteIds = collect($service->search($project, $user, 0, $deepNeedle)['results'])
        ->pluck('id');
    expect($noteIds)->toContain('note:'.$note->note_id);
});

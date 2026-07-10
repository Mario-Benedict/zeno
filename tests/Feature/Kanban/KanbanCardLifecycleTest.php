<?php

use App\Models\CardLabel;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardChecklist;
use App\Models\KanbanBoardCardChecklistItem;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->user = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno',
    ]);
    $this->project->members()->attach($this->user->id, ['role' => 'OWNER']);

    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);
});

function kanbanUrl(Project $project, string $path = ''): string
{
    return "/u/0/p/{$project->project_slug}/{$path}";
}

function createCard(KanbanBoard $board, string $title = 'Untitled'): KanbanBoardCard
{
    return KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => $title,
        'is_completed' => false,
    ]);
}

it('creates a card with its title on a single row', function () {
    /** @var mixed $this */
    $this->actingAs($this->user)
        ->post(kanbanUrl($this->project, "kanban/boards/{$this->board->kanban_board_id}/cards"), [
            'title' => 'Design login screen',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_id' => $this->board->kanban_board_id,
        'kanban_board_card_title' => 'Design login screen',
        'is_completed' => false,
    ]);
});

it('updates card title, description, and completion state', function () {
    /** @var mixed $this */
    $card = createCard($this->board, 'Original title');

    $this->actingAs($this->user)
        ->patch(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/detail"), [
            'kanban_board_card_title' => 'Updated title',
            'kanban_board_card_description' => 'Some description',
            'is_completed' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_title' => 'Updated title',
        'kanban_board_card_description' => 'Some description',
        'is_completed' => true,
    ]);
});

it('sets and clears the card start and due dates', function () {
    /** @var mixed $this */
    $card = createCard($this->board);

    $this->actingAs($this->user)
        ->patch(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/dates"), [
            'kanban_board_card_start_date' => '2026-08-01',
            'kanban_board_card_due_date' => '2026-08-15',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_start_date' => '2026-08-01 00:00:00',
        'kanban_board_card_due_date' => '2026-08-15 00:00:00',
    ]);

    $this->actingAs($this->user)
        ->patch(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/dates"), [
            'kanban_board_card_start_date' => null,
            'kanban_board_card_due_date' => null,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_start_date' => null,
        'kanban_board_card_due_date' => null,
    ]);
});

it('reorders cards within the same board', function () {
    /** @var mixed $this */
    $first = createCard($this->board, 'First');
    $second = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 1,
        'kanban_board_card_title' => 'Second',
        'is_completed' => false,
    ]);
    $third = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 2,
        'kanban_board_card_title' => 'Third',
        'is_completed' => false,
    ]);

    // Move the last card to the front of the same board.
    $this->actingAs($this->user)
        ->patch(kanbanUrl($this->project, "kanban/boards/{$this->board->kanban_board_id}/cards/{$third->kanban_board_card_id}/move"), [
            'board_id' => $this->board->kanban_board_id,
            'position' => 0,
        ])
        ->assertRedirect();

    // The move must not corrupt (or null out) any card's title — this is the
    // exact failure mode of the upsert bug this test guards against.
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $third->kanban_board_card_id,
        'position' => 0,
        'kanban_board_card_title' => 'Third',
    ]);
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $first->kanban_board_card_id,
        'position' => 1,
        'kanban_board_card_title' => 'First',
    ]);
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $second->kanban_board_card_id,
        'position' => 2,
        'kanban_board_card_title' => 'Second',
    ]);
});

it('moves a card to a different board and repacks both columns', function () {
    /** @var mixed $this */
    $sourceCardA = createCard($this->board, 'Stays behind');
    $movingCard = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 1,
        'kanban_board_card_title' => 'Moving card',
        'is_completed' => false,
    ]);

    $otherBoard = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'In Progress',
        'kanban_board_position' => 1,
    ]);
    $destCard = KanbanBoardCard::create([
        'kanban_board_id' => $otherBoard->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Already there',
        'is_completed' => false,
    ]);

    $this->actingAs($this->user)
        ->patch(kanbanUrl($this->project, "kanban/boards/{$this->board->kanban_board_id}/cards/{$movingCard->kanban_board_card_id}/move"), [
            'board_id' => $otherBoard->kanban_board_id,
            'position' => 0,
        ])
        ->assertRedirect();

    // Moved card now belongs to the destination board, title intact.
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $movingCard->kanban_board_card_id,
        'kanban_board_id' => $otherBoard->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Moving card',
    ]);
    // The card already on the destination board got pushed down, unharmed.
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $destCard->kanban_board_card_id,
        'kanban_board_id' => $otherBoard->kanban_board_id,
        'position' => 1,
        'kanban_board_card_title' => 'Already there',
    ]);
    // Source board is repacked with no gap left behind.
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $sourceCardA->kanban_board_card_id,
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Stays behind',
    ]);
});

it('creates a project label with a color and attaches it to the card', function () {
    /** @var mixed $this */
    $card = createCard($this->board);

    $this->actingAs($this->user)
        ->post(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/labels/create"), [
            'card_label_name' => 'Urgent',
            'card_label_color_hex' => '#FF0000',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('card_labels', [
        'card_label_project_id' => $this->project->project_id,
        'card_label_name' => 'Urgent',
        'card_label_color_hex' => '#FF0000',
    ]);
    $this->assertDatabaseCount('kanban_board_card_labels', 1);
});

it('attaches and detaches an existing label from a card', function () {
    /** @var mixed $this */
    $card = createCard($this->board);

    $this->actingAs($this->user)
        ->post(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/labels/create"), [
            'card_label_name' => 'Bug',
            'card_label_color_hex' => '#00FF00',
        ]);

    $label = CardLabel::where('card_label_name', 'Bug')->firstOrFail();

    $this->actingAs($this->user)
        ->delete(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/labels/{$label->card_label_id}"))
        ->assertRedirect();

    $this->assertDatabaseCount('kanban_board_card_labels', 0);

    $this->actingAs($this->user)
        ->post(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/labels"), [
            'label_id' => $label->card_label_id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kanban_board_card_labels', [
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_label_id' => $label->card_label_id,
    ]);
});

it('creates a checklist and toggles an item on a card', function () {
    /** @var mixed $this */
    $card = createCard($this->board);

    $this->actingAs($this->user)
        ->post(kanbanUrl($this->project, "cards/{$card->kanban_board_card_id}/checklists"), [
            'kanban_board_card_checklist_name' => 'Steps',
        ])
        ->assertRedirect();

    $checklist = KanbanBoardCardChecklist::where('kanban_board_card_id', $card->kanban_board_card_id)->firstOrFail();

    $this->actingAs($this->user)
        ->post(kanbanUrl($this->project, "checklists/{$checklist->kanban_board_card_checklist_id}/items"), [
            'kanban_board_card_checklist_item_name' => 'Write tests',
        ])
        ->assertRedirect();

    $item = KanbanBoardCardChecklistItem::where('kanban_board_card_checklist_id', $checklist->kanban_board_card_checklist_id)->firstOrFail();

    $this->actingAs($this->user)
        ->patch(kanbanUrl($this->project, "checklist-items/{$item->kanban_board_card_checklist_item_id}"), [
            'is_completed' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kanban_board_card_checklist_items', [
        'kanban_board_card_checklist_item_id' => $item->kanban_board_card_checklist_item_id,
        'is_completed' => true,
    ]);
});

it('deletes a card and cascades its checklists and label pivots', function () {
    /** @var mixed $this */
    $card = createCard($this->board);

    KanbanBoardCardChecklist::create([
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_checklist_name' => 'Steps',
    ]);

    $this->actingAs($this->user)
        ->delete(kanbanUrl($this->project, "kanban/boards/{$this->board->kanban_board_id}/cards/{$card->kanban_board_card_id}"))
        ->assertRedirect();

    $this->assertDatabaseMissing('kanban_board_cards', ['kanban_board_card_id' => $card->kanban_board_card_id]);
    $this->assertDatabaseMissing('kanban_board_card_checklists', ['kanban_board_card_id' => $card->kanban_board_card_id]);
});

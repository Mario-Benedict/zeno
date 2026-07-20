<?php

use App\Enums\ProjectRole;
use App\Models\CardLabel;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardChecklist;
use App\Models\KanbanBoardCardChecklistItem;
use App\Models\KanbanBoardCardComment;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function kanbanAuthorizationUrl(Project $project, string $path): string
{
    return "/u/0/p/{$project->project_slug}/{$path}";
}

beforeEach(function () {
    /** @var mixed $this */
    $this->owner = User::factory()->create();
    $this->member = User::factory()->create();
    $this->viewer = User::factory()->create();
    $this->project = Project::create([
        'project_name' => 'Authorization Project',
        'project_slug' => 'authorization-project',
    ]);
    $this->project->members()->attach($this->owner->id, [
        'role' => ProjectRole::Owner->value,
    ]);
    $this->project->members()->attach($this->member->id, [
        'role' => ProjectRole::Member->value,
    ]);
    $this->project->members()->attach($this->viewer->id, [
        'role' => ProjectRole::Viewer->value,
    ]);
    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'Current Board',
        'kanban_board_position' => 0,
    ]);
    $this->card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Current Card',
        'is_completed' => false,
    ]);
    $this->label = CardLabel::create([
        'card_label_project_id' => $this->project->project_id,
        'card_label_name' => 'Current Label',
        'card_label_color_hex' => '#3366FF',
    ]);
    $this->card->labels()->attach($this->label->card_label_id);
    $this->card->members()->attach($this->viewer->id);
    $this->checklist = KanbanBoardCardChecklist::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'kanban_board_card_checklist_name' => 'Current Checklist',
    ]);
    $this->item = KanbanBoardCardChecklistItem::create([
        'kanban_board_card_checklist_id' => $this->checklist->kanban_board_card_checklist_id,
        'kanban_board_card_checklist_item_name' => 'Current Item',
        'is_completed' => false,
    ]);
    $this->comment = KanbanBoardCardComment::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'kanban_board_card_comment_from' => $this->viewer->id,
        'kanban_board_card_comment_message' => 'Viewer comment',
    ]);
});

it('keeps viewers read-only across kanban and timeline mutation flows', function () {
    /** @var mixed $this */
    $boardId = $this->board->kanban_board_id;
    $cardId = $this->card->kanban_board_card_id;
    $labelId = $this->label->card_label_id;
    $checklistId = $this->checklist->kanban_board_card_checklist_id;
    $itemId = $this->item->kanban_board_card_checklist_item_id;
    $commentId = $this->comment->kanban_board_card_comment_id;

    $mutations = [
        ['post', 'kanban/boards', ['name' => 'Blocked Board', 'position' => 1]],
        ['patch', "kanban/boards/{$boardId}", ['name' => 'Blocked Rename']],
        ['delete', "kanban/boards/{$boardId}", []],
        ['post', "kanban/boards/{$boardId}/cards", ['title' => 'Blocked Task']],
        ['patch', "kanban/boards/{$boardId}/cards/{$cardId}/move", [
            'board_id' => $boardId,
            'position' => 0,
        ]],
        ['delete', "kanban/boards/{$boardId}/cards/{$cardId}", []],
        ['patch', "cards/{$cardId}/detail", ['is_completed' => true]],
        ['patch', "cards/{$cardId}/dates", ['kanban_board_card_due_date' => '2026-08-01']],
        ['post', "cards/{$cardId}/labels", ['label_id' => $labelId]],
        ['post', "cards/{$cardId}/labels/create", [
            'card_label_name' => 'Blocked Label',
            'card_label_color_hex' => '#FF0000',
        ]],
        ['delete', "cards/{$cardId}/labels/{$labelId}", []],
        ['delete', "cards/{$cardId}/labels/{$labelId}/global", []],
        ['post', "cards/{$cardId}/members", ['user_id' => $this->member->id]],
        ['delete', "cards/{$cardId}/members/{$this->viewer->id}", []],
        ['post', "cards/{$cardId}/checklists", [
            'kanban_board_card_checklist_name' => 'Blocked Checklist',
        ]],
        ['delete', "checklists/{$checklistId}", []],
        ['post', "checklists/{$checklistId}/items", [
            'kanban_board_card_checklist_item_name' => 'Blocked Item',
        ]],
        ['patch', "checklist-items/{$itemId}", ['is_completed' => true]],
        ['delete', "checklist-items/{$itemId}", []],
        ['post', "cards/{$cardId}/comments", [
            'kanban_board_card_comment_message' => 'Blocked comment',
        ]],
        ['delete', "comments/{$commentId}", []],
    ];

    foreach ($mutations as [$method, $path, $data]) {
        $this->actingAs($this->viewer)
            ->{$method}(kanbanAuthorizationUrl($this->project, $path), $data)
            ->assertForbidden();
    }

    $this->assertDatabaseMissing('kanban_boards', [
        'kanban_board_name' => 'Blocked Board',
    ]);
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $cardId,
        'kanban_board_card_title' => 'Current Card',
        'is_completed' => false,
    ]);
    $this->assertDatabaseHas('card_labels', ['card_label_id' => $labelId]);
    $this->assertDatabaseHas('kanban_board_card_checklists', [
        'kanban_board_card_checklist_id' => $checklistId,
    ]);
    $this->assertDatabaseHas('kanban_board_card_checklist_items', [
        'kanban_board_card_checklist_item_id' => $itemId,
        'is_completed' => false,
    ]);
    $this->assertDatabaseHas('kanban_board_card_comments', [
        'kanban_board_card_comment_id' => $commentId,
    ]);
});

it('allows members to create tasks through the shared kanban timeline endpoint', function () {
    /** @var mixed $this */
    $this->actingAs($this->member)
        ->from(kanbanAuthorizationUrl($this->project, 'timeline'))
        ->post(kanbanAuthorizationUrl(
            $this->project,
            "kanban/boards/{$this->board->kanban_board_id}/cards",
        ), ['title' => 'Member Task'])
        ->assertRedirect(kanbanAuthorizationUrl($this->project, 'timeline'));

    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_id' => $this->board->kanban_board_id,
        'kanban_board_card_title' => 'Member Task',
    ]);
});

it('returns not found for cross-project kanban resource mutations', function () {
    /** @var mixed $this */
    $otherProject = Project::create([
        'project_name' => 'Foreign Project',
        'project_slug' => 'foreign-project',
    ]);
    $otherProject->members()->attach($this->owner->id, [
        'role' => ProjectRole::Owner->value,
    ]);
    $otherBoard = KanbanBoard::create([
        'kanban_board_project_id' => $otherProject->project_id,
        'kanban_board_name' => 'Foreign Board',
        'kanban_board_position' => 0,
    ]);
    $otherCard = KanbanBoardCard::create([
        'kanban_board_id' => $otherBoard->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Foreign Card',
        'is_completed' => false,
    ]);
    $otherLabel = CardLabel::create([
        'card_label_project_id' => $otherProject->project_id,
        'card_label_name' => 'Foreign Label',
        'card_label_color_hex' => '#FF0000',
    ]);
    $otherChecklist = KanbanBoardCardChecklist::create([
        'kanban_board_card_id' => $otherCard->kanban_board_card_id,
        'kanban_board_card_checklist_name' => 'Foreign Checklist',
    ]);
    $otherItem = KanbanBoardCardChecklistItem::create([
        'kanban_board_card_checklist_id' => $otherChecklist->kanban_board_card_checklist_id,
        'kanban_board_card_checklist_item_name' => 'Foreign Item',
        'is_completed' => false,
    ]);
    $otherComment = KanbanBoardCardComment::create([
        'kanban_board_card_id' => $otherCard->kanban_board_card_id,
        'kanban_board_card_comment_from' => $this->owner->id,
        'kanban_board_card_comment_message' => 'Foreign comment',
    ]);

    $currentBoardId = $this->board->kanban_board_id;
    $currentCardId = $this->card->kanban_board_card_id;
    $foreignBoardId = $otherBoard->kanban_board_id;
    $foreignCardId = $otherCard->kanban_board_card_id;

    $mutations = [
        ['patch', "kanban/boards/{$foreignBoardId}", ['name' => 'Leaked Rename']],
        ['delete', "kanban/boards/{$foreignBoardId}", []],
        ['post', "kanban/boards/{$foreignBoardId}/cards", ['title' => 'Leaked Task']],
        ['patch', "kanban/boards/{$currentBoardId}/cards/{$currentCardId}/move", [
            'board_id' => $foreignBoardId,
            'position' => 0,
        ]],
        ['patch', "kanban/boards/{$currentBoardId}/cards/{$foreignCardId}/move", [
            'board_id' => $currentBoardId,
            'position' => 0,
        ]],
        ['delete', "kanban/boards/{$currentBoardId}/cards/{$foreignCardId}", []],
        ['patch', "cards/{$foreignCardId}/detail", ['kanban_board_card_title' => 'Leaked Detail']],
        ['patch', "cards/{$foreignCardId}/dates", ['kanban_board_card_due_date' => '2026-08-01']],
        ['delete', "cards/{$currentCardId}/labels/{$otherLabel->card_label_id}", []],
        ['delete', "cards/{$currentCardId}/labels/{$otherLabel->card_label_id}/global", []],
        ['delete', "checklists/{$otherChecklist->kanban_board_card_checklist_id}", []],
        ['post', "checklists/{$otherChecklist->kanban_board_card_checklist_id}/items", [
            'kanban_board_card_checklist_item_name' => 'Leaked Item',
        ]],
        ['patch', "checklist-items/{$otherItem->kanban_board_card_checklist_item_id}", [
            'is_completed' => true,
        ]],
        ['delete', "checklist-items/{$otherItem->kanban_board_card_checklist_item_id}", []],
        ['delete', "comments/{$otherComment->kanban_board_card_comment_id}", []],
    ];

    foreach ($mutations as [$method, $path, $data]) {
        $this->actingAs($this->owner)
            ->{$method}(kanbanAuthorizationUrl($this->project, $path), $data)
            ->assertNotFound();
    }

    $this->assertDatabaseHas('kanban_boards', [
        'kanban_board_id' => $foreignBoardId,
        'kanban_board_name' => 'Foreign Board',
    ]);
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $foreignCardId,
        'kanban_board_id' => $foreignBoardId,
        'kanban_board_card_title' => 'Foreign Card',
    ]);
    $this->assertDatabaseHas('kanban_board_cards', [
        'kanban_board_card_id' => $currentCardId,
        'kanban_board_id' => $currentBoardId,
    ]);
    $this->assertDatabaseHas('card_labels', [
        'card_label_id' => $otherLabel->card_label_id,
    ]);
    $this->assertDatabaseHas('kanban_board_card_checklists', [
        'kanban_board_card_checklist_id' => $otherChecklist->kanban_board_card_checklist_id,
    ]);
    $this->assertDatabaseHas('kanban_board_card_checklist_items', [
        'kanban_board_card_checklist_item_id' => $otherItem->kanban_board_card_checklist_item_id,
        'is_completed' => false,
    ]);
    $this->assertDatabaseHas('kanban_board_card_comments', [
        'kanban_board_card_comment_id' => $otherComment->kanban_board_card_comment_id,
    ]);
});

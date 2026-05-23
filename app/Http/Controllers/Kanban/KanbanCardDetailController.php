<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardDate;
use App\Models\CardLabel;
use App\Models\CardLabelColor;
use App\Models\CardLabelCategory;
use App\Models\User;
use Illuminate\Http\Request;

class KanbanCardDetailController extends Controller
{
    /**
     * Update card detail.
     */
    public function update(Request $request, KanbanBoardCard $card)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'kanban_board_card_title' => 'string|max:255',
            'kanban_board_card_description' => 'nullable|string',
            'is_completed' => 'boolean',
        ]);

        // Get or create detail
        $detail = $card->detail;
        if (!$detail) {
            $detail = $card->detail()->create([
                'kanban_board_card_id' => $card->kanban_board_card_id,
                'kanban_board_card_title' => $card->detail->kanban_board_card_title ?? '',
                'is_completed' => false,
            ]);
        }

        // Update detail
        $detail->update($validated);

        // Load full detail
        $detail->load(['labels.color', 'labels.category', 'members', 'checklists.items', 'dates', 'attachments', 'comments.user']);

        return response()->json(['detail' => $detail]);
    }

    /**
     * Add label to card.
     */
    public function addLabel(Request $request, KanbanBoardCard $card)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'label_id' => 'required|string',
        ]);

        // Verify label exists and belongs to project
        $label = CardLabel::where('card_label_id', $validated['label_id'])
            ->where('card_label_project_id', $project->project_id)
            ->first();

        if (!$label) {
            return response()->json(['message' => 'Label not found'], 404);
        }

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        // Attach label if not already attached
        if (!$detail->labels()->where('card_label_id', $validated['label_id'])->exists()) {
            $detail->labels()->attach($validated['label_id']);
        }

        // Load and return updated detail
        $detail->load(['labels.color', 'labels.category']);

        return response()->json(['detail' => $detail]);
    }

    /**
     * Remove label from card.
     */
    public function removeLabel(Request $request, KanbanBoardCard $card, $labelId)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        // Detach label
        $detail->labels()->detach($labelId);

        // Load and return updated detail
        $detail->load(['labels.color', 'labels.category']);

        return response()->json(['detail' => $detail]);
    }

    public function deleteLabel(Request $request, KanbanBoardCard $card, $labelId)
    {
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $label = \App\Models\CardLabel::findOrFail($labelId);
        $label->delete();

        return response()->json(['message' => 'Label deleted']);
    }

    /**
     * Create a new label and attach it to a card.
     */
    public function createLabel(Request $request, KanbanBoardCard $card)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'card_label_name' => 'required|string|max:20',
            'card_label_color_hex' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
        ]);

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        try {
            // Get or create color
            $color = CardLabelColor::firstOrCreate(
                ['card_label_color_hex' => strtoupper($validated['card_label_color_hex'])],
                ['card_label_color_hex' => strtoupper($validated['card_label_color_hex'])]
            );

            // Get or create default category
            $category = CardLabelCategory::first();
            if (!$category) {
                $category = CardLabelCategory::create([
                    'card_label_category_name' => 'General',
                ]);
            }

            // Create label
            $label = CardLabel::create([
                'card_label_project_id' => $project->project_id,
                'card_label_category_id' => $category->card_label_category_id,
                'card_label_color_id' => $color->card_label_color_id,
                'card_label_name' => $validated['card_label_name'],
            ]);

            // Attach label to card detail
            $detail->labels()->attach($label->card_label_id);

            // Load and return updated label with relationships
            $label->load(['color', 'category']);

            return response()->json(['label' => $label]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create label: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Add member to card.
     */
    public function addMember(Request $request, KanbanBoardCard $card)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'user_id' => 'required|integer',
        ]);

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        // Verify user is a project member
        $user = $project->members()->where('user_id', $validated['user_id'])->first();
        if (!$user) {
            return response()->json(['message' => 'User is not a project member'], 404);
        }

        // Attach member if not already attached
        if (!$detail->members()->where('kanban_board_card_account_id', $validated['user_id'])->exists()) {
            $detail->members()->attach($validated['user_id']);
        }

        // Load and return updated detail
        $detail->load(['members']);

        return response()->json(['detail' => $detail]);
    }

    /**
     * Remove member from card.
     */
    public function removeMember(Request $request, KanbanBoardCard $card, $memberId)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        // Detach member
        $detail->members()->detach($memberId);

        // Load and return updated detail
        $detail->load(['members']);

        return response()->json(['detail' => $detail]);
    }

    /**
     * Update card dates.
     */
    public function updateDates(Request $request, KanbanBoardCard $card)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'kanban_board_card_start_date' => 'nullable|date',
            'kanban_board_card_due_date' => 'nullable|date',
        ]);

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        // Get or create dates record
        $dates = $detail->dates;
        if (!$dates) {
            $dates = KanbanBoardCardDate::create([
                'kanban_board_card_detail_id' => $detail->kanban_board_card_detail_id,
            ]);
        }

        // Update dates
        $dates->update($validated);

        return response()->json(['dates' => $dates]);
    }
}

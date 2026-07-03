<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\CardLabel;
use App\Models\CardLabelCategory;
use App\Models\CardLabelColor;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardDate;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KanbanCardDetailController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Note on `Project $project` parameter
    |--------------------------------------------------------------------------
    | Every action below lives under `/p/{project:project_slug}/...` so Laravel
    | will pass the `{project}` URI segment positionally. We must declare it
    | in the signature even when the body doesn't reference it — otherwise the
    | resolver shifts the project slug into the next typed parameter and
    | throws a TypeError. The project is derived from related models for
    | authorization, so the explicit `$project` binding is purely structural.
    */

    /**
     * Update card detail (title / description / completion).
     */
    public function update(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card): RedirectResponse
    {
        abort_unless($request->user()->can('view', $card->kanbanBoard->project), 403);

        $validated = $request->validate([
            'kanban_board_card_title' => 'string|max:255',
            'kanban_board_card_description' => 'nullable|string',
            'is_completed' => 'boolean',
        ]);

        $detail = $card->detail;
        if (! $detail) {
            $detail = $card->detail()->create([
                'kanban_board_card_id' => $card->kanban_board_card_id,
                'kanban_board_card_title' => $card->detail->kanban_board_card_title ?? '',
                'is_completed' => false,
            ]);
        }

        $detail->update($validated);

        return back();
    }

    /**
     * Attach an existing project label to this card.
     */
    public function addLabel(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card): RedirectResponse
    {
        $cardProject = $card->kanbanBoard->project;
        abort_unless($request->user()->can('view', $cardProject), 403);

        $validated = $request->validate([
            'label_id' => 'required|string',
        ]);

        $label = CardLabel::where('card_label_id', $validated['label_id'])
            ->where('card_label_project_id', $cardProject->project_id)
            ->first();

        abort_if($label === null, 404);

        $detail = $card->detail;
        abort_if($detail === null, 404);

        if (! $detail->labels()->where('card_label_id', $validated['label_id'])->exists()) {
            $detail->labels()->attach($validated['label_id']);
        }

        return back();
    }

    /**
     * Detach a label from this card (label still exists at the project level).
     */
    public function removeLabel(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card, string $labelId): RedirectResponse
    {
        abort_unless($request->user()->can('view', $card->kanbanBoard->project), 403);

        $detail = $card->detail;
        abort_if($detail === null, 404);

        $detail->labels()->detach($labelId);

        return back();
    }

    /**
     * Delete a label entirely from the project (and from every card using it).
     */
    public function deleteLabel(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card, string $labelId): RedirectResponse
    {
        abort_unless($request->user()->can('view', $card->kanbanBoard->project), 403);

        CardLabel::findOrFail($labelId)->delete();

        return back();
    }

    /**
     * Create a brand-new project label and attach it to this card.
     *
     * Accepts an optional client-generated `card_label_id` (UUID) so the
     * frontend can render the label instantly and stay in sync.
     */
    public function createLabel(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card): RedirectResponse
    {
        $cardProject = $card->kanbanBoard->project;
        abort_unless($request->user()->can('view', $cardProject), 403);

        $validated = $request->validate([
            'card_label_id' => ['nullable', 'string', 'uuid'],
            'card_label_name' => 'required|string|max:20',
            'card_label_color_hex' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
        ]);

        $detail = $card->detail;
        abort_if($detail === null, 404);

        $color = CardLabelColor::firstOrCreate(
            ['card_label_color_hex' => strtoupper($validated['card_label_color_hex'])],
            ['card_label_color_hex' => strtoupper($validated['card_label_color_hex'])]
        );

        $category = CardLabelCategory::first() ?? CardLabelCategory::create([
            'card_label_category_name' => 'General',
        ]);

        $label = new CardLabel([
            'card_label_project_id' => $cardProject->project_id,
            'card_label_category_id' => $category->card_label_category_id,
            'card_label_color_id' => $color->card_label_color_id,
            'card_label_name' => $validated['card_label_name'],
        ]);

        if (! empty($validated['card_label_id'])) {
            $label->card_label_id = $validated['card_label_id'];
        }

        $label->save();

        $detail->labels()->attach($label->card_label_id);

        return back();
    }

    /**
     * Add a project user as a member of this card.
     */
    public function addMember(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card): RedirectResponse
    {
        $cardProject = $card->kanbanBoard->project;
        abort_unless($request->user()->can('view', $cardProject), 403);

        $validated = $request->validate([
            'user_id' => 'required|integer',
        ]);

        $detail = $card->detail;
        abort_if($detail === null, 404);

        $isMember = $cardProject->members()->where('user_id', $validated['user_id'])->exists();
        abort_unless($isMember, 404);

        if (! $detail->members()->where('kanban_board_card_account_id', $validated['user_id'])->exists()) {
            $detail->members()->attach($validated['user_id']);
        }

        return back();
    }

    /**
     * Remove a user from the card's member list.
     */
    public function removeMember(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card, int $memberId): RedirectResponse
    {
        abort_unless($request->user()->can('view', $card->kanbanBoard->project), 403);

        $detail = $card->detail;
        abort_if($detail === null, 404);

        $detail->members()->detach($memberId);

        return back();
    }

    /**
     * Update the card's start and / or due date.
     */
    public function updateDates(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card): RedirectResponse
    {
        abort_unless($request->user()->can('view', $card->kanbanBoard->project), 403);

        $validated = $request->validate([
            'kanban_board_card_start_date' => 'nullable|date',
            'kanban_board_card_due_date' => 'nullable|date',
        ]);

        $detail = $card->detail;
        abort_if($detail === null, 404);

        $dates = $detail->dates ?? KanbanBoardCardDate::create([
            'kanban_board_card_detail_id' => $detail->kanban_board_card_detail_id,
        ]);

        $dates->update($validated);

        return back();
    }
}

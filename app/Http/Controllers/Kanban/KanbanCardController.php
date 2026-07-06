<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KanbanCardController extends Controller
{
    /**
     * Store a newly created card in storage.
     *
     * Accepts an optional client-generated `kanban_board_card_id` so the
     * frontend can optimistically render the card immediately and have it
     * line up with the persisted record after the request resolves.
     */
    public function store(int $accountIndex, Request $request, Project $project, KanbanBoard $board): RedirectResponse
    {
        abort_unless($request->user()->can('view', $board->project), 403);

        $validated = $request->validate([
            'kanban_board_card_id' => ['nullable', 'string', 'uuid'],
            'title' => 'required|string|max:20',
            'label_ids' => 'array',
            'label_ids.*' => 'string',
        ]);

        DB::transaction(function () use ($validated, $board) {
            $lastPosition = $board->cards()->max('position') ?? -1;

            $card = new KanbanBoardCard([
                'kanban_board_id' => $board->kanban_board_id,
                'position' => $lastPosition + 1,
                'kanban_board_card_title' => $validated['title'],
                'kanban_board_card_description' => null,
                'is_completed' => false,
            ]);

            if (! empty($validated['kanban_board_card_id'])) {
                $card->kanban_board_card_id = $validated['kanban_board_card_id'];
            }

            $card->save();

            if (! empty($validated['label_ids'])) {
                $card->labels()->attach($validated['label_ids']);
            }
        });

        return back();
    }

    /**
     * Move card to another board (or reorder within the same one).
     *
     * Real-world concerns this implementation addresses:
     *  - **N writes → 1 bulk UPSERT** per affected board (previously one UPDATE
     *    per card, which scaled linearly with column size).
     *  - **Atomicity** — everything happens inside a single transaction so a
     *    failure halfway can't leave the board with corrupted ordering.
     *  - **Concurrency** — `lockForUpdate()` takes row-level locks on the
     *    cards being repacked, so two simultaneous drags by different users
     *    serialize cleanly instead of clobbering each other's positions.
     */
    public function move(int $accountIndex, Request $request, Project $project, KanbanBoard $board, KanbanBoardCard $card): RedirectResponse
    {
        $validated = $request->validate([
            'board_id' => 'required|string',
            'position' => 'required|integer|min:0',
        ]);

        $oldBoardId = $card->kanban_board_id;
        $newBoardId = $validated['board_id'];
        $newPosition = $validated['position'];

        DB::transaction(function () use ($card, $oldBoardId, $newBoardId, $newPosition) {
            // Read the destination board's current ordering (locking the rows
            // for the duration of this transaction).
            $destOrder = KanbanBoardCard::where('kanban_board_id', $newBoardId)
                ->where('kanban_board_card_id', '!=', $card->kanban_board_card_id)
                ->orderBy('position')
                ->lockForUpdate()
                ->pluck('kanban_board_card_id')
                ->all();

            // Insert the moved card at the requested index.
            array_splice(
                $destOrder,
                min($newPosition, count($destOrder)),
                0,
                [$card->kanban_board_card_id]
            );

            // One bulk write to repack the destination board.
            // `kanban_board_id` is included in the update so the moved card
            // is migrated to the new column in the same statement.
            $this->repackBoard($newBoardId, $destOrder, includeBoardId: true);

            // If the move crossed boards, repack what's left in the source.
            if ($oldBoardId !== $newBoardId) {
                $sourceOrder = KanbanBoardCard::where('kanban_board_id', $oldBoardId)
                    ->orderBy('position')
                    ->lockForUpdate()
                    ->pluck('kanban_board_card_id')
                    ->all();

                $this->repackBoard($oldBoardId, $sourceOrder);
            }
        });

        return back();
    }

    /**
     * Remove the specified card from storage and repack the column it was in.
     *
     * Wrapped in a transaction so the delete and the position recompaction
     * commit together — otherwise a crash between them would leave a gap in
     * the position sequence.
     */
    public function destroy(int $accountIndex, Request $request, Project $project, KanbanBoard $board, KanbanBoardCard $card): RedirectResponse
    {
        abort_unless($request->user()->can('view', $card->kanbanBoard->project), 403);

        $boardId = $card->kanban_board_id;

        DB::transaction(function () use ($card, $boardId) {
            $card->delete();

            $remaining = KanbanBoardCard::where('kanban_board_id', $boardId)
                ->orderBy('position')
                ->lockForUpdate()
                ->pluck('kanban_board_card_id')
                ->all();

            $this->repackBoard($boardId, $remaining);
        });

        return back();
    }

    /**
     * Persist the given list of card IDs as the canonical ordering for a
     * board in a single bulk `UPSERT` (compiled to `INSERT … ON DUPLICATE KEY
     * UPDATE` on MySQL). Each card's `position` becomes its index in the
     * supplied array.
     *
     * Pass `$includeBoardId = true` to also rewrite the `kanban_board_id`
     * column — used by `move()` so the moved card is reparented in the same
     * statement that repacks the destination column.
     *
     * @param  array<int, string>  $orderedCardIds  IDs in their new position order
     */
    private function repackBoard(string $boardId, array $orderedCardIds, bool $includeBoardId = false): void
    {
        if (empty($orderedCardIds)) {
            return;
        }

        $rows = [];
        foreach ($orderedCardIds as $index => $cardId) {
            $rows[] = [
                'kanban_board_card_id' => $cardId,
                'kanban_board_id' => $boardId,
                'position' => $index,
            ];
        }

        KanbanBoardCard::upsert(
            $rows,
            uniqueBy: ['kanban_board_card_id'],
            update: $includeBoardId ? ['kanban_board_id', 'position'] : ['position'],
        );
    }
}

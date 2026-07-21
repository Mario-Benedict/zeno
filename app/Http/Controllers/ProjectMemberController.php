<?php

namespace App\Http\Controllers;

use App\Enums\ProjectRole;
use App\Events\ProjectMemberRemoved;
use App\Models\ChatRoom;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatRoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProjectMemberController extends Controller
{
    /**
     * Cards in this project currently assigned to the given member — used by
     * the "remove member" confirmation to warn about (and, if the admin
     * proceeds, unassign) their in-flight work instead of silently leaving
     * dangling assignments.
     */
    public function assignedTasks(int $accountIndex, Project $project, User $user): JsonResponse
    {
        abort_if($project->roleFor($user) === null, 404);

        $cards = KanbanBoardCard::query()
            ->select(['kanban_board_card_id', 'kanban_board_card_title'])
            ->whereHas(
                'kanbanBoard',
                fn ($q) => $q->where('kanban_board_project_id', $project->project_id)
            )
            ->whereHas('members', fn ($q) => $q->where('users.id', $user->id))
            ->get();

        return response()->json([
            'count' => $cards->count(),
            'cards' => $cards->map(fn (KanbanBoardCard $card) => [
                'id' => $card->kanban_board_card_id,
                'title' => $card->kanban_board_card_title,
            ])->values(),
        ]);
    }

    public function update(int $accountIndex, Request $request, Project $project, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(ProjectRole::assignableValues())],
        ]);

        $this->ensureEditableMember($request, $project, $user);

        $project->members()->updateExistingPivot($user->id, [
            'role' => $validated['role'],
        ]);

        ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->where('type', 'group')
            ->first()
            ?->participants()
            ->updateExistingPivot($user->id, [
                'role' => ProjectRole::from($validated['role'])->chatParticipantRole(),
            ]);

        return back()->with('status', 'Member role updated.');
    }

    public function destroy(int $accountIndex,
        Request $request,
        Project $project,
        User $user,
        ChatRoomService $roomService,
    ): RedirectResponse {
        $this->ensureEditableMember($request, $project, $user);

        // Unassign them from every card in this project first — otherwise a
        // removed member keeps showing as an assignee on cards they no
        // longer have access to.
        KanbanBoardCard::query()
            ->whereHas(
                'kanbanBoard',
                fn ($q) => $q->where('kanban_board_project_id', $project->project_id)
            )
            ->whereHas('members', fn ($q) => $q->where('users.id', $user->id))
            ->get()
            ->each(fn (KanbanBoardCard $card) => $card->members()->detach($user->id));

        $project->members()->detach($user->id);
        $roomService->removeMemberFromProject($project, $user);

        ProjectMemberRemoved::dispatch((int) $user->id, $project->project_id);

        return back()->with('status', 'Member removed from the project.');
    }

    private function ensureEditableMember(Request $request, Project $project, User $user): void
    {
        $memberRole = $project->roleFor($user);

        abort_if($memberRole === null, 404);

        if ($memberRole === ProjectRole::Owner) {
            throw ValidationException::withMessages([
                'member' => 'The project owner role cannot be changed.',
            ]);
        }

        if ((string) $request->user()?->id === (string) $user->id) {
            throw ValidationException::withMessages([
                'member' => 'You cannot change your own project role.',
            ]);
        }
    }
}

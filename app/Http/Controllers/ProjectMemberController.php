<?php

namespace App\Http\Controllers;

use App\Enums\ProjectRole;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatRoomService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProjectMemberController extends Controller
{
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

        $project->members()->detach($user->id);
        $roomService->removeMemberFromProject($project, $user);

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

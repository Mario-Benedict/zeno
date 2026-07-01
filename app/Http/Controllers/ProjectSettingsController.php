<?php

namespace App\Http\Controllers;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Services\ChatRoomService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectSettingsController extends Controller
{
    public function update(int $accountIndex, Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9\- ]+$/'],
        ]);

        $newName = trim($validated['project_name']);
        $newSlug = Project::generateUniqueSlug($newName, $project->project_id);

        $project->update([
            'project_name' => $newName,
            'project_slug' => $newSlug,
        ]);

        return redirect()
            ->route('projects.show', ['accountIndex' => $accountIndex, 'project' => $newSlug])
            ->with('status', 'project-renamed');
    }

    public function updateAvatar(int $accountIndex, Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'avatar_color' => ['required', 'string', 'max:30'],
        ]);

        $project->update([
            'avatar_color' => $validated['avatar_color'],
            'avatar_url' => null,
        ]);

        return back();
    }

    public function storeAvatarImage(int $accountIndex, Request $request, Project $project): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,webp,gif', 'max:2048'],
        ]);

        if ($project->avatar_url) {
            Storage::disk('public')->delete($project->avatar_url);
        }

        $path = $request->file('avatar')->store('project-avatars', 'public');

        $project->update(['avatar_url' => $path]);

        return back();
    }

    public function destroyAvatarImage(int $accountIndex, Project $project): RedirectResponse
    {
        if ($project->avatar_url) {
            Storage::disk('public')->delete($project->avatar_url);
            $project->update(['avatar_url' => null]);
        }

        return back();
    }

    public function destroy(int $accountIndex, Project $project, ChatRoomService $roomService): RedirectResponse
    {
        abort_if($project->roleFor(auth()->user()) !== ProjectRole::Owner, 403);

        $project->delete();

        return redirect()
            ->route('projects.index', ['accountIndex' => $accountIndex])
            ->with('status', 'project-deleted');
    }

    public function leave(int $accountIndex, Request $request, Project $project, ChatRoomService $roomService): RedirectResponse
    {
        $user = $request->user();
        $role = $project->roleFor($user);

        abort_if($role === null, 403);
        abort_if($role === ProjectRole::Owner, 422, 'Transfer ownership or delete the project before leaving.');

        $project->members()->detach($user->id);
        $roomService->removeMemberFromProject($project, $user);

        return redirect()
            ->route('projects.index', ['accountIndex' => $accountIndex])
            ->with('status', 'project-left');
    }
}

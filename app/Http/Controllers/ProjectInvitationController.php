<?php

namespace App\Http\Controllers;

use App\Enums\ProjectRole;
use App\Events\ChatMemberJoined;
use App\Jobs\Chat\CreateMemberDirectMessageRooms;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use App\Services\AccountSessionService;
use App\Services\CalendarService;
use App\Services\ChatRoomService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProjectInvitationController extends Controller
{
    public function store(int $accountIndex, Request $request, Project $project, ChatRoomService $roomService): RedirectResponse
    {
        $validated = $request->validate([
            'invitee' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', Rule::in(ProjectRole::assignableValues())],
        ]);

        $invitee = trim($validated['invitee']);
        $role = $validated['role'];
        $matchedUser = $this->findInvitee($invitee);

        if ($matchedUser instanceof User) {
            $this->attachUserToProject($project, $matchedUser, $role, $roomService);

            return back()->with('status', 'Member added to the project.');
        }

        if (! filter_var($invitee, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages([
                'invitee' => 'No user found with that name.',
            ]);
        }

        DB::transaction(function () use ($project, $request, $invitee, $role) {
            $email = Str::lower($invitee);
            $invitation = ProjectInvitation::query()
                ->where('project_id', $project->project_id)
                ->where('email', $email)
                ->whereNull('accepted_at')
                ->first();

            if ($invitation instanceof ProjectInvitation) {
                $invitation->update([
                    'role' => $role,
                    'invited_by_id' => $request->user()?->id,
                    'expires_at' => now()->addDays(14),
                ]);

                return;
            }

            ProjectInvitation::create([
                'project_id' => $project->project_id,
                'invited_by_id' => $request->user()?->id,
                'email' => $email,
                'role' => $role,
                'token' => $this->generateInvitationToken(),
                'expires_at' => now()->addDays(14),
            ]);
        });

        return back()->with('status', 'Invitation created.');
    }

    public function createLink(int $accountIndex, Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(ProjectRole::assignableValues())],
        ]);

        $project->forceFill([
            'invitation_link' => $project->invitation_link ?: $this->generateInvitationToken(),
            'invitation_role' => $validated['role'],
        ])->save();

        return back()->with('status', 'Invitation link is ready.');
    }

    public function updateLink(int $accountIndex, Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', Rule::in(ProjectRole::assignableValues())],
        ]);

        abort_if($project->invitation_link === null, 404);

        $project->forceFill([
            'invitation_role' => $validated['role'],
        ])->save();

        return back()->with('status', 'Invitation link role updated.');
    }

    public function destroyLink(int $accountIndex, Project $project): RedirectResponse
    {
        $project->forceFill([
            'invitation_link' => null,
            'invitation_role' => ProjectRole::Member->value,
        ])->save();

        return back()->with('status', 'Invitation link disabled.');
    }

    public function accept(string $token, Request $request, ChatRoomService $roomService): RedirectResponse
    {
        $project = Project::query()
            ->where('invitation_link', $token)
            ->first();
        $invitation = null;
        $role = $project?->invitation_role ?? ProjectRole::Member->value;

        if (! $project instanceof Project) {
            $invitation = ProjectInvitation::query()
                ->with('project')
                ->where('token', $token)
                ->whereNull('accepted_at')
                ->firstOrFail();

            abort_if(
                $invitation->expires_at !== null && $invitation->expires_at->isPast(),
                410,
                'This invitation has expired.',
            );

            if ($invitation->email !== null) {
                abort_unless(
                    Str::lower((string) $request->user()?->email) === Str::lower($invitation->email),
                    403,
                    'This invitation belongs to another email address.',
                );
            }

            $project = $invitation->project;
            abort_unless($project instanceof Project, 404);
            $role = $invitation->role;
        }

        $joinedChat = DB::transaction(function () use ($project, $request, $role, $roomService, $invitation): bool {
            $user = $request->user();

            if (! $project->isMember($user)) {
                $project->members()->attach($user->id, [
                    'role' => $role,
                    'opened_at' => now(),
                    'color' => CalendarService::assignMemberColor($project->project_id),
                ]);
                $joinedChat = $roomService->addMemberToGroupRoom($project, $user, $role);
            } else {
                $project->members()->updateExistingPivot($user->id, [
                    'opened_at' => now(),
                ]);
                $joinedChat = false;
            }

            if ($invitation instanceof ProjectInvitation) {
                $invitation->forceFill(['accepted_at' => now()])->save();
            }

            return $joinedChat;
        });

        // The membership transaction has committed. Broadcasting now cannot
        // race its database writes, while the actual Reverb delivery remains
        // queued via ChatMemberJoined's ShouldBroadcast contract.
        if ($joinedChat) {
            $this->dispatchChatJoinSideEffects($project, $request->user());
        }

        $accountIndex = AccountSessionService::getActiveIndex($request);

        return redirect()->route('projects.dashboard', [
            'accountIndex' => $accountIndex,
            'project' => $project->project_slug,
        ]);
    }

    private function findInvitee(string $invitee): ?User
    {
        $normalized = Str::lower($invitee);

        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [$normalized])
            ->first();

        if ($user instanceof User) {
            return $user;
        }

        if (filter_var($invitee, FILTER_VALIDATE_EMAIL)) {
            return null;
        }

        return User::query()
            ->where('name', 'like', '%'.$invitee.'%')
            ->orderBy('name')
            ->first();
    }

    private function attachUserToProject(
        Project $project,
        User $user,
        string $role,
        ChatRoomService $roomService,
    ): void {
        if ($project->isMember($user)) {
            throw ValidationException::withMessages([
                'invitee' => 'This user is already a project member.',
            ]);
        }

        $joinedChat = DB::transaction(function () use ($project, $user, $role, $roomService): bool {
            $project->members()->attach($user->id, [
                'role' => $role,
                'opened_at' => null,
                'color' => CalendarService::assignMemberColor($project->project_id),
            ]);

            return $roomService->addMemberToGroupRoom($project, $user, $role);
        });

        if ($joinedChat) {
            $this->dispatchChatJoinSideEffects($project, $user);
        }
    }

    /**
     * Queue non-critical chat side effects after membership has committed.
     * Failure to enqueue either task is reported, but cannot turn a successful
     * invitation into an NGINX 502/failed response.
     */
    private function dispatchChatJoinSideEffects(Project $project, User $user): void
    {
        rescue(
            fn () => Bus::dispatch(new CreateMemberDirectMessageRooms($project->project_id, (int) $user->id)),
            report: true,
        );

        ChatMemberJoined::dispatch($project->project_id);
    }

    private function generateInvitationToken(): string
    {
        do {
            $token = Str::random(48);
        } while (
            Project::query()->where('invitation_link', $token)->exists()
            || ProjectInvitation::query()->where('token', $token)->exists()
        );

        return $token;
    }
}

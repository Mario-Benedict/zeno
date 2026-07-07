<?php

namespace App\Http\Controllers\Reminders;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Reminder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ReminderController extends Controller
{
    /**
     * GET /u/{accountIndex}/p/{project}/reminders
     */
    public function index(int $accountIndex, Project $project): Response
    {
        $reminders = Reminder::where('reminder_project_id', $project->project_id)
            ->where('reminder_user_id', Auth::id())
            ->with('steps')
            ->orderByDesc('is_pinned')
            ->orderBy('is_completed')
            ->orderBy('reminder_due_at')
            ->get();

        return Inertia::render('reminders/index', [
            'reminders' => $reminders,
            'pomodoroSettings' => Auth::user()->pomodoro_settings,
        ]);
    }

    /**
     * POST /u/{accountIndex}/p/{project}/reminders
     *
     * Accepts an optional client-generated `reminder_id` so the frontend can
     * optimistically render the new reminder before the round-trip resolves.
     */
    public function store(int $accountIndex, Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'reminder_id' => ['nullable', 'string', 'uuid'],
            'reminder_title' => 'required|string|max:255',
            'reminder_description' => 'nullable|string',
            'reminder_due_at' => 'nullable|date',
        ]);

        $reminder = new Reminder([
            'reminder_project_id' => $project->project_id,
            'reminder_user_id' => $request->user()->id,
            'reminder_title' => $validated['reminder_title'],
            'reminder_description' => $validated['reminder_description'] ?? null,
            'reminder_due_at' => $validated['reminder_due_at'] ?? null,
            'source' => 'manual',
        ]);

        if (! empty($validated['reminder_id'])) {
            $reminder->reminder_id = $validated['reminder_id'];
        }

        $reminder->save();

        return back();
    }

    /**
     * PATCH /u/{accountIndex}/p/{project}/reminders/{reminder}
     */
    public function update(int $accountIndex, Request $request, Project $project, Reminder $reminder): RedirectResponse
    {
        abort_unless($reminder->reminder_user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'reminder_title' => 'string|max:255',
            'reminder_description' => 'nullable|string',
            'reminder_due_at' => 'nullable|date',
            'is_completed' => 'boolean',
        ]);

        $reminder->update($validated);

        return back();
    }

    /**
     * PATCH /u/{accountIndex}/p/{project}/reminders/{reminder}/pin
     */
    public function togglePin(int $accountIndex, Request $request, Project $project, Reminder $reminder): RedirectResponse
    {
        abort_unless($reminder->reminder_user_id === $request->user()->id, 403);

        $reminder->update(['is_pinned' => ! $reminder->is_pinned]);

        return back();
    }

    /**
     * DELETE /u/{accountIndex}/p/{project}/reminders/{reminder}
     */
    public function destroy(int $accountIndex, Request $request, Project $project, Reminder $reminder): RedirectResponse
    {
        abort_unless($reminder->reminder_user_id === $request->user()->id, 403);

        $reminder->delete();

        return back();
    }
}

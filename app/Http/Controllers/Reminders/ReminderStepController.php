<?php

namespace App\Http\Controllers\Reminders;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\ReminderStep;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReminderStepController extends Controller
{
    /**
     * POST /u/{accountIndex}/p/{project}/reminders/{reminder}/steps
     */
    public function store(int $accountIndex, Request $request, Project $project, Reminder $reminder): RedirectResponse
    {
        abort_unless($reminder->reminder_user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'reminder_step_id' => ['nullable', 'string', 'uuid'],
            'reminder_step_name' => 'required|string|max:255',
        ]);

        $position = ((int) $reminder->steps()->max('position')) + 1;

        $step = new ReminderStep([
            'reminder_id' => $reminder->reminder_id,
            'reminder_step_name' => $validated['reminder_step_name'],
            'is_completed' => false,
            'position' => $position,
        ]);

        if (! empty($validated['reminder_step_id'])) {
            $step->reminder_step_id = $validated['reminder_step_id'];
        }

        $step->save();

        return back();
    }

    /**
     * PATCH /u/{accountIndex}/p/{project}/reminders/{reminder}/steps/{step}
     */
    public function update(int $accountIndex, Request $request, Project $project, Reminder $reminder, ReminderStep $step): RedirectResponse
    {
        abort_unless($reminder->reminder_user_id === $request->user()->id, 403);
        abort_unless($step->reminder_id === $reminder->reminder_id, 404);

        $validated = $request->validate([
            'reminder_step_name' => 'string|max:255',
            'is_completed' => 'boolean',
        ]);

        $step->update($validated);

        return back();
    }

    /**
     * DELETE /u/{accountIndex}/p/{project}/reminders/{reminder}/steps/{step}
     */
    public function destroy(int $accountIndex, Request $request, Project $project, Reminder $reminder, ReminderStep $step): RedirectResponse
    {
        abort_unless($reminder->reminder_user_id === $request->user()->id, 403);
        abort_unless($step->reminder_id === $reminder->reminder_id, 404);

        $step->delete();

        return back();
    }
}

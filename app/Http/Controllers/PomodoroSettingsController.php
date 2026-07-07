<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PomodoroSettingsController extends Controller
{
    public function update(int $accountIndex, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'focus_minutes' => ['required', 'integer', 'min:1', 'max:180'],
            'break_minutes' => ['required', 'integer', 'min:1', 'max:60'],
        ]);

        $request->user()->update([
            'pomodoro_settings' => [
                'focus_minutes' => $validated['focus_minutes'],
                'break_minutes' => $validated['break_minutes'],
            ],
        ]);

        return back();
    }
}

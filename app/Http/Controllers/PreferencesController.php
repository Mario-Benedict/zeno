<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PreferencesController extends Controller
{
    public function update(int $accountIndex, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['sometimes', 'string', Rule::in(['en', 'id'])],
            'theme' => ['sometimes', 'string', Rule::in(['dark', 'light'])],
            'calendar_visibility' => ['sometimes', 'string', Rule::in(['transparent', 'masked', 'busy_only'])],
        ]);

        $request->user()->update($validated);

        return back();
    }
}

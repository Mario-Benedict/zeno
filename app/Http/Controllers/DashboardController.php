<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\UserDashboardSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const VALID_TEMPLATES = ['3a', '4a', '4b', '5a', '5b'];

    public function show(int $accountIndex, Project $project): Response
    {
        $setting = UserDashboardSetting::firstOrCreate(
            [
                'user_id'    => auth()->id(),
                'project_id' => $project->project_id,
            ],
            [
                'template_id' => null,
                'slots'       => null,
            ],
        );

        return Inertia::render('dashboard', [
            'setting' => [
                'template_id' => $setting->template_id,
                'slots'       => $setting->slots,
            ],
        ]);
    }

    public function update(int $accountIndex, Project $project, Request $request): RedirectResponse
    {
        $data = $request->validate([
            'template_id' => ['nullable', 'string', Rule::in(self::VALID_TEMPLATES)],
        ]);

        $setting = UserDashboardSetting::firstOrCreate([
            'user_id'    => auth()->id(),
            'project_id' => $project->project_id,
        ]);

        // Reset slot assignments whenever the user switches to a different template.
        if ($setting->template_id !== $data['template_id']) {
            $setting->slots = null;
        }

        $setting->template_id = $data['template_id'];
        $setting->save();

        return back();
    }
}

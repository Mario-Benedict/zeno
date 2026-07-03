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

    // Widgets with a working implementation. Others are surfaced in the
    // widget picker as "coming soon" and can't be assigned to a slot yet.
    private const VALID_WIDGETS = ['kanban'];

    public function show(int $accountIndex, Project $project): Response
    {
        $setting = UserDashboardSetting::firstOrCreate(
            [
                'user_id' => auth()->id(),
                'project_id' => $project->project_id,
            ],
            [
                'template_id' => null,
                'slots' => null,
            ],
        );

        $props = [
            'setting' => [
                'template_id' => $setting->template_id,
                'slots' => $setting->slots,
            ],
        ];

        // Only pull in a widget's data if it's actually assigned to a slot,
        // so visiting the dashboard doesn't pay for widgets nobody placed.
        if (in_array('kanban', $setting->slots ?? [], true)) {
            $props['kanbanWidgetData'] = $this->loadKanbanWidgetData($project);
        }

        return Inertia::render('dashboard', $props);
    }

    private function loadKanbanWidgetData(Project $project): array
    {
        // Trimmed compared to KanbanController::show() — the widget is
        // read-only (view boards/cards, view detail, mark as done), so it
        // skips members/attachments/comments the full page needs for editing.
        $project->load([
            'kanbanBoards' => function ($query) {
                $query->orderBy('kanban_board_position');
            },
            'kanbanBoards.cards' => function ($query) {
                $query->orderBy('position', 'asc')
                    ->with([
                        'detail' => function ($q) {
                            $q->with([
                                'labels.color',
                                'checklists.items',
                                'dates',
                            ]);
                        },
                    ]);
            },
        ]);

        return [
            'kanbanBoards' => $project->kanbanBoards,
        ];
    }

    public function update(int $accountIndex, Project $project, Request $request): RedirectResponse
    {
        $data = $request->validate([
            'template_id' => ['nullable', 'string', Rule::in(self::VALID_TEMPLATES)],
        ]);

        $setting = UserDashboardSetting::firstOrCreate([
            'user_id' => auth()->id(),
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

    public function updateSlot(int $accountIndex, Project $project, Request $request): RedirectResponse
    {
        $data = $request->validate([
            'index' => ['required', 'integer', 'min:0'],
            'widget' => ['nullable', 'string', Rule::in(self::VALID_WIDGETS)],
        ]);

        $setting = UserDashboardSetting::firstOrCreate([
            'user_id' => auth()->id(),
            'project_id' => $project->project_id,
        ]);

        // Pad with nulls up to the target index first, otherwise assigning
        // straight to $slots[$index] leaves gaps that json-encode as an
        // object instead of a list.
        $slots = $setting->slots ?? [];
        while (count($slots) <= $data['index']) {
            $slots[] = null;
        }
        $slots[$data['index']] = $data['widget'];

        $setting->slots = array_values($slots);
        $setting->save();

        return back();
    }
}

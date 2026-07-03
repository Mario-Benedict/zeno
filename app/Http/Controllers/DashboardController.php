<?php

namespace App\Http\Controllers;

use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Models\UserDashboardSetting;
use App\Services\ChatMessageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const VALID_TEMPLATES = ['3a', '4a', '4b', '5a', '5b'];

    // Widgets with a working implementation. Others are surfaced in the
    // widget picker as "coming soon" and can't be assigned to a slot yet.
    private const VALID_WIDGETS = ['kanban', 'chat'];

    public function __construct(
        private readonly ChatMessageService $messageService,
    ) {}

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

        if (in_array('chat', $setting->slots ?? [], true)) {
            $props['chatWidgetData'] = $this->loadChatWidgetData($project);
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

    private function loadChatWidgetData(Project $project): array
    {
        // Mirrors ChatRoomController::index()'s rooms + last-message-preview
        // shape (trimmed to what the compact room list/conversation view needs).
        $user = Auth::user();

        $rooms = ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->with(['participants'])
            ->orderBy('updated_at', 'desc')
            ->get();

        $lastMessageMap = $this->messageService
            ->getLastMessagePreviewsForRooms($rooms->pluck('id')->all());

        return [
            'rooms' => $rooms->map(fn (ChatRoom $room) => [
                'id' => $room->id,
                'projectId' => $room->project_id,
                'type' => $room->type,
                'name' => $room->name,
                'participants' => $room->participants->map(fn (User $p) => [
                    'id' => (string) $p->id,
                    'name' => $p->name,
                    'email' => $p->email,
                    'avatarUrl' => null,
                ])->values()->all(),
                'lastMessage' => $lastMessageMap[$room->id] ?? null,
                'createdAt' => $room->created_at?->toIso8601String(),
                'updatedAt' => $room->updated_at?->toIso8601String(),
            ])->values()->all(),
            'currentUser' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatarUrl' => null,
            ],
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

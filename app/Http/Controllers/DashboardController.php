<?php

namespace App\Http\Controllers;

use App\Models\ChatRoom;
use App\Models\Note;
use App\Models\Project;
use App\Models\Reminder;
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
    private const VALID_WIDGETS = ['kanban', 'chat', 'notes', 'calendar', 'reminders', 'alarm', 'timeline'];

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

        if (in_array('notes', $setting->slots ?? [], true)) {
            $props['notesWidgetData'] = $this->loadNotesWidgetData($project);
        }

        if (in_array('calendar', $setting->slots ?? [], true)) {
            $props['calendarWidgetData'] = $this->loadCalendarWidgetData();
        }

        if (in_array('reminders', $setting->slots ?? [], true)) {
            $props['remindersWidgetData'] = $this->loadRemindersWidgetData($project);
        }

        if (in_array('alarm', $setting->slots ?? [], true)) {
            $props['alarmWidgetData'] = $this->loadAlarmWidgetData();
        }

        if (in_array('timeline', $setting->slots ?? [], true)) {
            $props['timelineWidgetData'] = $this->loadTimelineWidgetData($project);
        }

        return Inertia::render('dashboard', $props);
    }

    private function loadKanbanWidgetData(Project $project): array
    {
        // The widget's card detail view is read-only (no editing
        // affordances) but shows everything the full page's detail panel
        // does, so this mirrors KanbanController::show()'s full eager load.
        // loadMissing (not load) so calling this twice — the Timeline widget
        // reuses it below — doesn't re-query when both widgets are placed.
        $project->loadMissing([
            'kanbanBoards' => function ($query) {
                $query->orderBy('kanban_board_position');
            },
            'kanbanBoards.cards' => function ($query) {
                $query->orderBy('position', 'asc')
                    ->with([
                        'labels',
                        'members',
                        'checklists.items',
                        'attachments',
                        'comments.user',
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

    private function loadNotesWidgetData(Project $project): array
    {
        // Mirrors NoteController::index()'s lightweight list shape (no
        // `content` column) — the widget only shows title/excerpt/metadata
        // and fetches a note's full content on demand via the existing
        // notes.show endpoint when one is actually opened.
        $notes = Note::query()
            ->where('project_id', $project->project_id)
            ->where(function ($query) {
                $query->where('user_id', Auth::id())->orWhere('is_shared', true);
            })
            ->select(['note_id', 'title', 'excerpt', 'is_shared', 'user_id', 'updated_at'])
            ->withCount('collaborators')
            ->orderByDesc('updated_at')
            ->get();

        return [
            'notes' => $notes->map(fn (Note $note) => [
                'id' => (string) $note->note_id,
                'title' => $note->title,
                'excerpt' => $note->excerpt,
                'isShared' => (bool) $note->is_shared,
                'ownerId' => (int) $note->user_id,
                'updatedAt' => $note->updated_at?->toISOString(),
                'collaboratorsCount' => (int) $note->collaborators_count,
            ])->values()->all(),
        ];
    }

    private function loadCalendarWidgetData(): array
    {
        // The widget fetches events itself on demand (month at a time) via
        // the existing calendar.events.index JSON endpoint, scoped to just
        // the viewer's own events — this only needs to hand over who that is.
        return [
            'currentUserId' => (int) Auth::id(),
        ];
    }

    private function loadRemindersWidgetData(Project $project): array
    {
        // Mirrors ReminderController::index()'s query — the widget is
        // read-only apart from toggling a reminder's own completed state
        // (reusing the same PATCH endpoint), so no trimming needed here.
        $reminders = Reminder::where('reminder_project_id', $project->project_id)
            ->where('reminder_user_id', Auth::id())
            ->with('steps')
            ->orderByDesc('is_pinned')
            ->orderBy('is_completed')
            ->orderBy('reminder_due_at')
            ->get();

        return [
            'reminders' => $reminders,
        ];
    }

    private function loadAlarmWidgetData(): array
    {
        // Same per-account setting the Reminders page's Pomodoro timer reads
        // (Auth::user()->pomodoro_settings) — not project-scoped, so there's
        // nothing else to load here.
        return [
            'settings' => Auth::user()->pomodoro_settings,
        ];
    }

    private function loadTimelineWidgetData(Project $project): array
    {
        // The Timeline widget is a read-only alternate visualisation of the
        // same board/card tree as the Kanban widget — mirrors how the full
        // Timeline page reuses KanbanController::show()'s data instead of
        // having its own tables.
        return $this->loadKanbanWidgetData($project);
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

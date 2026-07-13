<?php

namespace App\Http\Controllers\Reminders;

use App\Http\Controllers\Controller;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\TaskConflict;
use App\Models\User;
use App\Services\ChatMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Powers the header notification popover's tabs. All computed live at read
 * time — the Inbox tab queries `reminders` directly for due/overdue items,
 * the Chat tab reuses `ChatMessageService::countUnread()`, and the Conflicts
 * tab queries `task_conflicts` (no persisted generic `notifications` table
 * anywhere in this app — see TaskConflict for why). Conflicts are
 * account-wide, not project-scoped (a conflict can span two different
 * projects), unlike Inbox/Chat.
 */
class NotificationController extends Controller
{
    public function __construct(
        private readonly ChatMessageService $messageService,
    ) {}

    public function index(int $accountIndex, Project $project): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $inbox = Reminder::where('reminder_project_id', $project->project_id)
            ->where('reminder_user_id', $user->id)
            ->where('is_completed', false)
            ->whereNull('notification_read_at')
            ->whereNotNull('reminder_due_at')
            ->where('reminder_due_at', '<=', now()->addDay())
            ->orderBy('reminder_due_at')
            ->get()
            ->map(fn (Reminder $reminder) => [
                'reminder_id' => $reminder->reminder_id,
                'title' => $reminder->reminder_title,
                'due_at' => $reminder->reminder_due_at?->toIso8601String(),
                'is_overdue' => $reminder->reminder_due_at?->isPast() ?? false,
            ])
            ->values();

        $rooms = ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->with('participants')
            ->get();

        $lastMessageMap = $this->messageService
            ->getLastMessagePreviewsForRooms($rooms->pluck('id')->all());

        $chat = $rooms
            ->map(function (ChatRoom $room) use ($user, $lastMessageMap) {
                // Already eager-loaded on $room->participants — avoids a
                // redundant `chat_room_participants` query per room.
                $lastReadMessageId = $room->participants
                    ->firstWhere('id', $user->id)
                    ?->pivot
                    ->last_read_message_id;

                return [
                    'id' => $room->id,
                    'type' => $room->type,
                    'name' => $room->name,
                    'participants' => $room->participants->map(fn (User $p) => [
                        'id' => (string) $p->id,
                        'name' => $p->name,
                    ])->values()->all(),
                    'unread_count' => $this->messageService->countUnread(
                        $room->id,
                        $lastReadMessageId,
                        (string) $user->id,
                    ),
                    'lastMessage' => $lastMessageMap[$room->id] ?? null,
                ];
            })
            ->filter(fn (array $r) => $r['unread_count'] > 0)
            ->values();

        $pendingConflicts = TaskConflict::where('assignee_user_id', $user->id)
            ->whereNull('assignee_acknowledged_at')
            ->with('kanbanBoardCard:kanban_board_card_id,kanban_board_card_title')
            ->orderBy('created_at')
            ->get()
            ->map(fn (TaskConflict $c) => [
                'id' => $c->id,
                'role' => 'assignee',
                'card_title' => $c->kanbanBoardCard?->kanban_board_card_title,
                'conflicting_title' => $c->conflicting_title,
                'conflicting_start' => $c->conflicting_start->toIso8601String(),
                'conflicting_end' => $c->conflicting_end->toIso8601String(),
            ]);

        $declineAlerts = TaskConflict::where('assigned_by_user_id', $user->id)
            ->where('status', 'declined')
            ->whereNull('assigner_acknowledged_at')
            ->with(['kanbanBoardCard:kanban_board_card_id,kanban_board_card_title', 'assignee:id,name'])
            ->orderBy('created_at')
            ->get()
            ->map(fn (TaskConflict $c) => [
                'id' => $c->id,
                'role' => 'assigner',
                'card_title' => $c->kanbanBoardCard?->kanban_board_card_title,
                'assignee_name' => $c->assignee?->name,
            ]);

        return response()->json([
            'inbox' => $inbox,
            'chat' => $chat,
            'conflicts' => $pendingConflicts->concat($declineAlerts)->values(),
        ]);
    }

    /** Mark a reminder notification as read, then open its detail pane. */
    public function openReminder(
        int $accountIndex,
        Request $request,
        Project $project,
        Reminder $reminder,
    ): RedirectResponse {
        abort_unless(
            $reminder->reminder_project_id === $project->project_id
                && $reminder->reminder_user_id === $request->user()->id,
            403,
        );

        $reminder->update(['notification_read_at' => now()]);

        return redirect()->route('reminders.index', [
            'accountIndex' => $accountIndex,
            'project' => $project->project_slug,
            'reminder' => $reminder->reminder_id,
        ]);
    }
}

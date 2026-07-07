<?php

namespace App\Http\Controllers\Reminders;

use App\Http\Controllers\Controller;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\User;
use App\Services\ChatMessageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Powers the header notification popover's two tabs. Both are computed live
 * at read time — the Inbox tab queries `reminders` directly for due/overdue
 * items (no persisted `notifications` table), and the Chat tab reuses
 * `ChatMessageService::countUnread()` against the existing chat schema
 * rather than duplicating unread state anywhere.
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

        $chat = $rooms
            ->map(fn (ChatRoom $room) => [
                'id' => $room->id,
                'type' => $room->type,
                'name' => $room->name,
                'participants' => $room->participants->map(fn (User $p) => [
                    'id' => (string) $p->id,
                    'name' => $p->name,
                ])->values()->all(),
                'unread_count' => $this->messageService->countUnread($room->id, (string) $user->id),
            ])
            ->filter(fn (array $r) => $r['unread_count'] > 0)
            ->values();

        return response()->json([
            'inbox' => $inbox,
            'chat' => $chat,
        ]);
    }
}

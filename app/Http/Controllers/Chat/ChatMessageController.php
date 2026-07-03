<?php

namespace App\Http\Controllers\Chat;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Services\ChatMessageService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * ChatMessageController
 * ----------------------
 * Handles CRUD for chat messages stored in MongoDB.
 *
 * Message reads are exposed for lightweight pagination endpoints, while writes
 * return redirects so Inertia can update the current page naturally.
 * Message reads go through cursor-based pagination for infinite scroll.
 *
 * Route prefix : /projects/{project}/chat/rooms/{room}/messages
 * Middleware   : auth, verified, project.member
 */
class ChatMessageController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly ChatMessageService $messageService,
    ) {}

    // ──────────────────────────────────────────────────────────────
    //  List messages — cursor pagination for infinite scroll
    // ──────────────────────────────────────────────────────────────

    /**
     * GET /projects/{project}/chat/rooms/{room}/messages
     *
     * Returns a paginated list of messages for a room, ordered newest-first.
     * The frontend loads older messages as the user scrolls up.
     *
     * Query params:
     *  - before  : MongoDB ObjectId cursor (load messages older than this)
     *  - limit   : number of messages per page (default: 30, max: 50)
     */
    public function index(int $accountIndex, Request $request, Project $project, ChatRoom $room): JsonResponse
    {
        $this->authorize('view', $room);

        $request->validate([
            'before' => ['nullable', 'string'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $limit = (int) ($request->query('limit', 30));
        $before = $request->query('before');

        $result = $this->messageService->getMessages($room->id, $limit, $before);

        // Update the participant's last_read_message_id for unread-count calculation.
        if (! empty($result['messages'])) {
            $this->messageService->markAsRead(
                $room,
                Auth::id(),
                $result['messages'][0]['_id'] ?? null, // newest message in this page
            );
        }

        return response()->json($result);
    }

    // ──────────────────────────────────────────────────────────────
    //  Send a message
    // ──────────────────────────────────────────────────────────────

    /**
     * POST /projects/{project}/chat/rooms/{room}/messages
     *
     * Stores a new message (text, image, or file) in MongoDB.
     * On success, the message document is returned so the frontend can
     * optimistically append it without re-fetching.
     */
    public function store(int $accountIndex, SendMessageRequest $request, Project $project, ChatRoom $room): RedirectResponse|JsonResponse
    {
        $this->authorize('sendMessage', $room);

        $message = $this->messageService->send(
            room: $room,
            sender: Auth::user(),
            payload: $request->validated(),
        );

        // Push to all OTHER room participants via WebSocket.
        // The sender receives their own message through the Inertia flash prop
        // (or, for API-style callers like the dashboard chat widget, the JSON body below).
        broadcast(new MessageSent($message))->toOthers();

        if ($request->wantsJson()) {
            return response()->json(['message' => $message]);
        }

        return redirect()->back()->with('chat.newMessage', $message);
    }

    // ──────────────────────────────────────────────────────────────
    //  Delete a message (soft-delete / redact)
    // ──────────────────────────────────────────────────────────────

    /**
     * DELETE /projects/{project}/chat/rooms/{room}/messages/{messageId}
     *
     * Only the message author (or a room admin) may delete a message.
     * The message body is replaced with a tombstone; attachments are removed
     * from storage via StorageService.
     *
     * @param  string  $messageId  MongoDB ObjectId
     */
    public function destroy(
        int $accountIndex,
        Project $project,
        ChatRoom $room,
        string $messageId,
    ): RedirectResponse {
        $this->authorize('sendMessage', $room); // basic membership check

        $this->messageService->delete(
            room: $room,
            messageId: $messageId,
            actor: Auth::user(),
        );

        return redirect()->back();
    }
}

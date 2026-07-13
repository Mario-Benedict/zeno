<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreChatRoomRequest;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatMessageService;
use App\Services\ChatRoomService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * ChatRoomController
 * -------------------
 * Handles the Inertia page render for the Chat feature and the REST actions
 * for creating DM rooms.
 *
 * Route prefix : /projects/{project}/chat
 * Middleware   : auth, verified, project.member (custom)
 */
class ChatRoomController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private readonly ChatRoomService $roomService,
        private readonly ChatMessageService $messageService,
    ) {}

    // ──────────────────────────────────────────────────────────────
    //  Inertia page
    // ──────────────────────────────────────────────────────────────

    /**
     * GET /projects/{project}/chat
     *
     * Renders the Chat/Index page with all rooms the authenticated user
     * belongs to within this project, including last-message previews
     * fetched from MongoDB.
     */
    public function index(int $accountIndex, Request $request, Project $project): InertiaResponse
    {
        $request->validate([
            'room' => ['nullable', 'string', 'uuid'],
            'before' => ['nullable', 'string'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        /** @var User $user */
        $user = Auth::user();

        // Load all rooms this user participates in for the given project.
        $rooms = ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->with(['participants'])
            ->orderBy('updated_at', 'desc')
            ->get();

        $roomIds = $rooms->pluck('id')->all();
        $lastMessageMap = $this->messageService->getLastMessagePreviewsForRooms($roomIds);

        $activeRoomId = $request->query('room');

        // Memoised closure — evaluated at most once per request, only when requested
        // via a partial reload (Inertia::optional).
        $messagesResult = null;
        $resolveMessages = function () use (&$messagesResult, $request, $activeRoomId, $user) {
            if ($messagesResult !== null) {
                return $messagesResult;
            }
            if (! $activeRoomId) {
                return $messagesResult = ['messages' => [], 'nextCursor' => null, 'hasMore' => false];
            }
            $room = ChatRoom::findOrFail($activeRoomId);
            Gate::authorize('view', $room);
            $limit = min((int) $request->query('limit', 30), 50);
            $result = $this->messageService->getMessages($room->id, $limit, $request->query('before'));
            if (! empty($result['messages'])) {
                $this->messageService->markAsRead($room, $user->id, $result['messages'][0]['_id'] ?? null);
            }

            return $messagesResult = $result;
        };

        return Inertia::render('chat/index', [
            'rooms' => $rooms->map(function (ChatRoom $room) use ($lastMessageMap) {
                return [
                    'id' => $room->id,
                    'projectId' => $room->project_id,
                    'type' => $room->type,
                    'name' => $room->name,
                    'participants' => $room->participants->map(fn (User $p) => [
                        'id' => (string) $p->id,
                        'name' => $p->name,
                        'email' => $p->email,
                        'avatarUrl' => null,
                        'role' => $p->pivot->role ?? null,
                        'isMuted' => (bool) ($p->pivot->is_muted ?? false),
                    ])->values()->all(),
                    'lastMessage' => $lastMessageMap[$room->id] ?? null,
                    'createdAt' => $room->created_at?->toIso8601String(),
                    'updatedAt' => $room->updated_at?->toIso8601String(),
                ];
            })->values()->all(),
            'currentUser' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatarUrl' => null,
            ],
            'project' => [
                'project_id' => $project->project_id,
                'project_name' => $project->project_name,
                'project_slug' => $project->project_slug,
            ],
            // Lets notification deep-links open and mark the intended room as
            // read instead of landing users on an empty chat pane.
            'activeRoomId' => $activeRoomId,
            // Optional props: only evaluated + sent when explicitly requested via partial reload.
            // Not included on the initial full page load.
            'messages' => Inertia::optional(fn () => $resolveMessages()['messages']),
            'nextCursor' => Inertia::optional(fn () => $resolveMessages()['nextCursor']),
            'hasMore' => Inertia::optional(fn () => $resolveMessages()['hasMore']),
        ]);
    }

    // ──────────────────────────────────────────────────────────────
    //  REST actions
    // ──────────────────────────────────────────────────────────────

    /**
     * POST /projects/{project}/chat/rooms
     *
     * Find or create a DM room between the authenticated user and the
     * requested recipient. Both must be members of the project.
     *
     * Returns a redirect to the Inertia chat page — the frontend will
     * highlight the new/existing room via the `activeRoomId` flash prop.
     */
    public function store(int $accountIndex, StoreChatRoomRequest $request, Project $project): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $recipient = User::findOrFail($request->validated('recipient_id'));

        // Ensure the recipient is actually a member of this project's group room.
        $this->authorize('createDm', [
            ChatRoom::query()
                ->where('project_id', $project->project_id)
                ->where('type', 'group')
                ->firstOrFail(),
        ]);

        $room = $this->roomService->findOrCreateDmRoom($project, $user, $recipient);

        return redirect()
            ->route('chat.index', [
                'accountIndex' => $accountIndex,
                'project' => $project->project_slug,
            ])
            ->with('activeRoomId', $room->id);
    }

    /**
     * GET /projects/{project}/chat/rooms/{room}
     *
     * Returns a single room as JSON (used by the frontend when opening a room
     * via a direct URL or notification deep-link).
     * The Inertia page handles the full render; this is a lightweight API endpoint.
     */
    public function show(int $accountIndex, Project $project, ChatRoom $room): ChatRoomResource
    {
        $this->authorize('view', $room);

        $room->loadMissing('participants');

        $resource = new ChatRoomResource($room);
        $resource->lastMessagePreview = $this->messageService
            ->getLastMessagePreviewsForRooms([$room->id])[$room->id] ?? null;

        return $resource;
    }
}

<?php

namespace App\Http\Controllers\Chat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\StoreChatGroupRequest;
use App\Http\Requests\Chat\StoreChatRoomRequest;
use App\Http\Resources\ChatRoomResource;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatMessageService;
use App\Services\ChatRoomService;
use App\Services\StorageService;
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
        private readonly StorageService $storage,
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
            'message' => ['nullable', 'string', 'regex:/^[a-f0-9]{24}$/i'],
            'before' => ['nullable', 'string', 'regex:/^[a-f0-9]{24}$/i'],
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

        $requestedRoomId = $request->query('room');
        $activeRoom = is_string($requestedRoomId)
            ? $rooms->firstWhere('id', $requestedRoomId)
            : null;
        abort_if($requestedRoomId !== null && $activeRoom === null, 404);

        $activeRoomId = $activeRoom?->id;
        $activeMessageId = $request->query('message');
        abort_if($activeMessageId !== null && $activeRoom === null, 404);

        $roomIds = $rooms->pluck('id')->all();
        $lastMessageMap = $this->messageService->getLastMessagePreviewsForRooms($roomIds);

        // Memoised closure — evaluated at most once per request, only when requested
        // via a partial reload (Inertia::optional).
        $messagesResult = $activeMessageId !== null
            ? $this->messageService->getMessagesAround($activeRoomId, $activeMessageId)
            : null;
        abort_if($activeMessageId !== null && $messagesResult === null, 404);
        $messagesWereMarkedRead = false;
        $resolveMessages = function () use (
            &$messagesResult,
            &$messagesWereMarkedRead,
            $request,
            $activeRoom,
            $activeRoomId,
            $activeMessageId,
            $user,
        ) {
            if ($messagesResult === null && ! $activeRoomId) {
                $messagesResult = ['messages' => [], 'nextCursor' => null, 'hasMore' => false];
            }
            if ($messagesResult === null) {
                Gate::authorize('view', $activeRoom);
                $limit = min((int) $request->query('limit', 30), 50);
                $messagesResult = $this->messageService->getMessages(
                    $activeRoomId,
                    $limit,
                    $request->query('before'),
                );
            }

            if (! $messagesWereMarkedRead && ! empty($messagesResult['messages'])) {
                $readThroughMessageId = $activeMessageId
                    ?? $messagesResult['messages'][0]['_id']
                    ?? null;
                $this->messageService->markAsRead($activeRoom, $user->id, $readThroughMessageId);
                $messagesWereMarkedRead = true;
            }

            return $messagesResult;
        };

        return Inertia::render('chat/index', [
            'rooms' => $rooms->map(function (ChatRoom $room) use ($lastMessageMap, $user) {
                $lastReadMessageId = $room->participants
                    ->firstWhere('id', $user->id)
                    ?->pivot
                    ->last_read_message_id;

                return [
                    'id' => $room->id,
                    'projectId' => $room->project_id,
                    'type' => $room->type,
                    'name' => $room->name,
                    'participants' => $room->participants->map(fn (User $p) => [
                        'id' => (string) $p->id,
                        'name' => $p->name,
                        'email' => $p->email,
                        'avatarUrl' => $this->storage->url($p->avatar_url),
                        'role' => $p->pivot->role ?? null,
                        'isMuted' => (bool) ($p->pivot->is_muted ?? false),
                    ])->values()->all(),
                    'lastMessage' => $lastMessageMap[$room->id] ?? null,
                    'unreadCount' => $this->messageService->countUnread(
                        $room->id,
                        $lastReadMessageId,
                        $user->getKey(),
                    ),
                    'createdAt' => $room->created_at?->toIso8601String(),
                    'updatedAt' => $room->updated_at?->toIso8601String(),
                ];
            })->values()->all(),
            'currentUser' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatarUrl' => $this->storage->url($user->avatar_url),
            ],
            'project' => [
                'project_id' => $project->project_id,
                'project_name' => $project->project_name,
                'project_slug' => $project->project_slug,
            ],
            // Lets notification deep-links open and mark the intended room as
            // read instead of landing users on an empty chat pane.
            'activeRoomId' => $activeRoomId,
            'activeMessageId' => $activeMessageId,
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
     * POST /projects/{project}/chat/rooms/group
     *
     * Create a new group room with an explicit subset of project members
     * (chosen via the chat "+" button), distinct from the auto-created
     * project-wide group room every member already belongs to.
     */
    public function storeGroup(int $accountIndex, StoreChatGroupRequest $request, Project $project): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $this->authorize('createGroup', [
            ChatRoom::query()
                ->where('project_id', $project->project_id)
                ->where('type', 'group')
                ->firstOrFail(),
        ]);

        $room = $this->roomService->createCustomGroupRoom(
            $project,
            $user,
            $request->validated('name'),
            $request->validated('participant_ids'),
        );

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

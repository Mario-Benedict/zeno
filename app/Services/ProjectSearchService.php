<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\ChatRoom;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Note;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\User;
use App\Support\Notes\NoteExcerptExtractor;
use Illuminate\Support\Str;
use Throwable;

class ProjectSearchService
{
    /**
     * @return array{query: string, results: list<array<string, mixed>>}
     */
    public function search(Project $project, User $user, int $accountIndex, string $rawQuery): array
    {
        $query = trim(Str::limit($rawQuery, 100, ''));
        if (mb_strlen($query) < 2) {
            return ['query' => $query, 'results' => []];
        }

        $basePath = '/u/'.$accountIndex.'/p/'.rawurlencode($project->project_slug);
        $candidates = $this->navigationCandidates($basePath);

        $boards = KanbanBoard::query()
            ->where('kanban_board_project_id', $project->project_id)
            ->orderBy('kanban_board_position')
            ->limit(150)
            ->get(['kanban_board_id', 'kanban_board_name']);

        foreach ($boards as $board) {
            $candidates[] = [
                'id' => 'board:'.$board->kanban_board_id,
                'kind' => 'board',
                'title' => $board->kanban_board_name,
                'title_key' => null,
                'context' => null,
                'href' => $basePath.'/kanban?'.http_build_query(['board' => $board->kanban_board_id], '', '&', PHP_QUERY_RFC3986),
                'searchable' => $board->kanban_board_name.' board kanban column kolom papan',
            ];
        }

        $cards = KanbanBoardCard::query()
            ->join('kanban_boards', 'kanban_boards.kanban_board_id', '=', 'kanban_board_cards.kanban_board_id')
            ->where('kanban_boards.kanban_board_project_id', $project->project_id)
            ->with([
                'labels:card_label_id,card_label_name',
                'members:id,name',
                'checklists' => fn ($query) => $query
                    ->latest()
                    ->limit(20)
                    ->select([
                        'kanban_board_card_checklist_id',
                        'kanban_board_card_id',
                        'kanban_board_card_checklist_name',
                    ]),
                'checklists.items' => fn ($query) => $query
                    ->latest()
                    ->limit(50)
                    ->select([
                        'kanban_board_card_checklist_item_id',
                        'kanban_board_card_checklist_id',
                        'kanban_board_card_checklist_item_name',
                    ]),
                'attachments' => fn ($query) => $query
                    ->latest()
                    ->limit(20)
                    ->select([
                        'kanban_board_card_attachment_id',
                        'kanban_board_card_id',
                        'kanban_board_card_attachment_name',
                    ]),
                'comments' => fn ($query) => $query
                    ->latest()
                    ->limit(30)
                    ->select([
                        'kanban_board_card_comment_id',
                        'kanban_board_card_id',
                        'kanban_board_card_comment_message',
                    ]),
            ])
            ->latest('kanban_board_cards.updated_at')
            ->limit(300)
            ->get([
                'kanban_board_cards.kanban_board_card_id',
                'kanban_board_cards.kanban_board_card_title',
                'kanban_board_cards.kanban_board_card_description',
                'kanban_boards.kanban_board_name',
            ]);

        foreach ($cards as $card) {
            $candidates[] = [
                'id' => 'card:'.$card->kanban_board_card_id,
                'kind' => 'card',
                'title' => $card->kanban_board_card_title,
                'title_key' => null,
                'context' => $card->kanban_board_name,
                'href' => $basePath.'/kanban?'.http_build_query(['card' => $card->kanban_board_card_id], '', '&', PHP_QUERY_RFC3986),
                'searchable' => implode(' ', array_filter([
                    $card->kanban_board_card_title,
                    $card->kanban_board_card_description,
                    $card->kanban_board_name,
                    $card->labels->pluck('card_label_name')->implode(' '),
                    $card->members->pluck('name')->implode(' '),
                    $card->checklists->flatMap(fn ($checklist) => [
                        $checklist->kanban_board_card_checklist_name,
                        ...$checklist->items->pluck('kanban_board_card_checklist_item_name')->all(),
                    ])->implode(' '),
                    $card->attachments->pluck('kanban_board_card_attachment_name')->implode(' '),
                    $card->comments->pluck('kanban_board_card_comment_message')->implode(' '),
                    'card task tugas kartu kanban',
                ])),
            ];
        }

        $rooms = ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->whereHas('participants', fn ($query) => $query->where('users.id', $user->id))
            ->with('participants:id,name')
            ->latest('updated_at')
            ->limit(100)
            ->get(['id', 'name', 'type']);
        $roomTitles = [];

        foreach ($rooms as $room) {
            $roomTitle = $room->name
                ?? $room->participants->first(fn (User $participant) => (int) $participant->id !== (int) $user->id)?->name;
            $roomTitles[$room->id] = $roomTitle;
            $candidates[] = [
                'id' => 'chat:'.$room->id,
                'kind' => 'chat',
                'title' => $roomTitle,
                'title_key' => $roomTitle === null ? 'nav.chat' : null,
                'context' => null,
                'href' => $basePath.'/chat?'.http_build_query(['room' => $room->id], '', '&', PHP_QUERY_RFC3986),
                'searchable' => ($roomTitle ?? '').' chat conversation room percakapan pesan',
            ];
        }

        try {
            $messages = app(ChatMessageService::class)
                ->getRecentSearchableMessages($rooms->pluck('id')->all());
            foreach ($messages as $message) {
                $body = trim($message['body']);
                if ($body === '') {
                    continue;
                }

                $candidates[] = [
                    'id' => 'message:'.$message['id'],
                    'kind' => 'message',
                    'title' => Str::limit($body, 90),
                    'title_key' => null,
                    'context' => $roomTitles[$message['room_id']] ?? null,
                    'href' => $basePath.'/chat?'.http_build_query([
                        'room' => $message['room_id'],
                        'message' => $message['id'],
                    ], '', '&', PHP_QUERY_RFC3986),
                    'searchable' => $body.' message chat pesan',
                ];
            }
        } catch (Throwable) {
            // MySQL-backed search results remain available when MongoDB is offline.
        }

        $notes = Note::query()
            ->where('project_id', $project->project_id)
            ->where(fn ($query) => $query->where('user_id', $user->id)->orWhere('is_shared', true))
            ->latest('updated_at')
            ->limit(200)
            ->get(['note_id', 'title', 'excerpt', 'content']);

        foreach ($notes as $note) {
            $candidates[] = [
                'id' => 'note:'.$note->note_id,
                'kind' => 'note',
                'title' => $note->title,
                'title_key' => null,
                'context' => Str::limit((string) $note->excerpt, 80),
                'href' => $basePath.'/notes?'.http_build_query(['note' => $note->note_id], '', '&', PHP_QUERY_RFC3986),
                'searchable' => implode(' ', array_filter([
                    $note->title,
                    $note->excerpt,
                    NoteExcerptExtractor::plainText($note->content),
                    'note catatan document dokumen',
                ])),
            ];
        }

        $events = CalendarEvent::query()
            ->where('project_id', $project->project_id)
            ->latest('start_time')
            ->limit(200)
            ->get(['id', 'title', 'description', 'start_time']);

        foreach ($events as $event) {
            $date = $event->start_time?->toDateString();
            $candidates[] = [
                'id' => 'calendar:'.$event->id,
                'kind' => 'calendar',
                'title' => $event->title,
                'title_key' => null,
                'context' => $date,
                'href' => $basePath.'/calendar?'.http_build_query(array_filter([
                    'date' => $date,
                    'event' => $event->id,
                ]), '', '&', PHP_QUERY_RFC3986),
                'searchable' => implode(' ', array_filter([
                    $event->title,
                    $event->description,
                    $date,
                    'calendar event agenda kalender acara',
                ])),
            ];
        }

        $reminders = Reminder::query()
            ->where('reminder_project_id', $project->project_id)
            ->where('reminder_user_id', $user->id)
            ->latest('updated_at')
            ->limit(200)
            ->get(['reminder_id', 'reminder_title', 'reminder_description', 'reminder_due_at']);

        foreach ($reminders as $reminder) {
            $candidates[] = [
                'id' => 'reminder:'.$reminder->reminder_id,
                'kind' => 'reminder',
                'title' => $reminder->reminder_title,
                'title_key' => null,
                'context' => $reminder->reminder_due_at?->toIso8601String(),
                'href' => $basePath.'/reminders?'.http_build_query(['reminder' => $reminder->reminder_id], '', '&', PHP_QUERY_RFC3986),
                'searchable' => implode(' ', array_filter([
                    $reminder->reminder_title,
                    $reminder->reminder_description,
                    'reminder pengingat notification notifikasi',
                ])),
            ];
        }

        $results = collect($candidates)
            ->map(function (array $candidate) use ($query) {
                $candidate['score'] = self::fuzzyScore($query, $candidate['searchable']);

                return $candidate;
            })
            ->filter(fn (array $candidate) => $candidate['score'] > 0)
            ->sortByDesc('score')
            ->take(18)
            ->map(function (array $candidate) {
                unset($candidate['score'], $candidate['searchable']);

                return $candidate;
            })
            ->values()
            ->all();

        return ['query' => $query, 'results' => $results];
    }

    public static function fuzzyScore(string $query, string $candidate): int
    {
        $needle = self::normalize($query);
        $haystack = self::normalize($candidate);
        if ($needle === '' || $haystack === '') {
            return 0;
        }

        if ($needle === $haystack) {
            return 1000;
        }

        if (str_starts_with($haystack, $needle)) {
            return 900 - min(100, strlen($haystack) - strlen($needle));
        }

        $position = strpos($haystack, $needle);
        if ($position !== false) {
            return 760 - min(160, $position);
        }

        foreach (explode(' ', $haystack) as $word) {
            if (str_starts_with($word, $needle)) {
                return 680 - min(100, strlen($word) - strlen($needle));
            }

            $distance = levenshtein($needle, $word);
            $allowedDistance = max(1, (int) floor(strlen($needle) / 4));
            if ($distance <= $allowedDistance) {
                return 540 - ($distance * 40);
            }
        }

        $queryIndex = 0;
        $gapCount = 0;
        for ($candidateIndex = 0; $candidateIndex < strlen($haystack) && $queryIndex < strlen($needle); $candidateIndex++) {
            if ($haystack[$candidateIndex] === $needle[$queryIndex]) {
                $queryIndex++;
            } elseif ($queryIndex > 0) {
                $gapCount++;
            }
        }

        return $queryIndex === strlen($needle)
            ? max(1, 400 - ($gapCount * 3))
            : 0;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function navigationCandidates(string $basePath): array
    {
        $items = [
            ['dashboard', 'nav.dashboard', '/dashboard', 'dashboard home overview ringkasan beranda'],
            ['board', 'nav.board', '/kanban', 'board kanban card task tugas kartu papan'],
            ['timeline', 'nav.timeline', '/timeline', 'timeline schedule roadmap jadwal lini masa'],
            ['calendar', 'nav.calendar', '/calendar', 'calendar event agenda kalender acara'],
            ['chat', 'nav.chat', '/chat', 'chat message room conversation pesan percakapan'],
            ['llm', 'nav.llm', '/llm-chat', 'llm ai assistant artificial intelligence kecerdasan buatan'],
            ['notes', 'nav.notes', '/notes', 'notes document catatan dokumen'],
            ['reminders', 'nav.reminders', '/reminders', 'reminders notification pengingat notifikasi'],
        ];

        return array_map(
            fn (array $item) => $this->mapNavigationCandidate($item, $basePath),
            $items,
        );
    }

    /**
     * @param  array{0: string, 1: string, 2: string, 3: string}  $item
     * @return array<string, mixed>
     */
    private function mapNavigationCandidate(array $item, string $basePath): array
    {
        return [
            'id' => 'navigation:'.$item[0],
            'kind' => 'navigation',
            'title' => null,
            'title_key' => $item[1],
            'context' => null,
            'href' => $basePath.$item[2],
            'searchable' => $item[3],
        ];
    }

    private static function normalize(string $value): string
    {
        return preg_replace('/\s+/', ' ', Str::lower(Str::ascii(trim($value)))) ?? '';
    }
}

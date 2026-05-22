<?php

namespace App\Services;

use App\Models\ChatRoom;
use App\Models\User;
use App\Services\MongoDB\MongoConnection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;
use MongoDB\Collection;

/**
 * ChatMessageService
 * -------------------
 * Menangani semua operasi pesan chat yang disimpan di MongoDB.
 *
 * Arsitektur:
 *  - MongoDB  : menyimpan isi pesan (append-heavy, schema fleksibel)
 *  - MySQL    : menyimpan metadata room & participant (relasional)
 *  - StorageService : menangani upload file (local atau S3)
 *
 * Collection MongoDB: `chat_messages`
 * Schema dokumen:
 * {
 *   _id          : ObjectId          ← MongoDB auto-generate
 *   room_id      : string (UUID)     ← FK ke MySQL chat_rooms.id
 *   sender_id    : string (UUID)     ← FK ke MySQL users.id
 *   type         : 'text'|'image'|'file'
 *   body         : string            ← teks atau caption
 *   attachments  : [{                ← array, kosong untuk pesan teks
 *     id         : string (UUID)
 *     type       : 'image'|'file'
 *     file_name  : string
 *     mime_type  : string
 *     size       : int (bytes)
 *     path       : string (relative) ← TIDAK menyimpan URL
 *   }]
 *   is_deleted   : bool              ← soft delete / tombstone
 *   created_at   : UTCDateTime
 *   updated_at   : UTCDateTime
 * }
 *
 * Index yang harus dibuat di MongoDB (jalankan sekali saat setup):
 *   db.chat_messages.createIndex({ room_id: 1, _id: -1 })   ← cursor pagination
 *   db.chat_messages.createIndex({ room_id: 1, created_at: -1 })
 */
class ChatMessageService
{
    private const COLLECTION = 'chat_messages';

    private const DELETED_TOMBSTONE = 'This message was deleted.';

    private Collection $collection;

    public function __construct(
        private readonly MongoConnection $mongo,
        private readonly StorageService  $storage,
    ) {
        $this->collection = $mongo->collection(self::COLLECTION);
    }

    /**
     * Ambil pesan untuk sebuah room dengan cursor pagination.
     *
     * Diurutkan newest-first (descending _id) agar infinite scroll ke atas
     * cukup mengirim cursor `before` = ObjectId pesan paling lama di layar.
     *
     * @param  string      $roomId  UUID dari MySQL chat_rooms.id
     * @param  int         $limit   Jumlah pesan per halaman (default 30)
     * @param  string|null $before  ObjectId string sebagai cursor
     * @return array{
     *   messages: array<int, array>,
     *   nextCursor: string|null,
     *   hasMore: bool,
     * }
     */
    public function getMessages(string $roomId, int $limit = 30, ?string $before = null): array
    {
        $filter = ['room_id' => $roomId, 'is_deleted' => false];

        if ($before) {
            $filter['_id'] = ['$lt' => new ObjectId($before)];
        }

        $cursor = $this->collection->find(
            $filter,
            [
                'sort'  => ['_id' => -1],
                'limit' => $limit + 1,
            ],
        );

        $documents = iterator_to_array($cursor, false);
        $hasMore   = count($documents) > $limit;

        if ($hasMore) {
            array_pop($documents);
        }

        $senderIds = array_unique(array_column($documents, 'sender_id'));
        $senderMap = $this->loadSenders($senderIds);

        $messages = array_map(
            fn ($doc) => $this->formatMessage($doc, $senderMap),
            $documents,
        );

        $nextCursor = $hasMore
            ? (string) end($documents)['_id']
            : null;

        return [
            'messages'   => $messages,
            'nextCursor' => $nextCursor,
            'hasMore'    => $hasMore,
        ];
    }


    /**
     * Ambil preview pesan terakhir untuk banyak room sekaligus (batch).
     * Dipanggil oleh ChatRoomController saat render halaman chat
     *
     * Strategi: 1 query MongoDB dengan $group + $sort, bukan N queries.
     *
     * @param  string[] $roomIds
     * @return array<string, array{body: string, senderName: string, createdAt: string}>
     *         Key = room_id (UUID string)
     */
    public function getLastMessagePreviewsForRooms(array $roomIds): array
    {
        if (empty($roomIds)) return [];

        $pipeline = [
            ['$match' => [
                'room_id'    => ['$in' => $roomIds],
                'is_deleted' => false,
            ]],

            ['$sort' => ['_id' => -1]],

            ['$group' => [
                '_id'       => '$room_id',
                'body'      => ['$first' => '$body'],
                'sender_id' => ['$first' => '$sender_id'],
                'type'      => ['$first' => '$type'],
                'createdAt' => ['$first' => '$created_at'],
            ]],
        ];

        $results = iterator_to_array(
            $this->collection->aggregate($pipeline),
            false,
        );

        $senderIds = array_unique(array_column($results, 'sender_id'));
        $senderMap = $this->loadSenders($senderIds);

        $map = [];
        foreach ($results as $doc) {
            $sender  = $senderMap[$doc['sender_id']] ?? null;
            $preview = match ($doc['type']) {
                'image' => $sender ? "{$sender['name']} sent an image" : 'Sent an image',
                'file'  => $sender ? "{$sender['name']} sent a file"  : 'Sent a file',
                default => $doc['body'] ?? '',
            };

            $map[(string) $doc['_id']] = [
                'body'        => $preview,
                'senderName'  => $sender['name'] ?? 'Unknown',
                'createdAt'   => $this->formatMongoDate($doc['createdAt']),
            ];
        }

        return $map;
    }

    /**
     * Simpan pesan baru ke MongoDB.
     * Upload attachment ke StorageService jika ada.
     *
     * @param  ChatRoom $room
     * @param  User     $sender
     * @param  array{
     *   type: 'text'|'image'|'file',
     *   body: string|null,
     *   attachments?: array<int, array{file: UploadedFile, type: string}>
     * } $payload  Data dari SendMessageRequest yang sudah tervalidasi
     *
     * @return array  Dokumen pesan yang sudah diformat (siap dikembalikan ke frontend)
     */
    public function send(ChatRoom $room, User $sender, array $payload): array
    {
        $attachments = $this->uploadAttachments($payload['attachments'] ?? []);

        $now = new UTCDateTime();

        $document = [
            'room_id'     => $room->id,
            'sender_id'   => $sender->id,
            'type'        => $payload['type'],
            'body'        => $payload['body'] ?? '',
            'attachments' => $attachments,
            'is_deleted'  => false,
            'created_at'  => $now,
            'updated_at'  => $now,
        ];

        $result = $this->collection->insertOne($document);

        $room->touch();

        $document['_id'] = $result->getInsertedId();

        return $this->formatMessage(
            $document,
            $this->loadSenders([$sender->id]),
        );
    }

    /**
     * Hapus pesan secara soft (tombstone).
     *
     * Hanya pengirim asli atau admin room yang boleh menghapus.
     * Attachment fisik dihapus dari storage agar tidak memakan space.
     *
     * @param  ChatRoom $room
     * @param  string   $messageId  MongoDB ObjectId string
     * @param  User     $actor      User yang melakukan aksi hapus
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException  jika bukan pemilik/admin
     * @throws \InvalidArgumentException                        jika messageId tidak valid
     */
    public function delete(ChatRoom $room, string $messageId, User $actor): void
    {
        $objectId = new ObjectId($messageId);

        $message = $this->collection->findOne([
            '_id'     => $objectId,
            'room_id' => $room->id,
        ]);

        if (! $message) {
            throw new \InvalidArgumentException("Message {$messageId} not found in room {$room->id}.");
        }

        // Periksa kepemilikan: pengirim asli ATAU admin room
        $isOwner = (string) $message['sender_id'] === $actor->id;
        $isAdmin = $room->participants()
            ->where('user_id', $actor->id)
            ->wherePivot('role', 'admin')
            ->exists();

        if (! $isOwner && ! $isAdmin) {
            throw new \Illuminate\Auth\Access\AuthorizationException(
                'You are not allowed to delete this message.'
            );
        }

        // Hapus file fisik dari storage
        $paths = collect($message['attachments'] ?? [])
            ->pluck('path')
            ->filter()
            ->values()
            ->all();

        $this->storage->deleteMany($paths);

        // Soft delete: ganti isi dengan tombstone, hapus attachment metadata
        $this->collection->updateOne(
            ['_id' => $objectId],
            ['$set' => [
                'body'        => self::DELETED_TOMBSTONE,
                'attachments' => [],
                'is_deleted'  => true,
                'updated_at'  => new UTCDateTime(),
            ]],
        );
    }

    /**
     * Update last_read_message_id di MySQL untuk hitung unread count.
     * Dipanggil oleh ChatMessageController setiap kali user membuka room.
     *
     * @param  ChatRoom    $room
     * @param  string      $userId         MySQL users.id
     * @param  string|null $lastMessageId  MongoDB ObjectId string pesan terbaru
     */
    public function markAsRead(ChatRoom $room, string $userId, ?string $lastMessageId): void
    {
        if (! $lastMessageId) return;

        DB::table('chat_room_participants')
            ->where('chat_room_id', $room->id)
            ->where('user_id', $userId)
            ->update([
                'last_read_message_id' => $lastMessageId,
            ]);
    }

    /**
     * Hitung jumlah pesan belum dibaca untuk seorang user di sebuah room.
     *
     * Strategi:
     *  1. Ambil last_read_message_id dari MySQL (pivot)
     *  2. Hitung dokumen MongoDB dengan _id > last_read ObjectId
     *
     * @param  string $roomId
     * @param  string $userId
     * @return int
     */
    public function countUnread(string $roomId, string $userId): int
    {
        $participant = DB::table('chat_room_participants')
            ->where('chat_room_id', $roomId)
            ->where('user_id', $userId)
            ->value('last_read_message_id');

        $filter = ['room_id' => $roomId, 'is_deleted' => false];

        if ($participant) {
            $filter['_id'] = ['$gt' => new ObjectId($participant)];
        }

        return (int) $this->collection->countDocuments($filter);
    }

    /**
     * Upload semua attachment dalam satu pesan ke StorageService.
     * Kembalikan array metadata attachment (tanpa URL — hanya relative path).
     *
     * @param  array<int, array{file: UploadedFile, type: string}> $rawAttachments
     * @return array<int, array>
     */
    private function uploadAttachments(array $rawAttachments): array
    {
        $result = [];

        foreach ($rawAttachments as $item) {
            /** @var UploadedFile $file */
            $file = $item['file'];
            $type = $item['type']; // 'image' | 'file'

            $folder = $type === 'image' ? 'chats/images' : 'chats/files';
            $path   = $this->storage->put($file, $folder);

            $result[] = [
                'id'        => \Illuminate\Support\Str::uuid()->toString(),
                'type'      => $type,
                'file_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'size'      => $file->getSize(),
                'path'      => $path, // relative — URL di-resolve saat read
            ];
        }

        return $result;
    }

    /**
     * Eager load data sender dari MySQL berdasarkan array sender_id.
     * Mengembalikan map [ userId => ['name' => ..., 'avatarUrl' => ...] ]
     *
     * @param  string[] $senderIds
     * @return array<string, array{name: string, email: string, avatarUrl: string|null}>
     */
    private function loadSenders(array $senderIds): array
    {
        if (empty($senderIds)) return [];

        return DB::table('users')
            ->whereIn('id', $senderIds)
            ->get(['id', 'name', 'email'])
            ->keyBy('id')
            ->map(fn ($u) => [
                'id'        => $u->id,
                'name'      => $u->name,
                'email'     => $u->email,
                'avatarUrl' => null,
            ])
            ->all();
    }

    /**
     * Ubah dokumen MongoDB menjadi array yang siap dikembalikan ke frontend.
     * Resolve semua relative path attachment → full URL.
     *
     * @param  array|\MongoDB\Model\BSONDocument $doc
     * @param  array<string, array>              $senderMap  Hasil loadSenders()
     * @return array
     */
    private function formatMessage(mixed $doc, array $senderMap): array
    {
        if ($doc instanceof \MongoDB\Model\BSONDocument) {
            $doc = $doc->getArrayCopy();
        }

        $attachments = [];
        foreach ((array) ($doc['attachments'] ?? []) as $att) {
            $att = $att instanceof \MongoDB\Model\BSONDocument
                ? $att->getArrayCopy()
                : (array) $att;

            $attachments[] = [
                'id'       => $att['id']       ?? '',
                'type'     => $att['type']     ?? 'file',
                'fileName' => $att['file_name'] ?? $att['fileName'] ?? '',
                'mimeType' => $att['mime_type'] ?? $att['mimeType'] ?? '',
                'size'     => (int) ($att['size'] ?? 0),
                'path'     => $att['path']     ?? '',
                'url'      => $this->storage->url($att['path'] ?? null),
            ];
        }

        $sender = $senderMap[(string) ($doc['sender_id'] ?? '')] ?? null;

        return [
            '_id'         => (string) $doc['_id'],
            'roomId'      => $doc['room_id'],
            'senderId'    => $doc['sender_id'],
            'sender'      => $sender,
            'type'        => $doc['type'],
            'body'        => $doc['is_deleted'] ?? false
                ? self::DELETED_TOMBSTONE
                : ($doc['body'] ?? ''),
            'attachments' => $attachments,
            'isDeleted'   => (bool) ($doc['is_deleted'] ?? false),
            'createdAt'   => $this->formatMongoDate($doc['created_at'] ?? null),
            'updatedAt'   => $this->formatMongoDate($doc['updated_at'] ?? null),
        ];
    }

    /**
     * Konversi MongoDB UTCDateTime atau null → ISO 8601 string.
     *
     * @param  \MongoDB\BSON\UTCDateTime|null $date
     * @return string|null
     */
    private function formatMongoDate(mixed $date): ?string
    {
        if (! $date instanceof UTCDateTime) return null;
        return $date->toDateTime()->format(\DateTimeInterface::ATOM);
    }
}
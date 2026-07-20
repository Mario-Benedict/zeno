/**
 * types/chat.ts
 * --------------
 * Shared TypeScript interfaces for the Chat feature.
 *
 * Database mapping:
 *  - ChatRoom, ChatRoomParticipant  → MySQL  (structured / relational data)
 *  - ChatMessage                    → MongoDB (append-heavy message data)
 *
 * The MongoDB collections reference MySQL via UUID foreign keys:
 *  - ChatMessage.roomId  ↔  ChatRoom.id
 */

/* ──────────────────────────────────────────────────────────────
   Participants / Users
────────────────────────────────────────────────────────────── */

/**
 * A lightweight user shape used inside chat contexts.
 * Mirrors the `users` MySQL table (selected columns only).
 */
export interface ChatParticipant {
  /** UUID — PK from MySQL `users` table */
  id: string;
  name: string;
  email: string;
  /** Optional presigned/public avatar URL resolved by the backend */
  avatarUrl?: string | null;
}

/* ──────────────────────────────────────────────────────────────
   Chat Rooms (MySQL)
────────────────────────────────────────────────────────────── */

/** Discriminator for room varieties */
export type RoomType = 'group' | 'dm';

/**
 * Mirrors the `chat_rooms` MySQL table.
 *
 * - type === 'group'  → auto-created when a project is created
 * - type === 'dm'     → 1-on-1 between two project members;
 *                       scoped to a project via chat_project_id
 */
export interface ChatRoom {
  /** UUID — PK */
  id: string;

  /** FK → projects.id; ensures DMs are project-scoped */
  projectId: string;

  /** 'group' | 'dm' */
  type: RoomType;

  /**
   * Human-readable name.
   * - Group rooms: auto-set to the project name on creation.
   * - DM rooms: null (frontend derives name from the other participant).
   */
  name: string | null;

  /** Optional avatar — relative path resolved to full URL by backend */
  avatarUrl?: string | null;

  /** Eager-loaded participants (from chat_room_participants + users join) */
  participants?: ChatParticipant[];

  /**
   * Last message preview (denormalised from MongoDB for performance).
   * Populated by the backend; may be null for brand-new rooms.
   */
  lastMessage?: ChatMessagePreview | null;

  /** Number of messages from other users after this participant's read cursor. */
  unreadCount: number;

  createdAt: string;
  updatedAt: string;
}

/* ──────────────────────────────────────────────────────────────
   Chat Messages (MongoDB)
────────────────────────────────────────────────────────────── */

/** Discriminator for message content types */
export type MessageType = 'text' | 'image' | 'file';

/**
 * A single file/media attachment stored inside a message document.
 * Stored as an array in MongoDB to support bulk-send (multiple files
 * in one message bubble).
 */
export interface MessageAttachment {
  /** Unique identifier for the attachment */
  id: string;
  /** 'image' | 'file' */
  type: MessageType;
  /** Original filename (e.g. "report-q3.pdf") */
  fileName: string;
  /** MIME type (e.g. "application/pdf", "image/png") */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /**
   * Relative path stored in MongoDB (e.g. "chats/media/uuid.png").
   * The backend resolves this to a full URL at query time.
   */
  path: string;
  /** Resolved preview URL, signed for S3-compatible storage */
  url?: string | null;
  /** Resolved download URL with the original filename */
  downloadUrl?: string | null;
}

/**
 * Full chat message document stored in MongoDB.
 *
 * Collection: `chat_messages`
 * FK:  roomId → MySQL chat_rooms.id (UUID string)
 */
export interface ChatMessage {
  /** MongoDB ObjectId (as string) */
  _id: string;

  /** FK → MySQL chat_rooms.id */
  roomId: string;

  /** FK → MySQL users.id */
  senderId: string;

  /** Resolved sender info (joined from MySQL at query time) */
  sender?: ChatParticipant;

  /** Primary content type of the message */
  type: MessageType;

  /**
   * Text body.
   * - type === 'text'  → the actual message content
   * - type === 'image' | 'file'  → optional caption; may be empty
   */
  body: string;

  /**
   * Media attachments (empty array for text-only messages).
   * Enables bulk-send: multiple files in one bubble.
   */
  attachments: MessageAttachment[];

  /** True when the message has been soft-deleted (body replaced with tombstone). */
  isDeleted?: boolean;

  /** ISO 8601 timestamp */
  createdAt: string;
  updatedAt: string;

  /**
   * Client-only fields, never present on a server-fetched message — set
   * while a message the current user just sent is optimistically shown
   * ahead of the server confirming it (see ChatComposer's `send()`).
   */
  /** True while this message is still saving. */
  pending?: boolean;
  /** True if the send request failed. */
  failed?: boolean;
}

/**
 * Lightweight message preview used in the sidebar room list.
 * Denormalised from MongoDB into the MySQL row (or assembled at query time).
 */
export interface ChatMessagePreview {
  body: string;
  senderName: string;
  createdAt: string;
}

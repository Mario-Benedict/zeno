import type { JSONContent } from '@tiptap/core';

// ─── Notes Domain Types ──────────────────────────────────────────────────────
//
// Mirrors the payloads sent by `NoteController` (see
// `app/Http/Controllers/Notes/NoteController.php`): `index()` ships the
// lightweight `NoteListItem` shape (no block content), `show()`/`store()`/
// `update()`/`share()` ship the full `NoteDetail` shape.

/** A Tiptap/ProseMirror document — the shape stored in `notes.content`. */
export type NoteContent = JSONContent;

export type NoteCollaboratorRole = 'Editor' | 'Viewer';

export interface NoteCollaborator {
  id: number;
  name: string;
  email: string;
  canEdit: boolean;
  avatarUrl: string | null;
}

/** Sidebar row shape — deliberately excludes `content` (see NoteController::index). */
export interface NoteListItem {
  id: string;
  title: string;
  excerpt: string | null;
  isShared: boolean;
  ownerId: number;
  updatedAt: string | null;
  collaboratorsCount: number;
}

/** Full note fetched on demand when a note is opened (NoteController::show). */
export interface NoteDetail {
  id: string;
  title: string;
  content: NoteContent;
  excerpt: string | null;
  isShared: boolean;
  ownerId: number;
  updatedAt: string | null;
  version: number;
  collaborators: NoteCollaborator[];
}

/** A project member available to pick from in the share/collaborator dialog. */
export interface NoteProjectUser {
  id: number;
  name: string;
  email: string;
}

export interface NotesPageProps {
  notes: NoteListItem[];
  projectUsers: NoteProjectUser[];
  currentUserId: number;
  activeNoteId: string | null;
  [key: string]: unknown;
}

/** Autosave lifecycle shown in the editor header's status chip. */
export type NoteSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

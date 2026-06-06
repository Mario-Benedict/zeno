/**
 * @file resources/js/types/note.ts
 * @description TypeScript interfaces for the Notes feature.
 *
 * Mirrors the array shape returned by NoteController::mapNote()
 */

// ─── Note content (JSON column) ───────────────────────────────────────────────

export interface NoteContent {
    /** Rich-text HTML from contentEditable editor */
    html?: string;
    /** Plain-text fallback (backward compat) */
    text?: string;
    /** YouTube embed URL */
    embedUrl?: string;
    /** YouTube embed display title */
    embedTitle?: string;
}

// ─── Note list item ───────────────────────────────────────────────────────────

export interface NoteItem {
    /** UUID primary key (note_id) */
    id: string;
    title: string;
    /** e.g. "Last Updated: 5 minutes ago" */
    timeAgo?: string;
    content?: NoteContent | null;
    /** false = Personal, true = Shared project-wide */
    isShared: boolean;
    userId: number;
}

// ─── Inertia page props ───────────────────────────────────────────────────────

export interface PersonalNotesPageProps {
    projectSlug: string;
    initialNotes: NoteItem[];
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface CreateNotePayload {
    title: string;
    content: NoteContent;
    is_shared: false;
}

export interface UpdateNotePayload {
    title?: string;
    content?: NoteContent;
}
import type { Editor } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import DiffMatchPatch from 'diff-match-patch';
import { useCallback, useEffect, useRef, useState } from 'react';
import echo from '@/echo';
import { useTranslation } from '@/hooks/useTranslation';
import { inertiaJson } from '@/lib/inertiaJson';
import notes from '@/routes/notes';
import type { NoteContent, NoteDetail, NoteSaveStatus } from '@/types/notes';
import { AutoCloseBrackets } from './editor/extensions/autoCloseBrackets';
import { CodeBlock } from './editor/extensions/codeBlock';
import { Embed } from './editor/extensions/embed';
import { NoteImage } from './editor/extensions/image';
import { SlashCommand } from './editor/extensions/slashCommand';

const AUTOSAVE_DELAY_MS = 600;
const MAX_CONFLICT_REBASE_ATTEMPTS = 3;

interface HttpErrorWithResponse {
  response?: {
    status?: number;
    data?: string | { note?: NoteDetail | null };
  };
}

const conflictNoteFromError = (error: unknown): NoteDetail | null => {
  const response = (error as HttpErrorWithResponse).response;
  if (response?.status !== 409 || !response.data) return null;

  try {
    const payload =
      typeof response.data === 'string'
        ? (JSON.parse(response.data) as { note?: NoteDetail | null })
        : response.data;

    return payload.note ?? null;
  } catch {
    return null;
  }
};

const mergeTextChanges = (
  base: string,
  local: string,
  remote: string,
): string | null => {
  if (local === base) return remote;
  if (remote === base || local === remote) return local;

  const matcher = new DiffMatchPatch();
  const [merged, applied] = matcher.patch_apply(
    matcher.patch_make(base, local),
    remote,
  );

  return applied.every(Boolean) ? merged : null;
};

export const emptyNoteDocument = (): NoteContent => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

interface UseNoteEditorOptions {
  accountIndex: number;
  projectSlug: string;
  note: NoteDetail | null;
  canEdit: boolean;
  onSaved: (note: NoteDetail) => void;
}

/**
 * Owns the Tiptap instance for whichever note is open, plus the debounced
 * autosave state machine (`idle -> dirty -> saving -> saved/error`).
 *
 * Callers must mount the consuming component with `key={note?.id}` (see
 * `NotesPage`) — that fully remounts this hook per note switch, which is
 * what resets `title`/`saveStatus`/etc. to the new note's values. That's
 * simpler and more correct than manually resetting each piece of state in
 * an effect, and it's why `noteId` below is a plain value rather than a
 * ref: within one mounted instance it never changes.
 */
export const useNoteEditor = ({
  accountIndex,
  projectSlug,
  note,
  canEdit,
  onSaved,
}: UseNoteEditorOptions) => {
  const { t } = useTranslation();
  const noteId = note?.id ?? null;

  const [title, setTitleState] = useState(note?.title ?? '');
  const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(
    note?.updatedAt ?? null,
  );

  const dirtyRef = useRef(false);
  const editRevisionRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);
  const versionRef = useRef(note?.version ?? 1);
  const baseTitleRef = useRef(note?.title ?? '');
  const baseContentRef = useRef(
    JSON.stringify(note?.content ?? emptyNoteDocument()),
  );
  const performSaveRef = useRef<(activeEditor: Editor) => Promise<void>>(
    async () => undefined,
  );

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      if (!noteId) throw new Error('No note selected');

      const form = new FormData();
      form.append('image', file);

      const data = await inertiaJson<{ url: string }>(
        'post',
        notes.images.store.url({
          accountIndex,
          project: projectSlug,
          note: noteId,
        }),
        { data: form },
      );

      return data.url;
    },
    [accountIndex, projectSlug, noteId],
  );

  const performSave = useCallback(
    async (activeEditor: Editor) => {
      if (!noteId) return;

      setSaveStatus('saving');

      for (let attempt = 0; attempt < MAX_CONFLICT_REBASE_ATTEMPTS; attempt++) {
        const revisionAtRequest = editRevisionRef.current;
        const localTitle = titleRef.current.trim() || t('notes.untitled');
        const localContent = activeEditor.getJSON();
        const socketId = echo.socketId();

        try {
          const data = await inertiaJson<{ note: NoteDetail }>(
            'patch',
            notes.update.url({
              accountIndex,
              project: projectSlug,
              note: noteId,
            }),
            {
              data: {
                title: localTitle,
                content: localContent,
                version: versionRef.current,
              },
              headers: socketId ? { 'X-Socket-ID': socketId } : {},
            },
          );

          versionRef.current = data.note.version;
          baseTitleRef.current = data.note.title;
          baseContentRef.current = JSON.stringify(data.note.content);
          setSavedAt(data.note.updatedAt);
          onSaved(data.note);

          if (editRevisionRef.current === revisionAtRequest) {
            dirtyRef.current = false;
            setSaveStatus('saved');
          } else {
            dirtyRef.current = true;
            setSaveStatus('dirty');
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(
              () => void performSaveRef.current(activeEditor),
              AUTOSAVE_DELAY_MS,
            );
          }

          return;
        } catch (error: unknown) {
          const latest = conflictNoteFromError(error);
          if (!latest) {
            setSaveStatus('error');
            return;
          }

          const currentLocalContentJson = JSON.stringify(
            activeEditor.getJSON(),
          );
          const mergedContentJson = mergeTextChanges(
            baseContentRef.current,
            currentLocalContentJson,
            JSON.stringify(latest.content),
          );
          const mergedTitle = mergeTextChanges(
            baseTitleRef.current,
            titleRef.current,
            latest.title,
          );

          if (!mergedContentJson || mergedTitle === null) {
            setSaveStatus('error');
            return;
          }

          try {
            const mergedContent = JSON.parse(mergedContentJson) as NoteContent;

            activeEditor.commands.setContent(mergedContent, {
              emitUpdate: false,
            });
            setTitleState(mergedTitle);
            titleRef.current = mergedTitle;
            versionRef.current = latest.version;
            baseTitleRef.current = latest.title;
            baseContentRef.current = JSON.stringify(latest.content);
            dirtyRef.current = true;
            setSaveStatus('dirty');
          } catch {
            setSaveStatus('error');
            return;
          }
        }
      }

      setSaveStatus('error');
    },
    [accountIndex, projectSlug, noteId, onSaved, t],
  );

  useEffect(() => {
    performSaveRef.current = performSave;
  }, [performSave]);

  const scheduleSave = useCallback(
    (activeEditor: Editor) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => void performSave(activeEditor),
        AUTOSAVE_DELAY_MS,
      );
    },
    [performSave],
  );

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          link: { openOnClick: false, autolink: true },
          codeBlock: false,
        }),
        CodeBlock,
        Placeholder.configure({
          placeholder: t('notes.editorContentPlaceholder'),
        }),
        TaskList,
        TaskItem.configure({ nested: true }),
        NoteImage.configure({ uploadImage }),
        Embed,
        SlashCommand,
        AutoCloseBrackets,
      ],
      content: note?.content ?? emptyNoteDocument(),
      editable: canEdit,
      editorProps: {
        attributes: { class: 'prose-note focus:outline-none' },
      },
      onUpdate: ({ editor: activeEditor }) => {
        editRevisionRef.current += 1;
        dirtyRef.current = true;
        setSaveStatus('dirty');
        scheduleSave(activeEditor);
      },
    },
    [noteId],
  );

  useEffect(() => {
    editor?.setEditable(canEdit);
  }, [editor, canEdit]);

  const setTitle = useCallback(
    (value: string) => {
      setTitleState(value);

      if (!editor || !canEdit) return;

      editRevisionRef.current += 1;
      dirtyRef.current = true;
      setSaveStatus('dirty');
      scheduleSave(editor);
    },
    [editor, canEdit, scheduleSave],
  );

  const flushSave = useCallback(() => {
    if (!editor || !dirtyRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    void performSave(editor);
  }, [editor, performSave]);

  const isDirty = useCallback(() => dirtyRef.current, []);

  const applyRemoteContent = useCallback(
    (remoteNote: NoteDetail) => {
      if (!editor || remoteNote.id !== noteId) return;

      editor.commands.setContent(remoteNote.content, { emitUpdate: false });
      setTitleState(remoteNote.title);
      setSavedAt(remoteNote.updatedAt);
      versionRef.current = remoteNote.version;
      baseTitleRef.current = remoteNote.title;
      baseContentRef.current = JSON.stringify(remoteNote.content);
    },
    [editor, noteId],
  );

  return {
    editor,
    title,
    setTitle,
    saveStatus,
    savedAt,
    isDirty,
    applyRemoteContent,
    flushSave,
  };
};

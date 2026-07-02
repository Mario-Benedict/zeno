import type { Editor } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import notes from '@/routes/projects/notes';
import type { NoteContent, NoteDetail, NoteSaveStatus } from '@/types/notes';
import { AutoCloseBrackets } from './editor/extensions/autoCloseBrackets';
import { CodeBlock } from './editor/extensions/codeBlock';
import { Embed } from './editor/extensions/embed';
import { NoteImage } from './editor/extensions/image';
import { SlashCommand } from './editor/extensions/slashCommand';

const AUTOSAVE_DELAY_MS = 600;

export const emptyNoteDocument = (): NoteContent => ({ type: 'doc', content: [{ type: 'paragraph' }] });

interface UseNoteEditorOptions {
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
export const useNoteEditor = ({ projectSlug, note, canEdit, onSaved }: UseNoteEditorOptions) => {
  const noteId = note?.id ?? null;

  const [title, setTitleState] = useState(note?.title ?? '');
  const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>('idle');
  const [savedAt, setSavedAt] = useState<string | null>(note?.updatedAt ?? null);

  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(title);

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

      const { data } = await axios.post<{ url: string }>(notes.images.store.url({ project: projectSlug, note: noteId }), form);

      return data.url;
    },
    [projectSlug, noteId],
  );

  const performSave = useCallback(
    async (activeEditor: Editor) => {
      if (!noteId) return;

      setSaveStatus('saving');

      try {
        const { data } = await axios.patch<{ note: NoteDetail }>(notes.update.url({ project: projectSlug, note: noteId }), {
          title: titleRef.current.trim() || 'Untitled',
          content: activeEditor.getJSON(),
        });

        dirtyRef.current = false;
        setSaveStatus('saved');
        setSavedAt(data.note.updatedAt);
        onSaved(data.note);
      } catch {
        setSaveStatus('error');
      }
    },
    [projectSlug, noteId, onSaved],
  );

  const scheduleSave = useCallback(
    (activeEditor: Editor) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void performSave(activeEditor), AUTOSAVE_DELAY_MS);
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
        Placeholder.configure({ placeholder: "Write something, or press '/' for commands…" }),
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
    },
    [editor, noteId],
  );

  return { editor, title, setTitle, saveStatus, savedAt, isDirty, applyRemoteContent, flushSave };
};

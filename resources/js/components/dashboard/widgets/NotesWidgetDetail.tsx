import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
import { CodeBlock } from '@/components/notes/editor/extensions/codeBlock';
import { Embed } from '@/components/notes/editor/extensions/embed';
import { NoteImage } from '@/components/notes/editor/extensions/image';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import { inertiaJson } from '@/lib/inertiaJson';
import notes from '@/routes/notes';
import type { NoteDetail, NoteListItem } from '@/types/notes';
import BackIcon from '@public/icons/small/arrow_left.svg';

interface Props {
  note: NoteListItem;
  onBack: () => void;
}

const emptyDocument = () => ({
  type: 'doc',
  content: [{ type: 'paragraph' }],
});

export const NotesWidgetDetail = ({ note, onBack }: Props) => {
  const { project, accountIndex } = useProject();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  // Read-only Tiptap instance with the same node extensions as the real
  // editor (see useNoteEditor.ts) so headings, lists, task lists, code
  // blocks (with syntax highlighting), images, and embeds keep their actual
  // styling — just not the editing-only extensions (slash menu, placeholder,
  // autoclose brackets), which don't apply once `editable: false`.
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
        codeBlock: false,
      }),
      CodeBlock,
      TaskList,
      TaskItem.configure({ nested: true }),
      NoteImage,
      Embed,
    ],
    content: emptyDocument(),
    editable: false,
    editorProps: {
      attributes: { class: 'prose-note' },
    },
  });

  useEffect(() => {
    let cancelled = false;
    // Reset for the newly selected note before fetching its content.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    inertiaJson<{ note: NoteDetail }>(
      'get',
      notes.show.url({
        accountIndex,
        project: project.project_slug,
        note: note.id,
      }),
    )
      .then((data: { note: NoteDetail }) => {
        if (!cancelled) {
          editor?.commands.setContent(data.note.content, {
            emitUpdate: false,
          });
        }
      })
      .catch(() => console.error('Failed to load note'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountIndex, project.project_slug, note.id, editor]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 pt-3 pr-10 pb-2 pl-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('dashboard.backToNotes')}
          className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <p className="min-w-0 flex-1 truncate text-small font-semibold text-dark-primary">
          {note.title || t('dashboard.untitled')}
        </p>
      </div>

      <div className="scrollbar-app notes-widget-detail min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {loading ? (
          <p className="py-6 text-center text-xsmall text-white/30">
            {t('dashboard.loadingMessages')}
          </p>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
};

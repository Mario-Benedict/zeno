import { useTranslation } from '@/hooks/useTranslation';
import type { NoteListItem } from '@/types/notes';

interface Props {
  notes: NoteListItem[];
  onSelectNote: (note: NoteListItem) => void;
}

const formatUpdatedAt = (iso: string | null): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const NotesWidgetList = ({ notes, onSelectNote }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="scrollbar-app flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-2">
      {notes.length === 0 ? (
        <p className="px-3 py-6 text-center text-xsmall text-dark-secondary/80">
          {t('dashboard.noNotesYet')}
        </p>
      ) : (
        notes.map((note) => (
          <button
            key={note.id}
            type="button"
            onClick={() => onSelectNote(note)}
            className="flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-left transition hover:bg-dark-surface-3"
          >
            <div className="flex w-full items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-xsmall font-medium text-dark-primary">
                {note.title || t('dashboard.untitled')}
              </p>
              {note.isShared && (
                <span className="shrink-0 rounded-full bg-accent-blue/20 px-1.5 py-0.5 text-micro font-medium text-accent-blue-light">
                  {t('dashboard.shared')}
                </span>
              )}
              <span className="shrink-0 text-micro text-dark-secondary/80">
                {formatUpdatedAt(note.updatedAt)}
              </span>
            </div>
            {note.excerpt && (
              <p className="w-full truncate text-micro text-dark-secondary">
                {note.excerpt}
              </p>
            )}
          </button>
        ))
      )}
    </div>
  );
};

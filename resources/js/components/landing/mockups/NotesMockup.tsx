import { useTranslation } from '@/hooks/useTranslation';
import WidgetFrame from '../primitives/WidgetFrame';

// Copies the real NotesWidget list: each row has a title, an optional "Shared"
// badge, an updated date, and a one-line excerpt — inside the shared frame.
const NotesMockup = ({ className }: { className?: string }) => {
  const { t } = useTranslation();

  const notes = [
    {
      title: t('landing.bentoMockup.notesTitle1'),
      excerpt: t('landing.bentoMockup.notesExcerpt1'),
      date: t('landing.bentoMockup.notesDate1'),
      shared: true,
    },
    {
      title: t('landing.bentoMockup.notesTitle2'),
      excerpt: t('landing.bentoMockup.notesExcerpt2'),
      date: t('landing.bentoMockup.notesDate2'),
      shared: false,
    },
    {
      title: t('landing.bentoMockup.notesTitle3'),
      excerpt: t('landing.bentoMockup.notesExcerpt3'),
      date: t('landing.bentoMockup.notesDate3'),
      shared: false,
    },
  ];

  return (
    <WidgetFrame
      title={t('dashboard.notesTitle')}
      count={t('landing.bentoMockup.notesCount')}
      className={className}
    >
      <div className="flex flex-col gap-0.5 px-1.5 pb-2">
        {notes.map((note) => (
          <div
            key={note.title}
            className="flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2"
          >
            <div className="flex w-full items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-xsmall font-medium text-white/90">
                {note.title}
              </p>
              {note.shared && (
                <span className="shrink-0 rounded-full bg-accent-blue/20 px-1.5 py-0.5 text-micro font-medium text-accent-blue-light">
                  {t('dashboard.shared')}
                </span>
              )}
              <span className="shrink-0 text-micro text-white/30">
                {note.date}
              </span>
            </div>
            <p className="w-full truncate text-micro text-white/40">
              {note.excerpt}
            </p>
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
};

export default NotesMockup;

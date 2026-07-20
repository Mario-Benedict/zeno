import { useTranslation } from '@/hooks/useTranslation';
import WidgetFrame from '../primitives/WidgetFrame';

// Copies the real KanbanWidget: bg-black/15 columns with a name + right-aligned
// count, surface-3 cards with a round checkbox, a rounded-full priority label,
// and a "No cards" empty column — inside the shared widget frame.
const KanbanMockup = ({ className }: { className?: string }) => {
  const { t } = useTranslation();

  const columns = [
    {
      name: t('landing.bentoMockup.kanbanCol1'),
      cards: [
        {
          title: t('landing.bentoMockup.kanbanCard1'),
          label: t('landing.bentoMockup.kanbanLabelHigh'),
          labelClass: 'bg-accent-red text-white',
        },
        {
          title: t('landing.bentoMockup.kanbanCard2'),
          label: t('landing.bentoMockup.kanbanLabelMedium'),
          labelClass: 'bg-accent-yellow text-landing-app-1',
        },
      ],
    },
    { name: t('landing.bentoMockup.kanbanCol2'), cards: [] },
  ];

  return (
    <WidgetFrame
      title={t('dashboard.kanbanTitle')}
      count={t('landing.bentoMockup.kanbanCount')}
      className={className}
    >
      <div className="flex gap-2 px-2 pb-3">
        {columns.map((column) => (
          <div
            key={column.name}
            className="flex w-full flex-col rounded-xl bg-black/15"
          >
            <div className="flex items-center justify-between gap-2 px-2.5 pt-2 pb-1.5">
              <p className="truncate text-xsmall font-semibold text-white/70">
                {column.name}
              </p>
              <span className="shrink-0 text-micro text-white/30">
                {column.cards.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-1.5 pb-2">
              {column.cards.length === 0 ? (
                <p className="px-2 py-4 text-center text-micro text-white/20">
                  {t('dashboard.noCards')}
                </p>
              ) : (
                column.cards.map((card) => (
                  <div
                    key={card.title}
                    className="flex items-start gap-2 rounded-lg bg-landing-app-3 p-2"
                  >
                    <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-landing-app-sub" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xsmall leading-snug font-medium text-white/90">
                        {card.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-micro font-semibold ${card.labelClass}`}
                        >
                          {card.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
};

export default KanbanMockup;

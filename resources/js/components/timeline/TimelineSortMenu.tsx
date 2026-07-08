import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import type { TimelineSortKey } from '@/types/timeline';
import CheckIcon from '@public/icons/small/check.svg';

interface TimelineSortMenuProps {
  sortKey: TimelineSortKey;
  onChange: (key: TimelineSortKey) => void;
}

const OPTIONS: {
  key: TimelineSortKey;
  labelKey: TranslationKey;
  hintKey: TranslationKey;
}[] = [
  {
    key: 'start',
    labelKey: 'timeline.startDateSort',
    hintKey: 'timeline.earliestFirst',
  },
  {
    key: 'priority',
    labelKey: 'timeline.prioritySort',
    hintKey: 'timeline.byLabelColorName',
  },
];

/** Small dropdown letting the user order rows by start date or priority. */
export const TimelineSortMenu = ({
  sortKey,
  onChange,
}: TimelineSortMenuProps) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-full right-0 z-40 mt-2 w-52 rounded-xl border border-dark-border bg-dark-surface-2 p-1.5 shadow-2xl">
      {OPTIONS.map((option) => {
        const active = option.key === sortKey;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition ${
              active ? 'bg-white/5' : 'hover:bg-white/5'
            }`}
          >
            <span className="min-w-0">
              <span className="block text-xsmall font-medium text-white/80">
                {t(option.labelKey)}
              </span>
              <span className="block text-micro text-white/30">
                {t(option.hintKey)}
              </span>
            </span>
            {active && (
              <CheckIcon className="h-3 w-3 shrink-0 text-accent-blue" />
            )}
          </button>
        );
      })}
    </div>
  );
};

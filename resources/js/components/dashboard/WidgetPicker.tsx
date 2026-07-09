import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import BoardIcon from '@public/icons/large/board.svg';
import CalendarIcon from '@public/icons/large/calendar.svg';
import ChatIcon from '@public/icons/large/chat.svg';
import NotesIcon from '@public/icons/large/notes.svg';
import RemindersIcon from '@public/icons/large/reminder.svg';
import TimelineIcon from '@public/icons/large/timeline.svg';
import CloseIcon from '@public/icons/small/cancel.svg';
import TimeIcon from '@public/icons/small/time.svg';
import type { WidgetId } from './widgets';
import { WIDGETS } from './widgets';

interface Props {
  onSelect: (id: WidgetId) => void;
  onClose: () => void;
}

const WIDGET_NAME_KEYS: Record<WidgetId, TranslationKey> = {
  kanban: 'dashboard.widgetKanbanName',
  chat: 'dashboard.widgetChatName',
  notes: 'dashboard.widgetNotesName',
  calendar: 'dashboard.widgetCalendarName',
  reminders: 'dashboard.widgetRemindersName',
  alarm: 'dashboard.widgetAlarmName',
  timeline: 'dashboard.widgetTimelineName',
};

const WIDGET_ICONS: Record<
  WidgetId,
  (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
> = {
  kanban: BoardIcon,
  chat: ChatIcon,
  notes: NotesIcon,
  calendar: CalendarIcon,
  reminders: RemindersIcon,
  alarm: TimeIcon,
  timeline: TimelineIcon,
};

// Static Tailwind class strings only, one per widget — Tailwind's compiler
// needs the full class name present in source, so these can't be built at
// runtime from a variable (same caveat as lib/projectAvatar.ts's dynamic
// avatar colors).
const WIDGET_ACCENTS: Record<WidgetId, string> = {
  kanban: 'bg-accent-blue/15 text-accent-blue',
  chat: 'bg-accent-cyan/15 text-accent-cyan',
  notes: 'bg-accent-purple/15 text-accent-purple',
  calendar: 'bg-accent-green/15 text-accent-green',
  reminders: 'bg-accent-orange/15 text-accent-orange',
  alarm: 'bg-accent-pink/15 text-accent-pink',
  timeline: 'bg-accent-lime/15 text-accent-lime',
};

/**
 * Widget picker shown in an empty dashboard slot — a grid of icon tiles
 * (one per widget, colour-coded) rather than a plain text list, so choosing
 * a widget reads as a deliberate gallery instead of a settings menu. Grows
 * from 2 to 3 columns via a container query once the slot is wide enough.
 */
export const WidgetPicker = ({ onSelect, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <div
      className="scrollbar-app @container flex h-full w-full flex-col gap-2 overflow-y-auto p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-xsmall font-semibold text-dark-primary">
          {t('dashboard.addWidgetLabel')}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
          aria-label={t('dashboard.cancel')}
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 @xs:grid-cols-3">
        {WIDGETS.map((widget) => {
          const Icon = WIDGET_ICONS[widget.id];

          return (
            <button
              key={widget.id}
              type="button"
              disabled={!widget.available}
              onClick={() => onSelect(widget.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                widget.available
                  ? 'border-dark-border/60 hover:border-dark-secondary/60 hover:bg-dark-surface-3'
                  : 'cursor-not-allowed border-dark-border/30 opacity-50'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${WIDGET_ACCENTS[widget.id]}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xsmall font-medium text-dark-primary">
                {t(WIDGET_NAME_KEYS[widget.id])}
              </span>
              {!widget.available && (
                <span className="text-micro text-dark-secondary/50">
                  {t('dashboard.comingSoon')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

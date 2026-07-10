import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import CloseIcon from '@public/icons/small/cancel.svg';
import { WIDGETS } from './widgets';
import type { WidgetId } from './widgets';

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
  pomodoro: 'dashboard.widgetPomodoroName',
};

export const WidgetPicker = ({ onSelect, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex h-full w-full flex-col gap-1 overflow-y-auto p-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-1 flex shrink-0 items-center justify-between">
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

      {WIDGETS.map((widget) => (
        <button
          key={widget.id}
          type="button"
          disabled={!widget.available}
          onClick={() => onSelect(widget.id)}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-small font-medium transition ${
            widget.available
              ? 'text-dark-primary hover:bg-dark-surface-3'
              : 'cursor-not-allowed text-dark-secondary/50'
          }`}
        >
          {t(WIDGET_NAME_KEYS[widget.id])}
          {!widget.available && (
            <span className="text-xsmall text-dark-secondary/50">
              {t('dashboard.comingSoon')}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

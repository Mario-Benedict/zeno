import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import type { ChatParticipant, ChatRoom } from '@/types/chat';
import type { KanbanBoard } from '@/types/kanban';
import type { NoteListItem } from '@/types/notes';
import CloseIcon from '@public/icons/small/cancel.svg';
import { getTemplate } from './templates';
import type { TemplateId } from './templates';
import { WidgetPicker } from './WidgetPicker';
import type { WidgetId } from './widgets';
import { ChatWidget } from './widgets/ChatWidget';
import { KanbanWidget } from './widgets/KanbanWidget';
import { NotesWidget } from './widgets/NotesWidget';

const TEMPLATE_NAME_KEYS: Record<TemplateId, TranslationKey> = {
  '3a': 'dashboard.templateFocusName',
  '4a': 'dashboard.templateGridName',
  '4b': 'dashboard.templateOverviewName',
  '5a': 'dashboard.templateCommandName',
  '5b': 'dashboard.templateSpreadName',
};

interface KanbanWidgetData {
  kanbanBoards: KanbanBoard[];
}

interface ChatWidgetData {
  rooms: ChatRoom[];
  currentUser: ChatParticipant;
}

interface NotesWidgetData {
  notes: NoteListItem[];
}

interface Props {
  templateId: TemplateId;
  slots: (WidgetId | null)[];
  onChangeLayout: () => void;
  onAssignWidget: (index: number, widgetId: WidgetId | null) => void;
  kanbanWidgetData?: KanbanWidgetData;
  chatWidgetData?: ChatWidgetData;
  notesWidgetData?: NotesWidgetData;
}

const PlusIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EmptySlot = ({
  index,
  pickerOpen,
  onOpenPicker,
  onClosePicker,
  onSelect,
}: {
  index: number;
  pickerOpen: boolean;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelect: (widgetId: WidgetId) => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-surface-3 bg-dark-surface-2 transition-colors hover:border-dark-secondary/40 hover:bg-dark-surface-3">
      {pickerOpen ? (
        <WidgetPicker onSelect={onSelect} onClose={onClosePicker} />
      ) : (
        <button
          type="button"
          onClick={onOpenPicker}
          className="flex flex-col items-center gap-2 rounded-xl p-6 text-dark-secondary transition hover:text-dark-primary"
          aria-label={t('dashboard.addWidget', { index: index + 1 })}
        >
          <PlusIcon />
          <span className="text-xsmall font-medium">
            {t('dashboard.addWidgetLabel')}
          </span>
        </button>
      )}
    </div>
  );
};

const renderWidget = (
  widgetId: WidgetId,
  slotIndex: number,
  kanbanWidgetData?: KanbanWidgetData,
  chatWidgetData?: ChatWidgetData,
  notesWidgetData?: NotesWidgetData,
) => {
  if (widgetId === 'kanban' && kanbanWidgetData) {
    return <KanbanWidget {...kanbanWidgetData} />;
  }
  if (widgetId === 'chat' && chatWidgetData) {
    return <ChatWidget {...chatWidgetData} slotIndex={slotIndex} />;
  }
  if (widgetId === 'notes' && notesWidgetData) {
    return <NotesWidget {...notesWidgetData} slotIndex={slotIndex} />;
  }

  return null;
};

export const DashboardGrid = ({
  templateId,
  slots,
  onChangeLayout,
  onAssignWidget,
  kanbanWidgetData,
  chatWidgetData,
  notesWidgetData,
}: Props) => {
  const template = getTemplate(templateId);
  const [pickerOpenIndex, setPickerOpenIndex] = useState<number | null>(null);
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-dark-primary">
            {t('dashboard.title')}
          </span>
          <span className="rounded-full bg-dark-surface-3 px-2 py-0.5 text-xsmall text-dark-secondary">
            {t(TEMPLATE_NAME_KEYS[template.id])}
          </span>
        </div>

        <button
          type="button"
          onClick={onChangeLayout}
          className="rounded-lg px-3 py-1.5 text-xsmall font-medium text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
        >
          {t('dashboard.changeLayout')}
        </button>
      </div>

      {/* Grid */}
      <div className={`grid min-h-0 flex-1 gap-3 ${template.gridClass}`}>
        {template.slotClasses.map((cls, i) => {
          const widgetId = slots[i] ?? null;
          const content = widgetId
            ? renderWidget(
                widgetId,
                i,
                kanbanWidgetData,
                chatWidgetData,
                notesWidgetData,
              )
            : null;

          return (
            <div key={i} className={`group relative min-h-0 ${cls}`}>
              {widgetId && content ? (
                <>
                  {content}
                  <button
                    type="button"
                    onClick={() => onAssignWidget(i, null)}
                    className="absolute top-2 right-2 z-10 rounded-lg bg-dark-surface-1/80 p-1.5 text-dark-secondary opacity-0 transition group-hover:opacity-100 hover:bg-dark-surface-3 hover:text-accent-red"
                    aria-label={t('dashboard.removeWidget')}
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : widgetId ? (
                // Assigned but the server hasn't sent that widget's data back
                // yet (it's only included once a slot actually references it).
                <div className="flex h-full min-h-0 items-center justify-center rounded-xl bg-dark-surface-2 text-xsmall text-dark-secondary">
                  {t('dashboard.loadingWidget')}
                </div>
              ) : (
                <EmptySlot
                  index={i}
                  pickerOpen={pickerOpenIndex === i}
                  onOpenPicker={() => setPickerOpenIndex(i)}
                  onClosePicker={() => setPickerOpenIndex(null)}
                  onSelect={(selected) => {
                    onAssignWidget(i, selected);
                    setPickerOpenIndex(null);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

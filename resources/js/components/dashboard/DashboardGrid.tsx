import { useState } from 'react';
import type { KanbanBoard } from '@/types/kanban';
import CloseIcon from '@public/icons/small/cancel.svg';
import { getTemplate } from './templates';
import type { TemplateId } from './templates';
import { WidgetPicker } from './WidgetPicker';
import type { WidgetId } from './widgets';
import { KanbanWidget } from './widgets/KanbanWidget';

interface KanbanWidgetData {
  kanbanBoards: KanbanBoard[];
}

interface Props {
  templateId: TemplateId;
  slots: (WidgetId | null)[];
  onChangeLayout: () => void;
  onAssignWidget: (index: number, widgetId: WidgetId | null) => void;
  kanbanWidgetData?: KanbanWidgetData;
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
}) => (
  <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-surface-3 bg-dark-surface-2 transition-colors hover:border-dark-secondary/40 hover:bg-dark-surface-3">
    {pickerOpen ? (
      <WidgetPicker onSelect={onSelect} onClose={onClosePicker} />
    ) : (
      <button
        type="button"
        onClick={onOpenPicker}
        className="flex flex-col items-center gap-2 rounded-xl p-6 text-dark-secondary transition hover:text-dark-primary"
        aria-label={`Add widget to slot ${index + 1}`}
      >
        <PlusIcon />
        <span className="text-xsmall font-medium">Add widget</span>
      </button>
    )}
  </div>
);

export const DashboardGrid = ({
  templateId,
  slots,
  onChangeLayout,
  onAssignWidget,
  kanbanWidgetData,
}: Props) => {
  const template = getTemplate(templateId);
  const [pickerOpenIndex, setPickerOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-dark-primary">
            Dashboard
          </span>
          <span className="rounded-full bg-dark-surface-3 px-2 py-0.5 text-xsmall text-dark-secondary">
            {template.name}
          </span>
        </div>

        <button
          type="button"
          onClick={onChangeLayout}
          className="rounded-lg px-3 py-1.5 text-xsmall font-medium text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
        >
          Change layout
        </button>
      </div>

      {/* Grid */}
      <div className={`grid min-h-0 flex-1 gap-3 ${template.gridClass}`}>
        {template.slotClasses.map((cls, i) => {
          const widgetId = slots[i] ?? null;

          return (
            <div key={i} className={`group relative min-h-0 ${cls}`}>
              {widgetId === 'kanban' && kanbanWidgetData ? (
                <>
                  <KanbanWidget {...kanbanWidgetData} />
                  <button
                    type="button"
                    onClick={() => onAssignWidget(i, null)}
                    className="absolute top-2 right-2 z-10 rounded-lg bg-dark-surface-1/80 p-1.5 text-dark-secondary opacity-0 transition group-hover:opacity-100 hover:bg-dark-surface-3 hover:text-accent-red"
                    aria-label="Remove widget"
                  >
                    <CloseIcon className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : widgetId === 'kanban' ? (
                // Assigned but the server hasn't sent kanbanWidgetData back yet
                // (it's only included once a slot actually references it).
                <div className="flex h-full min-h-0 items-center justify-center rounded-xl bg-dark-surface-2 text-xsmall text-dark-secondary">
                  Loading widget…
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

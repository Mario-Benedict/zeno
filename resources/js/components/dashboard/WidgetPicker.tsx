import CloseIcon from '@public/icons/small/cancel.svg';
import { WIDGETS } from './widgets';
import type { WidgetId } from './widgets';

interface Props {
  onSelect: (id: WidgetId) => void;
  onClose: () => void;
}

export const WidgetPicker = ({ onSelect, onClose }: Props) => (
  <div
    className="flex h-full w-full flex-col gap-1 overflow-y-auto p-3"
    onClick={(e) => e.stopPropagation()}
  >
    <div className="mb-1 flex shrink-0 items-center justify-between">
      <span className="text-xsmall font-semibold text-dark-primary">
        Add widget
      </span>
      <button
        type="button"
        onClick={onClose}
        className="rounded p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
        aria-label="Cancel"
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
        {widget.name}
        {!widget.available && (
          <span className="text-xsmall text-dark-secondary/50">
            Coming soon
          </span>
        )}
      </button>
    ))}
  </div>
);

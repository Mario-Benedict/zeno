import { useEffect, useRef } from 'react';

interface Props {
  label: string;
  items: { value: number; label: string }[];
  selected: number | null;
  onSelect: (value: number) => void;
}

/** A single vertically scrollable column of selectable time values. */
const TimePickerColumn = ({ label, items, selected, onSelect }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const item = selectedRef.current;
    if (!container || !item) return;

    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    container.scrollTop +=
      itemRect.top -
      containerRect.top -
      container.clientHeight / 2 +
      item.clientHeight / 2;
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="mb-1 text-center text-micro font-semibold tracking-wider text-dark-secondary/70 uppercase">
        {label}
      </p>
      <div
        ref={containerRef}
        className="scrollbar-app h-44 overflow-y-auto rounded-lg border border-dark-border bg-dark-surface-2 p-1"
      >
        {items.map((item) => {
          const active = item.value === selected;

          return (
            <button
              key={item.value}
              ref={active ? selectedRef : null}
              type="button"
              onClick={() => onSelect(item.value)}
              className={`w-full rounded-lg py-1.5 text-center text-xsmall transition ${
                active
                  ? 'bg-accent-blue font-semibold text-white shadow-[0_0_12px] shadow-accent-blue/40'
                  : 'text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimePickerColumn;

import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { SlashCommandItem } from './commandItems';

export interface SlashCommandMenuHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const SlashCommandMenu = forwardRef<SlashCommandMenuHandle, SuggestionProps<SlashCommandItem>>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setSelectedIndex(0), [props.items]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const select = (index: number): void => {
    const item = props.items[index];
    if (item) props.command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((i) => (i + props.items.length - 1) % props.items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((i) => (i + 1) % props.items.length);
        return true;
      }
      if (event.key === 'Enter') {
        select(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (props.items.length === 0) {
    return (
      <div className="w-64 rounded-lg border border-dark-border bg-dark-surface-2 p-3 text-small text-dark-secondary shadow-lg">
        No matching blocks
      </div>
    );
  }

  return (
    <div className="max-h-80 w-72 overflow-y-auto rounded-lg border border-dark-border bg-dark-surface-2 p-1 shadow-lg scrollbar-app">
      {props.items.map((item, index) => (
        <button
          key={item.key}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          type="button"
          onMouseEnter={() => setSelectedIndex(index)}
          onClick={() => select(index)}
          className={`flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left ${
            index === selectedIndex ? 'bg-dark-surface-3' : 'hover:bg-dark-surface-3/60'
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-dark-surface-1 text-xsmall font-semibold text-dark-primary">
            {item.glyph}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-small text-dark-primary">{item.title}</span>
            <span className="block truncate text-xsmall text-dark-secondary">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';

export default SlashCommandMenu;

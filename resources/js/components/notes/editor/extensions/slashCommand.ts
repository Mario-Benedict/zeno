import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import type { SuggestionOptions } from '@tiptap/suggestion';
import tippy from 'tippy.js';
import type {
  GetReferenceClientRect,
  Instance as TippyInstance,
} from 'tippy.js';
import { filterSlashCommandItems } from '../commandItems';
import type { SlashCommandItem } from '../commandItems';
import SlashCommandMenu from '../SlashCommandMenu';
import type { SlashCommandMenuHandle } from '../SlashCommandMenu';

/**
 * Notion-style "/" block menu. Typing `/` opens a filtered list of block
 * commands (headings, lists, quote, code, image, embed, …); Enter/click
 * runs the selected item's `run(editor, range)`.
 */
export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        items: ({ query }: { query: string }) => filterSlashCommandItems(query),
        command: ({ editor, range, props }) => {
          (props as SlashCommandItem).run(editor, range);
        },
        render: () => {
          let component: ReactRenderer<SlashCommandMenuHandle> | null = null;
          let popup: TippyInstance[] | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect:
                  props.clientRect as GetReferenceClientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: (props) => {
              component?.updateProps(props);

              if (!props.clientRect) return;
              popup?.[0]?.setProps({
                getReferenceClientRect:
                  props.clientRect as GetReferenceClientRect,
              });
            },
            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              popup?.[0]?.destroy();
              component?.destroy();
            },
          };
        },
      } satisfies Partial<SuggestionOptions<SlashCommandItem>>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommand;

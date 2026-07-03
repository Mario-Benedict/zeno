import { Extension } from '@tiptap/core';
import { Plugin, TextSelection } from '@tiptap/pm/state';

const PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};

const CLOSERS = new Set(Object.values(PAIRS));

/**
 * IDE-style bracket/quote auto-closing: typing an opener inserts the pair
 * and leaves the cursor between them; typing a closer that's already sitting
 * right after the cursor just types "through" it instead of duplicating it.
 */
export const AutoCloseBrackets = Extension.create({
  name: 'autoCloseBrackets',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleTextInput: (view, from, to, text) => {
            // Only handle plain single-character typing over a collapsed
            // cursor — leave selections/composition/multi-char input alone.
            if (from !== to || text.length !== 1) return false;

            const { state } = view;

            const closer = PAIRS[text];
            if (closer) {
              const tr = state.tr.insertText(text + closer, from, to);
              tr.setSelection(TextSelection.create(tr.doc, from + text.length));
              view.dispatch(tr);
              return true;
            }

            if (CLOSERS.has(text) && state.doc.textBetween(to, to + 1) === text) {
              view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, to + 1)));
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default AutoCloseBrackets;

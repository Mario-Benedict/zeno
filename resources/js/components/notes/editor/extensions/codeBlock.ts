import type { KeyboardShortcutCommand } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { TextSelection } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';
import CodeBlockView from '../CodeBlockView';

const lowlight = createLowlight(common);

/**
 * Notion-style code block: a language picker + copy button in a small
 * toolbar, with IDE-like syntax highlighting (see `.hljs-*` rules in
 * app.css) instead of StarterKit's plain, unhighlighted code block.
 *
 * Also layers in a few IDE conveniences the base extension doesn't have:
 * `Mod-a` scoped to the block instead of selecting the whole note, `Enter`
 * carrying over the current line's leading whitespace so nested indentation
 * doesn't collapse back to column 0, and `Backspace` right after an indent
 * dedenting a full tab stop at once instead of one space at a time.
 */
export const CodeBlock = CodeBlockLowlight.extend({
  // Tiptap's core Keymap extension also binds `Mod-a` (to select the whole
  // document) as its own separate keymap plugin — since ProseMirror tries
  // each bound plugin in extension-priority order until one returns true,
  // this needs to outrank it explicitly, not just rely on array position.
  priority: 1000,

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },

  addKeyboardShortcuts() {
    const parent = this.parent?.() ?? {};
    const parentEnter = parent.Enter;
    const parentBackspace = parent.Backspace;

    const selectAllWithinBlock: KeyboardShortcutCommand = ({ editor }) => {
      const { state, view } = editor;
      const { $from } = state.selection;

      if ($from.parent.type !== this.type) return false;

      view.dispatch(
        state.tr.setSelection(
          TextSelection.create(state.doc, $from.start(), $from.end()),
        ),
      );
      return true;
    };

    const continueIndentation: KeyboardShortcutCommand = (props) => {
      // Let the base "exit the block on a triple Enter" behavior win first.
      if (parentEnter?.(props)) return true;

      const { editor } = props;
      const { state, view } = editor;
      const { $from, empty } = state.selection;

      if (!empty || $from.parent.type !== this.type) return false;

      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
      const currentLine = textBefore.slice(textBefore.lastIndexOf('\n') + 1);
      const indent = currentLine.match(/^[ \t]*/)?.[0] ?? '';

      if (!indent) return false;

      // `editor.commands.insertContent` round-trips the string through an
      // HTML parser, which silently drops whitespace-only text nodes that
      // happen to match "\n" + exactly two spaces — exactly a 2-space
      // indent. A raw transaction insert has no such HTML-parsing step.
      const pos = $from.pos;
      view.dispatch(state.tr.insertText('\n' + indent, pos, pos));
      return true;
    };

    const dedentOnBackspace: KeyboardShortcutCommand = (props) => {
      // Let the base "clear the block when it's empty / at doc start" win first.
      if (parentBackspace?.(props)) return true;

      const { editor } = props;
      const { state, view } = editor;
      const { $from, empty } = state.selection;

      if (!empty || $from.parent.type !== this.type) return false;

      const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);
      const currentLine = textBefore.slice(textBefore.lastIndexOf('\n') + 1);

      // Only kick in when everything before the cursor on this line is
      // indentation whitespace — otherwise a plain single-character
      // backspace is exactly what's expected.
      if (!currentLine || !/^[ \t]+$/.test(currentLine)) return false;

      const tabSize = this.options.tabSize ?? 4;
      const removeCount = currentLine.length % tabSize || tabSize;
      const pos = $from.pos;

      view.dispatch(state.tr.delete(pos - removeCount, pos));
      return true;
    };

    return {
      ...parent,
      'Mod-a': selectAllWithinBlock,
      Enter: continueIndentation,
      Backspace: dedentOnBackspace,
    };
  },
}).configure({
  lowlight,
  defaultLanguage: 'plaintext',
  enableTabIndentation: true,
});

export default CodeBlock;

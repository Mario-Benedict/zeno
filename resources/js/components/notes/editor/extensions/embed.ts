import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import EmbedCard from '../EmbedCard';

export interface EmbedAttributes {
  url: string | null;
  provider: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      /** Insert an empty embed block, prompting the user for a URL. */
      insertEmbedPlaceholder: () => ReturnType;
    };
  }
}

/**
 * A block-level link/embed card — inserted empty via the "/" menu, then
 * resolves into a rich preview (YouTube/Figma/Drive iframe, or a generic
 * link card) once a URL is entered. Mirrors the provider detection that
 * used to live in the old contentEditable toolbar (see embedProviders.ts).
 */
export const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: null },
      provider: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'embed' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedCard);
  },

  addCommands() {
    return {
      insertEmbedPlaceholder:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { url: null, provider: null } }),
    };
  },
});

export default Embed;

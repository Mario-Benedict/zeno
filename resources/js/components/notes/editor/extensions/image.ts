import TiptapImage from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageBlock from '../ImageBlock';

export interface NoteImageOptions {
  uploadImage: (file: File) => Promise<string>;
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteImage: {
      /** Insert an empty image block, prompting an upload or a pasted URL. */
      insertImagePlaceholder: () => ReturnType;
    };
  }
}

/**
 * Extends Tiptap's base Image node with an interactive NodeView: inserted
 * empty via the "/" menu, it shows an upload/URL prompt until `src` is set.
 * `uploadImage` is injected by `useNoteEditor` (see NoteImageController).
 */
export const NoteImage = TiptapImage.extend<NoteImageOptions>({
  addOptions() {
    const parentOptions = this.parent?.();

    return {
      ...parentOptions,
      inline: false,
      allowBase64: false,
      uploadImage: async () => {
        throw new Error('NoteImage: uploadImage was not configured');
      },
      HTMLAttributes: parentOptions?.HTMLAttributes ?? {},
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlock);
  },

  addCommands() {
    return {
      ...this.parent?.(),
      insertImagePlaceholder:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { src: null } }),
    };
  },
});

export default NoteImage;

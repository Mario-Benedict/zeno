import type { Editor, Range } from '@tiptap/core';
import type { TranslationKey } from '@/i18n/dictionary';

export interface SlashCommandItem {
  key: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  glyph: string;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
}

/**
 * The full "/" command palette — headings, lists, blocks, and embeds. Each
 * item's `run` deletes the "/query" text and applies the block command in
 * one chain, matching Notion's slash-menu behavior. `titleKey`/`descriptionKey`
 * are translation keys (this module has no React context to call `t()`
 * itself) resolved by the rendering component — see `SlashCommandMenu.tsx`.
 * Keyword matching below stays on the untranslated English keywords, which
 * is fine since it's just a fuzzy-filter aid, not user-facing copy.
 */
export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    key: 'paragraph',
    titleKey: 'notes.slashCommandText',
    descriptionKey: 'notes.slashCommandTextDescription',
    glyph: 'T',
    keywords: ['text', 'paragraph', 'p'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    key: 'heading1',
    titleKey: 'notes.slashCommandHeading1',
    descriptionKey: 'notes.slashCommandHeading1Description',
    glyph: 'H1',
    keywords: ['h1', 'heading', 'title'],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 1 })
        .run(),
  },
  {
    key: 'heading2',
    titleKey: 'notes.slashCommandHeading2',
    descriptionKey: 'notes.slashCommandHeading2Description',
    glyph: 'H2',
    keywords: ['h2', 'heading', 'subtitle'],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 2 })
        .run(),
  },
  {
    key: 'heading3',
    titleKey: 'notes.slashCommandHeading3',
    descriptionKey: 'notes.slashCommandHeading3Description',
    glyph: 'H3',
    keywords: ['h3', 'heading'],
    run: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode('heading', { level: 3 })
        .run(),
  },
  {
    key: 'bulletList',
    titleKey: 'notes.slashCommandBulletList',
    descriptionKey: 'notes.slashCommandBulletListDescription',
    glyph: '•',
    keywords: ['bullet', 'list', 'ul'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    key: 'orderedList',
    titleKey: 'notes.slashCommandOrderedList',
    descriptionKey: 'notes.slashCommandOrderedListDescription',
    glyph: '1.',
    keywords: ['numbered', 'ordered', 'list', 'ol'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    key: 'taskList',
    titleKey: 'notes.slashCommandTaskList',
    descriptionKey: 'notes.slashCommandTaskListDescription',
    glyph: '☑',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    key: 'blockquote',
    titleKey: 'notes.slashCommandBlockquote',
    descriptionKey: 'notes.slashCommandBlockquoteDescription',
    glyph: '"',
    keywords: ['quote', 'blockquote', 'citation'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    key: 'codeBlock',
    titleKey: 'notes.slashCommandCodeBlock',
    descriptionKey: 'notes.slashCommandCodeBlockDescription',
    glyph: '</>',
    keywords: ['code', 'codeblock', 'snippet'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    key: 'divider',
    titleKey: 'notes.slashCommandDivider',
    descriptionKey: 'notes.slashCommandDividerDescription',
    glyph: '—',
    keywords: ['divider', 'hr', 'rule', 'line'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    key: 'image',
    titleKey: 'notes.slashCommandImage',
    descriptionKey: 'notes.slashCommandImageDescription',
    glyph: '▣',
    keywords: ['image', 'picture', 'photo', 'upload'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertImagePlaceholder().run(),
  },
  {
    key: 'embed',
    titleKey: 'notes.slashCommandEmbed',
    descriptionKey: 'notes.slashCommandEmbedDescription',
    glyph: '⛓',
    keywords: ['link', 'embed', 'url', 'youtube', 'figma', 'drive'],
    run: (editor, range) =>
      editor.chain().focus().deleteRange(range).insertEmbedPlaceholder().run(),
  },
];

export const filterSlashCommandItems = (query: string): SlashCommandItem[] => {
  const q = query.trim().toLowerCase();

  if (!q) return SLASH_COMMAND_ITEMS;

  return SLASH_COMMAND_ITEMS.filter(
    (item) =>
      item.key.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.includes(q)),
  );
};

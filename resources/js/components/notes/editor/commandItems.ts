import type { Editor, Range } from '@tiptap/core';

export interface SlashCommandItem {
  key: string;
  title: string;
  description: string;
  glyph: string;
  keywords: string[];
  run: (editor: Editor, range: Range) => void;
}

/**
 * The full "/" command palette — headings, lists, blocks, and embeds. Each
 * item's `run` deletes the "/query" text and applies the block command in
 * one chain, matching Notion's slash-menu behavior.
 */
export const SLASH_COMMAND_ITEMS: SlashCommandItem[] = [
  {
    key: 'paragraph',
    title: 'Text',
    description: 'Plain paragraph text',
    glyph: 'T',
    keywords: ['text', 'paragraph', 'p'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setParagraph().run(),
  },
  {
    key: 'heading1',
    title: 'Heading 1',
    description: 'Big section heading',
    glyph: 'H1',
    keywords: ['h1', 'heading', 'title'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run(),
  },
  {
    key: 'heading2',
    title: 'Heading 2',
    description: 'Medium section heading',
    glyph: 'H2',
    keywords: ['h2', 'heading', 'subtitle'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run(),
  },
  {
    key: 'heading3',
    title: 'Heading 3',
    description: 'Small section heading',
    glyph: 'H3',
    keywords: ['h3', 'heading'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run(),
  },
  {
    key: 'bulletList',
    title: 'Bulleted list',
    description: 'Simple unordered list',
    glyph: '•',
    keywords: ['bullet', 'list', 'ul'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    key: 'orderedList',
    title: 'Numbered list',
    description: 'Ordered, numbered list',
    glyph: '1.',
    keywords: ['numbered', 'ordered', 'list', 'ol'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    key: 'taskList',
    title: 'To-do list',
    description: 'Checkbox task list',
    glyph: '☑',
    keywords: ['todo', 'task', 'checkbox', 'check'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    key: 'blockquote',
    title: 'Quote',
    description: 'Capture a quote',
    glyph: '"',
    keywords: ['quote', 'blockquote', 'citation'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    key: 'codeBlock',
    title: 'Code block',
    description: 'Monospace code snippet',
    glyph: '</>',
    keywords: ['code', 'codeblock', 'snippet'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    key: 'divider',
    title: 'Divider',
    description: 'Horizontal rule',
    glyph: '—',
    keywords: ['divider', 'hr', 'rule', 'line'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    key: 'image',
    title: 'Image',
    description: 'Upload or embed an image',
    glyph: '▣',
    keywords: ['image', 'picture', 'photo', 'upload'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).insertImagePlaceholder().run(),
  },
  {
    key: 'embed',
    title: 'Link / Embed',
    description: 'Paste a link, YouTube, Figma, or Drive URL',
    glyph: '⛓',
    keywords: ['link', 'embed', 'url', 'youtube', 'figma', 'drive'],
    run: (editor, range) => editor.chain().focus().deleteRange(range).insertEmbedPlaceholder().run(),
  },
];

export const filterSlashCommandItems = (query: string): SlashCommandItem[] => {
  const q = query.trim().toLowerCase();

  if (!q) return SLASH_COMMAND_ITEMS;

  return SLASH_COMMAND_ITEMS.filter(
    (item) => item.title.toLowerCase().includes(q) || item.keywords.some((k) => k.includes(q)),
  );
};

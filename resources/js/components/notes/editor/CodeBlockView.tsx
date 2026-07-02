import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import React, { useMemo, useState } from 'react';
import { CODE_LANGUAGES } from './codeLanguages';

interface LanguagePickerProps {
  language: string;
  editable: boolean;
  onChange: (value: string) => void;
}

/** Custom dropdown instead of a native `<select>` — matches the dark-theme
 * search+list pattern used by `MemberPicker`/`SlashCommandMenu`, since a
 * native select's popup can't be restyled (it renders with OS chrome). */
const LanguagePicker = ({ language, editable, onChange }: LanguagePickerProps): React.ReactElement => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const current = CODE_LANGUAGES.find((l) => l.value === language) ?? CODE_LANGUAGES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return q ? CODE_LANGUAGES.filter((l) => l.label.toLowerCase().includes(q)) : CODE_LANGUAGES;
  }, [query]);

  if (!editable) {
    return <span className="px-1.5 py-0.5 text-xsmall font-medium text-dark-secondary">{current.label}</span>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xsmall font-medium text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary"
      >
        {current.label}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-dark-border bg-dark-surface-2 shadow-lg">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search language…"
              className="w-full border-b border-dark-border bg-transparent px-2 py-1.5 text-xsmall text-dark-primary outline-none placeholder:text-dark-secondary"
            />
            <div className="max-h-56 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {filtered.length === 0 ? (
                <p className="px-2 py-1.5 text-xsmall text-dark-secondary">No matches.</p>
              ) : (
                filtered.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => {
                      onChange(l.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`block w-full rounded-md px-2 py-1 text-left text-xsmall ${
                      l.value === language
                        ? 'bg-dark-surface-3 text-dark-primary'
                        : 'text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
                    }`}
                  >
                    {l.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const CodeBlockView = ({ node, updateAttributes, editor }: NodeViewProps): React.ReactElement => {
  const language = (node.attrs.language as string | null) ?? 'plaintext';
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied — silently no-op, nothing to recover from.
    }
  };

  return (
    // No `overflow-hidden` here — it would clip the language dropdown,
    // which is positioned absolutely so it can pop out past this box.
    // Each child rounds its own corners instead.
    <NodeViewWrapper className="code-block-wrapper my-2 rounded-lg border border-dark-border bg-dark-surface-1">
      <div
        contentEditable={false}
        className="flex items-center justify-between rounded-t-lg border-b border-dark-border bg-dark-surface-2 px-2 py-1"
      >
        <LanguagePicker language={language} editable={editor.isEditable} onChange={(value) => updateAttributes({ language: value })} />

        <button
          type="button"
          onClick={() => void copy()}
          className="rounded px-1.5 py-0.5 text-xsmall font-medium text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <pre className="overflow-x-auto p-3">
        <NodeViewContent<'code'> as="code" className={`hljs language-${language}`} />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlockView;

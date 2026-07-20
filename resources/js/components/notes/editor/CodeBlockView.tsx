import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import CodeLanguagePicker from './CodeLanguagePicker';

const CodeBlockView = ({
  node,
  updateAttributes,
  editor,
}: NodeViewProps): React.ReactElement => {
  const { t } = useTranslation();
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
        <CodeLanguagePicker
          language={language}
          editable={editor.isEditable}
          onChange={(value) => updateAttributes({ language: value })}
        />

        <button
          type="button"
          onClick={() => void copy()}
          className="rounded px-1.5 py-0.5 text-xsmall font-medium text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary"
        >
          {copied ? t('notes.copied') : t('notes.copy')}
        </button>
      </div>

      <pre className="overflow-x-auto p-3">
        <NodeViewContent<'code'>
          as="code"
          className={`hljs language-${language}`}
        />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlockView;

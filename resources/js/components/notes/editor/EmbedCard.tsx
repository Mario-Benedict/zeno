import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { detectEmbedProvider } from '../embedProviders';

const IFRAME_PROVIDERS = new Set(['youtube', 'google-drive']);

const EmbedCard = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
}: NodeViewProps): React.ReactElement => {
  const { t } = useTranslation();
  const { url, provider } = node.attrs as {
    url: string | null;
    provider: string | null;
  };
  const [draft, setDraft] = useState('');
  const editable = editor.isEditable;

  const submit = (): void => {
    const value = draft.trim();
    if (!value) return;

    const detected = detectEmbedProvider(value);
    updateAttributes({ url: value, provider: detected?.id ?? null });
  };

  if (!url) {
    return (
      <NodeViewWrapper data-type="embed">
        <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-2 p-2">
          <input
            autoFocus
            type="url"
            value={draft}
            placeholder={t('notes.embedPlaceholder')}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
              if (e.key === 'Escape') deleteNode();
            }}
            className="min-w-0 flex-1 bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="shrink-0 rounded-md bg-dark-surface-3 px-2.5 py-1 text-xsmall font-medium text-dark-primary hover:bg-dark-input-focus"
          >
            {t('notes.embed')}
          </button>
        </div>
      </NodeViewWrapper>
    );
  }

  const embedUrl = detectEmbedProvider(url)?.getEmbedUrl?.(url) ?? null;
  const showIframe = provider && IFRAME_PROVIDERS.has(provider) && embedUrl;

  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {
    // keep raw url as fallback label
  }

  return (
    <NodeViewWrapper data-type="embed">
      <div className="group relative overflow-hidden rounded-lg border border-dark-border bg-dark-surface-2">
        {showIframe ? (
          <div className="aspect-video w-full">
            <iframe
              src={embedUrl}
              className="h-full w-full"
              allowFullScreen
              title={hostname}
            />
          </div>
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 hover:bg-dark-surface-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-dark-surface-3 text-small text-dark-secondary">
              🔗
            </div>
            <div className="min-w-0">
              <div className="truncate text-small text-dark-primary">
                {hostname}
              </div>
              <div className="truncate text-xsmall text-dark-secondary">
                {url}
              </div>
            </div>
          </a>
        )}

        {editable && (
          <button
            type="button"
            onClick={deleteNode}
            className="absolute top-1.5 right-1.5 hidden rounded-md bg-dark-surface-1/80 px-2 py-1 text-xsmall text-dark-secondary group-hover:block hover:text-dark-primary"
          >
            {t('notes.remove')}
          </button>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export default EmbedCard;

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import React, { useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FILE_SIZE_LIMITS, isFileTooLarge } from '@/lib/fileUploads';

type UploadImage = (file: File) => Promise<string>;

const ImageBlock = ({
  node,
  updateAttributes,
  deleteNode,
  editor,
  extension,
}: NodeViewProps): React.ReactElement => {
  const { t } = useTranslation();
  const { src, alt } = node.attrs as { src: string | null; alt: string | null };
  const [urlDraft, setUrlDraft] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editable = editor.isEditable;

  const uploadImage = extension.options.uploadImage as UploadImage;

  const handleFile = async (file: File): Promise<void> => {
    if (isFileTooLarge(file, FILE_SIZE_LIMITS.noteImage)) {
      setError(t('notes.imageTooLarge'));
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      updateAttributes({ src: url });
    } catch {
      setError(t('notes.imageUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  if (!src) {
    return (
      <NodeViewWrapper data-type="image">
        <div className="rounded-lg border border-dashed border-dark-border bg-dark-surface-2 p-4">
          {uploading ? (
            <div className="text-small text-dark-secondary">
              {t('notes.uploadingImage')}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md bg-dark-surface-3 px-2.5 py-1 text-xsmall font-medium text-dark-primary hover:bg-dark-input-focus"
                >
                  {t('notes.uploadImage')}
                </button>
                <span className="text-xsmall text-dark-secondary">
                  {t('notes.orPasteImageUrl')}
                </span>
              </div>
              <input
                type="url"
                value={urlDraft}
                placeholder={t('notes.imageUrlPlaceholder')}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlDraft.trim()) {
                    e.preventDefault();
                    updateAttributes({ src: urlDraft.trim() });
                  }
                  if (e.key === 'Escape') deleteNode();
                }}
                className="min-w-0 flex-1 rounded-md bg-dark-input px-2 py-1 text-small text-dark-primary placeholder:text-dark-secondary focus:bg-dark-input-focus focus:outline-none"
              />
              {error && (
                <div className="text-xsmall text-status-error">{error}</div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </div>
          )}
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper data-type="image">
      <div className="group relative">
        <img
          src={src}
          alt={alt ?? ''}
          className="max-h-[480px] w-full rounded-lg object-contain"
        />
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

export default ImageBlock;

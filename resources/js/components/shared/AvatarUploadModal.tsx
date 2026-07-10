import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import CancelIcon from '@public/icons/small/cancel.svg';

export const UploadIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ImageIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

/**
 * Full-screen image upload dialog with a drag-free "click to select" preview
 * area. Shared by the project avatar picker (GeneralTab) and the account
 * profile picture picker (ProfileTab) — both upload/remove a single image
 * against a disk-backed `avatar_url` column via the same request shape.
 */
export const AvatarUploadModal = ({
  onClose,
  onUpload,
  onRemove,
  hasImage,
  uploading,
}: {
  onClose: () => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  hasImage: boolean;
  uploading: boolean;
}) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(picked));
    setFile(picked);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-dark-surface-1 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-dark-border bg-dark-surface-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
          <p className="text-normal font-semibold text-dark-primary">
            {t('projectSettingsTabs.uploadYourImage')}
          </p>
          <div className="flex items-center gap-2">
            {file && (
              <button
                type="button"
                onClick={() => onUpload(file)}
                disabled={uploading}
                className="rounded-lg bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {uploading
                  ? t('projectSettingsTabs.uploading')
                  : t('projectSettingsTabs.upload')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-surface-3 text-dark-secondary transition-colors hover:text-dark-primary"
            >
              <CancelIcon />
            </button>
          </div>
        </div>

        <div className="p-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-dark-border bg-dark-surface-1 transition-colors hover:border-dark-border-focus"
          >
            {preview ? (
              <img
                src={preview}
                alt={t('projectSettingsTabs.imagePreviewAlt')}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-dark-secondary">
                <ImageIcon />
                <p className="text-small">
                  {t('projectSettingsTabs.clickToSelectImage')}
                </p>
                <p className="text-xsmall opacity-60">
                  {t('projectSettingsTabs.imageFormatsHint')}
                </p>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          {hasImage && (
            <button
              type="button"
              onClick={onRemove}
              className="mt-4 text-xsmall text-status-error hover:underline"
            >
              {t('projectSettingsTabs.removeCurrentAvatar')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

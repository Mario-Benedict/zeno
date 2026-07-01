import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import CancelIcon from '@public/icons/small/cancel.svg';
import { projectPath } from '@/lib/accountRoutes';
import { AVATAR_COLORS, avatarHex } from '@/lib/projectAvatar';
import type { AvatarColor } from '@/lib/projectAvatar';
import { toSlug } from '@/lib/projectSlug';
import type { CurrentProject, ProjectRole } from '@/types';
import { SavedBadge } from './shared';

// ── Inline icons (no existing SVG files for these) ───────────────────────

const UploadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ImageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

// ── Avatar display ────────────────────────────────────────────────────────

const ProjectAvatarDisplay = ({
  name,
  color,
  avatarUrl,
  size = 'lg',
}: {
  name: string;
  color: string;
  avatarUrl: string | null;
  size?: 'sm' | 'lg';
}) => {
  const dim = size === 'lg' ? 'h-16 w-16 text-large' : 'h-9 w-9 text-xsmall';
  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name} className={`${dim} shrink-0 rounded-xl object-cover`} />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-xl font-bold text-white`}
      style={{ backgroundColor: avatarHex(color) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
};

// ── Color picker popover ──────────────────────────────────────────────────

const ColorPickerPopover = ({
  current,
  onSelectColor,
  onUploadClick,
}: {
  current: string;
  onSelectColor: (c: AvatarColor) => void;
  onUploadClick: () => void;
}) => (
  <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-dark-border bg-dark-surface-2 p-3 shadow-2xl">
    <p className="mb-2 text-micro font-bold uppercase tracking-wider text-dark-secondary">Color</p>
    <div className="grid grid-cols-10 gap-1.5">
      {AVATAR_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          onClick={() => onSelectColor(color)}
          className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
            current === color ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-surface-2' : ''
          }`}
          style={{ backgroundColor: avatarHex(color) }}
        />
      ))}
    </div>
    <div className="mt-3 border-t border-dark-border pt-2">
      <button
        type="button"
        onClick={onUploadClick}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-small text-dark-primary transition-colors hover:bg-white/[0.07]"
      >
        <UploadIcon />
        Upload avatar
      </button>
    </div>
  </div>
);

// ── Avatar upload modal ───────────────────────────────────────────────────

const AvatarUploadModal = ({
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
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

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
          <p className="text-normal font-semibold text-dark-primary">Upload your image</p>
          <div className="flex items-center gap-2">
            {file && (
              <button
                type="button"
                onClick={() => onUpload(file)}
                disabled={uploading}
                className="rounded-lg bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {uploading ? 'Uploading…' : 'Upload'}
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
              <img src={preview} alt="Preview" className="h-full w-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-dark-secondary">
                <ImageIcon />
                <p className="text-small">Click to select an image</p>
                <p className="text-xsmall opacity-60">JPEG, PNG, WebP or GIF · max 2 MB</p>
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
              Remove current avatar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── GeneralTab ────────────────────────────────────────────────────────────

const GeneralTab = ({
  project,
  role,
  accountIndex,
}: {
  project: CurrentProject;
  role: ProjectRole | null;
  accountIndex: number;
}) => {
  const [name, setName] = useState(project.project_name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const canEdit = role === 'OWNER' || role === 'ADMIN';
  const hasChanged = name.trim() !== '' && name.trim() !== project.project_name;
  const derivedSlug = toSlug(name || project.project_name);

  useEffect(() => { setName(project.project_name); }, [project.project_name]);

  useEffect(() => {
    if (!pickerOpen) return;
    const handle = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [pickerOpen]);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!canEdit || !hasChanged || saving) return;
    const trimmed = name.trim();
    if (!trimmed) { setError('Project name is required.'); return; }
    setSaving(true);
    setError(null);
    router.patch(projectPath(accountIndex, project.project_slug), { project_name: trimmed }, {
      preserveScroll: true,
      onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); },
      onError: (errs) => { setError((errs.project_name as string | undefined) ?? 'Something went wrong.'); },
      onFinish: () => setSaving(false),
    });
  };

  const handleColorSelect = (color: AvatarColor) => {
    setPickerOpen(false);
    router.patch(projectPath(accountIndex, project.project_slug, '/avatar'), { avatar_color: color }, {
      preserveScroll: true,
    });
  };

  const handleUpload = (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('avatar', file);
    router.post(projectPath(accountIndex, project.project_slug, '/avatar'), form, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => setUploadModalOpen(false),
      onFinish: () => setUploading(false),
    });
  };

  const handleRemoveImage = () => {
    router.delete(projectPath(accountIndex, project.project_slug, '/avatar'), {
      preserveScroll: true,
      onSuccess: () => setUploadModalOpen(false),
    });
  };

  return (
    <>
      <div>
        <h3 className="mb-5 text-normal font-semibold text-dark-primary">General</h3>

        <form onSubmit={handleSave}>
          <div className="rounded-xl border border-dark-border divide-y divide-dark-border">
            {/* Avatar row */}
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-small font-semibold text-dark-primary">Avatar</p>
              <div ref={pickerRef} className="relative">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setPickerOpen((v) => !v)}
                  className="block transition-opacity hover:opacity-80 disabled:cursor-not-allowed"
                  aria-label="Change project avatar"
                >
                  <ProjectAvatarDisplay
                    name={project.project_name}
                    color={project.avatar_color}
                    avatarUrl={project.avatar_url}
                    size="sm"
                  />
                </button>
                {pickerOpen && (
                  <ColorPickerPopover
                    current={project.avatar_color}
                    onSelectColor={handleColorSelect}
                    onUploadClick={() => { setPickerOpen(false); setUploadModalOpen(true); }}
                  />
                )}
              </div>
            </div>

            {/* Name row */}
            <div className="flex items-center justify-between gap-8 px-4 py-3">
              <label className="shrink-0 text-small font-semibold text-dark-primary">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                disabled={!canEdit}
                maxLength={50}
                placeholder="Project name"
                className="min-w-0 flex-1 bg-transparent text-right text-small text-dark-primary outline-none placeholder:text-dark-secondary disabled:opacity-50"
              />
            </div>

            {/* URL slug row */}
            <div className="flex items-center justify-between gap-8 px-4 py-3">
              <p className="shrink-0 text-small font-semibold text-dark-primary">URL slug</p>
              <div className="flex min-w-0 items-center gap-1 text-small text-dark-secondary">
                <span>/p/</span>
                <span className="truncate font-medium text-dark-primary">{derivedSlug}</span>
              </div>
            </div>
          </div>

          {error && <p className="mt-2 text-xsmall text-status-error">{error}</p>}
          <p className="mt-2 text-xsmall text-dark-secondary">
            The URL slug updates automatically when you rename the project.
          </p>

          {canEdit ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !hasChanged}
                className="rounded-lg bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <SavedBadge visible={saved} />
            </div>
          ) : (
            <p className="mt-4 text-small text-dark-secondary">
              Only project Admins and Owners can edit settings.
            </p>
          )}
        </form>
      </div>

      {uploadModalOpen && (
        <AvatarUploadModal
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
          onRemove={handleRemoveImage}
          hasImage={project.avatar_url !== null}
          uploading={uploading}
        />
      )}
    </>
  );
};

export default GeneralTab;

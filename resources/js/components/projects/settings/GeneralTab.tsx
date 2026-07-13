import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AvatarUploadModal,
  UploadIcon,
} from '@/components/shared/AvatarUploadModal';
import { useTranslation } from '@/hooks/useTranslation';
import { projectPath } from '@/lib/accountRoutes';
import { AVATAR_COLORS, avatarHex } from '@/lib/projectAvatar';
import type { AvatarColor } from '@/lib/projectAvatar';
import { toSlug } from '@/lib/projectSlug';
import type { CurrentProject, ProjectRole } from '@/types';
import { SavedBadge } from './shared';

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
      <img
        src={avatarUrl}
        alt={name}
        className={`${dim} shrink-0 rounded-xl object-cover`}
      />
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
}) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-dark-border bg-dark-surface-2 p-3 shadow-2xl">
      <p className="mb-2 text-micro font-bold tracking-wider text-dark-secondary uppercase">
        {t('projectSettingsTabs.color')}
      </p>
      <div className="grid grid-cols-10 gap-1.5">
        {AVATAR_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onSelectColor(color)}
            className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
              current === color
                ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-surface-2'
                : ''
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
          {t('projectSettingsTabs.uploadAvatar')}
        </button>
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
  const { t } = useTranslation();
  const [name, setName] = useState(project.project_name);
  const [prevProjectName, setPrevProjectName] = useState(project.project_name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Reset the local draft when the project itself changes (not on every
  // render) — adjusted during render instead of an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (project.project_name !== prevProjectName) {
    setPrevProjectName(project.project_name);
    setName(project.project_name);
  }

  const canEdit = role === 'OWNER' || role === 'ADMIN';
  const hasChanged = name.trim() !== '' && name.trim() !== project.project_name;
  const derivedSlug = toSlug(name || project.project_name);

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
    if (!trimmed) {
      setError(t('projectSettingsTabs.projectNameRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    router.patch(
      projectPath(accountIndex, project.project_slug),
      { project_name: trimmed },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
        onError: (errs) => {
          setError(
            (errs.project_name as string | undefined) ??
              t('common.somethingWentWrong'),
          );
        },
        onFinish: () => setSaving(false),
      },
    );
  };

  const handleColorSelect = (color: AvatarColor) => {
    setPickerOpen(false);
    router.patch(
      projectPath(accountIndex, project.project_slug, '/avatar'),
      { avatar_color: color },
      {
        preserveScroll: true,
      },
    );
  };

  const handleUpload = (file: File) => {
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append('avatar', file);
    router.post(
      projectPath(accountIndex, project.project_slug, '/avatar'),
      form,
      {
        preserveScroll: true,
        forceFormData: true,
        onSuccess: () => setUploadModalOpen(false),
        onError: (errors) =>
          setUploadError(
            (errors.avatar as string | undefined) ??
              t('projectSettingsTabs.avatarUploadFailed'),
          ),
        onFinish: () => setUploading(false),
      },
    );
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
        <h3 className="mb-5 text-normal font-semibold text-dark-primary">
          {t('projectSettingsTabs.general')}
        </h3>

        <form onSubmit={handleSave}>
          <div className="divide-y divide-dark-border rounded-xl border border-dark-border">
            {/* Avatar row */}
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-small font-semibold text-dark-primary">
                {t('projectSettingsTabs.avatar')}
              </p>
              <div ref={pickerRef} className="relative">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setPickerOpen((v) => !v)}
                  className="block transition-opacity hover:opacity-80 disabled:cursor-not-allowed"
                  aria-label={t('projectSettingsTabs.changeProjectAvatar')}
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
                    onUploadClick={() => {
                      setPickerOpen(false);
                      setUploadModalOpen(true);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Name row */}
            <div className="flex items-center justify-between gap-8 px-4 py-3">
              <label className="shrink-0 text-small font-semibold text-dark-primary">
                {t('projectSettingsTabs.name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                disabled={!canEdit}
                maxLength={50}
                placeholder={t('projectSettingsTabs.projectNamePlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-right text-small text-dark-primary outline-none placeholder:text-dark-secondary disabled:opacity-50"
              />
            </div>

            {/* URL slug row */}
            <div className="flex items-center justify-between gap-8 px-4 py-3">
              <p className="shrink-0 text-small font-semibold text-dark-primary">
                {t('projectSettingsTabs.urlSlug')}
              </p>
              <div className="flex min-w-0 items-center gap-1 text-small text-dark-secondary">
                <span>/p/</span>
                <span className="truncate font-medium text-dark-primary">
                  {derivedSlug}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-xsmall text-status-error">{error}</p>
          )}
          <p className="mt-2 text-xsmall text-dark-secondary">
            {t('projectSettingsTabs.slugUpdateHint')}
          </p>

          {canEdit ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || !hasChanged}
                className="rounded-lg bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saving
                  ? t('common.saving')
                  : t('projectSettingsTabs.saveChanges')}
              </button>
              <SavedBadge visible={saved} />
            </div>
          ) : (
            <p className="mt-4 text-small text-dark-secondary">
              {t('projectSettingsTabs.onlyAdminsAndOwnersCanEdit')}
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
          error={uploadError}
          onErrorClear={() => setUploadError(null)}
        />
      )}
    </>
  );
};

export default GeneralTab;

import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  AvatarUploadModal,
  UploadIcon,
} from '@/components/shared/AvatarUploadModal';
import { useTranslation } from '@/hooks/useTranslation';
import { accountPath } from '@/lib/accountRoutes';
import type { User } from '@/types/auth';
import { FieldLabel, SavedBadge, getInitials, inputClass } from './shared';

const ProfileTab = ({
  user,
  accountIndex,
}: {
  user: User | null;
  accountIndex: number;
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(user?.name ?? '');
  const [prevUserName, setPrevUserName] = useState(user?.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const hasChanged = name.trim() !== '' && name.trim() !== user?.name;

  // Adjusted during render instead of an effect — see
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (user?.name !== prevUserName) {
    setPrevUserName(user?.name);
    if (user?.name) setName(user.name);
  }

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!hasChanged || saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('projectSettingsTabs.nameRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    router.patch(
      accountPath(accountIndex, '/profile'),
      { name: trimmed },
      {
        preserveScroll: true,
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
        onError: (errs) => {
          setError(
            (errs.name as string | undefined) ?? t('common.somethingWentWrong'),
          );
        },
        onFinish: () => setSaving(false),
      },
    );
  };

  const handleUpload = (file: File) => {
    setUploading(true);
    const form = new FormData();
    form.append('avatar', file);
    router.post(accountPath(accountIndex, '/profile/avatar'), form, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => setUploadModalOpen(false),
      onFinish: () => setUploading(false),
    });
  };

  const handleRemoveImage = () => {
    router.delete(accountPath(accountIndex, '/profile/avatar'), {
      preserveScroll: true,
      onSuccess: () => setUploadModalOpen(false),
    });
  };

  return (
    <div>
      <h3 className="mb-5 text-normal font-semibold text-dark-primary">
        {t('projectSettingsTabs.profile')}
      </h3>
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="block shrink-0 transition-opacity hover:opacity-80"
          aria-label={t('projectSettingsTabs.changeProfilePicture')}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue text-large font-bold text-white">
              {getInitials(name || user?.name || 'U')}
            </div>
          )}
        </button>
        <div className="min-w-0">
          <p className="truncate text-small font-semibold text-dark-primary">
            {user?.name}
          </p>
          <p className="truncate text-xsmall text-dark-secondary">
            {user?.email}
          </p>
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            className="mt-1 flex items-center gap-1.5 text-xsmall text-dark-secondary transition-colors hover:text-dark-primary"
          >
            <UploadIcon />
            {t('projectSettingsTabs.uploadAvatar')}
          </button>
        </div>
      </div>

      {uploadModalOpen && (
        <AvatarUploadModal
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
          onRemove={handleRemoveImage}
          hasImage={!!user?.avatar_url}
          uploading={uploading}
        />
      )}
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <FieldLabel>{t('projectSettingsTabs.displayName')}</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            maxLength={255}
            placeholder={t('projectSettingsTabs.yourNamePlaceholder')}
            className={inputClass}
          />
          {error && (
            <p className="mt-1.5 text-xsmall text-status-error">{error}</p>
          )}
        </div>
        <div>
          <FieldLabel>{t('projectSettingsTabs.emailAddress')}</FieldLabel>
          <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-3 px-3 py-2.5">
            <span className="flex-1 text-small text-dark-primary">
              {user?.email}
            </span>
            {user?.email_verified_at ? (
              <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-micro font-semibold text-status-success">
                {t('projectSettingsTabs.verified')}
              </span>
            ) : (
              <span className="rounded-full bg-status-warning/15 px-2 py-0.5 text-micro font-semibold text-status-warning">
                {t('projectSettingsTabs.unverified')}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xsmall text-dark-secondary">
            {t('projectSettingsTabs.emailCannotBeChanged')}
          </p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || !hasChanged}
            className="rounded-lg bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? t('common.saving') : t('projectSettingsTabs.saveChanges')}
          </button>
          <SavedBadge visible={saved} />
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;

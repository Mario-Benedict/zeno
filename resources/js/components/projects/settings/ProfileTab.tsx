import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { accountPath } from '@/lib/accountRoutes';
import type { User } from '@/types/auth';
import { FieldLabel, SavedBadge, getInitials, inputClass } from './shared';

const ProfileTab = ({ user, accountIndex }: { user: User | null; accountIndex: number }) => {
  const [name, setName] = useState(user?.name ?? '');
  const [prevUserName, setPrevUserName] = useState(user?.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
 setError('Name is required.'); return; 
}
    setSaving(true);
    setError(null);
    router.patch(accountPath(accountIndex, '/profile'), { name: trimmed }, {
      preserveScroll: true,
      onSuccess: () => {
 setSaved(true); setTimeout(() => setSaved(false), 2500); 
},
      onError: (errs) => {
 setError((errs.name as string | undefined) ?? 'Something went wrong.'); 
},
      onFinish: () => setSaving(false),
    });
  };

  return (
    <div>
      <h3 className="mb-5 text-normal font-semibold text-dark-primary">Profile</h3>
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue text-large font-bold text-white">
          {getInitials(name || user?.name || 'U')}
        </div>
        <div className="min-w-0">
          <p className="truncate text-small font-semibold text-dark-primary">{user?.name}</p>
          <p className="truncate text-xsmall text-dark-secondary">{user?.email}</p>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <FieldLabel>Display name</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => {
 setName(e.target.value); setError(null); 
}}
            maxLength={255}
            placeholder="Your name"
            className={inputClass}
          />
          {error && <p className="mt-1.5 text-xsmall text-status-error">{error}</p>}
        </div>
        <div>
          <FieldLabel>Email address</FieldLabel>
          <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-3 px-3 py-2.5">
            <span className="flex-1 text-small text-dark-primary">{user?.email}</span>
            {user?.email_verified_at ? (
              <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-micro font-semibold text-status-success">
                Verified
              </span>
            ) : (
              <span className="rounded-full bg-status-warning/15 px-2 py-0.5 text-micro font-semibold text-status-warning">
                Unverified
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xsmall text-dark-secondary">Email cannot be changed here.</p>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving || !hasChanged}
            className="rounded-lg bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <SavedBadge visible={saved} />
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;

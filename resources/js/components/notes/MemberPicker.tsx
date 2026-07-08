import React, { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { NoteProjectUser } from '@/types/notes';

interface MemberPickerProps {
  projectUsers: NoteProjectUser[];
  excludeUserIds: number[];
  onPick: (user: NoteProjectUser) => void;
}

/** Search-as-you-type list of project members — replaces manual user-ID entry. */
const MemberPicker = ({
  projectUsers,
  excludeUserIds,
  onPick,
}: MemberPickerProps): React.ReactElement => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const candidates = projectUsers.filter(
      (u) => !excludeUserIds.includes(u.id),
    );

    if (!q) return candidates;

    return candidates.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [projectUsers, excludeUserIds, query]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('notes.memberPickerPlaceholder')}
        className="w-full rounded-md border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary outline-none placeholder:text-dark-secondary focus:bg-dark-input-focus"
      />

      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-dark-border">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => {
                onPick(user);
                setQuery('');
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-small text-dark-primary hover:bg-dark-surface-3"
            >
              <span className="truncate">{user.name}</span>
              <span className="truncate text-xsmall text-dark-secondary">
                {user.email}
              </span>
            </button>
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <p className="px-1 text-xsmall text-dark-secondary">
          {t('notes.noMatchingMembers')}
        </p>
      )}
    </div>
  );
};

export default MemberPicker;

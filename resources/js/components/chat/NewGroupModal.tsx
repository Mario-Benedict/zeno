import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatParticipant } from '@/types/chat';
import { avatarBgClass, initials } from '@/utils/chat';
import XIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';

interface NewGroupModalProps {
  members: ChatParticipant[];
  onClose: () => void;
  onSubmit: (name: string, participantIds: string[]) => void;
  submitting?: boolean;
}

/** Creates a group chat room with a chosen subset of project members. */
const NewGroupModal = ({
  members,
  onClose,
  onSubmit,
  submitting = false,
}: NewGroupModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    if (name.trim().length === 0) {
      setError(t('chat.groupNameRequiredError'));
      return;
    }
    if (selectedIds.size === 0) {
      setError(t('chat.selectAtLeastOneMemberError'));
      return;
    }
    setError(null);
    onSubmit(name.trim(), Array.from(selectedIds));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('chat.newGroupTitle')}
        className="flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-surface-2 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-dark-border px-5">
          <h2 className="truncate text-small font-semibold text-dark-primary">
            {t('chat.newGroupTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
          >
            <XIcon />
          </button>
        </div>

        <div className="scrollbar-app flex-1 overflow-y-auto p-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('chat.groupNamePlaceholder')}
            maxLength={255}
            className="h-9 w-full rounded-md border border-dark-border bg-dark-input px-3 text-small text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-border-focus"
          />

          <p className="mt-4 mb-2 text-xsmall font-semibold text-dark-secondary uppercase">
            {t('chat.selectMembers')}
          </p>

          <div className="space-y-1">
            {members.length === 0 && (
              <p className="py-4 text-center text-xsmall text-dark-secondary">
                {t('chat.noOtherMembers')}
              </p>
            )}
            {members.map((member) => {
              const active = selectedIds.has(member.id);

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleMember(member.id)}
                  className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                    active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xsmall font-bold text-white ${avatarBgClass(member.name)}`}
                  >
                    {initials(member.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-small text-dark-primary">
                    {member.name}
                  </span>
                  {active && (
                    <CheckIcon className="h-4 w-4 shrink-0 text-accent-blue" />
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-3 text-xsmall text-status-error">{error}</p>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-dark-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-dark-border px-4 text-small font-semibold text-dark-primary transition-colors hover:bg-white/[0.07]"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="h-10 rounded-md bg-dark-primary px-4 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? t('chat.creatingGroup') : t('common.create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewGroupModal;

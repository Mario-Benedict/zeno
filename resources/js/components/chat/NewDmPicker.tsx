import { useTranslation } from '@/hooks/useTranslation';
import type { ChatParticipant } from '@/types/chat';
import { avatarBgClass, initials } from '@/utils/chat';
import UsersIcon from '@public/icons/small/users.svg';

interface Props {
  members: ChatParticipant[];
  onSelect: (memberId: string) => void;
  onCreateGroup: () => void;
  onClose: () => void;
}

const NewDmPicker = ({ members, onSelect, onCreateGroup, onClose }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="scrollbar-app absolute top-full right-0 z-30 mt-1 max-h-72 w-44 overflow-y-auto rounded-xl border border-dark-border bg-dark-surface-3 py-1.5 shadow-2xl">
      <button
        type="button"
        onClick={() => {
          onCreateGroup();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 border-b border-dark-border px-3 py-2 text-left transition-colors hover:bg-dark-surface-2"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dark-surface-2 text-dark-primary">
          <UsersIcon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-small font-semibold text-dark-primary">
          {t('chat.newGroupAction')}
        </span>
      </button>
      {members.length === 0 && (
        <p className="px-3 py-4 text-center text-xsmall text-dark-secondary">
          {t('chat.noOtherMembers')}
        </p>
      )}
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          onClick={() => {
            onSelect(member.id);
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-dark-surface-2"
        >
          <span
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-micro font-semibold text-white ${avatarBgClass(member.name)}`}
          >
            {initials(member.name)}
          </span>
          <span className="truncate text-small text-dark-primary">
            {member.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default NewDmPicker;

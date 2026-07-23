import { useTranslation } from '@/hooks/useTranslation';
import ChatPlaceholderIcon from '@public/icons/small/chat_placeholder.svg';

const ChatEmptyState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 rounded-lg bg-dark-surface-2 select-none">
      <span className="text-dark-secondary opacity-30">
        <ChatPlaceholderIcon />
      </span>
      <p className="text-normal font-medium text-dark-secondary opacity-40">
        {t('chat.sendAMessage')}
      </p>
    </div>
  );
};

export default ChatEmptyState;

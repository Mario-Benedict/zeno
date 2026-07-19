import { useTranslation } from '@/hooks/useTranslation';
import WidgetFrame from '../primitives/WidgetFrame';

// Copies the real ChatWidget room list: each row is an accent avatar with
// initials, the room name, and the last message preview ("Sender: body") — or
// the empty-state text — inside the shared widget frame.
const ChatMockup = ({ className }: { className?: string }) => {
  const { t } = useTranslation();

  const rooms = [
    {
      name: t('landing.bentoMockup.chatRoom1'),
      last: t('landing.bentoMockup.chatMsg1'),
      initials: 'DT',
      avatar: 'bg-accent-green',
    },
    {
      name: t('landing.bentoMockup.chatRoom2'),
      last: t('landing.bentoMockup.chatMsg2'),
      initials: 'KC',
      avatar: 'bg-accent-purple',
    },
    {
      name: t('landing.bentoMockup.chatRoom3'),
      last: t('dashboard.noMessagesShort'),
      initials: 'OS',
      avatar: 'bg-accent-blue',
    },
  ];

  return (
    <WidgetFrame
      title={t('dashboard.chatTitle')}
      count={t('landing.bentoMockup.chatCount')}
      className={className}
    >
      <div className="flex flex-col gap-0.5 px-1.5 pb-2">
        {rooms.map((room) => (
          <div
            key={room.name}
            className="flex items-center gap-2.5 rounded-lg px-2 py-2"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xsmall font-semibold text-white ${room.avatar}`}
            >
              {room.initials}
            </span>
            <span className="min-w-0 flex-1">
              <p className="truncate text-xsmall font-medium text-white/90">
                {room.name}
              </p>
              <p className="truncate text-micro text-white/40">{room.last}</p>
            </span>
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
};

export default ChatMockup;

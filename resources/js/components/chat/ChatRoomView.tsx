import { useEffect, useRef, useState } from 'react';
import ChatComposer from '@/components/chat/ChatComposer';
import ChatRoomHeader from '@/components/chat/ChatRoomHeader';
import ChatSearchOverlay from '@/components/chat/ChatSearchOverlay';
import MessageList from '@/components/chat/MessageList';
import { useMessages } from '@/hooks/useMessages';
import type { ChatMessage, ChatParticipant, ChatRoom } from '@/types/chat';

interface Props {
  room: ChatRoom;
  currentUser: ChatParticipant;
  projectSlug: string;
  targetMessageId?: string | null;
  onSenderClick?: (senderId: string) => void;
  onMessageSent?: (message: ChatMessage) => void;
  realtimeMessages?: ChatMessage[];
}

const ChatRoomView = ({
  room,
  currentUser,
  projectSlug,
  targetMessageId,
  onSenderClick,
  onMessageSent,
  realtimeMessages = [],
}: Props) => {
  const {
    messages,
    hasMore,
    loading,
    initialLoading,
    loadMore,
    pushMessage,
    receiveMessage,
    confirmMessage,
    failMessage,
    scrollSignal,
  } = useMessages(projectSlug, room.id, targetMessageId);

  const [showSearch, setShowSearch] = useState(false);
  const processedRealtimeMessageIds = useRef(new Set<string>());

  useEffect(() => {
    for (const message of realtimeMessages) {
      if (
        message.roomId === room.id &&
        !processedRealtimeMessageIds.current.has(message._id)
      ) {
        processedRealtimeMessageIds.current.add(message._id);
        receiveMessage(message);
      }
    }
  }, [realtimeMessages, receiveMessage, room.id]);

  const handleMessageSent = (message: ChatMessage) => {
    pushMessage(message);
    onMessageSent?.(message);
  };

  const scrollToMessage = (messageId: string) => {
    setShowSearch(false);
    requestAnimationFrame(() => {
      const element = document.querySelector(`[data-msgid="${messageId}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  return (
    <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-lg bg-dark-surface-2">
      <ChatRoomHeader
        room={room}
        currentUser={currentUser}
        searchActive={showSearch}
        onSearchToggle={() => setShowSearch((visible) => !visible)}
      />

      {showSearch && (
        <ChatSearchOverlay
          messages={messages}
          onClose={() => setShowSearch(false)}
          onSelectResult={scrollToMessage}
        />
      )}

      <MessageList
        messages={messages}
        currentUser={currentUser}
        hasMore={hasMore}
        loading={loading}
        initialLoading={initialLoading}
        onLoadMore={loadMore}
        scrollSignal={scrollSignal}
        targetMessageId={targetMessageId}
        onSenderClick={room.type === 'group' ? onSenderClick : undefined}
      />

      <ChatComposer
        projectSlug={projectSlug}
        roomId={room.id}
        currentUser={currentUser}
        onMessageSent={handleMessageSent}
        onMessageConfirmed={confirmMessage}
        onMessageFailed={failMessage}
      />
    </div>
  );
};

export default ChatRoomView;

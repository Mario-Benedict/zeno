import { usePage } from '@inertiajs/react';
import ChatEmptyState from '@/components/chat/ChatEmptyState';
import ChatRoomView from '@/components/chat/ChatRoomView';
import type { ChatMessage, ChatParticipant, ChatRoom } from '@/types/chat';

interface Props {
  room: ChatRoom | null;
  currentUser: ChatParticipant;
  targetMessageId?: string | null;
  onSenderClick?: (senderId: string) => void;
  onMessageSent?: (message: ChatMessage) => void;
  realtimeMessages?: ChatMessage[];
}

interface PageProps {
  project?: { project_id: string; project_name: string; project_slug: string };
  [key: string]: unknown;
}

const ChatWindow = ({
  room,
  currentUser,
  targetMessageId,
  onSenderClick,
  onMessageSent,
  realtimeMessages,
}: Props) => {
  const { project } = usePage<PageProps>().props;
  const projectSlug = project?.project_slug ?? '';

  if (!room) return <ChatEmptyState />;

  return (
    <ChatRoomView
      key={room.id}
      room={room}
      currentUser={currentUser}
      projectSlug={projectSlug}
      targetMessageId={targetMessageId}
      onSenderClick={onSenderClick}
      onMessageSent={onMessageSent}
      realtimeMessages={realtimeMessages}
    />
  );
};

export default ChatWindow;

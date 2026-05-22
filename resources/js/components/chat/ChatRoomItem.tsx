import React from 'react';
import { getRoomDisplayName } from '@/components/chat/ChatSidebar';
import RoomAvatar from '@/components/chat/RoomAvatar';
import type { ChatRoom, ChatParticipant } from '@/types/chat';

interface Props {
    room: ChatRoom;
    currentUser: ChatParticipant;
    isActive: boolean;
    onClick: () => void;
}

export default function ChatRoomItem({ room, currentUser, isActive, onClick }: Props) {
    const displayName  = getRoomDisplayName(room, currentUser);
    const lastMsgBody  = room.lastMessage?.body ?? '';
    const lastMsgSender = room.lastMessage?.senderName;
    const preview = lastMsgBody
        ? (lastMsgSender && room.type === 'group'
            ? `${lastMsgSender}: ${lastMsgBody}`
            : lastMsgBody)
        : 'No messages yet';

    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                isActive
                    ? 'bg-dark-surface-3'
                    : 'hover:bg-dark-surface-3/60',
            ].join(' ')}
        >
            {/* Avatar */}
            <RoomAvatar room={room} currentUser={currentUser} size={32} />

            {/* Text */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium text-dark-primary leading-snug">
                    {displayName}
                </p>
                <p className="mt-0.5 truncate text-xsmall text-dark-secondary leading-snug">
                    {preview}
                </p>
            </div>
        </button>
    );
}

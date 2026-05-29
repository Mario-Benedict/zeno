import React, { useState, useCallback } from 'react';
import AppLayout from '@/layouts/AppLayout';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import type { ChatRoom, ChatParticipant, ChatMessage } from '@/types/chat';

/**
 * Chat/Index.tsx
 * ---------------
 * Main entry page for the Chat feature, rendered inside AppLayout.
 *
 * Props from Inertia (ChatRoomController::index):
 *  - rooms         : ALL rooms the user participates in (incl. empty DMs)
 *  - currentUser   : the logged-in user as a ChatParticipant shape
 *  - messages      : optional — only present after a partial reload (room selected)
 *  - nextCursor    : optional — MongoDB cursor for the next older page
 *  - hasMore       : optional — whether more messages exist above
 *
 * Route: GET /p/{project:project_slug}/chat
 */

interface Props {
    rooms: ChatRoom[];
    currentUser: ChatParticipant;
    messages?: ChatMessage[];
    nextCursor?: string | null;
    hasMore?: boolean;
}

export default function Index({ rooms, currentUser }: Props) {
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);

    /**
     * Tap-to-DM: clicking a member's name in a group chat opens the DM
     * with that person. All DM rooms are pre-created on join so they
     * should always be findable in the rooms list.
     */
    const handleSenderClick = useCallback((senderId: string) => {
        // Can't DM yourself
        if (String(senderId) === String(currentUser.id)) return;

        const dmRoom = rooms.find(
            (r) =>
                r.type === 'dm' &&
                r.participants?.some((p) => String(p.id) === String(senderId)),
        );
        if (dmRoom) setActiveRoom(dmRoom);
    }, [rooms, currentUser.id]);

    return (
        <AppLayout>
            {/* gap-2 separates sidebar and window as two distinct boxes */}
            <div className="flex h-full w-full gap-2 overflow-hidden">
                <ChatSidebar
                    rooms={rooms}
                    currentUser={currentUser}
                    activeRoomId={activeRoom?.id ?? null}
                    onSelectRoom={setActiveRoom}
                />
                <ChatWindow
                    room={activeRoom}
                    currentUser={currentUser}
                    onSenderClick={handleSenderClick}
                />
            </div>
        </AppLayout>
    );
}

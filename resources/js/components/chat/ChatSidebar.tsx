import React, { useState } from 'react';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import type { ChatRoom, ChatParticipant } from '@/types/chat';

/**
 * ChatSidebar.tsx
 * ----------------
 * Left panel listing all chat rooms (group + DMs) for a project.
 * Includes a search bar to filter rooms by name.
 *
 * Props:
 *  - rooms         : full list of ChatRoom objects
 *  - currentUser   : the logged-in user (for resolving DM display names)
 *  - activeRoomId  : currently selected room id (highlighted)
 *  - onSelectRoom  : callback when a room row is clicked
 */


// icon temp
/* ──────────────────────────────────────────────────────────────
   Shared prop type
────────────────────────────────────────────────────────────── */
 
export interface IconProps {
    /** Pixel size for both width and height. Default: 24 */
    size?: number;
    /** Extra Tailwind / CSS classes (e.g. "text-dark-secondary") */
    className?: string;
    /** SVG stroke width. Default: 2 */
    strokeWidth?: number;
    /** aria-hidden — set false only when the icon conveys meaning without a label */
    'aria-hidden'?: boolean | 'true' | 'false';
}
 
/** Shared SVG wrapper to reduce boilerplate in every icon below. */
function Icon({
    size = 24,
    className = '',
    strokeWidth = 2,
    children,
    'aria-hidden': ariaHidden = true,
}: IconProps & { children: React.ReactNode }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden={ariaHidden}
        >
            {children}
        </svg>
    );
}
 
/* ──────────────────────────────────────────────────────────────
   Icons
────────────────────────────────────────────────────────────── */
 
/**
 * SearchIcon — magnifying glass
 * Used in: ChatSidebar search input
 */
export function Search(props: IconProps) {
    return (
        <Icon {...props}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </Icon>
    );
}
// =====================================================================================


interface Props {
    rooms: ChatRoom[];
    currentUser: ChatParticipant;
    activeRoomId: string | null;
    onSelectRoom: (room: ChatRoom) => void;
}

export default function ChatSidebar({
    rooms,
    currentUser,
    activeRoomId,
    onSelectRoom,
}: Props) {
    const [query, setQuery] = useState('');

    const hasQuery = query.trim().length > 0;

    const filtered = rooms.filter((r) => {
        const nameMatch = getRoomDisplayName(r, currentUser)
            .toLowerCase()
            .includes(query.toLowerCase());
        if (!nameMatch) return false;
        // DM rooms without any messages are hidden until the user searches for them
        if (r.type === 'dm' && !r.lastMessage && !hasQuery) return false;
        return true;
    });

    return (
        <aside className="flex w-[200px] shrink-0 flex-col h-full rounded-lg bg-dark-surface-2 overflow-hidden">
 
            {/* ── Search bar ── */}
            <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 rounded-md bg-dark-input px-3 py-[7px] ring-1 ring-transparent focus-within:bg-dark-input-focus focus-within:ring-dark-border-focus transition-all">
                    <Search
                        size={14}
                        className="shrink-0 text-dark-secondary"
                        strokeWidth={2}
                    />
                    <input
                        type="text"
                        placeholder="Search chat"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none"
                    />
                </div>
            </div>
 
            {/* ── Room list ── */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dark-border">
                {filtered.map((room) => (
                    <ChatRoomItem
                        key={room.id}
                        room={room}
                        currentUser={currentUser}
                        isActive={room.id === activeRoomId}
                        onClick={() => onSelectRoom(room)}
                    />
                ))}
 
                {filtered.length === 0 && (
                    <p className="px-4 py-6 text-center text-xsmall text-dark-secondary">
                        No chats found
                    </p>
                )}
            </nav>
        </aside>
    );
}

/**
 * Derives a human-readable display name for a room.
 * - Group rooms  → room.name (set automatically when project is created)
 * - DM rooms     → the other participant's name
 */
export function getRoomDisplayName(
    room: ChatRoom,
    currentUser: ChatParticipant,
): string {
    if (room.type === 'group') return room.name ?? 'Group';

    const other = room.participants?.find((p) => p.id !== currentUser.id);
    return other?.name ?? 'Direct Message';
}
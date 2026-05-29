import React from 'react';
import type { ChatRoom, ChatParticipant } from '@/types/chat';
import { getRoomDisplayName } from '@/components/chat/ChatSidebar';

/**
 * RoomAvatar.tsx
 * ---------------
 * Renders an avatar for a chat room row.
 *
 * - Group rooms  → icon with gradient bg, or a custom uploaded avatar
 * - DM rooms     → the other participant's avatar, or initials fallback
 *
 * Props:
 *  - room        : the ChatRoom object
 *  - currentUser : to identify the "other" person in a DM
 *  - size        : pixel size of the avatar circle (default 36)
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
 * UsersIcon — two silhouettes
 * Used in: RoomAvatar for group rooms
 */
export function Users(props: IconProps) {
    return (
        <Icon {...props}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Icon>
    );
}

// ==========================================================================================

interface Props {
    room: ChatRoom;
    currentUser: ChatParticipant;
    size?: number;
}

/** Deterministic accent color from a string (for initials fallback). */
function colorFromName(name: string): string {
    const palette = [
        'bg-accent-blue',
        'bg-accent-purple',
        'bg-accent-green',
        'bg-accent-cyan',
        'bg-accent-orange',
        'bg-accent-pink',
        'bg-accent-lime',
        'bg-accent-brown',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return palette[Math.abs(hash) % palette.length];
}

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

export default function RoomAvatar({ room, currentUser, size = 36 }: Props) {
    const dim = { width: size, height: size };
    const style = { ...dim, minWidth: size };
    const textClass = size >= 36 ? 'text-xsmall' : 'text-[10px]';

    /* ── Group room ── */
    if (room.type === 'group') {
        if (room.avatarUrl) {
            return (
                <img
                    src={room.avatarUrl}
                    alt={room.name ?? 'Group'}
                    style={style}
                    className="rounded-full object-cover"
                />
            );
        }
        const bg = colorFromName(room.name ?? 'G');
        return (
            <span
                style={style}
                className={`inline-flex items-center justify-center rounded-full ${bg} shrink-0`}
            >
                <Users size={size * 0.44} className="text-white" strokeWidth={2} />
            </span>
        );
    }

    /* ── DM room ── */
    const other =
        room.participants?.find((p) => p.id !== currentUser.id) ?? null;

    if (other?.avatarUrl) {
        return (
            <img
                src={other.avatarUrl}
                alt={other.name}
                style={style}
                className="rounded-full object-cover shrink-0"
            />
        );
    }

    const name = getRoomDisplayName(room, currentUser);
    const bg = colorFromName(name);

    return (
        <span
            style={style}
            className={`inline-flex items-center justify-center rounded-full ${bg} font-semibold text-white shrink-0 ${textClass}`}
        >
            {initials(name)}
        </span>
    );
}
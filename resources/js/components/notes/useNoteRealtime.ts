import { useEffect, useRef, useState } from 'react';
import echo from '@/echo';
import type { NoteDetail } from '@/types/notes';

export interface PresenceUser {
  id: number;
  name: string;
}

interface RemoteNotePayload {
  note: NoteDetail;
  editedBy: PresenceUser | null;
}

interface UseNoteRealtimeOptions {
  noteId: string | null;
  isShared: boolean;
  currentUserId: number;
  /** Returns false only when the editor cannot safely merge the remote update. */
  onRemoteUpdate: (note: NoteDetail, editedBy: PresenceUser | null) => boolean;
}

/**
 * Joins the note's presence channel (see `routes/channels.php`) while a
 * shared note is open. Remote `NoteUpdated` events are applied immediately;
 * the editor rebases any unsaved local changes onto the incoming version so
 * multiple collaborators converge without overwriting each other's typing.
 */
export const useNoteRealtime = ({
  noteId,
  isShared,
  currentUserId,
  onRemoteUpdate,
}: UseNoteRealtimeOptions) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [hasStaleRemoteChange, setHasStaleRemoteChange] = useState(false);
  const onRemoteUpdateRef = useRef(onRemoteUpdate);

  useEffect(() => {
    onRemoteUpdateRef.current = onRemoteUpdate;
  }, [onRemoteUpdate]);

  useEffect(() => {
    if (!noteId || !isShared) return;

    const channel = echo?.join(`note.${noteId}`);
    if (!channel) return;

    channel
      .here((users: PresenceUser[]) => setOnlineUsers(users))
      .joining((user: PresenceUser) =>
        setOnlineUsers((prev) => [
          ...prev.filter((u) => u.id !== user.id),
          user,
        ]),
      )
      .leaving((user: PresenceUser) =>
        setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id)),
      );

    channel.listen('.NoteUpdated', (payload: RemoteNotePayload) => {
      // A browser without a connected socket cannot be excluded by Reverb.
      // Ignore that browser's own broadcast instead of flagging its save as a
      // remote conflict.
      if (payload.editedBy?.id === currentUserId) return;

      const applied = onRemoteUpdateRef.current(payload.note, payload.editedBy);
      setHasStaleRemoteChange(!applied);
    });

    // Runs on note switch (deps change) and on unmount — resets presence/stale
    // state for whichever note this effect instance was watching.
    return () => {
      echo?.leave(`note.${noteId}`);
      setOnlineUsers([]);
      setHasStaleRemoteChange(false);
    };
  }, [noteId, isShared, currentUserId]);

  return {
    onlineUsers,
    hasStaleRemoteChange,
    dismissStaleRemoteChange: () => setHasStaleRemoteChange(false),
  };
};

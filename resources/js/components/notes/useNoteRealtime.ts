import { useEffect, useState } from 'react';
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
  /** Should return true while the local user has unsaved/in-flight edits — remote updates are held back to avoid clobbering them. */
  isDirty: () => boolean;
  onRemoteUpdate: (note: NoteDetail, editedBy: PresenceUser | null) => void;
}

/**
 * Joins the note's presence channel (see `routes/channels.php`) while a
 * shared note is open. Remote `NoteUpdated` events are applied immediately
 * unless the local user is mid-edit, in which case we just flag that the
 * note changed elsewhere rather than overwriting their in-progress typing.
 */
export const useNoteRealtime = ({
  noteId,
  isShared,
  isDirty,
  onRemoteUpdate,
}: UseNoteRealtimeOptions) => {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [hasStaleRemoteChange, setHasStaleRemoteChange] = useState(false);

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
      if (isDirty()) {
        setHasStaleRemoteChange(true);
        return;
      }

      onRemoteUpdate(payload.note, payload.editedBy);
    });

    // Runs on note switch (deps change) and on unmount — resets presence/stale
    // state for whichever note this effect instance was watching.
    return () => {
      echo?.leave(`note.${noteId}`);
      setOnlineUsers([]);
      setHasStaleRemoteChange(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, isShared]);

  return {
    onlineUsers,
    hasStaleRemoteChange,
    dismissStaleRemoteChange: () => setHasStaleRemoteChange(false),
  };
};

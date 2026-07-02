import axios from 'axios';
import React, { useState } from 'react';
import notes from '@/routes/projects/notes';
import type { NoteDetail, NoteProjectUser } from '@/types/notes';
import MemberPicker from './MemberPicker';

interface ShareNoteDialogProps {
  projectSlug: string;
  note: NoteDetail;
  projectUsers: NoteProjectUser[];
  onClose: () => void;
  onNoteUpdated: (note: NoteDetail) => void;
}

interface PendingInvite {
  user: NoteProjectUser;
  canEdit: boolean;
}

/**
 * Doubles as the "migrate to shared" flow (personal notes) and the ongoing
 * collaborator manager (already-shared notes) — both are just "who can see
 * this note", so one dialog covers both instead of duplicating the UI.
 */
const ShareNoteDialog = ({ projectSlug, note, projectUsers, onClose, onNoteUpdated }: ShareNoteDialogProps): React.ReactElement => {
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const excludeIds = [note.ownerId, ...note.collaborators.map((c) => c.id), ...pending.map((p) => p.user.id)];

  const submitShare = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await axios.post<{ note: NoteDetail }>(
        notes.share.url({ project: projectSlug, note: note.id }),
        { collaborators: pending.map((p) => ({ user_id: p.user.id, can_edit: p.canEdit })) },
      );
      onNoteUpdated(data.note);
      onClose();
    } catch {
      setError('Could not share this note — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const addCollaborator = async (user: NoteProjectUser): Promise<void> => {
    setError(null);
    try {
      const { data } = await axios.post<{ note: NoteDetail }>(
        notes.collaborators.store.url({ project: projectSlug, note: note.id }),
        { user_id: user.id, can_edit: true },
      );
      onNoteUpdated(data.note);
    } catch {
      setError('Could not add that collaborator.');
    }
  };

  const updateRole = async (userId: number, canEdit: boolean): Promise<void> => {
    const { data } = await axios.patch<{ note: NoteDetail }>(
      notes.collaborators.update.url({ project: projectSlug, note: note.id, user: userId }),
      { can_edit: canEdit },
    );
    onNoteUpdated(data.note);
  };

  const removeCollaborator = async (userId: number): Promise<void> => {
    const { data } = await axios.delete<{ note: NoteDetail }>(
      notes.collaborators.destroy.url({ project: projectSlug, note: note.id, user: userId }),
    );
    onNoteUpdated(data.note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex w-[420px] flex-col gap-4 rounded-xl bg-dark-surface-2 p-6">
        <div>
          <h3 className="m-0 text-h5 font-bold text-dark-primary">{note.isShared ? 'Manage access' : 'Share this note'}</h3>
          <p className="m-0 mt-1 text-small text-dark-secondary">
            {note.isShared
              ? 'Anyone added here can open this note from their own Shared section.'
              : 'Sharing moves this note out of Private and into everyone’s Shared section.'}
          </p>
        </div>

        <MemberPicker
          projectUsers={projectUsers}
          excludeUserIds={excludeIds}
          onPick={(user) => (note.isShared ? void addCollaborator(user) : setPending((prev) => [...prev, { user, canEdit: true }]))}
        />

        {error && <p className="text-xsmall text-status-error">{error}</p>}

        <div className="flex flex-col gap-2">
          {!note.isShared &&
            pending.map(({ user, canEdit }) => (
              <div key={user.id} className="flex items-center justify-between rounded-md bg-dark-surface-3 px-3 py-2">
                <span className="truncate text-small text-dark-primary">{user.name}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={canEdit ? '1' : '0'}
                    onChange={(e) =>
                      setPending((prev) => prev.map((p) => (p.user.id === user.id ? { ...p, canEdit: e.target.value === '1' } : p)))
                    }
                    className="rounded bg-dark-surface-2 px-1.5 py-1 text-xsmall text-dark-secondary outline-none"
                  >
                    <option value="1">Editor</option>
                    <option value="0">Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setPending((prev) => prev.filter((p) => p.user.id !== user.id))}
                    className="text-xsmall text-status-error hover:opacity-70"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

          {note.isShared &&
            note.collaborators.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md bg-dark-surface-3 px-3 py-2">
                <span className="truncate text-small text-dark-primary">{c.name}</span>
                <div className="flex items-center gap-2">
                  <select
                    value={c.canEdit ? '1' : '0'}
                    onChange={(e) => void updateRole(c.id, e.target.value === '1')}
                    className="rounded bg-dark-surface-2 px-1.5 py-1 text-xsmall text-dark-secondary outline-none"
                  >
                    <option value="1">Editor</option>
                    <option value="0">Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void removeCollaborator(c.id)}
                    className="text-xsmall text-status-error hover:opacity-70"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-dark-surface-3 bg-transparent px-4 py-2 text-small text-dark-primary"
          >
            {note.isShared ? 'Done' : 'Cancel'}
          </button>
          {!note.isShared && (
            <button
              onClick={() => void submitShare()}
              disabled={submitting}
              className="cursor-pointer rounded-lg border-none bg-status-success px-4 py-2 text-small font-bold text-white disabled:opacity-60"
            >
              {submitting ? 'Sharing…' : 'Share note'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareNoteDialog;

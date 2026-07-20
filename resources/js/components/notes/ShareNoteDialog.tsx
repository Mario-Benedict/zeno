import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { inertiaJson } from '@/lib/inertiaJson';
import notes from '@/routes/notes';
import type {
  NoteCollaboratorRole,
  NoteDetail,
  NoteProjectUser,
} from '@/types/notes';
import CancelIcon from '@public/icons/small/cancel.svg';
import MemberPicker from './MemberPicker';
import NoteCollaboratorRow from './NoteCollaboratorRow';

interface ShareNoteDialogProps {
  accountIndex: number;
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

const roleFromCanEdit = (canEdit: boolean): NoteCollaboratorRole =>
  canEdit ? 'Editor' : 'Viewer';

/**
 * Doubles as the "migrate to shared" flow (personal notes) and the ongoing
 * collaborator manager (already-shared notes) — both are just "who can see
 * this note", so one dialog covers both instead of duplicating the UI.
 */
const ShareNoteDialog = ({
  accountIndex,
  projectSlug,
  note,
  projectUsers,
  onClose,
  onNoteUpdated,
}: ShareNoteDialogProps): React.ReactElement => {
  const { t } = useTranslation();
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleLabels: Record<NoteCollaboratorRole, string> = {
    Editor: t('notes.editorRole'),
    Viewer: t('notes.viewerRole'),
  };

  const excludeIds = [
    note.ownerId,
    ...note.collaborators.map((c) => c.id),
    ...pending.map((p) => p.user.id),
  ];

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const submitShare = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await inertiaJson<{ note: NoteDetail }>(
        'post',
        notes.share.url({ accountIndex, project: projectSlug, note: note.id }),
        {
          data: {
            collaborators: pending.map((p) => ({
              user_id: p.user.id,
              can_edit: p.canEdit,
            })),
          },
        },
      );
      onNoteUpdated(data.note);
      onClose();
    } catch {
      setError(t('notes.shareError'));
    } finally {
      setSubmitting(false);
    }
  };

  const addCollaborator = async (user: NoteProjectUser): Promise<void> => {
    setError(null);
    try {
      const data = await inertiaJson<{ note: NoteDetail }>(
        'post',
        notes.collaborators.store.url({
          accountIndex,
          project: projectSlug,
          note: note.id,
        }),
        { data: { user_id: user.id, can_edit: true } },
      );
      onNoteUpdated(data.note);
    } catch {
      setError(t('notes.addCollaboratorError'));
    }
  };

  const updateRole = async (
    userId: number,
    canEdit: boolean,
  ): Promise<void> => {
    const data = await inertiaJson<{ note: NoteDetail }>(
      'patch',
      notes.collaborators.update.url({
        accountIndex,
        project: projectSlug,
        note: note.id,
        user: userId,
      }),
      { data: { can_edit: canEdit } },
    );
    onNoteUpdated(data.note);
  };

  const removeCollaborator = async (userId: number): Promise<void> => {
    const data = await inertiaJson<{ note: NoteDetail }>(
      'delete',
      notes.collaborators.destroy.url({
        accountIndex,
        project: projectSlug,
        note: note.id,
        user: userId,
      }),
    );
    onNoteUpdated(data.note);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          note.isShared ? t('notes.manageAccess') : t('notes.shareThisNote')
        }
        className="flex max-h-[88dvh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-surface-2 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-dark-border px-5">
          <div className="min-w-0">
            <h2 className="truncate text-small font-semibold text-dark-primary">
              {note.isShared
                ? t('notes.manageAccess')
                : t('notes.shareThisNote')}
            </h2>
            <p className="truncate text-xsmall text-dark-secondary">
              {note.isShared
                ? t('notes.manageAccessDescription')
                : t('notes.shareThisNoteDescription')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('notes.close')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
          >
            <CancelIcon />
          </button>
        </div>

        <div className="scrollbar-app flex-1 overflow-y-auto p-5">
          <MemberPicker
            projectUsers={projectUsers}
            excludeUserIds={excludeIds}
            onPick={(user) =>
              note.isShared
                ? void addCollaborator(user)
                : setPending((prev) => [...prev, { user, canEdit: true }])
            }
          />

          {error && (
            <p className="mt-2 text-xsmall text-status-error">{error}</p>
          )}

          <div className="mt-4 space-y-1">
            {!note.isShared &&
              pending.map(({ user, canEdit }) => (
                <NoteCollaboratorRow
                  key={user.id}
                  name={user.name}
                  email={user.email}
                  role={roleFromCanEdit(canEdit)}
                  onRoleChange={(role) =>
                    setPending((prev) =>
                      prev.map((p) =>
                        p.user.id === user.id
                          ? { ...p, canEdit: role === 'Editor' }
                          : p,
                      ),
                    )
                  }
                  onRemove={() =>
                    setPending((prev) =>
                      prev.filter((p) => p.user.id !== user.id),
                    )
                  }
                  roleLabels={roleLabels}
                  removeLabel={t('notes.removeCollaborator', {
                    name: user.name,
                  })}
                />
              ))}

            {note.isShared &&
              note.collaborators.map((c) => (
                <NoteCollaboratorRow
                  key={c.id}
                  name={c.name}
                  email={c.email}
                  role={roleFromCanEdit(c.canEdit)}
                  onRoleChange={(role) =>
                    void updateRole(c.id, role === 'Editor')
                  }
                  onRemove={() => void removeCollaborator(c.id)}
                  roleLabels={roleLabels}
                  removeLabel={t('notes.removeCollaborator', { name: c.name })}
                />
              ))}
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-dark-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-dark-border px-4 text-small font-semibold text-dark-primary transition-colors hover:bg-white/[0.07]"
          >
            {note.isShared ? t('notes.done') : t('notes.cancel')}
          </button>
          {!note.isShared && (
            <button
              type="button"
              onClick={() => void submitShare()}
              disabled={submitting}
              className="h-10 rounded-md bg-dark-primary px-4 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? t('notes.sharing') : t('notes.shareNote')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareNoteDialog;

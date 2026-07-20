import { router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { FILE_SIZE_LIMITS, isFileTooLarge } from '@/lib/fileUploads';
import projects from '@/routes/projects';
import type {
  KanbanBoardCard,
  CardLabel,
  KanbanUser,
  KanbanProject,
  KanbanBoardCardChecklist,
  KanbanBoardCardChecklistItem,
  KanbanBoardCardComment,
} from '@/types/kanban';
import type { LocalAttachment } from '@/utils/attachmentStorage';
import { dbGetByCard, dbPut, dbDelete } from '@/utils/attachmentStorage';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';
import { CardDetailBody } from './CardDetailBody';
import { CardDetailSidebar } from './CardDetailSidebar';

interface CardDetailPanelProps {
  card: KanbanBoardCard;
  boardId: string;
  cardLabels: CardLabel[];
  projectUsers: KanbanUser[];
  currentUser: KanbanUser;
  project: KanbanProject;
  onClose: () => void;
  onUpdate: (updatedCard: KanbanBoardCard, boardId: string) => void;
}

interface CardDetailModalWrapperProps extends CardDetailPanelProps {
  isOpen: boolean;
}

export const CardDetailModalWrapper = (props: CardDetailModalWrapperProps) => {
  if (!props.isOpen) return null;
  return <CardDetailModal {...props} />;
};

// Shared Inertia options for every write request in this modal — the modal
// already runs its own optimistic updates, so we preserve scroll + state
// and only react to server-side validation failures.
const inertiaWriteOptions = {
  preserveScroll: true,
  preserveState: true,
} as const;

const CardDetailModal = ({
  card,
  boardId,
  cardLabels,
  projectUsers,
  currentUser,
  project,
  onClose,
  onUpdate,
}: CardDetailPanelProps) => {
  const { t } = useTranslation();
  const accountIndex = usePage().props.account.index;
  const [localCard, setLocalCard] = useState<KanbanBoardCard>(card);

  const [mounted, setMounted] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(
    localCard.kanban_board_card_title,
  );
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(
    localCard.kanban_board_card_description || '',
  );
  const [newComment, setNewComment] = useState('');
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newChecklistItems, setNewChecklistItems] = useState<
    Record<string, string>
  >({});
  const [saving, setSaving] = useState(false);

  const [localAttachments, setLocalAttachments] = useState<LocalAttachment[]>(
    [],
  );
  const [addingAttachment, setAddingAttachment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentZoneRef = useRef<HTMLDivElement>(null);

  const [labelPopoverOpen, setLabelPopoverOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<string | null>(null);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [savingLabel, setSavingLabel] = useState(false);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const cardId = card.kanban_board_card_id;
  const projectSlug = project.project_slug;

  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);
  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.selectionStart = titleRef.current.value.length;
    }
  }, [editingTitle]);
  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleClose]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalCard(card);
    setTitleValue(card.kanban_board_card_title);
    setDescValue(card.kanban_board_card_description || '');
    setEditingTitle(false);
    setEditingDesc(false);
    setNewComment('');
    setAddingChecklist(false);
    setAddingAttachment(false);
    setNewChecklistName('');
    setNewChecklistItems({});
    setNewLabelName('');
    setNewLabelColor(null);
    setCreatingLabel(false);
    setSavingLabel(false);
    setSaving(false);
    setUploadingFile(false);
    setAttachmentError(null);
    setDragOver(false);
    setLabelPopoverOpen(false);
    // Only reset when the card itself switches, not on every card update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.kanban_board_card_id]);

  // Sync is_completed from the card prop so toggling done from the card list
  // while the detail panel is open reflects immediately in the panel too.
  const cardIsCompleted = card.is_completed;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalCard((prev) => ({ ...prev, is_completed: cardIsCompleted }));
  }, [cardIsCompleted]);

  useEffect(() => {
    dbGetByCard(card.kanban_board_card_id)
      .then(setLocalAttachments)
      .catch(console.error);
  }, [card.kanban_board_card_id]);

  useEffect(() => {
    if (addingAttachment && attachmentZoneRef.current) {
      attachmentZoneRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [addingAttachment]);

  type CardScalarPatch = {
    kanban_board_card_title?: string;
    kanban_board_card_description?: string | null;
    is_completed?: boolean;
  };

  const patchCard = (patch: CardScalarPatch) => {
    const updated = { ...localCard, ...patch };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    router.patch(
      projects.kanban.cards.detail.update.url({
        accountIndex,
        project: projectSlug,
        card: cardId,
      }),
      { ...patch },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to save card detail'),
      },
    );
  };

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== localCard.kanban_board_card_title) {
      patchCard({ kanban_board_card_title: trimmed });
    } else {
      setTitleValue(localCard.kanban_board_card_title);
    }
  };

  const commitDesc = () => {
    setEditingDesc(false);
    patchCard({ kanban_board_card_description: descValue || null });
  };

  const createLabel = () => {
    if (!newLabelName.trim() || !newLabelColor) return;
    setSavingLabel(true);

    // Pre-generate the label id so optimistic UI matches the server
    const labelId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimisticLabel: CardLabel = {
      card_label_id: labelId,
      card_label_project_id: project.project_id,
      card_label_color_hex: newLabelColor,
      card_label_name: newLabelName.trim(),
      created_at: now,
      updated_at: now,
    };

    const updatedLabels = [...(localCard.labels || []), optimisticLabel];
    const updated = { ...localCard, labels: updatedLabels };
    setLocalCard(updated);
    onUpdate(updated, boardId);
    setNewLabelName('');
    setNewLabelColor(null);
    setCreatingLabel(false);

    router.post(
      projects.kanban.cards.labels.create.url({
        accountIndex,
        project: projectSlug,
        card: cardId,
      }),
      {
        card_label_id: labelId,
        card_label_name: optimisticLabel.card_label_name,
        card_label_color_hex: newLabelColor,
      },
      {
        ...inertiaWriteOptions,
        onSuccess: () => router.reload({ only: ['cardLabels'] }),
        onError: (errors) => {
          console.error('Create label failed:', errors);
          alert(t('kanban.failedToCreateLabel'));
        },
        onFinish: () => setSavingLabel(false),
      },
    );
  };

  const deleteLabel = (labelId: string) => {
    const isActive = (localCard.labels || []).some(
      (l) => l.card_label_id === labelId,
    );
    if (isActive) {
      const label = cardLabels.find((l) => l.card_label_id === labelId);
      if (label) toggleLabel(label);
    }

    router.delete(
      projects.kanban.cards.labels.delete.url({
        accountIndex,
        project: projectSlug,
        card: cardId,
        label: labelId,
      }),
      {
        ...inertiaWriteOptions,
        onSuccess: () => router.reload({ only: ['cardLabels'] }),
        onError: () => console.error('Failed to delete label'),
      },
    );
  };

  const toggleLabel = (label: CardLabel) => {
    const currentLabels = localCard.labels || [];
    const hasLabel = currentLabels.some(
      (l) => l.card_label_id === label.card_label_id,
    );
    const updatedLabels = hasLabel
      ? currentLabels.filter((l) => l.card_label_id !== label.card_label_id)
      : [...currentLabels, label];
    const updated = { ...localCard, labels: updatedLabels };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    if (hasLabel) {
      router.delete(
        projects.kanban.cards.labels.destroy.url({
          accountIndex,
          project: projectSlug,
          card: cardId,
          label: label.card_label_id,
        }),
        {
          ...inertiaWriteOptions,
          onError: () => console.error('Failed to detach label'),
        },
      );
    } else {
      router.post(
        projects.kanban.cards.labels.store.url({
          accountIndex,
          project: projectSlug,
          card: cardId,
        }),
        { label_id: label.card_label_id },
        {
          ...inertiaWriteOptions,
          onError: () => console.error('Failed to attach label'),
        },
      );
    }
  };

  const toggleMember = (user: KanbanUser) => {
    const currentMembers = localCard.members || [];
    const hasMember = currentMembers.some((m) => m.id === user.id);
    const updatedMembers = hasMember
      ? currentMembers.filter((m) => m.id !== user.id)
      : [...currentMembers, user];
    const updated = { ...localCard, members: updatedMembers };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    if (hasMember) {
      router.delete(
        projects.kanban.cards.members.destroy.url({
          accountIndex,
          project: projectSlug,
          card: cardId,
          user: user.id,
        }),
        {
          ...inertiaWriteOptions,
          onError: () => console.error('Failed to remove member'),
        },
      );
    } else {
      router.post(
        projects.kanban.cards.members.store.url({
          accountIndex,
          project: projectSlug,
          card: cardId,
        }),
        { user_id: user.id },
        {
          ...inertiaWriteOptions,
          onError: () => console.error('Failed to add member'),
        },
      );
    }
  };

  const updateDates = (
    field: 'kanban_board_card_start_date' | 'kanban_board_card_due_date',
    value: string,
  ) => {
    const updated = { ...localCard, [field]: value || null };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    router.patch(
      projects.kanban.cards.dates.update.url({
        accountIndex,
        project: projectSlug,
        card: cardId,
      }),
      { [field]: value || null },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to update dates'),
      },
    );
  };

  const addChecklist = () => {
    if (!newChecklistName.trim()) return;
    setSaving(true);

    const checklistId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimisticChecklist: KanbanBoardCardChecklist = {
      kanban_board_card_checklist_id: checklistId,
      kanban_board_card_id: localCard.kanban_board_card_id,
      kanban_board_card_checklist_name: newChecklistName.trim(),
      created_at: now,
      updated_at: now,
      items: [],
    };

    const updated = {
      ...localCard,
      checklists: [...(localCard.checklists || []), optimisticChecklist],
    };
    setLocalCard(updated);
    onUpdate(updated, boardId);
    setNewChecklistName('');
    setAddingChecklist(false);

    router.post(
      projects.kanban.cards.checklists.store.url({
        accountIndex,
        project: projectSlug,
        card: cardId,
      }),
      {
        kanban_board_card_checklist_id: checklistId,
        kanban_board_card_checklist_name:
          optimisticChecklist.kanban_board_card_checklist_name,
      },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to add checklist'),
        onFinish: () => setSaving(false),
      },
    );
  };

  const addChecklistItem = (checklistId: string) => {
    const text = newChecklistItems[checklistId]?.trim();
    if (!text) return;

    const itemId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimisticItem: KanbanBoardCardChecklistItem = {
      kanban_board_card_checklist_item_id: itemId,
      kanban_board_card_checklist_id: checklistId,
      kanban_board_card_checklist_item_name: text,
      is_completed: false,
      created_at: now,
      updated_at: now,
    };

    const updated = {
      ...localCard,
      checklists: (localCard.checklists || []).map((cl) =>
        cl.kanban_board_card_checklist_id !== checklistId
          ? cl
          : { ...cl, items: [...(cl.items || []), optimisticItem] },
      ),
    };
    setLocalCard(updated);
    onUpdate(updated, boardId);
    setNewChecklistItems((prev) => ({ ...prev, [checklistId]: '' }));

    router.post(
      projects.kanban.checklist.items.store.url({
        accountIndex,
        project: projectSlug,
        checklist: checklistId,
      }),
      {
        kanban_board_card_checklist_item_id: itemId,
        kanban_board_card_checklist_item_name: text,
      },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to add checklist item'),
      },
    );
  };

  const toggleChecklistItem = (
    checklistId: string,
    itemId: string,
    current: boolean,
  ) => {
    const updated = {
      ...localCard,
      checklists: (localCard.checklists || []).map((cl) =>
        cl.kanban_board_card_checklist_id !== checklistId
          ? cl
          : {
              ...cl,
              items: (cl.items || []).map((item) =>
                item.kanban_board_card_checklist_item_id !== itemId
                  ? item
                  : { ...item, is_completed: !current },
              ),
            },
      ),
    };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    router.patch(
      projects.kanban.checklist.items.update.url({
        accountIndex,
        project: projectSlug,
        item: itemId,
      }),
      { is_completed: !current },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to toggle checklist item'),
      },
    );
  };

  const deleteChecklistItem = (checklistId: string, itemId: string) => {
    const updated = {
      ...localCard,
      checklists: (localCard.checklists || []).map((cl) =>
        cl.kanban_board_card_checklist_id !== checklistId
          ? cl
          : {
              ...cl,
              items: (cl.items || []).filter(
                (item) => item.kanban_board_card_checklist_item_id !== itemId,
              ),
            },
      ),
    };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    router.delete(
      projects.kanban.checklist.items.destroy.url({
        accountIndex,
        project: projectSlug,
        item: itemId,
      }),
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to delete checklist item'),
      },
    );
  };

  const deleteChecklist = (checklistId: string) => {
    const updated = {
      ...localCard,
      checklists: (localCard.checklists || []).filter(
        (cl) => cl.kanban_board_card_checklist_id !== checklistId,
      ),
    };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    router.delete(
      projects.kanban.checklists.destroy.url({
        accountIndex,
        project: projectSlug,
        checklist: checklistId,
      }),
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to delete checklist'),
      },
    );
  };

  const submitComment = () => {
    if (!newComment.trim()) return;

    const commentId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimisticComment: KanbanBoardCardComment = {
      kanban_board_card_comment_id: commentId,
      kanban_board_card_id: localCard.kanban_board_card_id,
      kanban_board_card_comment_from: currentUser.id,
      kanban_board_card_comment_message: newComment.trim(),
      user: currentUser,
      created_at: now,
      updated_at: now,
    };

    const updated = {
      ...localCard,
      comments: [...(localCard.comments || []), optimisticComment],
    };
    setLocalCard(updated);
    onUpdate(updated, boardId);
    setNewComment('');

    router.post(
      projects.kanban.cards.comments.store.url({
        accountIndex,
        project: projectSlug,
        card: cardId,
      }),
      {
        kanban_board_card_comment_id: commentId,
        kanban_board_card_comment_message:
          optimisticComment.kanban_board_card_comment_message,
      },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to add comment'),
      },
    );
  };

  const deleteComment = (commentId: string) => {
    const updated = {
      ...localCard,
      comments: (localCard.comments || []).filter(
        (c) => c.kanban_board_card_comment_id !== commentId,
      ),
    };
    setLocalCard(updated);
    onUpdate(updated, boardId);

    router.delete(
      projects.kanban.comments.destroy.url({
        accountIndex,
        project: projectSlug,
        comment: commentId,
      }),
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to delete comment'),
      },
    );
  };

  const processFiles = async (files: FileList | File[]) => {
    setAttachmentError(null);
    for (const file of Array.from(files)) {
      if (isFileTooLarge(file, FILE_SIZE_LIMITS.cardAttachment)) {
        setAttachmentError(t('kanban.fileTooLarge', { name: file.name }));
        continue;
      }
      setUploadingFile(true);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        const att: LocalAttachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        await dbPut(card.kanban_board_card_id, att);
        setLocalAttachments((prev) => [...prev, att]);
      } catch (err) {
        console.error('Failed to process file', err);
        setAttachmentError(t('kanban.failedToProcessFile'));
      } finally {
        setUploadingFile(false);
      }
    }
    setAddingAttachment(false);
  };

  const deleteLocalAttachment = async (id: string) => {
    await dbDelete(id);
    setLocalAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const downloadAttachment = (att: LocalAttachment) => {
    const a = document.createElement('a');
    a.href = att.dataUrl;
    a.download = att.name;
    a.click();
  };

  const dueDate = localCard.kanban_board_card_due_date;
  // Use a memoized current time to avoid impure function calls during render
  const isDueSoon = dueDate
    ? new Date(dueDate).getTime() - new Date().getTime() < 86400000 * 2
    : false;
  const isOverdue = dueDate ? new Date(dueDate) < new Date() : false;

  return (
    <div
      className={`m-2 flex h-auto shrink-0 flex-col justify-start overflow-hidden rounded-2xl bg-dark-surface-2 transition-all duration-300 ease-out ${
        mounted ? 'w-140 opacity-100' : 'w-0 opacity-0'
      }`}
    >
      <div className="flex h-full w-140 shrink-0 flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-4 border-b-2 border-dark-secondary px-4 py-3">
          <button
            onClick={() => patchCard({ is_completed: !localCard.is_completed })}
            className={`flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 transition-all ${
              localCard.is_completed
                ? 'border-transparent bg-accent-blue text-dark-primary'
                : 'border-dark-secondary bg-dark-surface-2 hover:bg-dark-surface-3'
            }`}
          >
            {localCard.is_completed && <CheckIcon className="h-3 w-3" />}
          </button>

          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <textarea
                ref={titleRef}
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    commitTitle();
                  }
                  if (e.key === 'Escape') {
                    setTitleValue(localCard.kanban_board_card_title);
                    setEditingTitle(false);
                  }
                }}
                rows={1}
                className="w-full resize-none rounded-lg border border-dark-border-focus bg-dark-surface-2 px-2 py-1.5 text-medium leading-snug font-bold text-dark-primary focus:outline-none"
              />
            ) : (
              <h2
                className="line-clamp-2 cursor-pointer text-medium leading-snug font-bold text-dark-primary transition hover:text-dark-secondary"
                onClick={() => setEditingTitle(true)}
                title={t('kanban.clickToEditTitle')}
              >
                {localCard.kanban_board_card_title}
              </h2>
            )}
          </div>

          <button
            onClick={handleClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-dark-secondary/80 transition hover:bg-dark-surface-3 hover:text-dark-primary"
            title={t('kanban.closeEsc')}
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="scrollbar-app flex flex-1 overflow-y-auto">
          <CardDetailBody
            card={localCard}
            currentUser={currentUser}
            isDueSoon={isDueSoon}
            isOverdue={isOverdue}
            desc={{
              editing: editingDesc,
              value: descValue,
              ref: descRef,
              onEdit: () => setEditingDesc(true),
              onChange: setDescValue,
              onCommit: commitDesc,
              onDiscard: () => {
                setDescValue(localCard.kanban_board_card_description || '');
                setEditingDesc(false);
              },
            }}
            attachments={{
              local: localAttachments,
              adding: addingAttachment,
              uploading: uploadingFile,
              error: attachmentError,
              dragOver,
              fileInputRef,
              zoneRef: attachmentZoneRef,
              onSetDragOver: setDragOver,
              onProcess: processFiles,
              onDownload: downloadAttachment,
              onDelete: deleteLocalAttachment,
              onDismissError: () => setAttachmentError(null),
              onCancel: () => setAddingAttachment(false),
            }}
            checklists={{
              adding: addingChecklist,
              newName: newChecklistName,
              saving,
              newItems: newChecklistItems,
              onAdd: addChecklist,
              onNameChange: setNewChecklistName,
              onCancel: () => {
                setAddingChecklist(false);
                setNewChecklistName('');
              },
              onItemChange: (clId, v) =>
                setNewChecklistItems((prev) => ({ ...prev, [clId]: v })),
              onAddItem: addChecklistItem,
              onToggleItem: toggleChecklistItem,
              onDeleteItem: deleteChecklistItem,
              onDeleteChecklist: deleteChecklist,
            }}
            comments={{
              newComment,
              onChange: setNewComment,
              onSubmit: submitComment,
              onDelete: deleteComment,
              onDiscard: () => setNewComment(''),
            }}
          />

          <CardDetailSidebar
            card={localCard}
            cardLabels={cardLabels}
            projectUsers={projectUsers}
            addingChecklist={addingChecklist}
            addingAttachment={addingAttachment}
            onToggleChecklist={setAddingChecklist}
            onToggleAttachment={setAddingAttachment}
            onUpdateDates={updateDates}
            labels={{
              popoverOpen: labelPopoverOpen,
              setPopoverOpen: setLabelPopoverOpen,
              creatingLabel,
              setCreatingLabel,
              newName: newLabelName,
              setNewName: setNewLabelName,
              newColor: newLabelColor,
              setNewColor: setNewLabelColor,
              saving: savingLabel,
              onCreate: createLabel,
              onDelete: deleteLabel,
              onToggle: toggleLabel,
            }}
            onToggleMember={toggleMember}
          />
        </div>
      </div>
    </div>
  );
};

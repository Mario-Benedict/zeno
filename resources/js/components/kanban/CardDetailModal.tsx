import { router } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import projects from '@/routes/projects';
import type {
    KanbanBoardCard,
    CardLabel,
    KanbanUser,
    KanbanProject,
    KanbanBoardCardDetail,
    KanbanBoardCardDate,
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
    const [detail, setDetail] = useState<KanbanBoardCardDetail>(
        card.detail || {
            kanban_board_card_detail_id: '',
            kanban_board_card_id: card.kanban_board_card_id,
            kanban_board_card_title: '',
            kanban_board_card_description: null,
            is_completed: false,
            labels: [],
            members: [],
            checklists: [],
            attachments: [],
            comments: [],
            created_at: '',
            updated_at: '',
        }
    );

    const [mounted, setMounted] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(detail.kanban_board_card_title);
    const [editingDesc, setEditingDesc] = useState(false);
    const [descValue, setDescValue] = useState(detail.kanban_board_card_description || '');
    const [newComment, setNewComment] = useState('');
    const [addingChecklist, setAddingChecklist] = useState(false);
    const [newChecklistName, setNewChecklistName] = useState('');
    const [newChecklistItems, setNewChecklistItems] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    const [localAttachments, setLocalAttachments] = useState<LocalAttachment[]>([]);
    const [addingAttachment, setAddingAttachment] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
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
        setMounted(false); setTimeout(onClose, 300);
    }, [onClose]);

    useEffect(() => {
        requestAnimationFrame(() => setMounted(true));
    }, []);
    useEffect(() => {
        if (editingTitle && titleRef.current) {
            titleRef.current.focus(); titleRef.current.selectionStart = titleRef.current.value.length;
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
        if (card.detail) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDescValue(card.detail.kanban_board_card_description || '');
            setEditingTitle(false);
            setEditingDesc(false);
            setNewComment('');
            setAddingChecklist(false);
            setNewChecklistName('');
            setNewLabelName('');
            setNewLabelColor(null);
            setCreatingLabel(false);
            setLabelPopoverOpen(false);
        }
    }, [card.kanban_board_card_id, card.detail]);

    useEffect(() => {
        dbGetByCard(card.kanban_board_card_id).then(setLocalAttachments).catch(console.error);
    }, [card.kanban_board_card_id]);

    useEffect(() => {
        if (addingAttachment && attachmentZoneRef.current) {
            attachmentZoneRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [addingAttachment]);

    type DetailScalarPatch = {
        kanban_board_card_title?: string;
        kanban_board_card_description?: string | null;
        is_completed?: boolean;
    };

    const patchDetail = (patch: DetailScalarPatch) => {
        const updated = { ...detail, ...patch };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        router.patch(
            projects.kanban.cards.detail.update.url({ project: projectSlug, card: cardId }),
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
        if (trimmed && trimmed !== detail.kanban_board_card_title) {
            patchDetail({ kanban_board_card_title: trimmed });
        } else {
            setTitleValue(detail.kanban_board_card_title);
        }
    };

    const commitDesc = () => {
        setEditingDesc(false);
        patchDetail({ kanban_board_card_description: descValue || null });
    };

    const createLabel = () => {
        if (!newLabelName.trim() || !newLabelColor) return;
        setSavingLabel(true);

        // Pre-generate the label id so optimistic UI matches the server
        const labelId = crypto.randomUUID();
        const now = new Date().toISOString();

        const optimisticLabel: CardLabel = {
            card_label_id:           labelId,
            card_label_project_id:   project.project_id,
            card_label_category_id:  '',
            card_label_color_id:     '',
            card_label_name:         newLabelName.trim(),
            color: {
                card_label_color_id:  '',
                card_label_color_hex: newLabelColor,
                created_at:           now,
                updated_at:           now,
            },
            created_at: now,
            updated_at: now,
        };

        const updatedLabels = [...(detail.labels || []), optimisticLabel];
        const updatedDetail = { ...detail, labels: updatedLabels };
        setDetail(updatedDetail);
        onUpdate({ ...card, detail: updatedDetail }, boardId);
        setNewLabelName('');
        setNewLabelColor(null);
        setCreatingLabel(false);

        router.post(
            projects.kanban.cards.labels.create.url({ project: projectSlug, card: cardId }),
            {
                card_label_id:        labelId,
                card_label_name:      optimisticLabel.card_label_name,
                card_label_color_hex: newLabelColor,
            },
            {
                ...inertiaWriteOptions,
                onSuccess: () => router.reload({ only: ['cardLabels'] }),
                onError: (errors) => {
                    console.error('Create label failed:', errors);
                    alert('Failed to create label.');
                },
                onFinish: () => setSavingLabel(false),
            },
        );
    };

    const deleteLabel = (labelId: string) => {
        const isActive = (detail.labels || []).some((l) => l.card_label_id === labelId);
        if (isActive) {
            const label = cardLabels.find((l) => l.card_label_id === labelId);
            if (label) toggleLabel(label);
        }

        router.delete(
            projects.kanban.cards.labels.delete.url({
                project: projectSlug,
                card:    cardId,
                label:   labelId,
            }),
            {
                ...inertiaWriteOptions,
                onSuccess: () => router.reload({ only: ['cardLabels'] }),
                onError: () => console.error('Failed to delete label'),
            },
        );
    };

    const toggleLabel = (label: CardLabel) => {
        const currentLabels = detail.labels || [];
        const hasLabel = currentLabels.some((l) => l.card_label_id === label.card_label_id);
        const updatedLabels = hasLabel
            ? currentLabels.filter((l) => l.card_label_id !== label.card_label_id)
            : [...currentLabels, label];
        const updated = { ...detail, labels: updatedLabels };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        if (hasLabel) {
            router.delete(
                projects.kanban.cards.labels.destroy.url({
                    project: projectSlug,
                    card:    cardId,
                    label:   label.card_label_id,
                }),
                {
                    ...inertiaWriteOptions,
                    onError: () => console.error('Failed to detach label'),
                },
            );
        } else {
            router.post(
                projects.kanban.cards.labels.store.url({ project: projectSlug, card: cardId }),
                { label_id: label.card_label_id },
                {
                    ...inertiaWriteOptions,
                    onError: () => console.error('Failed to attach label'),
                },
            );
        }
    };

    const toggleMember = (user: KanbanUser) => {
        const currentMembers = detail.members || [];
        const hasMember = currentMembers.some((m) => m.id === user.id);
        const updatedMembers = hasMember
            ? currentMembers.filter((m) => m.id !== user.id)
            : [...currentMembers, user];
        const updated = { ...detail, members: updatedMembers };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        if (hasMember) {
            router.delete(
                projects.kanban.cards.members.destroy.url({
                    project: projectSlug,
                    card:    cardId,
                    user:    user.id,
                }),
                {
                    ...inertiaWriteOptions,
                    onError: () => console.error('Failed to remove member'),
                },
            );
        } else {
            router.post(
                projects.kanban.cards.members.store.url({ project: projectSlug, card: cardId }),
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
        value: string
    ) => {
        const updatedDates = {
            ...(detail.dates || {
                kanban_board_card_date_id: '',
                kanban_board_card_detail_id: detail.kanban_board_card_detail_id,
                kanban_board_card_start_date: null,
                kanban_board_card_due_date: null,
                created_at: '',
                updated_at: '',
            }),
            [field]: value || null,
        } as KanbanBoardCardDate;
        const updated = { ...detail, dates: updatedDates };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        router.patch(
            projects.kanban.cards.dates.update.url({ project: projectSlug, card: cardId }),
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
            kanban_board_card_checklist_id:        checklistId,
            kanban_board_card_checklist_detail_id: detail.kanban_board_card_detail_id,
            kanban_board_card_checklist_name:      newChecklistName.trim(),
            created_at:                            now,
            updated_at:                            now,
            items:                                 [],
        };

        const updated = { ...detail, checklists: [...(detail.checklists || []), optimisticChecklist] };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        setNewChecklistName('');
        setAddingChecklist(false);

        router.post(
            projects.kanban.cards.checklists.store.url({ project: projectSlug, card: cardId }),
            {
                kanban_board_card_checklist_id:   checklistId,
                kanban_board_card_checklist_name: optimisticChecklist.kanban_board_card_checklist_name,
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
            kanban_board_card_checklist_item_id:   itemId,
            kanban_board_card_checklist_id:        checklistId,
            kanban_board_card_checklist_item_name: text,
            is_completed:                          false,
            created_at:                            now,
            updated_at:                            now,
        };

        const updated = {
            ...detail,
            checklists: (detail.checklists || []).map((cl) =>
                cl.kanban_board_card_checklist_id !== checklistId
                    ? cl
                    : { ...cl, items: [...(cl.items || []), optimisticItem] }
            ),
        };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        setNewChecklistItems((prev) => ({ ...prev, [checklistId]: '' }));

        router.post(
            projects.kanban.checklist.items.store.url({
                project:   projectSlug,
                checklist: checklistId,
            }),
            {
                kanban_board_card_checklist_item_id:   itemId,
                kanban_board_card_checklist_item_name: text,
            },
            {
                ...inertiaWriteOptions,
                onError: () => console.error('Failed to add checklist item'),
            },
        );
    };

    const toggleChecklistItem = (checklistId: string, itemId: string, current: boolean) => {
        const updated = {
            ...detail,
            checklists: (detail.checklists || []).map((cl) =>
                cl.kanban_board_card_checklist_id !== checklistId
                    ? cl
                    : {
                        ...cl,
                        items: (cl.items || []).map((item) =>
                            item.kanban_board_card_checklist_item_id !== itemId
                                ? item
                                : { ...item, is_completed: !current }
                        ),
                      }
            ),
        };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        router.patch(
            projects.kanban.checklist.items.update.url({ project: projectSlug, item: itemId }),
            { is_completed: !current },
            {
                ...inertiaWriteOptions,
                onError: () => console.error('Failed to toggle checklist item'),
            },
        );
    };

    const deleteChecklistItem = (checklistId: string, itemId: string) => {
        const updated = {
            ...detail,
            checklists: (detail.checklists || []).map((cl) =>
                cl.kanban_board_card_checklist_id !== checklistId
                    ? cl
                    : { ...cl, items: (cl.items || []).filter((item) => item.kanban_board_card_checklist_item_id !== itemId) }
            ),
        };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        router.delete(
            projects.kanban.checklist.items.destroy.url({ project: projectSlug, item: itemId }),
            {
                ...inertiaWriteOptions,
                onError: () => console.error('Failed to delete checklist item'),
            },
        );
    };

    const deleteChecklist = (checklistId: string) => {
        const updated = {
            ...detail,
            checklists: (detail.checklists || []).filter(
                (cl) => cl.kanban_board_card_checklist_id !== checklistId
            ),
        };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        router.delete(
            projects.kanban.checklists.destroy.url({
                project:   projectSlug,
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
            kanban_board_card_comment_id:       commentId,
            kanban_board_card_detail_id:        detail.kanban_board_card_detail_id,
            kanban_board_card_comment_from:     currentUser.id,
            kanban_board_card_comment_message:  newComment.trim(),
            user:                               currentUser,
            created_at:                         now,
            updated_at:                         now,
        };

        const updated = { ...detail, comments: [...(detail.comments || []), optimisticComment] };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        setNewComment('');

        router.post(
            projects.kanban.cards.comments.store.url({ project: projectSlug, card: cardId }),
            {
                kanban_board_card_comment_id:      commentId,
                kanban_board_card_comment_message: optimisticComment.kanban_board_card_comment_message,
            },
            {
                ...inertiaWriteOptions,
                onError: () => console.error('Failed to add comment'),
            },
        );
    };

    const deleteComment = (commentId: string) => {
        const updated = {
            ...detail,
            comments: (detail.comments || []).filter(
                (c) => c.kanban_board_card_comment_id !== commentId
            ),
        };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);

        router.delete(
            projects.kanban.comments.destroy.url({ project: projectSlug, comment: commentId }),
            {
                ...inertiaWriteOptions,
                onError: () => console.error('Failed to delete comment'),
            },
        );
    };

    const processFiles = async (files: FileList | File[]) => {
        for (const file of Array.from(files)) {
            if (file.size > 20 * 1024 * 1024) {
            alert(`${file.name} is too large. Max 20 MB.`); continue;
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

    const dueDate = detail.dates?.kanban_board_card_due_date;
    // Use a memoized current time to avoid impure function calls during render
    const isDueSoon = dueDate ? new Date(dueDate).getTime() - new Date().getTime() < 86400000 * 2 : false;
    const isOverdue = dueDate ? new Date(dueDate) < new Date() : false;

    if (!card.detail) return null;

    return (
        <div
            className={`justify-start shrink-0 m-2 rounded-2xl bg-dark-surface-2 flex flex-col h-auto transition-all duration-300 ease-out overflow-hidden ${
                mounted ? 'w-140 opacity-100' : 'w-0 opacity-0'
            }`}
        >
            <div className="w-140 flex flex-col h-full shrink-0">
                {/* Header */}
                <div className="flex items-center gap-4 px-4 py-3 border-b-2 border-dark-secondary shrink-0">
                    <button
                        onClick={() => patchDetail({ is_completed: !detail.is_completed })}
                        className={`min-w-6 min-h-6 flex items-center justify-center rounded-full transition-all border-2 ${
                            detail.is_completed
                                ? 'bg-accent-blue border-transparent text-dark-primary'
                                : 'bg-dark-surface-2 border-dark-secondary hover:bg-dark-surface-3'
                        }`}
                    >
                        {detail.is_completed && <CheckIcon className="w-3 h-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                        {editingTitle ? (
                            <textarea
                                ref={titleRef}
                                value={titleValue}
                                onChange={(e) => setTitleValue(e.target.value)}
                                onBlur={commitTitle}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault(); commitTitle();
                                    }
                                    if (e.key === 'Escape') {
                                        setTitleValue(detail.kanban_board_card_title); setEditingTitle(false);
                                    }
                                }}
                                rows={1}
                                className="w-full bg-dark-surface-2 border border-dark-border-focus rounded-lg px-2 py-1.5 text-medium font-bold text-dark-primary focus:outline-none resize-none leading-snug"
                            />
                        ) : (
                            <h2
                                className="text-medium font-bold text-dark-primary cursor-pointer hover:text-dark-secondary transition leading-snug line-clamp-2"
                                onClick={() => setEditingTitle(true)}
                                title="Click to edit title"
                            >
                                {detail.kanban_board_card_title}
                            </h2>
                        )}
                    </div>

                    <button
                        onClick={handleClose}
                        className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition"
                        title="Close (Esc)"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-y-auto">
                    <CardDetailBody
                        detail={detail}
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
                            setDescValue(detail.kanban_board_card_description || ''); setEditingDesc(false);
                            },
                        }}
                        attachments={{
                            local: localAttachments,
                            adding: addingAttachment,
                            uploading: uploadingFile,
                            dragOver,
                            fileInputRef,
                            zoneRef: attachmentZoneRef,
                            onSetDragOver: setDragOver,
                            onProcess: processFiles,
                            onDownload: downloadAttachment,
                            onDelete: deleteLocalAttachment,
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
                            setAddingChecklist(false); setNewChecklistName('');
                            },
                            onItemChange: (clId, v) => setNewChecklistItems((prev) => ({ ...prev, [clId]: v })),
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
                        detail={detail}
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

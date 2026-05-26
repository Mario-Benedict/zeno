import { router } from '@inertiajs/react';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { LocalAttachment } from '@/utils/attachmentStorage';
import { dbGetByCard, dbPut, dbDelete } from '@/utils/attachmentStorage';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';
import { CardDetailBody } from './CardDetailBody';
import { CardDetailSidebar } from './CardDetailSidebar';
import type {
    KanbanBoardCard,
    CardLabel,
    User,
    KanbanBoardCardDetail,
    KanbanBoardCardDate,
    KanbanBoardCardChecklist,
    KanbanBoardCardChecklistItem,
    KanbanBoardCardComment,
} from './types';

interface CardDetailPanelProps {
    card: KanbanBoardCard;
    boardId: string;
    cardLabels: CardLabel[];
    projectUsers: User[];
    currentUser: User;
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

const CardDetailModal = ({
    card,
    boardId,
    cardLabels,
    projectUsers,
    currentUser,
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

    const patchDetail = async (patch: Partial<KanbanBoardCardDetail>) => {
        const updated = { ...detail, ...patch };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        try {
            await fetch(`/cards/${card.kanban_board_card_id}/detail`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify(patch),
            });
        } catch (err) {
            console.error('Failed to save card detail', err);
        }
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

    const createLabel = async () => {
        if (!newLabelName.trim() || !newLabelColor) return;
        setSavingLabel(true);
        try {
            const res = await fetch(`/cards/${card.kanban_board_card_id}/labels/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ card_label_name: newLabelName.trim(), card_label_color_hex: newLabelColor }),
            });
            if (!res.ok) throw new Error(`Failed to create label: ${await res.text()}`);
            const { label: newLabel } = await res.json() as { label: CardLabel };
            setNewLabelName('');
            setNewLabelColor(null);
            setCreatingLabel(false);
            const updatedLabels = [...(detail.labels || []), newLabel];
            setDetail({ ...detail, labels: updatedLabels });
            onUpdate({ ...card, detail: { ...detail, labels: updatedLabels } }, boardId);
            router.reload({ only: ['cardLabels'] });
        } catch (err) {
            console.error('Create label failed:', err);
            alert(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setSavingLabel(false);
        }
    };

    const deleteLabel = async (labelId: string) => {
        const isActive = (detail.labels || []).some((l) => l.card_label_id === labelId);
        if (isActive) {
            const label = cardLabels.find((l) => l.card_label_id === labelId);
            if (label) await toggleLabel(label);
        }
        try {
            const res = await fetch(`/cards/${card.kanban_board_card_id}/labels/${labelId}/global`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (res.ok) router.reload({ only: ['cardLabels'] });
        } catch (err) {
            console.error('Failed to delete label', err);
        }
    };

    const toggleLabel = async (label: CardLabel) => {
        const currentLabels = detail.labels || [];
        const hasLabel = currentLabels.some((l) => l.card_label_id === label.card_label_id);
        const updatedLabels = hasLabel
            ? currentLabels.filter((l) => l.card_label_id !== label.card_label_id)
            : [...currentLabels, label];
        const updated = { ...detail, labels: updatedLabels };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        try {
            if (hasLabel) {
                await fetch(`/cards/${card.kanban_board_card_id}/labels/${label.card_label_id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
            } else {
                await fetch(`/cards/${card.kanban_board_card_id}/labels`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({ label_id: label.card_label_id }),
                });
            }
        } catch (err) {
            console.error('Failed to toggle label', err);
        }
    };

    const toggleMember = async (user: User) => {
        const currentMembers = detail.members || [];
        const hasMember = currentMembers.some((m) => m.id === user.id);
        const updatedMembers = hasMember
            ? currentMembers.filter((m) => m.id !== user.id)
            : [...currentMembers, user];
        const updated = { ...detail, members: updatedMembers };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        try {
            if (hasMember) {
                await fetch(`/cards/${card.kanban_board_card_id}/members/${user.id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
            } else {
                await fetch(`/cards/${card.kanban_board_card_id}/members`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    body: JSON.stringify({ user_id: user.id }),
                });
            }
        } catch (err) {
            console.error('Failed to toggle member', err);
        }
    };

    const updateDates = async (
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
        try {
            await fetch(`/cards/${card.kanban_board_card_id}/dates`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ [field]: value || null }),
            });
        } catch (err) {
            console.error('Failed to update dates', err);
        }
    };

    const addChecklist = async () => {
        if (!newChecklistName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/cards/${card.kanban_board_card_id}/checklists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ kanban_board_card_checklist_name: newChecklistName.trim() }),
            });
            const data = await res.json();
            const created: KanbanBoardCardChecklist = data.checklist || {
                kanban_board_card_checklist_id: Math.random().toString(36).slice(2, 9),
                kanban_board_card_checklist_detail_id: detail.kanban_board_card_detail_id,
                kanban_board_card_checklist_name: newChecklistName.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                items: [],
            };
            const updated = { ...detail, checklists: [...(detail.checklists || []), created] };
            setDetail(updated);
            onUpdate({ ...card, detail: updated }, boardId);
            setNewChecklistName('');
            setAddingChecklist(false);
        } catch (err) {
            console.error('Failed to add checklist', err);
        } finally {
            setSaving(false);
        }
    };

    const addChecklistItem = async (checklistId: string) => {
        const text = newChecklistItems[checklistId]?.trim();
        if (!text) return;
        try {
            const res = await fetch(`/checklists/${checklistId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ kanban_board_card_checklist_item_name: text }),
            });
            const data = await res.json();
            const created: KanbanBoardCardChecklistItem = data.item || {
                kanban_board_card_checklist_item_id: Math.random().toString(36).slice(2, 9),
                kanban_board_card_checklist_id: checklistId,
                kanban_board_card_checklist_item_name: text,
                is_completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const updated = {
                ...detail,
                checklists: (detail.checklists || []).map((cl) =>
                    cl.kanban_board_card_checklist_id !== checklistId
                        ? cl
                        : { ...cl, items: [...(cl.items || []), created] }
                ),
            };
            setDetail(updated);
            onUpdate({ ...card, detail: updated }, boardId);
            setNewChecklistItems((prev) => ({ ...prev, [checklistId]: '' }));
        } catch (err) {
            console.error('Failed to add checklist item', err);
        }
    };

    const toggleChecklistItem = async (checklistId: string, itemId: string, current: boolean) => {
        const updated = {
            ...detail,
            checklists: (detail.checklists || []).map((cl) =>
                cl.kanban_board_card_checklist_id !== checklistId
                    ? cl
                    : { ...cl, items: (cl.items || []).map((item) => item.kanban_board_card_checklist_item_id !== itemId ? item : { ...item, is_completed: !current }) }
            ),
        };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        try {
            await fetch(`/checklist-items/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ is_completed: !current }),
            });
        } catch (err) {
            console.error('Failed to toggle checklist item', err);
        }
    };

    const deleteChecklistItem = async (checklistId: string, itemId: string) => {
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
        try {
            await fetch(`/checklist-items/${itemId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
        } catch (err) {
            console.error('Failed to delete checklist item', err);
        }
    };

    const deleteChecklist = async (checklistId: string) => {
        const updated = { ...detail, checklists: (detail.checklists || []).filter((cl) => cl.kanban_board_card_checklist_id !== checklistId) };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        try {
            await fetch(`/checklists/${checklistId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
        } catch (err) {
            console.error('Failed to delete checklist', err);
        }
    };

    const submitComment = async () => {
        if (!newComment.trim()) return;
        try {
            const res = await fetch(`/cards/${card.kanban_board_card_id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ kanban_board_card_comment_message: newComment.trim() }),
            });
            const data = await res.json();
            const created: KanbanBoardCardComment = data.comment || {
                kanban_board_card_comment_id: Math.random().toString(36).slice(2, 9),
                kanban_board_card_detail_id: detail.kanban_board_card_detail_id,
                kanban_board_card_comment_from: currentUser.id,
                kanban_board_card_comment_message: newComment.trim(),
                user: currentUser,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            const updated = { ...detail, comments: [...(detail.comments || []), created] };
            setDetail(updated);
            onUpdate({ ...card, detail: updated }, boardId);
            setNewComment('');
        } catch (err) {
            console.error('Failed to add comment', err);
        }
    };

    const deleteComment = async (commentId: string) => {
        const updated = { ...detail, comments: (detail.comments || []).filter((c) => c.kanban_board_card_comment_id !== commentId) };
        setDetail(updated);
        onUpdate({ ...card, detail: updated }, boardId);
        try {
            await fetch(`/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
        } catch (err) {
            console.error('Failed to delete comment', err);
        }
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

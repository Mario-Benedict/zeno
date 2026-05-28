import { DatePicker } from '@/components/shared/DatePicker';
import type { KanbanBoardCardDetail, CardLabel, KanbanUser } from '@/types/kanban';
import { generateInitials, MEMBER_COLORS } from '@/utils/kanban';
import CheckIcon from '@public/icons/small/check.svg';
import ChecklistIcon from '@public/icons/small/checkbox.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';
import { SidebarButton } from './CardDetailComponents';
import { LabelPopover } from './LabelPopover';

interface LabelState {
    popoverOpen: boolean;
    setPopoverOpen: (v: boolean) => void;
    creatingLabel: boolean;
    setCreatingLabel: (v: boolean) => void;
    newName: string;
    setNewName: (v: string) => void;
    newColor: string | null;
    setNewColor: (v: string | null) => void;
    saving: boolean;
    onCreate: () => void;
    onDelete: (id: string) => void;
    onToggle: (label: CardLabel) => void;
}

interface CardDetailSidebarProps {
    detail: KanbanBoardCardDetail;
    cardLabels: CardLabel[];
    projectUsers: KanbanUser[];
    addingChecklist: boolean;
    addingAttachment: boolean;
    onToggleChecklist: (v: boolean) => void;
    onToggleAttachment: (v: boolean) => void;
    onUpdateDates: (field: 'kanban_board_card_start_date' | 'kanban_board_card_due_date', value: string) => void;
    labels: LabelState;
    onToggleMember: (user: KanbanUser) => void;
}

export const CardDetailSidebar = ({
    detail,
    cardLabels,
    projectUsers,
    addingChecklist,
    addingAttachment,
    onToggleChecklist,
    onToggleAttachment,
    onUpdateDates,
    labels,
    onToggleMember,
}: CardDetailSidebarProps) => {
    return (
        <div className="w-52 shrink-0 border-l border-dark-border px-4 py-4 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Dates */}
            <div>
                <p className="text-xsmall font-semibold text-white/20 uppercase tracking-wider mb-2">Dates</p>
                <div className="space-y-2">
                    <DatePicker
                        label="Start date"
                        value={detail.dates?.kanban_board_card_start_date?.slice(0, 10) || null}
                        onChange={(v) => onUpdateDates('kanban_board_card_start_date', v)}
                        onClear={() => onUpdateDates('kanban_board_card_start_date', '')}
                        placeholder="Set start date"
                    />
                    <DatePicker
                        label="Due date"
                        value={detail.dates?.kanban_board_card_due_date?.slice(0, 10) || null}
                        onChange={(v) => onUpdateDates('kanban_board_card_due_date', v)}
                        onClear={() => onUpdateDates('kanban_board_card_due_date', '')}
                        placeholder="Set due date"
                        highlightOverdue
                    />
                </div>
            </div>

            <div className="border-t border-dark-border" />

            {/* Add to card */}
            <div>
                <p className="text-xsmall font-semibold text-white/20 uppercase tracking-wider mb-2">Add to card</p>
                <div className="space-y-1.5">
                    <SidebarButton
                        icon={<ChecklistIcon className="w-3.5 h-3.5" />}
                        label="Checklist"
                        onClick={() => {
                            onToggleChecklist(true); onToggleAttachment(false);
                        }}
                        active={addingChecklist}
                    />
                    <SidebarButton
                        icon={<PaperclipIcon className="w-3.5 h-3.5" />}
                        label="Attachment"
                        onClick={() => {
                            onToggleAttachment(true); onToggleChecklist(false);
                        }}
                        active={addingAttachment}
                    />
                </div>
            </div>

            <div className="border-t border-dark-border" />

            {/* Labels */}
            <div>
                <p className="text-xsmall font-semibold text-white/20 uppercase tracking-wider mb-2">Labels</p>

                <div className="space-y-1 mb-2">
                    {cardLabels
                        .filter((label) => (detail.labels || []).some((l) => l.card_label_id === label.card_label_id))
                        .map((label) => {
                            const hex = label.color?.card_label_color_hex || '#7B7B7B';

                            return (
                                <div
                                    key={label.card_label_id}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                                    style={{ backgroundColor: hex + '20', border: `1px solid ${hex}45` }}
                                >
                                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: hex }} />
                                    <span className="text-xsmall truncate flex-1" style={{ color: hex }}>
                                        {label.card_label_name}
                                    </span>
                                    <button
                                        onClick={() => labels.onToggle(label)}
                                        className="w-4 h-4 flex items-center justify-center rounded opacity-60 hover:opacity-100 transition"
                                        style={{ color: hex }}
                                        title="Remove from card"
                                    >
                                        <CheckIcon className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            );
                        })}
                </div>

                <div className="relative">
                    <button
                        onClick={() => labels.setPopoverOpen(!labels.popoverOpen)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-surface-2 hover:bg-dark-surface-3 border border-dark-border text-xsmall text-white/40 hover:text-white/60 transition"
                    >
                        <PaperclipIcon className="w-3.5 h-3.5" />
                        <span>Edit labels</span>
                    </button>

                    {labels.popoverOpen && (
                        <LabelPopover
                            cardLabels={cardLabels}
                            activeLabels={detail.labels || []}
                            onToggle={labels.onToggle}
                            onDelete={labels.onDelete}
                            onClose={() => {
                            labels.setPopoverOpen(false); labels.setCreatingLabel(false);
                            }}
                            creatingLabel={labels.creatingLabel}
                            setCreatingLabel={labels.setCreatingLabel}
                            newName={labels.newName}
                            setNewName={labels.setNewName}
                            newColor={labels.newColor}
                            setNewColor={labels.setNewColor}
                            saving={labels.saving}
                            onCreate={labels.onCreate}
                        />
                    )}
                </div>
            </div>

            <div className="border-t border-dark-border" />

            {/* Members */}
            <div>
                <p className="text-xsmall font-semibold text-white/20 uppercase tracking-wider mb-2">Members</p>
                <div className="space-y-1">
                    {projectUsers?.map((user, i) => {
                        const isMember = (detail.members || []).some((m) => m.id === user.id);

                        return (
                            <button
                                key={user.id}
                                onClick={() => onToggleMember(user)}
                                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-left ${
                                    isMember
                                        ? 'bg-white/5 border border-white/10'
                                        : 'hover:bg-white/4 border border-transparent'
                                }`}
                            >
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xsmall font-bold text-white shrink-0"
                                    style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                                >
                                    {generateInitials(user.name)}
                                </div>
                                <span className="text-xsmall text-white/50 truncate flex-1">{user.name}</span>
                                {isMember && <CheckIcon className="w-3 h-3 text-accent-blue shrink-0" />}
                            </button>
                        );
                    })}
                    {(!projectUsers || projectUsers.length === 0) && (
                        <p className="text-xsmall text-white/30 italic px-2">No members in this project.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

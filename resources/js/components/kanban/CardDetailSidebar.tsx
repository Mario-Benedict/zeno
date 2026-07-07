import { DatePicker } from '@/components/shared/DatePicker';
import { TimePicker } from '@/components/shared/TimePicker';
import type { KanbanBoardCard, CardLabel, KanbanUser } from '@/types/kanban';
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
  card: KanbanBoardCard;
  cardLabels: CardLabel[];
  projectUsers: KanbanUser[];
  addingChecklist: boolean;
  addingAttachment: boolean;
  onToggleChecklist: (v: boolean) => void;
  onToggleAttachment: (v: boolean) => void;
  onUpdateDates: (
    field: 'kanban_board_card_start_date' | 'kanban_board_card_due_date',
    value: string,
  ) => void;
  labels: LabelState;
  onToggleMember: (user: KanbanUser) => void;
}

export const CardDetailSidebar = ({
  card,
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
  const startDt = card.kanban_board_card_start_date;
  const dueDt = card.kanban_board_card_due_date;

  // Dates are stored as timestamps: the picker edits the calendar day and the
  // time input edits the wall-clock time, recombined into one datetime string.
  const datePart = (dt: string | null) => (dt ? dt.slice(0, 10) : null);
  const timePart = (dt: string | null) => (dt ? dt.slice(11, 16) : '');
  const combine = (date: string | null, time: string) =>
    date ? `${date}T${time || '00:00'}` : '';

  return (
    <div className="scrollbar-app w-52 shrink-0 space-y-4 overflow-y-auto border-l border-dark-border px-4 py-4">
      {/* Dates */}
      <div>
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-white/20 uppercase">
          Dates
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <DatePicker
              label="Start date"
              value={datePart(startDt)}
              onChange={(v) =>
                onUpdateDates(
                  'kanban_board_card_start_date',
                  combine(v, timePart(startDt)),
                )
              }
              onClear={() => onUpdateDates('kanban_board_card_start_date', '')}
              placeholder="Set start date"
            />
            <TimePicker
              ariaLabel="Start time"
              value={timePart(startDt) || null}
              disabled={!startDt}
              onChange={(t) =>
                onUpdateDates(
                  'kanban_board_card_start_date',
                  combine(datePart(startDt), t),
                )
              }
            />
          </div>
          <div className="space-y-1.5">
            <DatePicker
              label="Due date"
              value={datePart(dueDt)}
              onChange={(v) =>
                onUpdateDates(
                  'kanban_board_card_due_date',
                  combine(v, timePart(dueDt)),
                )
              }
              onClear={() => onUpdateDates('kanban_board_card_due_date', '')}
              placeholder="Set due date"
              highlightOverdue
            />
            <TimePicker
              ariaLabel="Due time"
              value={timePart(dueDt) || null}
              disabled={!dueDt}
              onChange={(t) =>
                onUpdateDates(
                  'kanban_board_card_due_date',
                  combine(datePart(dueDt), t),
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="border-t border-dark-border" />

      {/* Add to card */}
      <div>
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-white/20 uppercase">
          Add to card
        </p>
        <div className="space-y-1.5">
          <SidebarButton
            icon={<ChecklistIcon className="h-3.5 w-3.5" />}
            label="Checklist"
            onClick={() => {
              onToggleChecklist(true);
              onToggleAttachment(false);
            }}
            active={addingChecklist}
          />
          <SidebarButton
            icon={<PaperclipIcon className="h-3.5 w-3.5" />}
            label="Attachment"
            onClick={() => {
              onToggleAttachment(true);
              onToggleChecklist(false);
            }}
            active={addingAttachment}
          />
        </div>
      </div>

      <div className="border-t border-dark-border" />

      {/* Labels */}
      <div>
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-white/20 uppercase">
          Labels
        </p>

        <div className="mb-2 space-y-1">
          {cardLabels
            .filter((label) =>
              (card.labels || []).some(
                (l) => l.card_label_id === label.card_label_id,
              ),
            )
            .map((label) => {
              const hex = label.card_label_color_hex || '#7B7B7B';

              return (
                <div
                  key={label.card_label_id}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
                  style={{
                    backgroundColor: hex + '20',
                    border: `1px solid ${hex}45`,
                  }}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: hex }}
                  />
                  <span
                    className="flex-1 truncate text-xsmall"
                    style={{ color: hex }}
                  >
                    {label.card_label_name}
                  </span>
                  <button
                    onClick={() => labels.onToggle(label)}
                    className="flex h-4 w-4 items-center justify-center rounded opacity-60 transition hover:opacity-100"
                    style={{ color: hex }}
                    title="Remove from card"
                  >
                    <CheckIcon className="h-2.5 w-2.5" />
                  </button>
                </div>
              );
            })}
        </div>

        <div className="relative">
          <button
            onClick={() => labels.setPopoverOpen(!labels.popoverOpen)}
            className="flex w-full items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-2 px-3 py-1.5 text-xsmall text-white/40 transition hover:bg-dark-surface-3 hover:text-white/60"
          >
            <PaperclipIcon className="h-3.5 w-3.5" />
            <span>Edit labels</span>
          </button>

          {labels.popoverOpen && (
            <LabelPopover
              cardLabels={cardLabels}
              activeLabels={card.labels || []}
              onToggle={labels.onToggle}
              onDelete={labels.onDelete}
              onClose={() => {
                labels.setPopoverOpen(false);
                labels.setCreatingLabel(false);
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
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-white/20 uppercase">
          Members
        </p>
        <div className="space-y-1">
          {projectUsers?.map((user, i) => {
            const isMember = (card.members || []).some((m) => m.id === user.id);

            return (
              <button
                key={user.id}
                onClick={() => onToggleMember(user)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                  isMember
                    ? 'border border-white/10 bg-white/5'
                    : 'border border-transparent hover:bg-white/4'
                }`}
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xsmall font-bold text-white"
                  style={{
                    backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length],
                  }}
                >
                  {generateInitials(user.name)}
                </div>
                <span className="flex-1 truncate text-xsmall text-white/50">
                  {user.name}
                </span>
                {isMember && (
                  <CheckIcon className="h-3 w-3 shrink-0 text-accent-blue" />
                )}
              </button>
            );
          })}
          {(!projectUsers || projectUsers.length === 0) && (
            <p className="px-2 text-xsmall text-white/30 italic">
              No members in this project.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

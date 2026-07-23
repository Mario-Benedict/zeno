import { useState } from 'react';
import { DatePicker } from '@/components/shared/DatePicker';
import { TimePicker } from '@/components/shared/TimePicker';
import { useTranslation } from '@/hooks/useTranslation';
import type { KanbanBoardCard, CardLabel, KanbanUser } from '@/types/kanban';
import { generateInitials, memberColor } from '@/utils/kanban';
import CheckIcon from '@public/icons/small/check.svg';
import ChecklistIcon from '@public/icons/small/checkbox.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';
import { LabelPopover } from './LabelPopover';
import { SidebarButton } from './SidebarButton';

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
  const { t } = useTranslation();
  const [dateError, setDateError] = useState<string | null>(null);
  const startDt = card.kanban_board_card_start_date;
  const dueDt = card.kanban_board_card_due_date;

  // Dates are stored as absolute UTC timestamps on the wire. The picker
  // edits the calendar day and wall-clock time in the viewer's local
  // timezone, so both parts must be read off a real Date's local getters
  // (not sliced directly out of the UTC ISO string), and combine() must go
  // back through a local Date so the saved instant matches what was
  // actually typed rather than reinterpreting local-looking digits as UTC.
  const datePart = (dt: string | null) => {
    if (!dt) return null;
    const d = new Date(dt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  };
  const timePart = (dt: string | null) =>
    dt ? new Date(dt).toTimeString().slice(0, 5) : '';
  const combine = (date: string | null, time: string) => {
    if (!date) return '';
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = (time || '00:00').split(':').map(Number);

    return new Date(y, m - 1, d, h, min).toISOString();
  };

  const updateDate = (
    field: 'kanban_board_card_start_date' | 'kanban_board_card_due_date',
    value: string,
  ) => {
    const nextStart =
      field === 'kanban_board_card_start_date' ? value || null : startDt;
    const nextDue =
      field === 'kanban_board_card_due_date' ? value || null : dueDt;

    if (
      nextStart &&
      nextDue &&
      new Date(nextDue).getTime() <= new Date(nextStart).getTime()
    ) {
      setDateError(t('kanban.dueMustBeAfterStart'));
      return;
    }

    setDateError(null);
    onUpdateDates(field, value);
  };

  return (
    <div className="scrollbar-app w-52 shrink-0 space-y-4 overflow-y-auto border-l border-dark-border px-4 py-4">
      {/* Dates */}
      <div>
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-dark-secondary/70 uppercase">
          {t('kanban.dates')}
        </p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <DatePicker
              label={t('kanban.startDate')}
              value={datePart(startDt)}
              onChange={(v) =>
                updateDate(
                  'kanban_board_card_start_date',
                  combine(v, timePart(startDt)),
                )
              }
              onClear={() => updateDate('kanban_board_card_start_date', '')}
              placeholder={t('kanban.setStartDate')}
            />
            <TimePicker
              ariaLabel={t('kanban.startTime')}
              value={timePart(startDt) || null}
              disabled={!startDt}
              onChange={(time) =>
                updateDate(
                  'kanban_board_card_start_date',
                  combine(datePart(startDt), time),
                )
              }
            />
          </div>
          <div className="space-y-1.5">
            <DatePicker
              label={t('kanban.dueDate')}
              value={datePart(dueDt)}
              minDate={datePart(startDt) ?? undefined}
              onChange={(v) =>
                updateDate(
                  'kanban_board_card_due_date',
                  combine(
                    v,
                    timePart(dueDt) ||
                      (v === datePart(startDt) ? '23:59' : '00:00'),
                  ),
                )
              }
              onClear={() => updateDate('kanban_board_card_due_date', '')}
              placeholder={t('kanban.setDueDate')}
              highlightOverdue
            />
            <TimePicker
              ariaLabel={t('kanban.dueTime')}
              value={timePart(dueDt) || null}
              disabled={!dueDt}
              onChange={(time) =>
                updateDate(
                  'kanban_board_card_due_date',
                  combine(datePart(dueDt), time),
                )
              }
            />
          </div>
          {dateError && (
            <p className="text-xsmall text-status-error">{dateError}</p>
          )}
        </div>
      </div>

      <div className="border-t border-dark-border" />

      {/* Add to card */}
      <div>
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-dark-secondary/70 uppercase">
          {t('kanban.addToCard')}
        </p>
        <div className="space-y-1.5">
          <SidebarButton
            icon={<ChecklistIcon className="h-3.5 w-3.5" />}
            label={t('kanban.checklist')}
            onClick={() => {
              onToggleChecklist(true);
              onToggleAttachment(false);
            }}
            active={addingChecklist}
          />
          <SidebarButton
            icon={<PaperclipIcon className="h-3.5 w-3.5" />}
            label={t('kanban.attachment')}
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
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-dark-secondary/70 uppercase">
          {t('kanban.labelsLabel')}
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
                    title={t('kanban.removeFromCard')}
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
            className="flex w-full items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-2 px-3 py-1.5 text-xsmall text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-secondary"
          >
            <PaperclipIcon className="h-3.5 w-3.5" />
            <span>{t('kanban.editLabels')}</span>
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
        <p className="mb-2 text-xsmall font-semibold tracking-wider text-dark-secondary/70 uppercase">
          {t('kanban.members')}
        </p>
        <div className="space-y-1">
          {projectUsers?.map((user) => {
            const isMember = (card.members || []).some((m) => m.id === user.id);

            return (
              <button
                key={user.id}
                onClick={() => onToggleMember(user)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                  isMember
                    ? 'border border-dark-border bg-dark-surface-3'
                    : 'border border-transparent hover:bg-dark-surface-3'
                }`}
              >
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xsmall font-bold text-white"
                  style={{
                    backgroundColor: memberColor(user.id),
                  }}
                >
                  {generateInitials(user.name)}
                </div>
                <span className="flex-1 truncate text-xsmall text-dark-secondary">
                  {user.name}
                </span>
                {isMember && (
                  <CheckIcon className="h-3 w-3 shrink-0 text-accent-blue" />
                )}
              </button>
            );
          })}
          {(!projectUsers || projectUsers.length === 0) && (
            <p className="px-2 text-xsmall text-dark-secondary/80 italic">
              {t('kanban.noMembersInProject')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

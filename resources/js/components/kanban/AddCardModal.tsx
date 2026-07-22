import { useMemo, useState } from 'react';
import { DatePicker } from '@/components/shared/DatePicker';
import { TimePicker } from '@/components/shared/TimePicker';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  CardLabel,
  CreateKanbanCardAttachmentInput,
  CreateKanbanCardChecklistItemInput,
  CreateKanbanCardInput,
  KanbanBoard,
  KanbanUser,
} from '@/types/kanban';
import CheckIcon from '@public/icons/small/check.svg';
import AddCardAttachmentField from './AddCardAttachmentField';
import AddCardChecklistField from './AddCardChecklistField';

interface AddCardModalProps {
  boards: KanbanBoard[];
  cardLabels: CardLabel[];
  projectUsers: KanbanUser[];
  defaultBoardId: string;
  onClose: () => void;
  onSubmit: (input: CreateKanbanCardInput) => Promise<void> | void;
}

const toIsoDateTime = (date: string | null, time: string): string | null => {
  if (!date) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = (time || '00:00').split(':').map(Number);

  return new Date(year, month - 1, day, hour, minute).toISOString();
};

export const AddCardModal = ({
  boards,
  cardLabels,
  projectUsers,
  defaultBoardId,
  onClose,
  onSubmit,
}: AddCardModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [boardId, setBoardId] = useState(defaultBoardId);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [dueTime, setDueTime] = useState('10:00');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [checklistItems, setChecklistItems] = useState<
    CreateKanbanCardChecklistItemInput[]
  >([]);
  const [attachments, setAttachments] = useState<
    CreateKanbanCardAttachmentInput[]
  >([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startAt = useMemo(
    () => toIsoDateTime(startDate, startTime),
    [startDate, startTime],
  );
  const dueAt = useMemo(
    () => toIsoDateTime(dueDate, dueTime),
    [dueDate, dueTime],
  );

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((previous) =>
      previous.includes(labelId)
        ? previous.filter((id) => id !== labelId)
        : [...previous, labelId],
    );
  };

  const toggleMember = (memberId: number) => {
    setSelectedMemberIds((previous) =>
      previous.includes(memberId)
        ? previous.filter((id) => id !== memberId)
        : [...previous, memberId],
    );
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setDateError(null);
    if (dueDate && dueDate < value) setDueDate(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !boardId || loading) return;

    if (startAt && dueAt && new Date(dueAt) <= new Date(startAt)) {
      setDateError(t('kanban.dueMustBeAfterStart'));
      return;
    }

    setDateError(null);
    setLoading(true);
    try {
      await onSubmit({
        boardId,
        title: title.trim(),
        description: description.trim() || null,
        startAt,
        dueAt,
        labelIds: selectedLabelIds,
        memberIds: selectedMemberIds,
        checklist:
          checklistItems.length > 0
            ? {
                id: crypto.randomUUID(),
                name: t('kanban.checklist'),
                items: checklistItems,
              }
            : null,
        attachments,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5"
      onClick={(event) =>
        !loading && event.target === event.currentTarget && onClose()
      }
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-card-title"
        className="scrollbar-app max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-dark-border bg-dark-surface-2 shadow-2xl"
      >
        <div className="sticky top-0 z-10 border-b border-dark-border bg-dark-surface-2 px-5 py-4">
          <h3
            id="add-card-title"
            className="text-h6 font-bold text-dark-primary"
          >
            {t('kanban.addNewCard')}
          </h3>
          <p className="mt-1 text-xsmall text-dark-secondary">
            {t('kanban.addCardDetailsHelp')}
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xsmall font-semibold text-dark-secondary">
                {t('kanban.boardLabel')}
              </span>
              <select
                value={boardId}
                onChange={(event) => setBoardId(event.target.value)}
                className="h-10 w-full rounded-xl border border-dark-border bg-dark-input px-3 text-small text-dark-primary transition outline-none focus:border-dark-border-focus"
              >
                {boards.map((board) => (
                  <option
                    key={board.kanban_board_id}
                    value={board.kanban_board_id}
                  >
                    {board.kanban_board_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xsmall font-semibold text-dark-secondary">
                {t('kanban.cardTitleLabel')}
              </span>
              <input
                autoFocus
                required
                maxLength={20}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('kanban.cardTitlePlaceholder')}
                className="h-10 w-full rounded-xl border border-dark-border bg-dark-input px-3 text-small text-dark-primary transition outline-none placeholder:text-dark-secondary focus:border-dark-border-focus"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xsmall font-semibold text-dark-secondary">
              {t('kanban.description')}
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={10000}
              rows={4}
              placeholder={t('kanban.descriptionPlaceholder')}
              className="w-full resize-y rounded-xl border border-dark-border bg-dark-input px-3 py-2.5 text-small text-dark-primary transition outline-none placeholder:text-dark-secondary focus:border-dark-border-focus"
            />
          </label>

          <div>
            <p className="mb-2 text-xsmall font-semibold text-dark-secondary">
              {t('kanban.dates')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  label={t('kanban.startDate')}
                  value={startDate}
                  onChange={handleStartDateChange}
                  onClear={() => {
                    setStartDate(null);
                    setDateError(null);
                  }}
                  placeholder={t('kanban.setStartDate')}
                />
                <TimePicker
                  label={t('kanban.startTime')}
                  ariaLabel={t('kanban.startTime')}
                  value={startDate ? startTime : null}
                  disabled={!startDate}
                  onChange={(value) => {
                    setStartTime(value);
                    setDateError(null);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  label={t('kanban.dueDate')}
                  value={dueDate}
                  minDate={startDate ?? undefined}
                  onChange={(value) => {
                    setDueDate(value);
                    setDateError(null);
                  }}
                  onClear={() => {
                    setDueDate(null);
                    setDateError(null);
                  }}
                  placeholder={t('kanban.setDueDate')}
                />
                <TimePicker
                  label={t('kanban.dueTime')}
                  ariaLabel={t('kanban.dueTime')}
                  value={dueDate ? dueTime : null}
                  disabled={!dueDate}
                  onChange={(value) => {
                    setDueTime(value);
                    setDateError(null);
                  }}
                />
              </div>
            </div>
            {dateError && (
              <p className="mt-2 text-xsmall text-status-error">{dateError}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <AddCardChecklistField
              items={checklistItems}
              onChange={setChecklistItems}
            />
            <AddCardAttachmentField
              attachments={attachments}
              onChange={setAttachments}
            />
          </div>

          {cardLabels.length > 0 && (
            <div>
              <p className="mb-2 text-xsmall font-semibold text-dark-secondary">
                {t('kanban.labelsLabel')}
              </p>
              <div className="flex flex-wrap gap-2">
                {cardLabels.map((label) => {
                  const active = selectedLabelIds.includes(label.card_label_id);
                  const color = label.card_label_color_hex || '#7B7B7B';

                  return (
                    <button
                      key={label.card_label_id}
                      type="button"
                      onClick={() => toggleLabel(label.card_label_id)}
                      className="rounded-lg border px-2.5 py-1 text-micro font-semibold transition"
                      style={{
                        backgroundColor: active ? `${color}33` : 'transparent',
                        borderColor: active ? `${color}66` : '#ffffff15',
                        color: active ? color : '#ffffff70',
                      }}
                    >
                      {label.card_label_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {projectUsers.length > 0 && (
            <div>
              <p className="mb-2 text-xsmall font-semibold text-dark-secondary">
                {t('kanban.members')}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {projectUsers.map((member) => {
                  const active = selectedMemberIds.includes(member.id);

                  return (
                    <button
                      key={member.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMember(member.id)}
                      className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                        active
                          ? 'border-accent-blue/60 bg-accent-blue/10 text-dark-primary'
                          : 'border-dark-border text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate text-xsmall font-medium">
                        {member.name}
                      </span>
                      {active && (
                        <CheckIcon className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-dark-border bg-dark-surface-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-dark-border px-4 py-2 text-small font-semibold whitespace-nowrap text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!title.trim() || !boardId || loading}
            className="rounded-xl bg-accent-blue px-4 py-2 text-small font-semibold whitespace-nowrap text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? t('kanban.adding') : t('kanban.addCard')}
          </button>
        </div>
      </div>
    </div>
  );
};

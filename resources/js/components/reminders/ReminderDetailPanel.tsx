import { useEffect, useRef, useState } from 'react';
import { DatePicker } from '@/components/shared/DatePicker';
import { TimePicker } from '@/components/shared/TimePicker';
import { useTranslation } from '@/hooks/useTranslation';
import type { Reminder } from '@/types/reminder';
import {
  combineDueAt,
  formatReminderDetailDateTime,
  splitDueAt,
} from '@/utils/reminders';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';
import CalendarIcon from '@public/icons/small/time.svg';

interface ReminderDetailPanelProps {
  reminder: Reminder;
  onClose: () => void;
  onToggleComplete: () => void;
  onUpdateTitle: (title: string) => void;
  onUpdateDescription: (description: string | null) => void;
  onUpdateDueAt: (dueAt: string | null) => void;
  onAddStep: (name: string) => void;
  onToggleStep: (stepId: string, current: boolean) => void;
  onDeleteStep: (stepId: string) => void;
}

export const ReminderDetailPanel = ({
  reminder,
  onClose,
  onToggleComplete,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateDueAt,
  onAddStep,
  onToggleStep,
  onDeleteStep,
}: ReminderDetailPanelProps) => {
  const { locale, t } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(reminder.reminder_title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(
    reminder.reminder_description ?? '',
  );
  const [editingDate, setEditingDate] = useState(false);
  const [newStepName, setNewStepName] = useState('');

  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitleValue(reminder.reminder_title);
    setDescValue(reminder.reminder_description ?? '');
    setEditingTitle(false);
    setEditingDesc(false);
    setEditingDate(false);
    setNewStepName('');
    // Only reset when the reminder itself switches, not on every field update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminder.reminder_id]);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);
  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  const { date: dueDate, time: dueTime } = splitDueAt(reminder.reminder_due_at);

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== reminder.reminder_title) {
      onUpdateTitle(trimmed);
    } else {
      setTitleValue(reminder.reminder_title);
    }
  };

  const commitDesc = () => {
    setEditingDesc(false);
    onUpdateDescription(descValue || null);
  };

  const handleAddStep = () => {
    if (!newStepName.trim()) return;
    onAddStep(newStepName.trim());
    setNewStepName('');
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b-2 border-dark-secondary px-5 py-4">
        <button
          type="button"
          onClick={onToggleComplete}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            reminder.is_completed
              ? 'border-transparent bg-accent-blue text-dark-primary'
              : 'border-dark-secondary hover:bg-dark-surface-3'
          }`}
        >
          {reminder.is_completed && <CheckIcon className="h-3 w-3" />}
        </button>

        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle();
                if (e.key === 'Escape') {
                  setTitleValue(reminder.reminder_title);
                  setEditingTitle(false);
                }
              }}
              className="w-full rounded-lg border border-dark-border-focus bg-dark-surface-2 px-2 py-1 text-medium leading-snug font-bold text-dark-primary focus:outline-none"
            />
          ) : (
            <h2
              className="line-clamp-2 cursor-pointer text-medium leading-snug font-bold text-dark-primary transition hover:text-dark-secondary"
              onClick={() => setEditingTitle(true)}
              title={t('reminders.clickToEditTitle')}
            >
              {reminder.reminder_title}
            </h2>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-dark-secondary/80 transition hover:bg-dark-surface-3 hover:text-dark-primary"
          title={t('reminders.close')}
        >
          <CloseIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="scrollbar-app flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Steps */}
        <div>
          <div className="mb-2 flex items-center gap-2 text-xsmall font-semibold tracking-wider text-dark-secondary uppercase">
            <span>{t('reminders.steps')}</span>
          </div>
          <div className="space-y-1">
            {(reminder.steps || []).map((step) => (
              <div
                key={step.reminder_step_id}
                className="group/step flex items-center gap-3 rounded-lg px-1 py-1 transition hover:bg-dark-surface-3"
              >
                <button
                  type="button"
                  onClick={() =>
                    onToggleStep(step.reminder_step_id, step.is_completed)
                  }
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all ${
                    step.is_completed
                      ? 'border-accent-blue bg-accent-blue'
                      : 'border-dark-border-focus hover:border-accent-blue'
                  }`}
                >
                  {step.is_completed && (
                    <CheckIcon className="h-2 w-2 text-white" />
                  )}
                </button>
                <span
                  className={`flex-1 text-small leading-snug ${
                    step.is_completed
                      ? 'text-dark-secondary/70 line-through'
                      : 'text-dark-primary'
                  }`}
                >
                  {step.reminder_step_name}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteStep(step.reminder_step_id)}
                  className="flex h-5 w-5 items-center justify-center rounded text-xsmall text-dark-secondary/70 opacity-0 transition group-hover/step:opacity-100 hover:text-accent-red"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 pl-1">
            <span className="text-accent-blue">+</span>
            <input
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddStep();
              }}
              placeholder={t('reminders.addStep')}
              className="flex-1 rounded-lg bg-transparent py-1 text-small text-dark-primary placeholder-accent-blue outline-none"
            />
          </div>
        </div>

        {/* Due date/time */}
        <div>
          {editingDate ? (
            <div className="flex items-end gap-2">
              <DatePicker
                label={t('reminders.dueDate')}
                value={dueDate}
                onChange={(v) => onUpdateDueAt(combineDueAt(v, dueTime))}
                onClear={() => onUpdateDueAt(null)}
                placeholder={t('reminders.setDueDate')}
              />
              <div>
                <label className="mb-1 block text-xsmall tracking-wider text-dark-secondary/80 uppercase">
                  {t('reminders.time')}
                </label>
                <TimePicker
                  ariaLabel={t('reminders.time')}
                  value={dueTime}
                  onChange={(v) => onUpdateDueAt(combineDueAt(dueDate, v))}
                  disabled={!dueDate}
                />
              </div>
              <button
                type="button"
                onClick={() => setEditingDate(false)}
                className="rounded-lg border border-dark-border px-3 py-1.5 text-xsmall text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
              >
                {t('reminders.done')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingDate(true)}
              className="flex items-center gap-2 text-small text-dark-secondary transition hover:text-dark-primary"
            >
              <CalendarIcon className="h-4 w-4" />
              {formatReminderDetailDateTime(
                reminder.reminder_due_at,
                localeCode,
                t('reminders.noDueDate'),
              )}
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xsmall font-semibold tracking-wider text-dark-secondary uppercase">
              {t('reminders.description')}
            </span>
            {!editingDesc && (
              <button
                type="button"
                onClick={() => setEditingDesc(true)}
                className="rounded px-2 py-0.5 text-xsmall text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
              >
                {t('reminders.edit')}
              </button>
            )}
          </div>
          {editingDesc ? (
            <div>
              <textarea
                ref={descRef}
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                rows={5}
                placeholder={t('reminders.descriptionPlaceholder')}
                className="scrollbar-app w-full resize-none rounded-xl border border-dark-border-focus bg-dark-surface-2 px-3.5 py-3 text-small leading-relaxed text-dark-primary placeholder-dark-secondary focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={commitDesc}
                  className="hover:bg-opacity-90 rounded-lg bg-accent-blue px-3.5 py-1.5 text-xsmall font-semibold text-white transition"
                >
                  {t('reminders.save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDescValue(reminder.reminder_description ?? '');
                    setEditingDesc(false);
                  }}
                  className="rounded-lg border border-dark-border px-3.5 py-1.5 text-xsmall text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
                >
                  {t('reminders.discard')}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingDesc(true)}
              className="min-h-15 cursor-pointer rounded-xl bg-dark-surface-1 px-3.5 py-3 text-small leading-relaxed transition hover:bg-dark-surface-3"
            >
              {reminder.reminder_description ? (
                <span className="whitespace-pre-wrap text-dark-primary">
                  {reminder.reminder_description}
                </span>
              ) : (
                <span className="text-dark-secondary/70">
                  {t('reminders.descriptionPlaceholder')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

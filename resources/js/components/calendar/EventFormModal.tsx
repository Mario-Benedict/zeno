import { useState, useEffect } from 'react';
import { DatePicker } from '@/components/shared/DatePicker';
import { SelectPopover } from '@/components/shared/SelectPopover';
import { TimePicker } from '@/components/shared/TimePicker';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  CalendarMember,
  CalendarEventFull,
  CalendarRecurrence,
} from '@/types/calendar';
import type { CardLabel } from '@/types/kanban';
import type { ProjectRole } from '@/types/project';
import { getRecurrenceLabelParams } from '@/utils/calendar';
import { EventLabelPicker } from './EventLabelPicker';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialDate?: Date;
  eventToEdit?: CalendarEventFull;
  members: CalendarMember[];
  cardLabels: CardLabel[];
  currentUser: { id: number; name: string };
  projectRole: ProjectRole | null;
}

export const EventFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  eventToEdit,
  members,
  cardLabels,
  currentUser,
  projectRole,
}: EventFormModalProps) => {
  const { t, locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<string | null>('09:00');
  const [endDate, setEndDate] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>('10:00');
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<CalendarRecurrence>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string | null>(
    null,
  );
  const [assigneeId, setAssigneeId] = useState<number>(currentUser.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canAssignOthers = projectRole === 'OWNER' || projectRole === 'ADMIN';

  // Sync the form fields to the event being edited (or reset for a new one)
  // whenever the modal opens. This intentionally mirrors external props into
  // local state, so the set-state-in-effect guidance does not apply.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setTitle(eventToEdit.title);
        setDescription(eventToEdit.description || '');

        const start = new Date(eventToEdit.start_time);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));

        const end = new Date(eventToEdit.end_time);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));

        setLabelIds(eventToEdit.labels.map((l) => l.card_label_id));
        setRecurrence(eventToEdit.recurrence);
        setRecurrenceEndDate(eventToEdit.recurrence_end_date);
        setAssigneeId(eventToEdit.participants[0]?.id || currentUser.id);
      } else {
        setTitle('');
        setDescription('');

        const initD = initialDate ? new Date(initialDate) : new Date();
        const yyyy = initD.getFullYear();
        const mm = String(initD.getMonth() + 1).padStart(2, '0');
        const dd = String(initD.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        setStartDate(dateStr);
        setEndDate(dateStr);

        // Next hour for default time
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        setStartTime(nextHour.toTimeString().slice(0, 5));

        nextHour.setHours(nextHour.getHours() + 1);
        setEndTime(nextHour.toTimeString().slice(0, 5));

        setLabelIds([]);
        setRecurrence('none');
        setRecurrenceEndDate(null);
        setAssigneeId(currentUser.id);
      }
    }
  }, [isOpen, eventToEdit, initialDate, currentUser.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (!startDate || !startTime || !endDate || !endTime) {
        throw new Error(t('calendar.saveScheduleError'));
      }

      const startIso = new Date(`${startDate}T${startTime}`).toISOString();
      const endIso = new Date(`${endDate}T${endTime}`).toISOString();

      if (new Date(startIso) >= new Date(endIso)) {
        throw new Error(t('calendar.endTimeAfterStartTimeError'));
      }

      if (
        recurrence !== 'none' &&
        recurrenceEndDate &&
        recurrenceEndDate < startDate
      ) {
        throw new Error(t('calendar.recurrenceEndBeforeStartError'));
      }

      await onSubmit({
        title,
        description,
        start_time: startIso,
        end_time: endIso,
        label_ids: labelIds,
        recurrence,
        recurrence_end_date: recurrence === 'none' ? null : recurrenceEndDate,
        participants: [assigneeId],
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      const data = error?.response?.data;
      if (data?.errors) {
        // Laravel validation errors (422)
        const firstError = Object.values(data.errors)[0] as string[];
        setErrorMsg(firstError[0]);
      } else if (typeof data?.message === 'string') {
        setErrorMsg(data.message);
      } else if (!error?.response && error instanceof Error) {
        // A client-side check we threw ourselves above (e.g. end-before-start)
        // — already a translated, user-facing string, safe to show as-is.
        setErrorMsg(error.message);
      } else {
        // An HTTP failure with no structured payload (e.g. a 500 error page).
        // Never surface the raw fetch error text or request URL here.
        setErrorMsg(t('calendar.saveScheduleError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clearing recurrence back to "Does not repeat" also clears any end date
  // set on it — an end date has no meaning for a one-time event.
  const handleRecurrenceChange = (value: CalendarRecurrence) => {
    setRecurrence(value);
    if (value === 'none') setRecurrenceEndDate(null);
  };

  // Google-Calendar-style recurrence options, described relative to the
  // selected start date (e.g. "Weekly on Wednesday", "Monthly on day 8") so
  // the label always matches what picking it will actually do.
  const recurrenceBaseDate = startDate
    ? new Date(`${startDate}T00:00:00`)
    : new Date();
  const recurrenceOptions = (
    ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const
  ).map((value) => {
    const { key, params } = getRecurrenceLabelParams(
      value,
      recurrenceBaseDate,
      localeCode,
    );

    return { value, label: t(key, params) };
  });

  const assigneeOptions = canAssignOthers
    ? members.map((m) => ({ value: m.id, label: m.name, dotColor: m.color }))
    : [{ value: currentUser.id, label: currentUser.name }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-dark-border bg-dark-surface-1 shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark-border px-5 py-4">
          <h2 className="text-large font-semibold text-dark-primary">
            {eventToEdit
              ? t('calendar.editSchedule')
              : t('calendar.newSchedule')}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('calendar.close')}
            className="text-dark-secondary hover:text-dark-primary"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          {errorMsg && (
            <div className="rounded-lg border border-status-error/20 bg-status-error/10 p-3 text-small text-status-error">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xsmall text-dark-secondary">
              {t('calendar.title')}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              placeholder={t('calendar.eventTitlePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label={t('calendar.startDate')}
              value={startDate}
              onChange={setStartDate}
              placeholder={t('calendar.startDate')}
            />
            <TimePicker
              label={t('calendar.startTime')}
              ariaLabel={t('calendar.startTime')}
              value={startTime}
              onChange={setStartTime}
              placeholder={t('calendar.startTime')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label={t('calendar.endDate')}
              value={endDate}
              onChange={setEndDate}
              placeholder={t('calendar.endDate')}
            />
            <TimePicker
              label={t('calendar.endTime')}
              ariaLabel={t('calendar.endTime')}
              value={endTime}
              onChange={setEndTime}
              placeholder={t('calendar.endTime')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EventLabelPicker
              cardLabels={cardLabels}
              selectedIds={labelIds}
              onChange={setLabelIds}
            />
            <SelectPopover
              label={t('calendar.recurrence')}
              value={recurrence}
              options={recurrenceOptions}
              onChange={handleRecurrenceChange}
            />
          </div>

          {recurrence !== 'none' && (
            <DatePicker
              label={t('calendar.endsOn')}
              value={recurrenceEndDate}
              onChange={setRecurrenceEndDate}
              onClear={() => setRecurrenceEndDate(null)}
              placeholder={t('calendar.neverEnds')}
            />
          )}

          <div>
            <SelectPopover
              label={t('calendar.assignee')}
              value={assigneeId}
              options={assigneeOptions}
              onChange={setAssigneeId}
              disabled={!canAssignOthers}
            />
            {!canAssignOthers && (
              <p className="mt-1 text-[10px] text-dark-secondary">
                {t('calendar.assigneeRestrictionNote')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xsmall text-dark-secondary">
              {t('calendar.descriptionOptional')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              placeholder={t('calendar.eventDescriptionPlaceholder')}
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-small font-medium text-dark-primary transition hover:bg-dark-surface-2"
            >
              {t('calendar.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-accent-blue px-4 py-2 text-small font-medium text-white transition hover:bg-accent-blue/90 disabled:opacity-70"
            >
              {isSubmitting ? t('calendar.saving') : t('calendar.saveSchedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

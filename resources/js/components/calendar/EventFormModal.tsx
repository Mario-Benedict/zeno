import { useState, useEffect } from 'react';
import type { CalendarMember, CalendarEventFull } from '@/types/calendar';
import type { ProjectRole } from '@/types/project';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialDate?: Date;
  eventToEdit?: CalendarEventFull;
  members: CalendarMember[];
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
  currentUser,
  projectRole,
}: EventFormModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [priority, setPriority] = useState('mid');
  const [recurrence, setRecurrence] = useState('none');
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

        setPriority(eventToEdit.priority);
        setRecurrence(eventToEdit.recurrence);
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

        setPriority('mid');
        setRecurrence('none');
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
      const startIso = new Date(`${startDate}T${startTime}`).toISOString();
      const endIso = new Date(`${endDate}T${endTime}`).toISOString();

      if (new Date(startIso) >= new Date(endIso)) {
        throw new Error(
          'End time must be after start time. If it ends the next day, please update the End Date.',
        );
      }

      await onSubmit({
        title,
        description,
        start_time: startIso,
        end_time: endIso,
        priority,
        recurrence,
        participants: [assigneeId],
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      if (error.response?.data?.errors) {
        // Laravel validation errors
        const firstError = Object.values(
          error.response.data.errors,
        )[0] as string[];
        setErrorMsg(firstError[0]);
      } else if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg(error.message || 'Failed to save schedule.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-dark-border bg-dark-surface-1 shadow-2xl">
        <div className="flex items-center justify-between border-b border-dark-border px-5 py-4">
          <h2 className="text-large font-semibold text-dark-primary">
            {eventToEdit ? 'Edit Schedule' : 'New Schedule'}
          </h2>
          <button
            onClick={onClose}
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
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              placeholder="Event title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xsmall text-dark-secondary">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-2 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xsmall text-dark-secondary">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-2 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xsmall text-dark-secondary">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-2 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xsmall text-dark-secondary">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-2 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xsmall text-dark-secondary">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="mid">Mid</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xsmall text-dark-secondary">
                Recurrence
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              >
                <option value="none">One time</option>
                <option value="weekly">Every week</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xsmall text-dark-secondary">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(Number(e.target.value))}
              disabled={!canAssignOthers}
              className="w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none disabled:opacity-60"
            >
              {canAssignOthers ? (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))
              ) : (
                <option value={currentUser.id}>{currentUser.name}</option>
              )}
            </select>
            {!canAssignOthers && (
              <p className="mt-1 text-[10px] text-dark-secondary">
                Only Owners and Admins can assign schedules to other members.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xsmall text-dark-secondary">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-dark-border bg-dark-input px-3 py-2 text-small text-dark-primary focus:border-dark-border-focus focus:outline-none"
              placeholder="Event details..."
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-small font-medium text-dark-primary transition hover:bg-dark-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-accent-blue px-4 py-2 text-small font-medium text-white transition hover:bg-accent-blue/90 disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { DatePicker } from '@/components/shared/DatePicker';
import { TimePicker } from '@/components/shared/TimePicker';
import { combineDueAt } from '@/utils/reminders';

interface AddReminderModalProps {
  onClose: () => void;
  onSubmit: (title: string, dueAt: string | null) => Promise<void>;
}

export const AddReminderModal = ({
  onClose,
  onSubmit,
}: AddReminderModalProps) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit(title.trim(), combineDueAt(date, time));
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-dark-border bg-dark-surface-2 p-5 shadow-2xl">
        <h3 className="mb-4 text-base font-bold text-white">Add Reminder</h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Reminder title..."
              className="w-full rounded-xl border border-dark-border bg-dark-input px-3 py-2 text-sm text-white placeholder-dark-secondary transition focus:border-dark-border-focus focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <DatePicker
              label="Due date"
              value={date}
              onChange={setDate}
              onClear={() => setDate(null)}
              placeholder="Optional"
            />
            <TimePicker
              label="Time"
              value={time}
              onChange={setTime}
              disabled={!date}
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-dark-border py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            className="hover:bg-opacity-90 flex-1 rounded-xl bg-accent-blue py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Adding...' : 'Add Reminder'}
          </button>
        </div>
      </div>
    </div>
  );
};

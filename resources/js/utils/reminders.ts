export const isReminderOverdue = (dueAt: string | null): boolean => {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() < Date.now();
};

export const isReminderDueSoon = (dueAt: string | null): boolean => {
  if (!dueAt || isReminderOverdue(dueAt)) return false;
  return new Date(dueAt).getTime() - Date.now() < 86400000 * 2;
};

/** e.g. "Fri, December 20, 2026" — used in the reminders list rows. */
export const formatReminderListDate = (
  dueAt: string | null | undefined,
  locale = 'en-US',
): string => {
  if (!dueAt) return '';
  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

/** e.g. "Friday, December 20, 2026 - 09:30 AM" — used in the detail panel. */
export const formatReminderDetailDateTime = (
  dueAt: string | null | undefined,
  locale: string,
  noDueDate: string,
): string => {
  if (!dueAt) return noDueDate;
  const date = new Date(dueAt);
  if (isNaN(date.getTime())) return noDueDate;

  const datePart = date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${datePart} - ${timePart}`;
};

/** Splits an ISO datetime into separate `YYYY-MM-DD` / `HH:MM` local parts for form inputs. */
export const splitDueAt = (
  dueAt: string | null,
): { date: string | null; time: string } => {
  if (!dueAt) return { date: null, time: '' };
  const d = new Date(dueAt);
  if (isNaN(d.getTime())) return { date: null, time: '' };

  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
};

/** Combines a `YYYY-MM-DD` date and `HH:MM` time into an ISO string, or null if no date. */
export const combineDueAt = (
  date: string | null,
  time: string,
): string | null => {
  if (!date) return null;

  return new Date(`${date}T${time || '00:00'}:00`).toISOString();
};

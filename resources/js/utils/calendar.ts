import type { TranslationKey } from '@/i18n/dictionary';
import type { CalendarEventLabel, CalendarRecurrence } from '@/types/calendar';

/** Neutral fallback used wherever an event has no labels attached. */
export const NEUTRAL_EVENT_COLOR = '#7B7B7B';

/**
 * The accent colour for an event — its first label's colour, or neutral.
 * Mirrors `getTaskAccentColor` in `@/utils/timeline`, which does the same
 * "first label wins" fallback for Kanban-card-derived colour accents.
 */
export const getEventLabelColor = (labels: CalendarEventLabel[]): string =>
  labels[0]?.card_label_color_hex ?? NEUTRAL_EVENT_COLOR;

/**
 * Google-Calendar-style recurrence description, e.g. "Weekly on Wednesday" /
 * "Monthly on day 8" / "Annually on July 8" — derived from the event's start
 * date so the label always matches what the recurrence actually does. Returns
 * a translation key + params rather than a string, since only the caller (a
 * component) has access to `t()` via `useTranslation()`.
 */
export const getRecurrenceLabelParams = (
  recurrence: CalendarRecurrence,
  startDate: Date,
  localeCode: string,
): { key: TranslationKey; params?: Record<string, string> } => {
  switch (recurrence) {
    case 'daily':
      return { key: 'calendar.daily' };
    case 'weekly':
      return {
        key: 'calendar.weeklyOn',
        params: {
          weekday: new Intl.DateTimeFormat(localeCode, {
            weekday: 'long',
          }).format(startDate),
        },
      };
    case 'monthly':
      return {
        key: 'calendar.monthlyOn',
        params: { day: String(startDate.getDate()) },
      };
    case 'yearly':
      return {
        key: 'calendar.yearlyOn',
        params: {
          date: new Intl.DateTimeFormat(localeCode, {
            month: 'long',
            day: 'numeric',
          }).format(startDate),
        },
      };
    default:
      return { key: 'calendar.doesNotRepeat' };
  }
};

/**
 * Full recurrence description including its optional end date, e.g.
 * "Weekly on Wednesday" or, with an end date set, "Weekly on Wednesday until
 * Jul 20, 2026" — Google Calendar's "Ends on" phrasing. Takes `t` directly so
 * it can be called from any component without re-deriving the base label.
 */
export const getRecurrenceLabel = (
  recurrence: CalendarRecurrence,
  startDate: Date,
  recurrenceEndDate: string | null,
  localeCode: string,
  t: (key: TranslationKey, params?: Record<string, string>) => string,
): string => {
  const { key, params } = getRecurrenceLabelParams(
    recurrence,
    startDate,
    localeCode,
  );
  const base = t(key, params);

  if (recurrence === 'none' || !recurrenceEndDate) return base;

  const endLabel = new Intl.DateTimeFormat(localeCode, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${recurrenceEndDate}T00:00:00`));

  return `${base} ${t('calendar.until', { date: endLabel })}`;
};

/** Short, badge-sized recurrence label (no "on X" suffix) — e.g. event pills. */
export const getRecurrenceShortLabelKey = (
  recurrence: CalendarRecurrence,
): TranslationKey => {
  switch (recurrence) {
    case 'daily':
      return 'calendar.daily';
    case 'weekly':
      return 'calendar.weeklyShort';
    case 'monthly':
      return 'calendar.monthlyShort';
    case 'yearly':
      return 'calendar.yearlyShort';
    default:
      return 'calendar.doesNotRepeat';
  }
};

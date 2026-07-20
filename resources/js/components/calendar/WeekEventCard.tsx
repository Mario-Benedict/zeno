import { useTranslation } from '@/hooks/useTranslation';
import type { AnyCalendarEvent, CalendarMember } from '@/types/calendar';
import {
  getEventLabelColor,
  getRecurrenceShortLabelKey,
} from '@/utils/calendar';

interface WeekEventCardProps {
  event: AnyCalendarEvent;
  members: CalendarMember[];
  dayStart: Date;
  style: React.CSSProperties;
  onClick: (e: React.MouseEvent) => void;
}

const formatTime = (d: Date) =>
  d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(':00', '')
    .replace(' ', '')
    .toLowerCase();

export const WeekEventCard = ({
  event,
  members,
  dayStart,
  style,
  onClick,
}: WeekEventCardProps) => {
  const { t } = useTranslation();
  const evStart = new Date(event.start_time);
  const evEnd = new Date(event.end_time);

  // Clamp event bounds to current day (for multi-day events)
  const clampedStart = evStart < dayStart ? dayStart : evStart;
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const clampedEnd = evEnd > dayEnd ? dayEnd : evEnd;

  // 1 hour = 60px height
  const topMin = clampedStart.getHours() * 60 + clampedStart.getMinutes();
  const heightMin = (clampedEnd.getTime() - clampedStart.getTime()) / 60000;
  const height = Math.max(heightMin, 22);

  const owner = members.find((m) => m.id === event.participants?.[0]?.id);
  const ownerColor = owner?.color ?? '#7B7B7B';
  const extraParticipantCount = Math.max(
    (event.participants?.length ?? 0) - 1,
    0,
  );

  const timeString = `${formatTime(clampedStart)} - ${formatTime(clampedEnd)}`;

  // --- CLASSIFIED busy-block: neutral card, no colour, no label ribbon ---
  if (event.is_classified) {
    // "busy_only" (the event creator's calendar_visibility preference) shows
    // nothing but the block itself — no label, name, or time text.
    if (event.visibility === 'busy_only') {
      return (
        <div
          onClick={onClick}
          className="absolute z-10 cursor-pointer p-[1.5px] transition-opacity hover:opacity-90"
          style={{ top: `${topMin}px`, height: `${height}px`, ...style }}
          title={t('calendar.classified')}
        >
          <div className="h-full w-full rounded-lg border border-dashed border-dark-border bg-dark-surface-3" />
        </div>
      );
    }

    return (
      <div
        onClick={onClick}
        className="absolute z-10 cursor-pointer p-[1.5px] transition-opacity hover:opacity-90"
        style={{ top: `${topMin}px`, height: `${height}px`, ...style }}
      >
        <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-dashed border-dark-border bg-dark-surface-3 px-2 py-1">
          <span className="truncate text-[10px] font-bold tracking-wide text-dark-secondary uppercase">
            {t('calendar.classified')}
          </span>
          <span className="truncate text-[11px] font-medium text-dark-primary/80">
            {event.participants[0]?.name}
            {extraParticipantCount > 0 && ` +${extraParticipantCount}`}
          </span>
          {height >= 44 && (
            <span className="mt-auto truncate text-[10px] text-dark-secondary">
              {timeString}
            </span>
          )}
        </div>
      </div>
    );
  }

  // --- Normal full-detail event: pastel owner colour + folded label corner ---
  const foldHex = getEventLabelColor(event.labels);

  return (
    <div
      onClick={onClick}
      className="absolute z-10 cursor-pointer p-[1.5px] transition-transform hover:z-20 hover:scale-[1.01]"
      style={{ top: `${topMin}px`, height: `${height}px`, ...style }}
    >
      <div
        className="relative flex h-full w-full flex-col overflow-hidden rounded-lg px-2 py-1 text-light-primary shadow-sm ring-1 ring-black/10"
        style={{ backgroundColor: ownerColor }}
      >
        <span
          className={`truncate pr-3 text-[11px] font-bold ${event.is_kanban_task && event.is_completed ? 'line-through opacity-60' : ''}`}
        >
          {event.title}
        </span>

        {height >= 34 && (
          <span className="truncate text-[10px] opacity-70">
            {timeString}
            {extraParticipantCount > 0 && ` · +${extraParticipantCount}`}
          </span>
        )}

        {event.is_kanban_task && height >= 58 && (
          <span className="mt-auto w-fit rounded-full bg-black/10 px-1.5 py-px text-[8px] font-bold tracking-wide uppercase">
            {t('calendar.fromBoard', { board: event.kanban_board_name })}
          </span>
        )}

        {!event.is_kanban_task &&
          event.recurrence !== 'none' &&
          height >= 58 && (
            <span className="mt-auto w-fit rounded-full bg-black/10 px-1.5 py-px text-[8px] font-bold tracking-wide uppercase">
              {t(getRecurrenceShortLabelKey(event.recurrence))}
            </span>
          )}

        {/* Folded-corner label ribbon (top-right) */}
        <span
          className="absolute top-0 right-0 h-0 w-0"
          style={{
            borderTop: `15px solid ${foldHex}`,
            borderLeft: '15px solid transparent',
          }}
        />
      </div>
    </div>
  );
};

import { useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { AnyCalendarEvent, CalendarMember } from '@/types/calendar';
import { getEventLabelColor } from '@/utils/calendar';

interface DayEventsPopupProps {
  date: Date;
  events: AnyCalendarEvent[];
  members: CalendarMember[];
  onClose: () => void;
  onEventClick: (event: AnyCalendarEvent) => void;
}

export const DayEventsPopup = ({
  date,
  events,
  members,
  onClose,
  onEventClick,
}: DayEventsPopupProps) => {
  const { t, locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const displayDate = date.toLocaleDateString(localeCode, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  });

  const getEventOwnerColor = (ev: AnyCalendarEvent) => {
    if (!ev.participants || ev.participants.length === 0) return '#7B7B7B';
    const owner = members.find((m) => m.id === ev.participants[0].id);

    return owner?.color || '#7B7B7B';
  };

  return (
    <div
      ref={ref}
      className="absolute top-4 left-1/2 z-50 w-64 -translate-x-1/2 rounded-xl border border-dark-border bg-dark-surface-2 p-3 shadow-2xl"
      onClick={(e) => e.stopPropagation()} // prevent clicking through to cell
    >
      <div className="mb-3 flex items-center justify-between border-b border-dark-border pb-2">
        <h3 className="text-small font-semibold text-dark-primary">
          {displayDate}
        </h3>
        <button
          onClick={onClose}
          aria-label={t('calendar.close')}
          className="text-dark-secondary hover:text-dark-primary"
        >
          ✕
        </button>
      </div>

      <div className="scrollbar-app flex max-h-[300px] flex-col gap-1 overflow-y-auto pr-1">
        {events.map((ev) => {
          const startTime = new Date(ev.start_time).toLocaleTimeString(
            localeCode,
            {
              hour: 'numeric',
              minute: '2-digit',
            },
          );

          if (ev.is_classified) {
            // Both "masked" and "busy_only" render the same classified row
            // — a generic label + owner name, no real title/description.
            return (
              <div
                key={ev.id}
                onClick={() => {
                  onClose();
                  onEventClick(ev);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-dark-surface-3 px-2 py-1.5 hover:bg-dark-border"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dark-surface-1 text-micro font-bold text-dark-secondary">
                  {ev.participants[0]?.name.charAt(0)}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-xsmall font-medium text-dark-secondary">
                    {t('calendar.classified')}
                  </span>
                  <span className="text-micro text-dark-secondary/70">
                    {startTime} · {ev.participants[0]?.name}
                    {ev.participants.length > 1 &&
                      ` +${ev.participants.length - 1}`}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={ev.id}
              onClick={() => {
                onClose();
                onEventClick(ev);
              }}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ring-white/5 transition-colors hover:opacity-90"
              style={{ backgroundColor: `${getEventOwnerColor(ev)}15` }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: getEventLabelColor(ev.labels) }}
              >
                <span className="h-2 w-2 rounded-full bg-white/90" />
              </span>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-xsmall font-medium text-dark-primary">
                  {ev.title}
                </span>
                <span className="flex items-center gap-2 text-micro text-dark-secondary">
                  <span>{startTime}</span>
                  {ev.labels[0] && (
                    <span className="rounded-full bg-dark-surface-1/70 px-1.5 py-0.5 text-micro font-semibold tracking-wide text-dark-primary uppercase">
                      {ev.labels[0].card_label_name}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

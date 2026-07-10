import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { CalendarMember } from '@/types/calendar';
import CheckIcon from '@public/icons/small/check.svg';

interface EventAssigneePickerProps {
  members: CalendarMember[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  /** See `SelectPopover`'s `align` prop — same reasoning. */
  align?: 'left' | 'right';
}

/**
 * Multi-select assignee picker for calendar events, styled after
 * `EventLabelPicker` (same open/close + checkbox-list interaction) but shows
 * a member's colour dot + name instead of a label badge, matching how
 * assignees are rendered elsewhere in Calendar (event cards, detail modal).
 */
export const EventAssigneePicker = ({
  members,
  selectedIds,
  onChange,
  disabled = false,
  align = 'left',
}: EventAssigneePickerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      // At least one assignee is always required.
      if (selectedIds.length === 1) return;
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedMembers = members.filter((m) => selectedIds.includes(m.id));

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xsmall tracking-wider text-white/30 uppercase">
        {t('calendar.assignee')}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xsmall transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          selectedMembers.length > 0
            ? 'border-dark-border bg-dark-surface-2 hover:border-dark-border-focus'
            : 'border-dark-border bg-dark-surface-2 text-white/25 hover:border-dark-border-focus hover:text-white/40'
        }`}
      >
        {selectedMembers.length > 0 ? (
          selectedMembers.map((member) => (
            <span
              key={member.id}
              className="flex items-center gap-1 rounded-full bg-dark-surface-3 py-0.5 pr-2 pl-1.5 text-white/80"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/20"
                style={{ backgroundColor: member.color }}
              />
              {member.name}
            </span>
          ))
        ) : (
          <span>{t('calendar.selectAssignees')}</span>
        )}
      </button>

      {open && !disabled && (
        <div
          className={`absolute top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="border-b border-dark-border px-4 py-3 text-small font-semibold text-white/80">
            {t('calendar.assignee')}
          </div>
          <div className="scrollbar-app max-h-72 overflow-y-auto p-2">
            {members.map((member) => {
              const active = selectedIds.includes(member.id);

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggle(member.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xsmall transition ${
                    active ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/20"
                    style={{ backgroundColor: member.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-white/70">
                    {member.name}
                  </span>
                  {active && (
                    <CheckIcon className="h-3 w-3 shrink-0 text-accent-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

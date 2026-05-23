import { useState, useRef, useEffect } from 'react';

interface DatePickerProps {
    value: string | null;
    onChange: (value: string) => void;
    onClear?: () => void;
    label: string;
    placeholder?: string;
    highlightOverdue?: boolean;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export const DatePicker = ({
    value,
    onChange,
    onClear,
    label,
    placeholder = 'Set date',
    highlightOverdue = false,
}: DatePickerProps) => {
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => {
        if (value) return new Date(value + 'T00:00:00').getFullYear();
        return new Date().getFullYear();
    });
    const [viewMonth, setViewMonth] = useState(() => {
        if (value) return new Date(value + 'T00:00:00').getMonth();
        return new Date().getMonth();
    });
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const d = new Date(value + 'T00:00:00');
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
        }
    }, [value]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const selectedDate = value ? new Date(value + 'T00:00:00') : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isOverdue = highlightOverdue && selectedDate && selectedDate < today;
    const isDueSoon =
        highlightOverdue &&
        selectedDate &&
        !isOverdue &&
        selectedDate.getTime() - today.getTime() < 86400000 * 2;

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
        cells.push({ date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(viewYear, viewMonth, d), isCurrentMonth: true });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        cells.push({ date: new Date(viewYear, viewMonth + 1, d), isCurrentMonth: false });
    }

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    const selectDate = (date: Date) => {
        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        onChange(iso);
        setOpen(false);
    };

    const formatDisplay = (d: Date) =>
        d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div ref={ref} className="relative">
            <div className="mb-1">
                <label className="text-xsmall text-white/30 mb-1 block uppercase tracking-wider">{label}</label>
                <button
                    onClick={() => setOpen((v) => !v)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xsmall transition-all text-left ${
                        isOverdue
                            ? 'bg-accent-red/10 border-accent-red/40 text-accent-red hover:border-accent-red/70'
                            : isDueSoon
                            ? 'bg-accent-yellow/10 border-accent-yellow/40 text-accent-yellow hover:border-accent-yellow/70'
                            : selectedDate
                            ? 'bg-dark-surface-2 border-dark-border text-white/70 hover:border-dark-border-focus'
                            : 'bg-dark-surface-2 border-dark-border text-white/25 hover:border-dark-border-focus hover:text-white/40'
                    }`}
                >
                    <span className="flex-1 truncate">
                        {selectedDate ? formatDisplay(selectedDate) : placeholder}
                    </span>
                    {selectedDate && onClear && (
                        <span
                            role="button"
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            className="shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full text-white/20 hover:text-white/60 hover:bg-white/10 transition text-xsmall"
                        >
                            ✕
                        </span>
                    )}
                </button>
            </div>

            {open && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-64 bg-dark-surface-1 border border-dark-border rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                        <button
                            onClick={prevMonth}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition text-small"
                        >
                            ‹
                        </button>
                        <button
                            className="flex items-center gap-1.5 text-small font-semibold text-white/70 hover:text-white transition"
                            onClick={() => { setViewMonth(new Date().getMonth()); setViewYear(new Date().getFullYear()); }}
                            title="Jump to today"
                        >
                            {MONTHS[viewMonth]} {viewYear}
                        </button>
                        <button
                            onClick={nextMonth}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition text-small"
                        >
                            ›
                        </button>
                    </div>

                    <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                        {DAYS.map((d) => (
                            <div key={d} className="text-center text-xsmall font-semibold text-white/20 uppercase tracking-wider py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
                        {cells.map(({ date, isCurrentMonth }, i) => {
                            const isToday = date.getTime() === today.getTime();
                            const isSelected =
                                selectedDate &&
                                date.getFullYear() === selectedDate.getFullYear() &&
                                date.getMonth() === selectedDate.getMonth() &&
                                date.getDate() === selectedDate.getDate();
                            const isPast = isCurrentMonth && date < today;

                            return (
                                <button
                                    key={i}
                                    onClick={() => selectDate(date)}
                                    className={`
                                        relative w-full aspect-square flex items-center justify-center rounded-lg text-xsmall transition-all
                                        ${!isCurrentMonth ? 'text-white/10 hover:text-white/20' : ''}
                                        ${isCurrentMonth && !isSelected && !isToday ? 'text-white/60 hover:bg-white/8 hover:text-white' : ''}
                                        ${isPast && !isSelected ? 'text-white/30' : ''}
                                        ${isToday && !isSelected ? 'text-accent-blue font-semibold' : ''}
                                        ${isSelected ? 'bg-accent-blue text-white font-semibold shadow-[0_0_12px_rgba(59,130,246,0.4)]' : ''}
                                    `}
                                >
                                    {isToday && !isSelected && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-blue" />
                                    )}
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="px-3 pb-3 flex gap-2">
                        <button
                            onClick={() => selectDate(today)}
                            className="flex-1 py-1.5 rounded-lg bg-dark-surface-2 hover:bg-dark-surface-3 border border-dark-border text-xsmall text-white/40 hover:text-white/70 transition"
                        >
                            Today
                        </button>
                        {selectedDate && onClear && (
                            <button
                                onClick={() => { onClear(); setOpen(false); }}
                                className="flex-1 py-1.5 rounded-lg bg-dark-surface-2 hover:bg-accent-red/10 border border-dark-border hover:border-accent-red/30 text-xsmall text-white/40 hover:text-accent-red transition"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

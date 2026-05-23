import { useRef, useEffect } from 'react';
import { CardLabel } from './types';
import { LABEL_COLORS, getContrastColor } from './utils';
import CheckIcon from '@public/icons/small/check.svg';
import CloseIcon from '@public/icons/small/cancel.svg';

interface LabelPopoverProps {
    cardLabels: CardLabel[];
    activeLabels: CardLabel[];
    onToggle: (label: CardLabel) => void;
    onDelete: (labelId: string) => void;
    onClose: () => void;
    creatingLabel: boolean;
    setCreatingLabel: (v: boolean) => void;
    newName: string;
    setNewName: (v: string) => void;
    newColor: string | null;
    setNewColor: (v: string | null) => void;
    saving: boolean;
    onCreate: () => void;
}

export const LabelPopover = ({
    cardLabels,
    activeLabels,
    onToggle,
    onDelete,
    onClose,
    creatingLabel,
    setCreatingLabel,
    newName,
    setNewName,
    newColor,
    setNewColor,
    saving,
    onCreate,
}: LabelPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div
            ref={popoverRef}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-dark-surface-1 border border-dark-border rounded-2xl shadow-2xl z-50 overflow-hidden"
        >
            {!creatingLabel ? (
                <>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border">
                        <span className="text-xsmall font-semibold text-white/60">Labels</span>
                        <button
                            onClick={onClose}
                            className="text-dark-primary hover:text-dark-secondary transition cursor-pointer"
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className="p-2 max-h-52 overflow-y-auto space-y-0.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-thumb]:rounded-full">
                        {cardLabels.length === 0 && (
                            <p className="text-xsmall text-white/20 text-center py-4">No labels yet</p>
                        )}
                        {cardLabels.map((label) => {
                            const active = activeLabels.some((l) => l.card_label_id === label.card_label_id);
                            const hex = label.color?.card_label_color_hex || '#7B7B7B';
                            return (
                                <div
                                    key={label.card_label_id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg group/lbl hover:bg-white/[0.04] transition"
                                >
                                    <button
                                        onClick={() => onToggle(label)}
                                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                                    >
                                        <span
                                            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                                active ? 'border-transparent bg-dark-surface-3' : 'border-dark-secondary bg-transparent'
                                            }`}
                                        >
                                            {active && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                                        </span>
                                        <span className="w-5 h-5 rounded-sm shrink-0" style={{ backgroundColor: hex }} />
                                        <span className="text-xsmall text-white/60 truncate flex-1">
                                            {label.card_label_name}
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(label.card_label_id); }}
                                        className="opacity-0 group-hover/lbl:opacity-100 w-5 h-5 flex items-center justify-center rounded text-white/20 hover:text-accent-red hover:bg-accent-red/10 transition text-xsmall shrink-0"
                                        title="Delete label"
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="px-2 pb-2 pt-1 border-t border-dark-border">
                        <button
                            onClick={() => setCreatingLabel(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-surface-2 hover:bg-dark-surface-3 border border-dark-border text-xsmall text-white/40 hover:text-white/60 transition"
                        >
                            <span className="text-normal leading-none">+</span>
                            <span>Create new label</span>
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-border">
                        <button
                            onClick={() => { setCreatingLabel(false); setNewName(''); setNewColor(null); }}
                            className="text-white/30 hover:text-white/60 transition text-small"
                        >
                            ←
                        </button>
                        <span className="text-xsmall font-semibold text-white/60">Create label</span>
                    </div>

                    <div className="p-4 space-y-4">
                        <div
                            className="w-fit py-1 px-3 rounded-full flex items-center transition-all"
                            style={newColor ? { backgroundColor: newColor } : { backgroundColor: 'rgba(255,255,255,0.04)' }}
                        >
                            <span
                                className="text-xsmall font-semibold truncate"
                                style={{ color: newColor ? getContrastColor(newColor) : 'rgba(255,255,255,0.3)' }}
                            >
                                {newName || 'Label preview'}
                            </span>
                        </div>

                        <div>
                            <label className="text-xsmall text-white/30 mb-1.5 block uppercase tracking-wider">Name</label>
                            <input
                                autoFocus
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }}
                                placeholder="Label name..."
                                className="w-full bg-dark-surface-2 border border-dark-border rounded-lg px-3 py-2 text-small text-white placeholder-white/20 focus:outline-none focus:border-dark-border-focus transition"
                            />
                        </div>

                        <div>
                            <label className="text-xsmall text-white/30 mb-1.5 block uppercase tracking-wider">Color</label>
                            <div className="grid grid-cols-5 gap-1.5">
                                {LABEL_COLORS.map((c) => (
                                    <button
                                        key={c.name}
                                        onClick={() => setNewColor(c.hex)}
                                        className="w-full aspect-square rounded-lg transition-all relative"
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    >
                                        {newColor === c.hex && (
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <CheckIcon className="w-3 h-3 text-white drop-shadow" />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={onCreate}
                                disabled={!newName.trim() || !newColor || saving}
                                className="flex-1 px-3 py-2 bg-accent-blue rounded-lg text-xsmall font-semibold text-white hover:bg-opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                                {saving ? 'Creating...' : 'Create'}
                            </button>
                            <button
                                onClick={() => { setCreatingLabel(false); setNewName(''); setNewColor(null); }}
                                className="px-3 py-2 border border-dark-border rounded-lg text-xsmall text-white/40 hover:text-white hover:bg-white/5 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

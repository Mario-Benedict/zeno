import { useState, useRef, useEffect } from 'react';

interface AddBoardInputProps {
    onAdd: (name: string) => void;
    onCancel: () => void;
}

export const AddBoardInput = ({ onAdd, onCancel }: AddBoardInputProps) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleAdd = () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        onAdd(trimmed);
        setName('');
    };

    return (
        <div className="shrink-0 w-70 bg-dark-surface-2 rounded-2xl p-4">
            <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') onCancel();
                }}
                placeholder="Board name..."
                className="w-full bg-dark-input border border-dark-border-focus rounded-xl px-3 py-2 text-sm text-white placeholder-dark-secondary focus:outline-none mb-2"
            />
            <div className="flex gap-2">
                <button
                    onClick={handleAdd}
                    disabled={!name.trim()}
                    className="flex-1 py-1.5 bg-accent-blue rounded-lg text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    Add Board
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-1.5 border border-dark-border rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/5 transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

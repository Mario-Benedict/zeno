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
    <div className="w-70 shrink-0 rounded-2xl bg-dark-surface-2 p-4">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Board name..."
        className="mb-2 w-full rounded-xl border border-dark-border-focus bg-dark-input px-3 py-2 text-sm text-white placeholder-dark-secondary focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="flex-1 rounded-lg bg-accent-blue py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add Board
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-dark-border py-1.5 text-xs text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

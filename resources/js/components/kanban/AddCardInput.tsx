import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface AddCardInputProps {
  onAdd: (title: string) => void;
  onCancel: () => void;
}

export const AddCardInput = ({ onAdd, onCancel }: AddCardInputProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAdd = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
    // Stay open and focused so multiple cards can be added back-to-back —
    // only Escape or clicking away closes the composer.
    inputRef.current?.focus();
  };

  return (
    <div className="shrink-0 px-3 pb-3">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={onCancel}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={t('kanban.cardTitlePlaceholder')}
        className="w-full rounded-xl border border-dark-border-focus bg-dark-input px-3 py-2 text-small text-dark-primary placeholder-dark-secondary focus:outline-none"
      />
    </div>
  );
};

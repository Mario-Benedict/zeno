import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { CreateKanbanCardChecklistItemInput } from '@/types/kanban';
import RemoveIcon from '@public/icons/small/cancel.svg';
import CheckboxIcon from '@public/icons/small/checkbox.svg';
import PlusIcon from '@public/icons/small/plus.svg';

interface AddCardChecklistFieldProps {
  items: CreateKanbanCardChecklistItemInput[];
  onChange: (items: CreateKanbanCardChecklistItemInput[]) => void;
}

const MAX_CHECKLIST_ITEMS = 50;

const AddCardChecklistField = ({
  items,
  onChange,
}: AddCardChecklistFieldProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const addItem = () => {
    const name = draft.trim();
    if (!name || items.length >= MAX_CHECKLIST_ITEMS) return;

    onChange([...items, { id: crypto.randomUUID(), name }]);
    setDraft('');
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-xsmall font-semibold text-dark-secondary">
          {t('kanban.checklist')}
        </p>
        <p className="mt-0.5 text-micro text-dark-secondary/70">
          {t('kanban.checklistItemsHelp')}
        </p>
      </div>

      {items.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-1 px-3 py-2"
            >
              <CheckboxIcon className="h-4 w-4 shrink-0 text-dark-secondary" />
              <span className="min-w-0 flex-1 truncate text-xsmall text-dark-primary">
                {item.name}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    items.filter((candidate) => candidate.id !== item.id),
                  )
                }
                aria-label={t('kanban.removeChecklistItem', {
                  name: item.name,
                })}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-dark-secondary transition hover:bg-accent-red/10 hover:text-accent-red"
              >
                <RemoveIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          maxLength={255}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addItem();
            }
          }}
          placeholder={t('kanban.addAnItem')}
          className="h-10 min-w-0 flex-1 rounded-xl border border-dark-border bg-dark-input px-3 text-small text-dark-primary transition outline-none placeholder:text-dark-secondary focus:border-dark-border-focus"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!draft.trim() || items.length >= MAX_CHECKLIST_ITEMS}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-dark-border px-3 text-xsmall font-semibold text-dark-primary transition hover:bg-dark-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {t('common.add')}
        </button>
      </div>
    </div>
  );
};

export default AddCardChecklistField;

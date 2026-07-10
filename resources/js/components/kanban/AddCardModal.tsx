import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { KanbanBoard, CardLabel } from '@/types/kanban';

interface AddCardModalProps {
  boards: KanbanBoard[];
  cardLabels: CardLabel[];
  defaultBoardId: string;
  onClose: () => void;
  onSubmit: (
    boardId: string,
    title: string,
    labelIds: string[],
  ) => Promise<void>;
}

export const AddCardModal = ({
  cardLabels,
  defaultBoardId,
  onClose,
  onSubmit,
}: AddCardModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [boardId] = useState(defaultBoardId);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId],
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await onSubmit(boardId, title.trim(), selectedLabelIds);
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-dark-border bg-dark-surface-2 p-5 shadow-2xl">
        <h3 className="mb-4 text-base font-bold text-white">
          {t('kanban.addNewCard')}
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-white/50">
              {t('kanban.cardTitleLabel')}
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={t('kanban.cardTitlePlaceholder')}
              className="w-full rounded-xl border border-dark-border bg-dark-input px-3 py-2 text-sm text-white placeholder-dark-secondary transition focus:border-dark-border-focus focus:outline-none"
            />
          </div>
          {(cardLabels || []).length > 0 && (
            <div>
              <label className="mb-1 block text-xs text-white/50">
                {t('kanban.labelsLabel')}
              </label>
              <div className="flex flex-wrap gap-2">
                {cardLabels.map((label) => {
                  const active = selectedLabelIds.includes(label.card_label_id);
                  const hexColor = label.card_label_color_hex || '#7B7B7B';

                  return (
                    <button
                      key={label.card_label_id}
                      onClick={() => toggleLabel(label.card_label_id)}
                      className="rounded-lg border px-2.5 py-1 text-micro font-semibold transition"
                      style={
                        active
                          ? {
                              backgroundColor: hexColor + '33',
                              color: hexColor,
                              borderColor: hexColor + '66',
                            }
                          : {
                              backgroundColor: 'transparent',
                              color: '#ffffff40',
                              borderColor: '#ffffff15',
                            }
                      }
                    >
                      {label.card_label_name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-dark-border py-2 text-sm text-white/50 transition hover:bg-white/5 hover:text-white"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            className="hover:bg-opacity-90 flex-1 rounded-xl bg-accent-blue py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? t('kanban.adding') : t('kanban.addCard')}
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import type { KanbanBoard, CardLabel } from '@/types/kanban';

interface AddCardModalProps {
    boards: KanbanBoard[];
    cardLabels: CardLabel[];
    defaultBoardId: string;
    onClose: () => void;
    onSubmit: (boardId: string, title: string, labelIds: string[]) => Promise<void>;
}

export const AddCardModal = ({
    cardLabels,
    defaultBoardId,
    onClose,
    onSubmit,
}: AddCardModalProps) => {
    const [title, setTitle] = useState('');
    const [boardId] = useState(defaultBoardId);
    const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggleLabel = (labelId: string) => {
        setSelectedLabelIds((prev) =>
            prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-dark-surface-2 border border-dark-border rounded-2xl w-full max-w-sm p-5 shadow-2xl">
                <h3 className="text-base font-bold mb-4 text-white">Add New Card</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-white/50 mb-1 block">Title</label>
                        <input
                            autoFocus
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Card title..."
                            className="w-full bg-dark-input border border-dark-border rounded-xl px-3 py-2 text-sm text-white placeholder-dark-secondary focus:outline-none focus:border-dark-border-focus transition"
                        />
                    </div>
                    {(cardLabels || []).length > 0 && (
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Labels</label>
                            <div className="flex flex-wrap gap-2">
                                {cardLabels.map((label) => {
                                    const active = selectedLabelIds.includes(label.card_label_id);
                                    const hexColor = label.color?.card_label_color_hex || '#7B7B7B';

                                    return (
                                        <button
                                            key={label.card_label_id}
                                            onClick={() => toggleLabel(label.card_label_id)}
                                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition"
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
                <div className="flex gap-2 mt-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-xl border border-dark-border text-sm text-white/50 hover:text-white hover:bg-white/5 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim() || loading}
                        className="flex-1 py-2 rounded-xl bg-accent-blue hover:bg-opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
                    >
                        {loading ? 'Adding...' : 'Add Card'}
                    </button>
                </div>
            </div>
        </div>
    );
};

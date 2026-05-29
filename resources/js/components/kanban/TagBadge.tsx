import type { CardLabelColor } from '@/types/kanban';
import { getContrastColor } from '@/utils/kanban';

interface TagBadgeProps {
  label?: string | null;
  color?: CardLabelColor | null;
}

export const TagBadge = ({ label, color }: TagBadgeProps) => {
  if (!label || !color?.card_label_color_hex) {
    return null;
  }
  return (
    <span
      className="rounded-full px-3 py-0.5 text-[10px] font-semibold text-white"
      style={{
        backgroundColor: color.card_label_color_hex,
        color: getContrastColor(color.card_label_color_hex),
      }}
      title={label}
    >
      {label}
    </span>
  );
};

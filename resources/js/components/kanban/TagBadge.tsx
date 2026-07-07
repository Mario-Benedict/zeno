import { getContrastColor } from '@/utils/kanban';

interface TagBadgeProps {
  label?: string | null;
  colorHex?: string | null;
}

export const TagBadge = ({ label, colorHex }: TagBadgeProps) => {
  if (!label || !colorHex) {
    return null;
  }
  return (
    <span
      className="rounded-full px-3 py-0.5 text-micro font-semibold text-white"
      style={{
        backgroundColor: colorHex,
        color: getContrastColor(colorHex),
      }}
      title={label}
    >
      {label}
    </span>
  );
};

import { CardLabelColor } from './types';
import { getContrastColor } from './utils'

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
            className="text-[10px] font-semibold px-3 py-0.5 rounded-full text-white"
            style={{ backgroundColor: color.card_label_color_hex, color: getContrastColor(color.card_label_color_hex)}}
            title={label}
        >
            {label}
        </span>
    );
};

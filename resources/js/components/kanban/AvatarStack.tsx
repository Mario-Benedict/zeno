import type { User } from './types';
import { generateInitials, MEMBER_COLORS } from './utils';

interface AvatarStackProps {
    members?: User[];
}

export const AvatarStack = ({ members }: AvatarStackProps) => {
    if (!members?.length) return null;
    return (
        <div className="flex justify-end -space-x-1.5">
            {members.slice(0, 4).map((member, i) => (
                <div
                    key={member.id}
                    className="w-7 h-7 rounded-full border-2 border-dark-surface-3 text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                    title={member.name}
                >
                    {generateInitials(member.name)}
                </div>
            ))}
        </div>
    );
};

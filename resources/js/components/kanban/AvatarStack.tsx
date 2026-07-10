import type { KanbanUser } from '@/types/kanban';
import { generateInitials, memberColor } from '@/utils/kanban';

interface AvatarStackProps {
  members?: KanbanUser[];
}

export const AvatarStack = ({ members }: AvatarStackProps) => {
  if (!members?.length) return null;
  return (
    <div className="flex justify-end -space-x-1.5">
      {members.slice(0, 4).map((member) => (
        <div
          key={member.id}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-dark-surface-3 text-micro font-bold text-white"
          style={{ backgroundColor: memberColor(member.id) }}
          title={member.name}
        >
          {generateInitials(member.name)}
        </div>
      ))}
    </div>
  );
};

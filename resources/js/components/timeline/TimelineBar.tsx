import { AvatarStack, TagBadge } from '@/components/kanban';
import type { TimelineTask } from '@/types/timeline';
import {
  BAR_HEIGHT,
  getTaskAccentColor,
  isTaskOverdue,
} from '@/utils/timeline';

interface TimelineBarProps {
  task: TimelineTask;
  left: number;
  top: number;
  width: number;
  onOpenCard: (task: TimelineTask) => void;
}

/**
 * A single task rendered as a horizontal bar. Clicking it opens the (reused)
 * Kanban card-detail modal, where start / due dates and their times are
 * edited. There is no drag, resize, or kebab menu on the timeline itself.
 */
export const TimelineBar = ({
  task,
  left,
  top,
  width,
  onOpenCard,
}: TimelineBarProps) => {
  const accent = getTaskAccentColor(task);
  const overdue = isTaskOverdue(task);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenCard(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenCard(task);
        }
      }}
      style={{ left, top, width, height: BAR_HEIGHT, borderLeftColor: accent }}
      className={`group absolute flex cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-l-4 bg-dark-surface-2 pr-2.5 shadow-md transition-all hover:-translate-y-px hover:shadow-xl ${
        overdue
          ? 'border-accent-red/40 ring-1 ring-accent-red/40'
          : 'border-dark-border'
      } ${task.isCompleted ? 'opacity-60' : ''}`}
      title={task.title}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-2 pl-2.5">
        <span
          className={`truncate text-small font-semibold text-dark-primary ${
            task.isCompleted ? 'line-through' : ''
          }`}
        >
          {task.title}
        </span>
        {task.labels.length > 0 && (
          <div className="flex min-w-0 items-center gap-1 overflow-hidden">
            {task.labels.map((label) => (
              <TagBadge
                key={label.card_label_id}
                label={label.card_label_name}
                colorHex={label.card_label_color_hex}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0">
        <AvatarStack members={task.members} />
      </div>
    </div>
  );
};

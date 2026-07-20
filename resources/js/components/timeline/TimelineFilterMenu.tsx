import { useTranslation } from '@/hooks/useTranslation';
import type { CardLabel, KanbanBoard, KanbanUser } from '@/types/kanban';
import type { TimelineFilters } from '@/types/timeline';
import { generateInitials, memberColor } from '@/utils/kanban';
import TimelineFilterRow from './TimelineFilterRow';
import TimelineFilterSectionLabel from './TimelineFilterSectionLabel';

interface TimelineFilterMenuProps {
  cardLabels: CardLabel[];
  projectUsers: KanbanUser[];
  boards: KanbanBoard[];
  filters: TimelineFilters;
  onChange: (filters: TimelineFilters) => void;
}

const toggle = <T,>(list: T[], value: T): T[] =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

/**
 * Dropdown of every filterable dimension — Labels, Assignee and Status
 * (Kanban column). Selections are OR within a section, AND across sections;
 * the actual filtering lives in `filterTasks`.
 */
export const TimelineFilterMenu = ({
  cardLabels,
  projectUsers,
  boards,
  filters,
  onChange,
}: TimelineFilterMenuProps) => {
  const { t } = useTranslation();
  const hasFilters =
    filters.labelIds.length > 0 ||
    filters.memberIds.length > 0 ||
    filters.boardIds.length > 0;

  return (
    <div className="scrollbar-app absolute top-full right-0 z-40 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-dark-border bg-dark-surface-2 p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-small font-semibold text-dark-primary">
          {t('timeline.filter')}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={() =>
              onChange({ labelIds: [], memberIds: [], boardIds: [] })
            }
            className="text-xsmall text-dark-secondary transition hover:text-accent-red"
          >
            {t('timeline.clearAll')}
          </button>
        )}
      </div>

      {cardLabels.length > 0 && (
        <div className="mb-3">
          <TimelineFilterSectionLabel>
            {t('timeline.labels')}
          </TimelineFilterSectionLabel>
          <div className="space-y-0.5">
            {cardLabels.map((label) => {
              const hex = label.card_label_color_hex ?? '#7B7B7B';

              return (
                <TimelineFilterRow
                  key={label.card_label_id}
                  active={filters.labelIds.includes(label.card_label_id)}
                  onClick={() =>
                    onChange({
                      ...filters,
                      labelIds: toggle(filters.labelIds, label.card_label_id),
                    })
                  }
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="truncate text-xsmall text-dark-primary">
                      {label.card_label_name}
                    </span>
                  </span>
                </TimelineFilterRow>
              );
            })}
          </div>
        </div>
      )}

      {projectUsers.length > 0 && (
        <div className="mb-3">
          <TimelineFilterSectionLabel>
            {t('timeline.assignee')}
          </TimelineFilterSectionLabel>
          <div className="space-y-0.5">
            {projectUsers.map((user) => (
              <TimelineFilterRow
                key={user.id}
                active={filters.memberIds.includes(user.id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    memberIds: toggle(filters.memberIds, user.id),
                  })
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-micro font-bold text-white"
                    style={{
                      backgroundColor: memberColor(user.id),
                    }}
                  >
                    {generateInitials(user.name)}
                  </span>
                  <span className="truncate text-xsmall text-dark-primary">
                    {user.name}
                  </span>
                </span>
              </TimelineFilterRow>
            ))}
          </div>
        </div>
      )}

      {boards.length > 0 && (
        <div>
          <TimelineFilterSectionLabel>
            {t('timeline.status')}
          </TimelineFilterSectionLabel>
          <div className="space-y-0.5">
            {boards.map((board) => (
              <TimelineFilterRow
                key={board.kanban_board_id}
                active={filters.boardIds.includes(board.kanban_board_id)}
                onClick={() =>
                  onChange({
                    ...filters,
                    boardIds: toggle(filters.boardIds, board.kanban_board_id),
                  })
                }
              >
                <span className="truncate text-xsmall text-dark-primary">
                  {board.kanban_board_name}
                </span>
              </TimelineFilterRow>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

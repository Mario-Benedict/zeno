// ─── Timeline Domain Types ───────────────────────────────────────────────────
//
// The Timeline is an alternative visualisation of the project's Kanban tasks,
// so it deliberately consumes the same payload shape as the Kanban page
// (`@/types/kanban`) and reuses those components (AddCardModal,
// CardDetailModalWrapper, AvatarStack, TagBadge).

import type {
  CardLabel,
  KanbanBoard,
  KanbanBoardCard,
  KanbanProject,
  KanbanUser,
} from './kanban';

/** How rows are ordered vertically. `start` = earliest start date first. */
export type TimelineSortKey = 'start' | 'priority';

/**
 * Active filter selections. An empty array in a category means "no filter"
 * (show everything) rather than "show nothing".
 */
export interface TimelineFilters {
  labelIds: string[];
  memberIds: number[];
  boardIds: string[];
}

/**
 * A single Kanban card flattened into the shape the timeline renders. The
 * original `card` + `boardId` are kept so clicking a bar can hand straight
 * off to the reused Kanban card-detail modal without a second lookup.
 */
export interface TimelineTask {
  cardId: string;
  boardId: string;
  boardName: string;
  boardPosition: number;
  title: string;
  isCompleted: boolean;
  start: Date | null;
  due: Date | null;
  labels: CardLabel[];
  members: KanbanUser[];
  card: KanbanBoardCard;
}

/**
 * Props shared by `TimelineController::show`. Identical in spirit to
 * `KanbanProps` because the timeline reuses Kanban's create / detail modals,
 * which need `cardLabels`, `projectUsers` and `currentUser`.
 */
export interface TimelineProps {
  project: KanbanProject;
  kanbanBoards: KanbanBoard[];
  cardLabels: CardLabel[];
  projectUsers: KanbanUser[];
  currentUser: KanbanUser;
  [key: string]: unknown;
}

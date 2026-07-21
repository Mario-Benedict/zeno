import type { CardLabel } from '@/types/kanban';
import type { CurrentProject, ProjectRole } from '@/types/project';

/**
 * Lean label shape carried on a calendar event — mirrors the fields
 * `CalendarService::formatFullEvent()` picks off `App\Models\CardLabel`
 * (the same project-scoped labels Kanban cards use).
 */
export interface CalendarEventLabel {
  card_label_id: string;
  card_label_name: string;
  card_label_color_hex: string;
}

export type CalendarRecurrence =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly';
export type CalendarViewMode = 'month' | 'week';

/** Filters every calendar entry by whether it belongs to the open project. */
export type CalendarEventSourceFilter = 'all' | 'own' | 'other';

export interface CalendarMember {
  id: number;
  name: string;
  email: string;
  color: string;
  checked: boolean;
}

export interface CalendarParticipant {
  id: number;
  name: string;
}

export interface CalendarEventBase {
  id: string;
  start_time: string;
  end_time: string;
  participants: CalendarParticipant[];
}

export interface CalendarEventFull extends CalendarEventBase {
  project_id: string;
  title: string;
  description: string | null;
  labels: CalendarEventLabel[];
  recurrence: CalendarRecurrence;
  recurrence_group_id: string | null;
  /** "Ends on" date (YYYY-MM-DD) — `null` means the recurrence never ends. */
  recurrence_end_date: string | null;
  created_by: number;
  original_event_id?: string;
  is_recurring_instance?: boolean;
  is_classified: false;
  /** True only for a Kanban-card-derived entry — see `CalendarKanbanTask`. */
  is_kanban_task?: false;
  is_completed?: boolean;
}

export interface CalendarEventClassified extends CalendarEventBase {
  is_classified: true;
  /**
   * The event creator's `calendar_visibility` preference. `masked` and
   * `busy_only` currently render identically (a generic classified card) —
   * kept as a separate value since it's still a distinct user preference.
   */
  visibility: 'masked' | 'busy_only';
  /**
   * True when this classified block came from a Kanban card's due date
   * (another project) rather than a manually-created CalendarEvent — lets
   * the "this project vs other project" task filter tell them apart even
   * though neither carries a `project_id`.
   */
  is_kanban_task?: boolean;
}

/**
 * A Kanban card with an assignee and a start/due date, surfaced on the
 * calendar (`CalendarService::getAssignedKanbanTasks()`). Structurally a
 * `CalendarEventFull` — every existing render path (month/week grid,
 * mini-calendar dots, the detail modal) already knows how to display one —
 * plus the extra fields needed to keep it read-only and link back to the
 * board instead of Calendar's own edit form.
 */
export interface CalendarKanbanTask extends Omit<
  CalendarEventFull,
  'is_kanban_task'
> {
  is_kanban_task: true;
  is_completed: boolean;
  kanban_board_card_id: string;
  kanban_board_id: string;
  kanban_board_name: string;
}

export type AnyCalendarEvent =
  | CalendarEventFull
  | CalendarEventClassified
  | CalendarKanbanTask;

export interface CalendarProps {
  project: CurrentProject;
  projectRole: ProjectRole | null;
  projectUsers: Omit<CalendarMember, 'checked'>[];
  cardLabels: CardLabel[];
  currentUser: {
    id: number;
    name: string;
    email: string;
  };
  initialDate?: string | null;
  activeEventId?: string | null;
  [key: string]: unknown;
}

import type { CurrentProject, ProjectRole } from '@/types/project';

export type CalendarPriority = 'low' | 'mid' | 'high';
export type CalendarRecurrence = 'none' | 'weekly';
export type CalendarViewMode = 'month' | 'week';

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
  priority: CalendarPriority;
  recurrence: CalendarRecurrence;
  recurrence_group_id: string | null;
  created_by: number;
  original_event_id?: string;
  is_recurring_instance?: boolean;
  is_classified: false;
}

export interface CalendarEventClassified extends CalendarEventBase {
  is_classified: true;
}

export type AnyCalendarEvent = CalendarEventFull | CalendarEventClassified;

export interface CalendarProps {
  project: CurrentProject;
  projectRole: ProjectRole | null;
  projectUsers: Omit<CalendarMember, 'checked'>[];
  currentUser: {
    id: number;
    name: string;
    email: string;
  };
  [key: string]: unknown;
}

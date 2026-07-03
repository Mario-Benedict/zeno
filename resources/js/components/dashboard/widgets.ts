export type WidgetId =
  | 'kanban'
  | 'chat'
  | 'notes'
  | 'calendar'
  | 'reminders'
  | 'pomodoro';

export interface WidgetDefinition {
  id: WidgetId;
  name: string;
  available: boolean;
}

/**
 * Registry of widgets that can be assigned to a dashboard slot.
 * `available: false` widgets show up in the picker as "coming soon" and
 * can't be selected yet — add the real implementation, then flip this flag.
 */
export const WIDGETS: WidgetDefinition[] = [
  { id: 'kanban', name: 'Kanban Board', available: true },
  { id: 'chat', name: 'Chat', available: false },
  { id: 'notes', name: 'Notes', available: false },
  { id: 'calendar', name: 'Calendar', available: false },
  { id: 'reminders', name: 'Reminders', available: false },
  { id: 'pomodoro', name: 'Pomodoro', available: false },
];

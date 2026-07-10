export type WidgetId =
  | 'kanban'
  | 'chat'
  | 'notes'
  | 'calendar'
  | 'reminders'
  | 'pomodoro';

export interface WidgetDefinition {
  id: WidgetId;
  available: boolean;
}

/**
 * Registry of widgets that can be assigned to a dashboard slot.
 * `available: false` widgets show up in the picker as "coming soon" and
 * can't be selected yet — add the real implementation, then flip this flag.
 */
export const WIDGETS: WidgetDefinition[] = [
  { id: 'kanban', available: true },
  { id: 'chat', available: true },
  { id: 'notes', available: true },
  { id: 'calendar', available: false },
  { id: 'reminders', available: false },
  { id: 'pomodoro', available: false },
];

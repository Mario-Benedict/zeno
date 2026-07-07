// ─── Reminders Domain Types ─────────────────────────────────────────────────

export interface ReminderStep {
  reminder_step_id: string;
  reminder_id: string;
  reminder_step_name: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  reminder_id: string;
  reminder_project_id: string;
  reminder_user_id: number;
  reminder_title: string;
  reminder_description: string | null;
  reminder_due_at: string | null;
  is_completed: boolean;
  is_pinned: boolean;
  source: 'manual' | 'kanban';
  kanban_board_card_id: string | null;
  steps?: ReminderStep[];
  created_at: string;
  updated_at: string;
}

export interface PomodoroSettings {
  focus_minutes: number;
  break_minutes: number;
}

export interface RemindersPageProps {
  reminders: Reminder[];
  pomodoroSettings: PomodoroSettings | null;
  [key: string]: unknown;
}

export interface NotificationInboxItem {
  reminder_id: string;
  title: string;
  due_at: string | null;
  is_overdue: boolean;
}

export interface NotificationChatItem {
  id: string;
  type: 'group' | 'dm';
  name: string | null;
  participants: { id: string; name: string }[];
  unread_count: number;
}

export interface NotificationInboxResponse {
  inbox: NotificationInboxItem[];
  chat: NotificationChatItem[];
}

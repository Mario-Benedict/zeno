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
  activeReminderId: string | null;
  [key: string]: unknown;
}

export type NotificationInboxItem =
  | {
      type: 'reminder';
      reminder_id: string;
      title: string;
      due_at: string | null;
      is_overdue: boolean;
    }
  | {
      type: 'assignment';
      id: string;
      card_title: string | null;
      kanban_board_card_id: string;
    };

export interface NotificationChatItem {
  id: string;
  type: 'group' | 'dm';
  name: string | null;
  participants: { id: string; name: string }[];
  unread_count: number;
  lastMessage: {
    body: string;
    senderName: string;
    createdAt: string;
  } | null;
}

/**
 * One row from `task_conflicts`, shaped differently depending on which side
 * of the conflict the current user is on — `role: 'assignee'` means they
 * need to respond Yes/No, `role: 'assigner'` means they're seeing a decline
 * alert for a task they assigned.
 */
export type NotificationConflictItem =
  | {
      id: string;
      role: 'assignee';
      card_title: string | null;
      conflicting_title: string;
      conflicting_start: string;
      conflicting_end: string;
    }
  | {
      id: string;
      role: 'assigner';
      card_title: string | null;
      assignee_name: string | null;
    };

export interface NotificationInboxResponse {
  inbox: NotificationInboxItem[];
  chat: NotificationChatItem[];
  conflicts: NotificationConflictItem[];
}

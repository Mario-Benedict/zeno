import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import reminders from '@/routes/reminders';
import type { Reminder } from '@/types/reminder';
import { RemindersWidgetDetail } from './RemindersWidgetDetail';
import { RemindersWidgetList } from './RemindersWidgetList';
import { WidgetSearchHeader } from './WidgetSearchHeader';

interface Props {
  reminders: Reminder[];
}

/**
 * Compact reminders view for a dashboard slot — not the full reminders
 * page. Read-only apart from toggling a reminder's completed state (the
 * one interaction, matching the Kanban widget's "mark as done"); no
 * create/edit/delete/pin-toggle, no steps editing, and deliberately no
 * alarm/notification mechanism — this is a glance-and-check-off view.
 */
export const RemindersWidget = ({ reminders: initialReminders }: Props) => {
  const { project, accountIndex } = useProject();
  const { t } = useTranslation();
  const [reminderList, setReminderList] =
    useState<Reminder[]>(initialReminders);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selected =
    reminderList.find((r) => r.reminder_id === selectedId) ?? null;

  const toggleComplete = (reminder: Reminder) => {
    const newValue = !reminder.is_completed;
    setReminderList((prev) =>
      prev.map((r) =>
        r.reminder_id === reminder.reminder_id
          ? { ...r, is_completed: newValue }
          : r,
      ),
    );

    router.patch(
      reminders.update.url({
        accountIndex,
        project: project.project_slug,
        reminder: reminder.reminder_id,
      }),
      { is_completed: newValue },
      {
        preserveScroll: true,
        preserveState: true,
        onError: () => console.error('Failed to toggle reminder'),
      },
    );
  };

  const filteredReminders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return reminderList;

    return reminderList.filter((r) =>
      r.reminder_title.toLowerCase().includes(query),
    );
  }, [reminderList, searchQuery]);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      <WidgetSearchHeader
        title={t('reminders.title')}
        countLabel={t(
          reminderList.length === 1
            ? 'dashboard.reminderCount'
            : 'dashboard.reminderCountPlural',
          { count: reminderList.length },
        )}
        searchOpen={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onOpenSearch={() => setSearchOpen(true)}
        onCloseSearch={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        searchLabel={t('dashboard.searchReminders')}
        placeholder={t('dashboard.searchRemindersPlaceholder')}
      />

      <RemindersWidgetList
        reminders={filteredReminders}
        onToggleComplete={toggleComplete}
        onSelectReminder={(reminder) => setSelectedId(reminder.reminder_id)}
      />

      {selected && (
        <RemindersWidgetDetail
          reminder={selected}
          onClose={() => setSelectedId(null)}
          onToggleComplete={toggleComplete}
        />
      )}
    </div>
  );
};

import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
  AddReminderModal,
  NoReminderSelected,
  PomodoroTimer,
  ReminderDetailPanel,
  ReminderList,
} from '@/components/reminders';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import pomodoro from '@/routes/pomodoro';
import reminders from '@/routes/reminders';
import type {
  PomodoroSettings,
  Reminder,
  RemindersPageProps,
} from '@/types/reminder';
import ArrowLeftIcon from '@public/icons/small/arrow_left.svg';

// All write operations use Inertia's `router` with `preserveState` +
// `preserveScroll` so the page's own optimistic local state drives the UI,
// matching the pattern used on the Kanban page.
const inertiaWriteOptions = {
  preserveScroll: true,
  preserveState: true,
} as const;

export default function RemindersPage({
  reminders: initialReminders,
  pomodoroSettings,
}: RemindersPageProps) {
  const { t } = useTranslation();
  const { project, accountIndex } = useProject();
  const [reminderList, setReminderList] =
    useState<Reminder[]>(initialReminders);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('reminder'),
  );
  const [addModalOpen, setAddModalOpen] = useState(false);

  const selected =
    reminderList.find((r) => r.reminder_id === selectedId) ?? null;

  const updateLocal = (id: string, patch: Partial<Reminder>) => {
    setReminderList((prev) =>
      prev.map((r) => (r.reminder_id === id ? { ...r, ...patch } : r)),
    );
  };

  const handleToggleComplete = (reminder: Reminder) => {
    const newValue = !reminder.is_completed;
    updateLocal(reminder.reminder_id, { is_completed: newValue });

    router.patch(
      reminders.update.url({
        accountIndex,
        project: project.project_slug,
        reminder: reminder.reminder_id,
      }),
      { is_completed: newValue },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to toggle reminder'),
      },
    );
  };

  const handleTogglePin = (reminder: Reminder) => {
    updateLocal(reminder.reminder_id, { is_pinned: !reminder.is_pinned });

    router.patch(
      reminders.togglePin.url({
        accountIndex,
        project: project.project_slug,
        reminder: reminder.reminder_id,
      }),
      {},
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to pin reminder'),
      },
    );
  };

  const handleAddReminder = async (title: string, dueAt: string | null) => {
    const reminderId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimistic: Reminder = {
      reminder_id: reminderId,
      reminder_project_id: project.project_id,
      reminder_user_id: 0,
      reminder_title: title,
      reminder_description: null,
      reminder_due_at: dueAt,
      is_completed: false,
      is_pinned: false,
      source: 'manual',
      kanban_board_card_id: null,
      steps: [],
      created_at: now,
      updated_at: now,
    };

    setReminderList((prev) => [optimistic, ...prev]);
    setAddModalOpen(false);
    setSelectedId(reminderId);

    router.post(
      reminders.store.url({ accountIndex, project: project.project_slug }),
      {
        reminder_id: reminderId,
        reminder_title: title,
        reminder_due_at: dueAt,
      },
      {
        ...inertiaWriteOptions,
        onError: (errors) => {
          setReminderList((prev) =>
            prev.filter((r) => r.reminder_id !== reminderId),
          );
          console.error('Failed to add reminder', errors);
          alert(t('common.somethingWentWrong'));
        },
      },
    );
  };

  const handleUpdateTitle = (title: string) => {
    if (!selected) return;
    updateLocal(selected.reminder_id, { reminder_title: title });

    router.patch(
      reminders.update.url({
        accountIndex,
        project: project.project_slug,
        reminder: selected.reminder_id,
      }),
      { reminder_title: title },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to update title'),
      },
    );
  };

  const handleUpdateDescription = (description: string | null) => {
    if (!selected) return;
    updateLocal(selected.reminder_id, { reminder_description: description });

    router.patch(
      reminders.update.url({
        accountIndex,
        project: project.project_slug,
        reminder: selected.reminder_id,
      }),
      { reminder_description: description },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to update description'),
      },
    );
  };

  const handleUpdateDueAt = (dueAt: string | null) => {
    if (!selected) return;
    updateLocal(selected.reminder_id, { reminder_due_at: dueAt });

    router.patch(
      reminders.update.url({
        accountIndex,
        project: project.project_slug,
        reminder: selected.reminder_id,
      }),
      { reminder_due_at: dueAt },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to update due date'),
      },
    );
  };

  const handleAddStep = (name: string) => {
    if (!selected) return;
    const stepId = crypto.randomUUID();
    const now = new Date().toISOString();

    updateLocal(selected.reminder_id, {
      steps: [
        ...(selected.steps || []),
        {
          reminder_step_id: stepId,
          reminder_id: selected.reminder_id,
          reminder_step_name: name,
          is_completed: false,
          position: (selected.steps || []).length,
          created_at: now,
          updated_at: now,
        },
      ],
    });

    router.post(
      reminders.steps.store.url({
        accountIndex,
        project: project.project_slug,
        reminder: selected.reminder_id,
      }),
      { reminder_step_id: stepId, reminder_step_name: name },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to add step'),
      },
    );
  };

  const handleToggleStep = (stepId: string, current: boolean) => {
    if (!selected) return;
    updateLocal(selected.reminder_id, {
      steps: (selected.steps || []).map((s) =>
        s.reminder_step_id === stepId ? { ...s, is_completed: !current } : s,
      ),
    });

    router.patch(
      reminders.steps.update.url({
        accountIndex,
        project: project.project_slug,
        reminder: selected.reminder_id,
        step: stepId,
      }),
      { is_completed: !current },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to toggle step'),
      },
    );
  };

  const handleDeleteStep = (stepId: string) => {
    if (!selected) return;
    updateLocal(selected.reminder_id, {
      steps: (selected.steps || []).filter(
        (s) => s.reminder_step_id !== stepId,
      ),
    });

    router.delete(
      reminders.steps.destroy.url({
        accountIndex,
        project: project.project_slug,
        reminder: selected.reminder_id,
        step: stepId,
      }),
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to delete step'),
      },
    );
  };

  const handleDeleteReminder = (reminder: Reminder) => {
    setReminderList((prev) =>
      prev.filter((r) => r.reminder_id !== reminder.reminder_id),
    );
    if (selectedId === reminder.reminder_id) setSelectedId(null);

    router.delete(
      reminders.destroy.url({
        accountIndex,
        project: project.project_slug,
        reminder: reminder.reminder_id,
      }),
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to delete reminder'),
      },
    );
  };

  const handleSavePomodoroSettings = (settings: PomodoroSettings) => {
    router.patch(
      pomodoro.settings.update.url({ accountIndex }),
      {
        focus_minutes: settings.focus_minutes,
        break_minutes: settings.break_minutes,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onError: () => console.error('Failed to save pomodoro settings'),
      },
    );
  };

  return (
    <AppLayout project={project}>
      <Head title={`${t('reminders.title')} - ${project.project_name}`} />

      <div className="flex h-full w-full gap-2 overflow-hidden p-2">
        <ReminderList
          reminders={reminderList}
          selectedReminderId={selectedId}
          onSelect={(r) => setSelectedId(r.reminder_id)}
          onToggleComplete={handleToggleComplete}
          onTogglePin={handleTogglePin}
          onDelete={handleDeleteReminder}
          onAddClick={() => setAddModalOpen(true)}
          className={selected ? 'max-md:hidden' : ''}
        />

        <div
          className={`flex flex-1 flex-col gap-3 overflow-hidden ${selected ? '' : 'max-md:hidden'}`}
        >
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-1.5 self-start rounded-lg px-2 py-1 text-small font-medium text-dark-secondary transition-colors hover:bg-dark-surface-2 hover:text-dark-primary md:hidden"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('common.back')}
          </button>

          <PomodoroTimer
            settings={pomodoroSettings}
            onSaveSettings={handleSavePomodoroSettings}
          />

          {selected ? (
            <ReminderDetailPanel
              reminder={selected}
              onClose={() => setSelectedId(null)}
              onToggleComplete={() => handleToggleComplete(selected)}
              onUpdateTitle={handleUpdateTitle}
              onUpdateDescription={handleUpdateDescription}
              onUpdateDueAt={handleUpdateDueAt}
              onAddStep={handleAddStep}
              onToggleStep={handleToggleStep}
              onDeleteStep={handleDeleteStep}
            />
          ) : (
            <NoReminderSelected />
          )}
        </div>
      </div>

      {addModalOpen && (
        <AddReminderModal
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleAddReminder}
        />
      )}
    </AppLayout>
  );
}

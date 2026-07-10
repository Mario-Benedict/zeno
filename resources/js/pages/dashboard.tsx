import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { TemplatePicker } from '@/components/dashboard/TemplatePicker';
import type { TemplateId } from '@/components/dashboard/templates';
import type { WidgetId } from '@/components/dashboard/widgets';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import { projectPath } from '@/lib/accountRoutes';
import type { ChatParticipant, ChatRoom } from '@/types/chat';
import type { KanbanBoard } from '@/types/kanban';
import type { NoteListItem } from '@/types/notes';
import type { PomodoroSettings, Reminder } from '@/types/reminder';

interface DashboardSetting {
  template_id: TemplateId | null;
  slots: (WidgetId | null)[] | null;
}

interface KanbanWidgetData {
  kanbanBoards: KanbanBoard[];
}

interface ChatWidgetData {
  rooms: ChatRoom[];
  currentUser: ChatParticipant;
}

interface NotesWidgetData {
  notes: NoteListItem[];
}

interface CalendarWidgetData {
  currentUserId: number;
}

interface RemindersWidgetData {
  reminders: Reminder[];
}

interface AlarmWidgetData {
  settings: PomodoroSettings | null;
}

// Same shape as KanbanWidgetData — the Timeline widget is a read-only
// alternate visualisation of the same board/card tree.
type TimelineWidgetData = KanbanWidgetData;

interface Props {
  setting: DashboardSetting;
  kanbanWidgetData?: KanbanWidgetData;
  chatWidgetData?: ChatWidgetData;
  notesWidgetData?: NotesWidgetData;
  calendarWidgetData?: CalendarWidgetData;
  remindersWidgetData?: RemindersWidgetData;
  alarmWidgetData?: AlarmWidgetData;
  timelineWidgetData?: TimelineWidgetData;
}

export default function Dashboard({
  setting,
  kanbanWidgetData,
  chatWidgetData,
  notesWidgetData,
  calendarWidgetData,
  remindersWidgetData,
  alarmWidgetData,
  timelineWidgetData,
}: Props) {
  const { project, accountIndex } = useProject();
  const { t } = useTranslation();

  // Local state mirrors the server setting so the picker→grid transition is
  // instant (optimistic) without waiting for the Inertia round-trip.
  const [templateId, setTemplateId] = useState<TemplateId | null>(
    setting.template_id,
  );
  const [slots, setSlots] = useState<(WidgetId | null)[]>(setting.slots ?? []);

  const handleSelect = useCallback(
    (id: TemplateId) => {
      setTemplateId(id);
      setSlots([]);
      router.patch(
        projectPath(accountIndex, project.project_slug, '/dashboard'),
        { template_id: id },
        { preserveScroll: true, preserveState: true },
      );
    },
    [accountIndex, project.project_slug],
  );

  const handleChangeLayout = useCallback(() => {
    setTemplateId(null);
    setSlots([]);
    router.patch(
      projectPath(accountIndex, project.project_slug, '/dashboard'),
      { template_id: null },
      { preserveScroll: true, preserveState: true },
    );
  }, [accountIndex, project.project_slug]);

  const handleAssignWidget = useCallback(
    (index: number, widgetId: WidgetId | null) => {
      setSlots((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = widgetId;
        return next;
      });
      router.patch(
        projectPath(accountIndex, project.project_slug, '/dashboard/slots'),
        { index, widget: widgetId },
        { preserveScroll: true, preserveState: true },
      );
    },
    [accountIndex, project.project_slug],
  );

  return (
    <AppLayout project={project}>
      <Head title={`${t('dashboard.title')} - ${project.project_name}`} />

      <div className="flex h-full w-full flex-col overflow-hidden bg-dark-surface-1">
        {templateId === null ? (
          <TemplatePicker onSelect={handleSelect} />
        ) : (
          <DashboardGrid
            templateId={templateId}
            slots={slots}
            onChangeLayout={handleChangeLayout}
            onAssignWidget={handleAssignWidget}
            kanbanWidgetData={kanbanWidgetData}
            chatWidgetData={chatWidgetData}
            notesWidgetData={notesWidgetData}
            calendarWidgetData={calendarWidgetData}
            remindersWidgetData={remindersWidgetData}
            alarmWidgetData={alarmWidgetData}
            timelineWidgetData={timelineWidgetData}
          />
        )}
      </div>
    </AppLayout>
  );
}

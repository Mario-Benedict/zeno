import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { TemplatePicker } from '@/components/dashboard/TemplatePicker';
import type { TemplateId } from '@/components/dashboard/templates';
import type { WidgetId } from '@/components/dashboard/widgets';
import { useProject } from '@/hooks/useProject';
import AppLayout from '@/layouts/AppLayout';
import { projectPath } from '@/lib/accountRoutes';
import type { KanbanBoard } from '@/types/kanban';

interface DashboardSetting {
  template_id: TemplateId | null;
  slots: (WidgetId | null)[] | null;
}

interface KanbanWidgetData {
  kanbanBoards: KanbanBoard[];
}

interface Props {
  setting: DashboardSetting;
  kanbanWidgetData?: KanbanWidgetData;
}

export default function Dashboard({ setting, kanbanWidgetData }: Props) {
  const { project, accountIndex } = useProject();

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
      <Head title={`Dashboard - ${project.project_name}`} />

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
          />
        )}
      </div>
    </AppLayout>
  );
}

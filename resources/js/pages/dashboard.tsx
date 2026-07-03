import { Head, router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';
import { TemplatePicker } from '@/components/dashboard/TemplatePicker';
import { useProject } from '@/hooks/useProject';
import AppLayout from '@/layouts/AppLayout';
import { projectPath } from '@/lib/accountRoutes';
import type { TemplateId } from '@/components/dashboard/templates';

interface DashboardSetting {
  template_id: TemplateId | null;
  slots: unknown[] | null;
}

interface Props {
  setting: DashboardSetting;
}

export default function Dashboard({ setting }: Props) {
  const { project, accountIndex } = useProject();

  // Local state mirrors the server setting so the picker→grid transition is
  // instant (optimistic) without waiting for the Inertia round-trip.
  const [templateId, setTemplateId] = useState<TemplateId | null>(
    setting.template_id,
  );

  const handleSelect = useCallback(
    (id: TemplateId) => {
      setTemplateId(id);
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
    router.patch(
      projectPath(accountIndex, project.project_slug, '/dashboard'),
      { template_id: null },
      { preserveScroll: true, preserveState: true },
    );
  }, [accountIndex, project.project_slug]);

  return (
    <AppLayout project={project}>
      <Head title={`Dashboard - ${project.project_name}`} />

      <div className="flex h-full w-full flex-col overflow-hidden bg-dark-surface-1">
        {templateId === null ? (
          <TemplatePicker onSelect={handleSelect} />
        ) : (
          <DashboardGrid
            templateId={templateId}
            onChangeLayout={handleChangeLayout}
          />
        )}
      </div>
    </AppLayout>
  );
}

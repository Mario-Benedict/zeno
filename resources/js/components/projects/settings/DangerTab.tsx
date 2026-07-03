import { router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { projectPath } from '@/lib/accountRoutes';
import type { CurrentProject, ProjectRole } from '@/types';

const DangerTab = ({
  project,
  role,
  accountIndex,
}: {
  project: CurrentProject;
  role: ProjectRole | null;
  accountIndex: number;
}) => {
  const isOwner = role === 'OWNER';
  const [confirm, setConfirm] = useState<'delete' | 'leave' | null>(null);
  const [processing, setProcessing] = useState(false);

  const deleteProject = () => {
    setProcessing(true);
    router.delete(projectPath(accountIndex, project.project_slug), {
      onFinish: () => setProcessing(false),
    });
  };

  const leaveProject = () => {
    setProcessing(true);
    router.post(
      projectPath(accountIndex, project.project_slug, '/leave'),
      {},
      { onFinish: () => setProcessing(false) },
    );
  };

  return (
    <>
      <div>
        <h3 className="mb-5 text-normal font-semibold text-dark-primary">Danger Zone</h3>

        {isOwner ? (
          <div className="rounded-lg border border-status-error/25 bg-status-error/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-small font-semibold text-dark-primary">Delete this project</p>
                <p className="mt-1 text-xsmall leading-relaxed text-dark-secondary">
                  Permanently deletes{' '}
                  <strong className="font-semibold text-dark-primary">{project.project_name}</strong>{' '}
                  and all its data. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirm('delete')}
                disabled={processing}
                className="shrink-0 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-2 text-small font-semibold text-status-error transition-colors hover:bg-status-error/20 disabled:opacity-40"
              >
                Delete project
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-accent-orange/25 bg-accent-orange/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-small font-semibold text-dark-primary">Leave this project</p>
                <p className="mt-1 text-xsmall leading-relaxed text-dark-secondary">
                  You will lose access to{' '}
                  <strong className="font-semibold text-dark-primary">{project.project_name}</strong>.{' '}
                  You can only rejoin if invited again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirm('leave')}
                disabled={processing}
                className="shrink-0 rounded-lg border border-accent-orange/30 bg-accent-orange/10 px-4 py-2 text-small font-semibold text-accent-orange transition-colors hover:bg-accent-orange/20 disabled:opacity-40"
              >
                Leave project
              </button>
            </div>
          </div>
        )}
      </div>

      {confirm === 'delete' && (
        <ConfirmModal
          title={`Delete "${project.project_name}"?`}
          description="This will permanently delete the project and all its data. This action cannot be undone."
          confirmLabel="Delete project"
          tone="danger"
          onConfirm={() => {
 setConfirm(null); deleteProject(); 
}}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === 'leave' && (
        <ConfirmModal
          title="Leave project?"
          description={`You will lose access to "${project.project_name}". You can only rejoin if invited again.`}
          confirmLabel="Leave project"
          tone="danger"
          onConfirm={() => {
 setConfirm(null); leaveProject(); 
}}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
};

export default DangerTab;

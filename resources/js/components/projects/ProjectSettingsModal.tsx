import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import CancelIcon from '@public/icons/small/cancel.svg';
import DangerTab from './settings/DangerTab';
import GeneralTab from './settings/GeneralTab';
import MembersTab from './settings/MembersTab';
import PreferencesTab from './settings/PreferencesTab';
import ProfileTab from './settings/ProfileTab';
import ProjectSettingsNavGroup from './settings/ProjectSettingsNavGroup';
import ProjectSettingsNavItem from './settings/ProjectSettingsNavItem';
import SecurityTab from './settings/SecurityTab';

// ── Types ──────────────────────────────────────────────────────────────────

type Tab =
  | 'general'
  | 'members'
  | 'profile'
  | 'preferences'
  | 'security'
  | 'danger';

interface ProjectSettingsModalProps {
  open: boolean;
  initialTab?: Tab;
  onClose: () => void;
}

// ── Modal ──────────────────────────────────────────────────────────────────

const PROJECT_TABS: Tab[] = ['general', 'members', 'danger'];

const ProjectSettingsModal = ({
  open,
  initialTab,
  onClose,
}: ProjectSettingsModalProps) => {
  const { project, projectRole, projectShare, auth, account, twoFactor } =
    usePage().props;
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const accountIndex = account.index;

  // Recompute the active tab whenever the modal opens (or its target
  // project/initialTab changes) — adjusted during render instead of an
  // effect, per https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const openKey = `${open}:${initialTab ?? ''}:${project?.project_id ?? ''}`;
  const [prevOpenKey, setPrevOpenKey] = useState(openKey);

  if (openKey !== prevOpenKey) {
    setPrevOpenKey(openKey);

    if (open) {
      const desired = initialTab ?? (project ? 'general' : 'profile');
      setActiveTab(
        project || !PROJECT_TABS.includes(desired) ? desired : 'profile',
      );
    }
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-surface-1 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('projectSettings.title')}
        className="flex h-[88dvh] max-h-[640px] w-full max-w-3xl overflow-hidden rounded-xl border border-dark-border bg-dark-surface-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Sidebar ─────────────────────────────── */}
        <div className="flex w-36 shrink-0 flex-col border-r border-dark-border bg-dark-surface-1 p-2 sm:w-52">
          <div className="mb-4 flex items-center justify-between px-1 pt-1">
            <p className="text-small font-semibold text-dark-primary">
              {t('projectSettings.title')}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('projectSettings.close')}
              className="flex h-7 w-7 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
            >
              <CancelIcon />
            </button>
          </div>

          <div className="flex flex-1 flex-col">
            {project && (
              <ProjectSettingsNavGroup label={t('projectSettings.navProject')}>
                <ProjectSettingsNavItem
                  label={t('projectSettings.navGeneral')}
                  active={activeTab === 'general'}
                  onClick={() => setActiveTab('general')}
                />
                <ProjectSettingsNavItem
                  label={t('projectSettings.navMembers')}
                  active={activeTab === 'members'}
                  onClick={() => setActiveTab('members')}
                />
              </ProjectSettingsNavGroup>
            )}
            <ProjectSettingsNavGroup
              label={t('projectSettings.navYourAccount')}
            >
              <ProjectSettingsNavItem
                label={t('projectSettings.navProfile')}
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
              />
              <ProjectSettingsNavItem
                label={t('projectSettings.navPreferences')}
                active={activeTab === 'preferences'}
                onClick={() => setActiveTab('preferences')}
              />
              <ProjectSettingsNavItem
                label={t('projectSettings.navSecurity')}
                active={activeTab === 'security'}
                onClick={() => setActiveTab('security')}
              />
            </ProjectSettingsNavGroup>
            {project && (
              <div className="mt-auto border-t border-dark-border pt-2">
                <ProjectSettingsNavItem
                  label={t('projectSettings.navDanger')}
                  active={activeTab === 'danger'}
                  danger
                  onClick={() => setActiveTab('danger')}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Content ─────────────────────────────── */}
        <div className="scrollbar-app min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'general' && project && (
            <GeneralTab
              project={project}
              role={projectRole}
              accountIndex={accountIndex}
            />
          )}
          {activeTab === 'members' && project && (
            <MembersTab
              share={projectShare}
              project={project}
              accountIndex={accountIndex}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileTab user={auth.user} accountIndex={accountIndex} />
          )}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'security' && <SecurityTab twoFactor={twoFactor} />}
          {activeTab === 'danger' && project && (
            <DangerTab
              project={project}
              role={projectRole}
              accountIndex={accountIndex}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;

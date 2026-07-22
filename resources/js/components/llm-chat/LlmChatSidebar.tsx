import { router } from '@inertiajs/react';
import { useState } from 'react';
import LlmSessionItem from '@/components/llm-chat/LlmSessionItem';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import { projectPath } from '@/lib/accountRoutes';
import type { LlmSession } from '@/types/llm-chat';
import PlusIcon from '@public/icons/small/plus.svg';

interface Props {
  sessions: LlmSession[];
  activeSessionId?: string;
  /** Mobile in-page drawer open state (ignored on md+ where it's a static rail). */
  open?: boolean;
  /** Close the mobile drawer (also called after navigating to a session). */
  onClose?: () => void;
}

const LlmChatSidebar = ({
  sessions,
  activeSessionId,
  open = false,
  onClose,
}: Props) => {
  const { t } = useTranslation();
  const { project, accountIndex } = useProject();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LlmSession | null>(null);

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.llm_chat_session_id;
    setDeleteTarget(null);

    router.delete(
      projectPath(accountIndex, project.project_slug, `/llm-chat/${targetId}`),
      { preserveScroll: true },
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 z-30 rounded-lg bg-black/50 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`z-40 flex w-55 shrink-0 flex-col overflow-hidden rounded-lg bg-dark-surface-2 max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:w-64 max-md:shadow-2xl max-md:transition-transform max-md:duration-200 ${
          open ? 'max-md:translate-x-0' : 'max-md:-translate-x-[110%]'
        }`}
      >
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() => {
              onClose?.();
              router.get(
                projectPath(accountIndex, project.project_slug, '/llm-chat'),
              );
            }}
            className="flex w-full items-center gap-2 rounded-lg bg-dark-surface-3 px-3 py-2 text-sm text-dark-secondary transition-colors hover:bg-status-info hover:text-white"
          >
            <PlusIcon className="h-3.5 w-3.5 shrink-0" />
            {t('llmChat.newChat')}
          </button>
        </div>

        <div className="mx-3 h-px bg-dark-border" />

        <p className="px-3 pt-2.5 pb-1.5 text-xs font-semibold tracking-wider text-dark-secondary uppercase">
          {t('llmChat.chats')}
        </p>

        <nav className="scrollbar-app flex-1 overflow-y-auto px-2 pb-3">
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-dark-secondary">
              {t('llmChat.noChatsYet')}
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {sessions.map((session) => (
                <LlmSessionItem
                  key={session.llm_chat_session_id}
                  session={session}
                  isActive={session.llm_chat_session_id === activeSessionId}
                  accountIndex={accountIndex}
                  projectSlug={project.project_slug}
                  menuOpen={openMenuId === session.llm_chat_session_id}
                  onOpenMenu={() => setOpenMenuId(session.llm_chat_session_id)}
                  onCloseMenu={() => setOpenMenuId(null)}
                  onRequestDelete={() => setDeleteTarget(session)}
                  onNavigate={() => onClose?.()}
                />
              ))}
            </div>
          )}
        </nav>
      </aside>

      {deleteTarget && (
        <ConfirmModal
          title={t('llmChat.deleteChatTitle')}
          description={t('llmChat.deleteChatDescription', {
            name: deleteTarget.llm_chat_session_name,
          })}
          confirmLabel={t('llmChat.deleteChatConfirmLabel')}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
};

export default LlmChatSidebar;

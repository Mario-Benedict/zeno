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
}

const LlmChatSidebar = ({ sessions, activeSessionId }: Props) => {
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
      <aside className="flex w-55 shrink-0 flex-col overflow-hidden rounded-lg bg-dark-surface-2">
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() =>
              router.get(
                projectPath(accountIndex, project.project_slug, '/llm-chat'),
              )
            }
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

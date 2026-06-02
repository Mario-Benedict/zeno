import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import LlmChatController from '@/actions/App/Http/Controllers/LlmChatController';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { useProject } from '@/hooks/useProject';
import type { LlmSession } from '@/types/llm-chat';
import MoreIcon from '@public/icons/large/more.svg';
import PlusIcon from '@public/icons/small/plus.svg';

interface Props {
  sessions: LlmSession[];
  activeSessionId?: string;
}

// ─── Session row with hover-revealed three-dot menu ───

interface SessionItemProps {
  session: LlmSession;
  isActive: boolean;
  projectSlug: string;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onRequestDelete: () => void;
}

const SessionItem = ({
  session,
  isActive,
  projectSlug,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onRequestDelete,
}: SessionItemProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside.
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        onCloseMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, onCloseMenu]);

  const navigate = () => {
    router.get(
      LlmChatController.show.url({
        project: projectSlug,
        session: session.llm_chat_session_id,
      }),
    );
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCloseMenu();
    onRequestDelete();
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (menuOpen) {
      onCloseMenu();
    } else {
      onOpenMenu();
    }
  };

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={navigate}
        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
          isActive
            ? 'bg-status-info text-white'
            : 'text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
        }`}
      >
        <span className="min-w-0 flex-1 truncate">
          {session.llm_chat_session_name}
        </span>

        {/* Three-dot trigger — shown on hover, when active, or while menu is open */}
        <span
          role="button"
          tabIndex={0}
          onClick={toggleMenu}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMenu(e as unknown as React.MouseEvent);
            }
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-opacity ${
            isActive || menuOpen
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          } hover:bg-white/10`}
        >
          <MoreIcon className="h-3.5 w-3.5" />
        </span>
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-1 z-20 mt-1 w-32 overflow-hidden rounded-lg border border-dark-border bg-dark-surface-3 py-1 shadow-lg"
        >
          <button
            type="button"
            onClick={handleDeleteClick}
            className="block w-full px-3 py-1.5 text-left text-xs text-status-error transition-colors hover:bg-status-error/10"
          >
            Delete chat
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Sidebar ───

const LlmChatSidebar = ({ sessions, activeSessionId }: Props) => {
  const { project } = useProject();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LlmSession | null>(null);

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const targetId = deleteTarget.llm_chat_session_id;
    setDeleteTarget(null);

    router.delete(
      LlmChatController.destroy.url({
        project: project.project_slug,
        session: targetId,
      }),
      { preserveScroll: true },
    );
  };

  return (
    <>
      <aside className="flex w-55 shrink-0 flex-col overflow-hidden rounded-lg bg-dark-surface-2">
        {/* ── New Chat ── */}
        <div className="px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={() =>
              router.get(
                LlmChatController.index.url({ project: project.project_slug }),
              )
            }
            className="flex w-full items-center gap-2 rounded-lg bg-dark-surface-3 px-3 py-2 text-sm text-dark-secondary transition-colors hover:bg-status-info hover:text-white"
          >
            <PlusIcon className="h-3.5 w-3.5 shrink-0" />
            New Chat
          </button>
        </div>

        <div className="mx-3 h-px bg-dark-border" />

        <p className="px-3 pt-2.5 pb-1.5 text-xs font-semibold tracking-wider text-dark-secondary uppercase">
          Chats
        </p>

        {/* ── Session list ── */}
        <nav className="flex-1 overflow-y-auto px-2 pb-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-track]:bg-transparent">
          {sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-dark-secondary">
              No chats yet.
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {sessions.map((s) => (
                <SessionItem
                  key={s.llm_chat_session_id}
                  session={s}
                  isActive={s.llm_chat_session_id === activeSessionId}
                  projectSlug={project.project_slug}
                  menuOpen={openMenuId === s.llm_chat_session_id}
                  onOpenMenu={() => setOpenMenuId(s.llm_chat_session_id)}
                  onCloseMenu={() => setOpenMenuId(null)}
                  onRequestDelete={() => setDeleteTarget(s)}
                />
              ))}
            </div>
          )}
        </nav>
      </aside>

      {deleteTarget && (
        <ConfirmModal
          title="Delete Chat"
          description={
            <>
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-white">
                "{deleteTarget.llm_chat_session_name}"
              </strong>
              ? All messages inside it will be permanently removed.
            </>
          }
          confirmLabel="Yes, delete it"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
};

export default LlmChatSidebar;

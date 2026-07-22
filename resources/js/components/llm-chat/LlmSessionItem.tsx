import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { projectPath } from '@/lib/accountRoutes';
import type { LlmSession } from '@/types/llm-chat';
import MoreIcon from '@public/icons/large/others.svg';

interface Props {
  session: LlmSession;
  isActive: boolean;
  accountIndex: number;
  projectSlug: string;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onRequestDelete: () => void;
  /** Called just before navigating — used to close the mobile drawer. */
  onNavigate?: () => void;
}

const LlmSessionItem = ({
  session,
  isActive,
  accountIndex,
  projectSlug,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onRequestDelete,
  onNavigate,
}: Props) => {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onCloseMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, onCloseMenu]);

  const navigate = () => {
    onNavigate?.();
    router.get(
      projectPath(
        accountIndex,
        projectSlug,
        `/llm-chat/${session.llm_chat_session_id}`,
      ),
    );
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onCloseMenu();
    onRequestDelete();
  };

  const toggleMenu = (event: React.MouseEvent) => {
    event.stopPropagation();
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

        <span
          role="button"
          tabIndex={0}
          onClick={toggleMenu}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              toggleMenu(event as unknown as React.MouseEvent);
            }
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-opacity ${
            isActive || menuOpen
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          } hover:bg-dark-surface-3`}
        >
          <MoreIcon className="h-3.5 w-3.5" />
        </span>
      </button>

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
            {t('llmChat.deleteChat')}
          </button>
        </div>
      )}
    </div>
  );
};

export default LlmSessionItem;

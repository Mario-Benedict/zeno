import { useState } from "react";
import Zeno from "../../../public/logos/logo.svg?react";
import ArrowDown from "../../../public/icons/small/arrow_down.svg?react";
import Search from "../../../public/icons/small/search.svg?react";
import Bell from "../../../public/icons/small/bell.svg?react";
import People from "../../../public/icons/small/people.svg?react";
import Gear from "../../../public/icons/small/gear.svg?react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  name: string;
  avatarUrl?: string;
}

interface AppHeaderProps {
  projectName?: string;
  user?: User;
  onSearch?: (query: string) => void;
  onProjectClick?: () => void;
  onNotificationClick?: () => void;
  onContactsClick?: () => void;
  onSettingsClick?: () => void;
  onUserMenuClick?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Generic icon button with hover state */
function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-md text-[#aaa] hover:text-[#e8e8e8] hover:bg-white/[0.07] transition-colors"
    >
      {children}
    </button>
  );
}

/** User avatar — image with initials fallback */
function Avatar({ user }: { user: User }) {
  return (
    <div className="w-7.5 h-7.5 rounded-full overflow-hidden bg-dark-primary flex items-center justify-center shrink-0">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-[10px] font-semibold text-white leading-none">
          {getInitials(user.name)}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Header({
  projectName = "Project Zeno",
  user = { name: "Mario Benedict" },
  onSearch,
  onProjectClick,
  onNotificationClick,
  onContactsClick,
  onSettingsClick,
  onUserMenuClick,
}: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  }

  return (
    <header className="flex items-center h-12 px-2 gap-2 bg-dark-surface-1 border-b border-[#2e2e2e] select-none">

      {/* ── Left: Logo + Project selector ── */}
      <div className="flex items-center w-100 gap-2 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 bg-dark-surface-2">
          <Zeno className="w-8 h-8"/>
        </div>

        <button
          onClick={onProjectClick}
          aria-haspopup="true"
          aria-label="Select project"
          className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[#e8e8e8] hover:bg-white/[0.07] transition-colors"
        >
          <span className="text-sm font-medium whitespace-nowrap">{projectName}</span>
          <span className="text-[#888]"><ArrowDown/></span>
        </button>
      </div>

      {/* ── Center: Search ── */}
      <div className="flex-1 flex justify-center px-4 min-w-0" role="search">
        <div className="relative w-full max-w-90">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888] pointer-events-none">
            <Search/>
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search"
            aria-label="Search"
            className="
              w-full h-8 pl-8 pr-3
              bg-[#2a2a2a] border border-[#3a3a3a] rounded-full
              text-[13px] text-[#e8e8e8] placeholder-[#888]
              outline-none transition-colors
              focus:bg-[#313131] focus:border-[#4a4a4a]
              [&::-webkit-search-cancel-button]:hidden
            "
          />
        </div>
      </div>

      {/* ── Right: Icons + Divider + User menu ── */}
      <div className="flex items-center justify-end w-100 gap-2 shrink-0">
        <IconButton label="Notifications" onClick={onNotificationClick}>
          <Bell />
        </IconButton>

        <IconButton label="Contacts" onClick={onContactsClick}>
          <People />
        </IconButton>

        <IconButton label="Settings" onClick={onSettingsClick}>
          <Gear />
        </IconButton>

        {/* Divider */}
        <div className="w-px h-5 bg-[#2e2e2e] mx-1.5" aria-hidden="true" />

        {/* User menu */}
        <button
          onClick={onUserMenuClick}
          aria-haspopup="true"
          aria-label="User menu"
          className="flex items-center gap-2 px-1.5 py-1 rounded-md text-[#e8e8e8] hover:bg-white/[0.07] transition-colors"
        >
          <Avatar user={user} />
          <span className="text-[13px] font-medium whitespace-nowrap">{user.name}</span>
          <span className="text-[#888]"><ArrowDown /></span>
        </button>
      </div>

    </header>
  );
}
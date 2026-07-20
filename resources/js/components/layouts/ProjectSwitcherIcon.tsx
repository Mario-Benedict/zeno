import { avatarHex } from '@/lib/projectAvatar';

interface ProjectSwitcherIconProps {
  name: string;
  color: string;
  avatarUrl: string | null;
}

const ProjectSwitcherIcon = ({
  name,
  color,
  avatarUrl,
}: ProjectSwitcherIconProps) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-md object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xsmall font-bold text-white"
      style={{ backgroundColor: avatarHex(color) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
};

export default ProjectSwitcherIcon;

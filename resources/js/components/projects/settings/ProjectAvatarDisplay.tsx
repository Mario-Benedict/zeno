import { avatarHex } from '@/lib/projectAvatar';

interface ProjectAvatarDisplayProps {
  name: string;
  color: string;
  avatarUrl: string | null;
  size?: 'sm' | 'lg';
}

const ProjectAvatarDisplay = ({
  name,
  color,
  avatarUrl,
  size = 'lg',
}: ProjectAvatarDisplayProps) => {
  const dimensions =
    size === 'lg' ? 'h-16 w-16 text-large' : 'h-9 w-9 text-xsmall';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dimensions} shrink-0 rounded-xl object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-xl font-bold text-white`}
      style={{ backgroundColor: avatarHex(color) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
};

export default ProjectAvatarDisplay;

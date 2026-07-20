import { UploadIcon } from '@/components/shared/AvatarUploadModal';
import { useTranslation } from '@/hooks/useTranslation';
import { AVATAR_COLORS, avatarHex } from '@/lib/projectAvatar';
import type { AvatarColor } from '@/lib/projectAvatar';

interface ProjectColorPickerPopoverProps {
  current: string;
  onSelectColor: (color: AvatarColor) => void;
  onUploadClick: () => void;
}

const ProjectColorPickerPopover = ({
  current,
  onSelectColor,
  onUploadClick,
}: ProjectColorPickerPopoverProps) => {
  const { t } = useTranslation();

  return (
    <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-xl border border-dark-border bg-dark-surface-2 p-3 shadow-2xl">
      <p className="mb-2 text-micro font-bold tracking-wider text-dark-secondary uppercase">
        {t('projectSettingsTabs.color')}
      </p>
      <div className="grid grid-cols-10 gap-1.5">
        {AVATAR_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            onClick={() => onSelectColor(color)}
            className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${
              current === color
                ? 'ring-2 ring-white ring-offset-1 ring-offset-dark-surface-2'
                : ''
            }`}
            style={{ backgroundColor: avatarHex(color) }}
          />
        ))}
      </div>
      <div className="mt-3 border-t border-dark-border pt-2">
        <button
          type="button"
          onClick={onUploadClick}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-small text-dark-primary transition-colors hover:bg-white/[0.07]"
        >
          <UploadIcon />
          {t('projectSettingsTabs.uploadAvatar')}
        </button>
      </div>
    </div>
  );
};

export default ProjectColorPickerPopover;

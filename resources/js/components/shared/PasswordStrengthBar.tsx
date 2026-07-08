import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import { barColors, strengthLabelColor } from '@/lib/passwordStrength';
import type { PasswordStrength } from '@/lib/passwordStrength';

interface PasswordStrengthBarProps {
  strength: PasswordStrength;
}

const PasswordStrengthBar = ({ strength }: PasswordStrengthBarProps) => {
  const { t } = useTranslation();

  if (strength === 0) return null;

  const strengthLabelKey: Record<PasswordStrength, TranslationKey> = {
    0: 'auth.passwordStrength.weak',
    1: 'auth.passwordStrength.weak',
    2: 'auth.passwordStrength.fair',
    3: 'auth.passwordStrength.strong',
    4: 'auth.passwordStrength.superStrong',
  };

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {barColors.map((color, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              strength > i ? color : 'bg-dark-surface-3'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-dark-secondary">
        <span className={`font-medium ${strengthLabelColor[strength]}`}>
          {t(strengthLabelKey[strength])}
        </span>
        {' · '}
        {t('auth.passwordStrength.requirement')}
      </p>
    </div>
  );
};

export default PasswordStrengthBar;

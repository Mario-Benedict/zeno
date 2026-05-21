import {
  barColors,
  strengthLabel,
  strengthLabelColor
  
} from '@/lib/passwordStrength';
import type {PasswordStrength} from '@/lib/passwordStrength';

interface PasswordStrengthBarProps {
  strength: PasswordStrength;
}

const PasswordStrengthBar = ({ strength }: PasswordStrengthBarProps) => {
  if (strength === 0) return null;

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
          {strengthLabel[strength]}
        </span>
        {' · '}
        At least 8 characters with uppercase, numbers &amp; symbols
      </p>
    </div>
  );
};

export default PasswordStrengthBar;

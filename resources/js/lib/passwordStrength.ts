export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password.length) return 0;
  let score = 1;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password) && password.length >= 6)
    score++;
  if (
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password) &&
    password.length >= 6
  )
    score++;
  return score as PasswordStrength;
};

export const strengthLabel: Record<PasswordStrength, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Strong',
  4: 'Super Strong',
};

export const strengthLabelColor: Record<PasswordStrength, string> = {
  0: '',
  1: 'text-status-error',
  2: 'text-status-warning',
  3: 'text-status-success',
  4: 'text-status-success-str',
};

export const barColors = [
  'bg-status-error',
  'bg-status-warning',
  'bg-status-success',
  'bg-status-success-str',
] as const;

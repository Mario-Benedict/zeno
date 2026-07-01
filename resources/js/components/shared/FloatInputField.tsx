import type { InputHTMLAttributes, ReactNode } from 'react';

type FloatInputFieldProps = {
  label: string;
  error?: string;
  suffix?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'className'>;

const inputBase =
  'peer block w-full rounded-lg border border-dark-border bg-dark-input px-3 pb-2.5 pt-6 text-sm text-dark-primary outline-none transition-colors focus:border-dark-border-focus focus:bg-dark-input-focus';

const floatLabel = [
  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2',
  'cursor-text text-sm text-dark-secondary',
  'transition-all duration-150',
  'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-micro peer-focus:text-dark-primary',
  'peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0',
  'peer-[:not(:placeholder-shown)]:text-micro peer-[:not(:placeholder-shown)]:text-dark-primary',
  'peer-autofill:top-2 peer-autofill:translate-y-0 peer-autofill:text-micro peer-autofill:text-dark-primary',
].join(' ');

const FloatInputField = ({
  id,
  label,
  error,
  suffix,
  ...props
}: FloatInputFieldProps) => (
  <div>
    <div className="relative">
      <input
        id={id}
        placeholder=" "
        className={suffix ? `${inputBase} pr-10` : inputBase}
        {...props}
      />
      <label htmlFor={id} className={floatLabel}>
        {label}
      </label>
      {suffix && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2">
          {suffix}
        </div>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-status-error">{error}</p>}
  </div>
);

export default FloatInputField;

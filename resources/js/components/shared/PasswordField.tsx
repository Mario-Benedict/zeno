import type { InputHTMLAttributes } from 'react';
import { useState } from 'react';
import EyeOpen from '@public/icons/small/eye.svg';
import EyeClosed from '@public/icons/small/eye_off.svg';
import FloatInputField from './FloatInputField';

type PasswordFieldProps = {
  label: string;
  error?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'placeholder' | 'className'
>;

const PasswordField = ({ label, error, ...props }: PasswordFieldProps) => {
  const [show, setShow] = useState(false);

  return (
    <FloatInputField
      label={label}
      error={error}
      type={show ? 'text' : 'password'}
      suffix={
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-dark-secondary transition-colors hover:text-dark-primary"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <EyeOpen className="h-4 w-4" />
          ) : (
            <EyeClosed className="h-4 w-4" />
          )}
        </button>
      }
      {...props}
    />
  );
};

export default PasswordField;

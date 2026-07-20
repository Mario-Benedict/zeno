import type { ReactNode } from 'react';

interface FieldLabelProps {
  children: ReactNode;
}

const FieldLabel = ({ children }: FieldLabelProps) => (
  <p className="mb-1.5 text-xsmall font-semibold tracking-wide text-dark-secondary uppercase">
    {children}
  </p>
);

export default FieldLabel;

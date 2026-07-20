import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const TimelineFilterSectionLabel = ({ children }: Props) => (
  <p className="mb-1.5 text-xsmall font-semibold tracking-wider text-dark-secondary/70 uppercase">
    {children}
  </p>
);

export default TimelineFilterSectionLabel;

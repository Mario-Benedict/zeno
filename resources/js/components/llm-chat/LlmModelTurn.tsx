import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const LlmModelTurn = ({ children }: Props) => (
  <div className="w-full text-sm leading-relaxed text-dark-primary">
    {children}
  </div>
);

export default LlmModelTurn;

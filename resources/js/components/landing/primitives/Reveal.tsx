import type { CSSProperties, ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

type RevealDirection = 'up' | 'left' | 'right';

interface RevealProps {
  children: ReactNode;
  /** Which edge the content slides in from. Defaults to sliding up. */
  direction?: RevealDirection;
  /** Stagger delay in ms, for revealing items in sequence. */
  delay?: number;
  className?: string;
}

// Start offsets per direction, applied through CSS custom properties that
// `.landing-reveal` in app.css reads. Under prefers-reduced-motion the CSS
// forces the settled state, so these are ignored automatically.
const OFFSET: Record<RevealDirection, { x: string; y: string }> = {
  up: { x: '0', y: '28px' },
  left: { x: '-40px', y: '0' },
  right: { x: '40px', y: '0' },
};

/**
 * Fades + slides its children into place the first time they enter the
 * viewport. Landing-only motion primitive; pairs with the WebGL hero canvas.
 */
const Reveal = ({
  children,
  direction = 'up',
  delay = 0,
  className,
}: RevealProps) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const offset = OFFSET[direction];

  const style = {
    '--reveal-x': offset.x,
    '--reveal-y': offset.y,
    '--reveal-delay': `${delay}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      style={style}
      className={cn('landing-reveal', inView && 'is-visible', className)}
    >
      {children}
    </div>
  );
};

export default Reveal;

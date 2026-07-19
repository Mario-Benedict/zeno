import { Link } from '@inertiajs/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type LandingButtonVariant = 'primary' | 'secondary';

type LandingButtonProps = {
  variant?: LandingButtonVariant;
} & ComponentProps<typeof Link>;

// Landing CTAs deliberately do NOT reuse shared/Button: that component is
// styled with adaptive `dark-*` tokens which flip to light when a returning
// visitor has light mode saved. These use the isolated `landing-*` palette so
// the marketing page stays dark for everyone (see the landing color note in
// tailwind.config.js). Glow/hover intensity comes from `.landing-cta-primary`
// in app.css — the base bg stays constant so no arbitrary Tailwind value.
const variantClasses: Record<LandingButtonVariant, string> = {
  primary:
    'landing-cta-primary bg-landing-glow-blue text-white hover:text-white',
  secondary:
    'border border-landing-border bg-landing-surface text-landing-primary hover:border-landing-border-hover hover:bg-landing-surface-2',
};

const LandingButton = ({
  variant = 'primary',
  className,
  children,
  ...props
}: LandingButtonProps) => (
  <Link
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-landing-glow-blue/70 focus-visible:outline-none',
      variantClasses[variant],
      className,
    )}
    {...props}
  >
    {children}
  </Link>
);

export default LandingButton;

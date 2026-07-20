import type { FC, ReactNode, SVGProps } from 'react';

interface Props {
  icon: FC<SVGProps<SVGSVGElement>>;
  iconColor: string;
  tag: string;
  title: string;
  body: string;
  children: ReactNode;
}

const FeatureCard = ({
  icon: Icon,
  iconColor,
  tag,
  title,
  body,
  children,
}: Props) => (
  <article
    tabIndex={0}
    className="landing-card flex h-full flex-col rounded-2xl border border-landing-border bg-landing-surface p-5 outline-none sm:p-6"
  >
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-landing-surface-2 ${iconColor}`}
      >
        <Icon width={20} height={20} aria-hidden="true" />
      </span>
      <span className="text-xsmall font-semibold tracking-wide text-landing-muted uppercase">
        {tag}
      </span>
    </div>
    <h3 className="mt-4 text-large font-semibold text-landing-primary">
      {title}
    </h3>
    <p className="mt-2 text-small text-landing-secondary">{body}</p>
    <div className="mt-5">{children}</div>
  </article>
);

export default FeatureCard;

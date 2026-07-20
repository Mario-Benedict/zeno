import type { FC, ReactNode, SVGProps } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import BoardIcon from '@public/icons/large/board.svg';
import CalendarIcon from '@public/icons/large/calendar.svg';
import ChatIcon from '@public/icons/large/chat.svg';
import NotesIcon from '@public/icons/large/notes.svg';
import TimelineIcon from '@public/icons/large/timeline.svg';
import CalendarMockup from '../mockups/CalendarMockup';
import ChatMockup from '../mockups/ChatMockup';
import KanbanMockup from '../mockups/KanbanMockup';
import NotesMockup from '../mockups/NotesMockup';
import TimelineMockup from '../mockups/TimelineMockup';
import Reveal from '../primitives/Reveal';

type FeatureCardProps = {
  icon: FC<SVGProps<SVGSVGElement>>;
  iconColor: string;
  tag: string;
  title: string;
  body: string;
  children: ReactNode;
};

const FeatureCard = ({
  icon: Icon,
  iconColor,
  tag,
  title,
  body,
  children,
}: FeatureCardProps) => (
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

const BentoGrid = () => {
  const { t } = useTranslation();

  return (
    <section id="features" className="scroll-mt-20 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-h3 text-landing-primary sm:text-h2">
            {t('landing.bento.heading')}
          </h2>
          <p className="mt-4 text-normal text-landing-secondary sm:text-medium">
            {t('landing.bento.subheading')}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal
            direction="up"
            className="h-full sm:col-span-2 lg:col-span-2 lg:row-span-2"
          >
            <FeatureCard
              icon={CalendarIcon}
              iconColor="text-landing-glow-blue"
              tag={t('landing.bento.calendarTag')}
              title={t('landing.bento.calendarTitle')}
              body={t('landing.bento.calendarBody')}
            >
              <CalendarMockup />
            </FeatureCard>
          </Reveal>

          <Reveal direction="right" delay={80} className="h-full">
            <FeatureCard
              icon={BoardIcon}
              iconColor="text-landing-glow-cyan"
              tag={t('landing.bento.kanbanTag')}
              title={t('landing.bento.kanbanTitle')}
              body={t('landing.bento.kanbanBody')}
            >
              <KanbanMockup />
            </FeatureCard>
          </Reveal>

          <Reveal direction="right" delay={160} className="h-full">
            <FeatureCard
              icon={ChatIcon}
              iconColor="text-landing-glow-purple"
              tag={t('landing.bento.chatTag')}
              title={t('landing.bento.chatTitle')}
              body={t('landing.bento.chatBody')}
            >
              <ChatMockup />
            </FeatureCard>
          </Reveal>

          <Reveal direction="left" delay={80} className="h-full">
            <FeatureCard
              icon={NotesIcon}
              iconColor="text-landing-glow-blue"
              tag={t('landing.bento.notesTag')}
              title={t('landing.bento.notesTitle')}
              body={t('landing.bento.notesBody')}
            >
              <NotesMockup />
            </FeatureCard>
          </Reveal>

          <Reveal direction="up" delay={160} className="h-full lg:col-span-2">
            <FeatureCard
              icon={TimelineIcon}
              iconColor="text-landing-glow-cyan"
              tag={t('landing.bento.timelineTag')}
              title={t('landing.bento.timelineTitle')}
              body={t('landing.bento.timelineBody')}
            >
              <TimelineMockup />
            </FeatureCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default BentoGrid;

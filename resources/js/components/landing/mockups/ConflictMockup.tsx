import { useTranslation } from '@/hooks/useTranslation';

// Copies the real NotificationPanel with the Conflicts tab active: the tab bar,
// an assignee prompt with Yes/No, and an assigner alert with OK — the actual UI
// where a caught scheduling conflict gets resolved.
const ConflictMockup = () => {
  const { t } = useTranslation();

  const tabs = [
    { label: t('landing.spotlightMockup.panelInbox'), active: false },
    { label: t('landing.spotlightMockup.panelChat'), active: false },
    { label: t('landing.spotlightMockup.panelConflicts'), active: true },
  ];

  return (
    <div
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-landing-app-line bg-landing-app-1 shadow-2xl shadow-black/50"
      aria-hidden="true"
    >
      {/* Tab bar */}
      <div className="flex border-b border-landing-app-line">
        {tabs.map((tab) => (
          <span
            key={tab.label}
            className={`relative flex-1 py-3 text-center text-small font-semibold ${
              tab.active
                ? 'border-b-2 border-accent-blue text-landing-app-fg'
                : 'text-landing-app-sub'
            }`}
          >
            {tab.label}
            {tab.active && (
              <span className="absolute top-2 right-4 h-1.5 w-1.5 rounded-full bg-accent-red" />
            )}
          </span>
        ))}
      </div>

      {/* Conflicts list */}
      <div className="flex flex-col p-2">
        <div className="rounded-lg px-3 py-2.5">
          <p className="text-small text-landing-app-fg">
            {t('landing.spotlightMockup.assigneePrompt')}
          </p>
          <p className="mt-0.5 text-xsmall text-landing-app-sub">
            {t('landing.spotlightMockup.assigneeTime')}
          </p>
          <div className="mt-2 flex gap-2">
            <span className="rounded-lg bg-accent-blue px-3 py-1 text-xsmall font-semibold text-white">
              {t('landing.spotlightMockup.yes')}
            </span>
            <span className="rounded-lg border border-landing-app-line px-3 py-1 text-xsmall text-landing-app-sub">
              {t('landing.spotlightMockup.no')}
            </span>
          </div>
        </div>

        <div className="rounded-lg px-3 py-2.5">
          <p className="text-small text-landing-app-fg">
            {t('landing.spotlightMockup.assignerAlert')}
          </p>
          <span className="mt-2 inline-block rounded-lg border border-landing-app-line px-3 py-1 text-xsmall text-landing-app-sub">
            {t('landing.spotlightMockup.ok')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConflictMockup;

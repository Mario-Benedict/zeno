// Public marketing landing page (pages/welcome.tsx + components/landing/*).
// Every leaf is a plain string: the dictionary's DotPath type only flattens
// string values, so no arrays/objects-of-non-strings here. Repeated items
// (feature cards, spotlight steps) use numbered keys instead of a list.
//
// The feature mockups reuse the real app's `dashboard.*` / `nav.*` labels for
// their chrome (titles, empty states, sidebar) so they stay in sync with the
// product; only the sample data below is landing-specific.
export const landing = {
  meta: {
    // Tab title only — Inertia's title callback appends " - {app name}", so the
    // brand is not repeated here. The OG/social title carries the full brand.
    title: 'One workspace for every project',
    ogTitle: 'Zeno: one workspace for every project',
    description:
      'Zeno brings your board, team chat, notes, calendar, and AI assistant into one project workspace, so your team stops jumping between separate apps to get work done.',
    ogImageAlt: 'The Zeno project workspace',
  },

  // Only two CTAs exist on the whole page: Log in → /login, Sign up → /register.
  nav: {
    skipToContent: 'Skip to content',
    login: 'Log in',
    signup: 'Sign up',
  },

  hero: {
    badge: 'The all-in-one project workspace',
    headline: 'Run your projects from one workspace.',
    subhead:
      'Zeno puts your board, chat, notes, calendar, and AI assistant inside a single project. Your team stops switching between separate apps just to move one task forward.',
    login: 'Log in',
    signup: 'Sign up',
    note: 'Free to start. No credit card needed.',
  },

  // Sample data for the hero Dashboard snapshot (chrome only — the widgets pull
  // their own labels/data). Kept translatable per the project i18n rule.
  heroMockup: {
    projectName: 'Orbit relaunch',
    searchPlaceholder: 'Search',
    account: 'Alex Rivera',
  },

  problem: {
    line: "A project shouldn't need six open tabs.",
    body: 'The board lives in one app, chat in another, notes somewhere else, and the calendar in a fourth window. Every switch pulls your attention off the actual work. Zeno keeps all of it in one project.',
  },

  bento: {
    heading: 'One project, every tool it needs',
    subheading:
      'The board, chat, notes, calendar, and AI assistant all live inside the same project.',
    calendarTag: 'Smart calendar',
    calendarTitle: 'A calendar that catches scheduling conflicts',
    calendarBody:
      'Zeno watches your tasks across every project and warns you when two of them overlap, before you agree to be in two places at once.',
    kanbanTag: 'Boards',
    kanbanTitle: 'Boards you shape around the work',
    kanbanBody:
      'Custom columns, labels, and cards for the way each project actually runs.',
    chatTag: 'Chat and AI',
    chatTitle: 'Team chat and an AI assistant, built in',
    chatBody:
      'Message your team and ask the AI assistant questions without leaving the project.',
    notesTag: 'Notes',
    notesTitle: 'Notes that stay with the project',
    notesBody:
      'Write specs, keep meeting notes, and record decisions next to the work they belong to.',
    timelineTag: 'Timeline',
    timelineTitle: 'See how each project is tracking',
    timelineBody: 'A dashboard view of progress across all your projects.',
  },

  // Sample data inside the feature widget mockups (kanban / chat / notes /
  // timeline). Chrome labels come from the shared dashboard.* namespace.
  bentoMockup: {
    kanbanCol1: 'In progress',
    kanbanCol2: 'Done',
    kanbanCount: '2 cards',
    kanbanCard1: 'Ship v2 landing',
    kanbanCard2: 'API contract',
    kanbanLabelHigh: 'high',
    kanbanLabelMedium: 'medium',
    chatCount: '2 chats',
    chatRoom1: 'Design team',
    chatMsg1: 'Mara: pushed the fix, ready for review',
    chatRoom2: 'Kai Chen',
    chatMsg2: 'You: sounds good, merging now',
    chatRoom3: 'Ops sync',
    notesCount: '3 notes',
    notesTitle1: 'Spec: v2 launch',
    notesExcerpt1: 'Goals, non-goals, and the rollout plan.',
    notesDate1: 'Aug 2',
    notesTitle2: 'Design review notes',
    notesExcerpt2: 'Feedback from the Thursday sync.',
    notesDate2: 'Aug 1',
    notesTitle3: 'Onboarding checklist',
    notesExcerpt3: 'Steps for new teammates.',
    notesDate3: 'Jul 28',
    timelineCount: '2 tasks',
    timelineTask1: 'Ship v2 landing',
    timelineTask2: 'Investor demo prep',
  },

  // Sample data inside the flagship calendar widget mockup.
  calendarMockup: {
    range: 'Jul 12–18',
    eventCount: '2 events',
    event1Name: 'Design review',
    event2Name: 'Investor demo',
  },

  spotlight: {
    tag: 'How the calendar helps',
    heading: 'It catches the clash before you do.',
    body: 'When a new task lands on top of something you already committed to, even on a different project, Zeno flags the overlap and helps you deal with it instead of letting it quietly break your week.',
    step1Title: 'Checks across every project',
    step1Body:
      'Conflicts are tracked by person, not by board, so an overlap between two separate projects still shows up.',
    step2Title: 'Notifies both people',
    step2Body:
      'The assignee and the person who assigned the task both hear about it the moment the overlap appears.',
    step3Title: 'One click to resolve it',
    step3Body: 'Reschedule it, turn it down, or keep both and carry on.',
  },

  // Copy inside the spotlight mockup — the real NotificationPanel conflicts tab.
  spotlightMockup: {
    panelInbox: 'Inbox',
    panelChat: 'Chat',
    panelConflicts: 'Conflicts',
    assigneePrompt:
      '"Design review" clashes with "Investor demo" on Thursday. Can you still do both?',
    assigneeTime: 'Thu, 2:00–3:30 PM',
    yes: 'Yes',
    no: 'No',
    assignerAlert: 'Kai has a scheduling conflict on "API contract".',
    ok: 'OK',
  },

  closing: {
    heading: 'Move your first project into Zeno',
    body: 'Create a workspace, invite your team, and run your next project in one place. Free to start, no credit card.',
    login: 'Log in',
    signup: 'Sign up',
  },

  footer: {
    tagline: 'One workspace for your whole project.',
    login: 'Log in',
    signup: 'Sign up',
    rights: '© 2026 Zeno. All rights reserved.',
  },
};

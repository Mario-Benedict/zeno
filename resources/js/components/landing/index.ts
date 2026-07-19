// ─── Landing (marketing) page ───────────────────────────────────────────────
//
// Folder layout:
//   sections/    one component per page section, composed by pages/welcome.tsx
//   mockups/     self-made product mockups embedded inside sections (no real
//                screenshots), styled to match the real Zeno feature UIs
//   primitives/  landing-only building blocks (button, scroll-reveal wrapper,
//                WebGL hero background)
//
// Copy lives in the `landing` i18n namespace (resources/js/i18n/locales/*/landing.ts).
// Dark-only color tokens live in tailwind.config.js (`landing.*`) and app.css
// (`.landing-*` glow/hover/reveal), isolated from the light-mode flip. Only the
// page sections are exported here; primitives/mockups are internal to sections.

export { default as LandingNav } from './sections/LandingNav';
export { default as LandingHero } from './sections/LandingHero';
export { default as ProblemStrip } from './sections/ProblemStrip';
export { default as BentoGrid } from './sections/BentoGrid';
export { default as ConflictSpotlight } from './sections/ConflictSpotlight';
export { default as ClosingCTA } from './sections/ClosingCTA';
export { default as LandingFooter } from './sections/LandingFooter';

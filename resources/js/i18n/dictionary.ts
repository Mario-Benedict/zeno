import { account as accountEn } from './locales/en/account';
import { auth as authEn } from './locales/en/auth';
import { calendar as calendarEn } from './locales/en/calendar';
import { chat as chatEn } from './locales/en/chat';
import { common as commonEn } from './locales/en/common';
import { dashboard as dashboardEn } from './locales/en/dashboard';
import { header as headerEn } from './locales/en/header';
import { kanban as kanbanEn } from './locales/en/kanban';
import { landing as landingEn } from './locales/en/landing';
import { llmChat as llmChatEn } from './locales/en/llmChat';
import { nav as navEn } from './locales/en/nav';
import { notes as notesEn } from './locales/en/notes';
import { projects as projectsEn } from './locales/en/projects';
import { projectSettings as projectSettingsEn } from './locales/en/projectSettings';
import { projectSettingsTabs as projectSettingsTabsEn } from './locales/en/projectSettingsTabs';
import { reminders as remindersEn } from './locales/en/reminders';
import { timeline as timelineEn } from './locales/en/timeline';
import { account as accountId } from './locales/id/account';
import { auth as authId } from './locales/id/auth';
import { calendar as calendarId } from './locales/id/calendar';
import { chat as chatId } from './locales/id/chat';
import { common as commonId } from './locales/id/common';
import { dashboard as dashboardId } from './locales/id/dashboard';
import { header as headerId } from './locales/id/header';
import { kanban as kanbanId } from './locales/id/kanban';
import { landing as landingId } from './locales/id/landing';
import { llmChat as llmChatId } from './locales/id/llmChat';
import { nav as navId } from './locales/id/nav';
import { notes as notesId } from './locales/id/notes';
import { projects as projectsId } from './locales/id/projects';
import { projectSettings as projectSettingsId } from './locales/id/projectSettings';
import { projectSettingsTabs as projectSettingsTabsId } from './locales/id/projectSettingsTabs';
import { reminders as remindersId } from './locales/id/reminders';
import { timeline as timelineId } from './locales/id/timeline';

// One namespace per feature area, matching resources/js/components/<feature>
// and resources/js/pages/<feature> — see resources/js/i18n/locales/en/*.ts
// for the source of truth on shape; every locales/id/*.ts file imports
// `typeof en` from its English counterpart so a missing/extra key is a
// compile-time error, not a silent runtime fallback.
const en = {
  common: commonEn,
  nav: navEn,
  header: headerEn,
  account: accountEn,
  projectSettings: projectSettingsEn,
  projectSettingsTabs: projectSettingsTabsEn,
  auth: authEn,
  projects: projectsEn,
  kanban: kanbanEn,
  landing: landingEn,
  chat: chatEn,
  llmChat: llmChatEn,
  notes: notesEn,
  calendar: calendarEn,
  reminders: remindersEn,
  dashboard: dashboardEn,
  timeline: timelineEn,
};

const id: typeof en = {
  common: commonId,
  nav: navId,
  header: headerId,
  account: accountId,
  projectSettings: projectSettingsId,
  projectSettingsTabs: projectSettingsTabsId,
  auth: authId,
  projects: projectsId,
  kanban: kanbanId,
  landing: landingId,
  chat: chatId,
  llmChat: llmChatId,
  notes: notesId,
  calendar: calendarId,
  reminders: remindersId,
  dashboard: dashboardId,
  timeline: timelineId,
};

export const dictionaries = { en, id };

export type Locale = keyof typeof dictionaries;

export type Dictionary = typeof en;

// Flattens the nested dictionary shape into a union of dot-path keys, e.g.
// 'common.save' | 'nav.dashboard' | ... — gives t() compile-time key checking
// without a runtime dependency.
type DotPath<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : DotPath<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = DotPath<Dictionary>;

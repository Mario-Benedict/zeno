// ProjectSettingsModal shell (nav sidebar) + the Preferences tab, which is
// tightly coupled to the locale/theme switcher itself. Owned separately from
// projectSettingsTabs.ts (General/Members/Profile/Security/Danger + related
// modals) so the two can be edited independently without touching the same file.
export const projectSettings = {
  title: 'Settings',
  navProject: 'Project',
  navYourAccount: 'Your Account',
  navGeneral: 'General',
  navMembers: 'Members',
  navProfile: 'Profile',
  navPreferences: 'Preferences',
  navSecurity: 'Security',
  navDanger: 'Danger Zone',
  close: 'Close settings',

  preferencesTitle: 'Preferences',
  appearance: 'Appearance',
  appearanceHint: 'Choose how Zeno looks on this device.',
  dark: 'Dark',
  light: 'Light',
  language: 'Language',
  languageHint: 'Choose the language used across the app.',
  english: 'English',
  indonesian: 'Bahasa Indonesia',

  calendarVisibility: 'Calendar visibility',
  calendarVisibilityHint:
    'Control how admins of your other projects see your schedule when it overlaps theirs.',
  visibilityTransparent: 'Transparent',
  visibilityTransparentDescription: 'Show full task details',
  visibilityMasked: 'Masked',
  visibilityMaskedDescription: 'Show a generic label',
  visibilityBusyOnly: 'Busy Only',
  visibilityBusyOnlyDescription: 'Show just a busy block',
};

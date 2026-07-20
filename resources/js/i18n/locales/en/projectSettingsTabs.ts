// General/Members/Profile/Security/Danger tabs of ProjectSettingsModal, plus
// CreateProjectPanel and ProjectInvitationModal. Filled in as part of the
// settings-modal translation sweep.
export const projectSettingsTabs = {
  // Shared (settings/shared.tsx)
  saved: 'Saved',
  uploadAvatar: 'Upload avatar',

  // GeneralTab
  general: 'General',
  color: 'Color',
  uploadYourImage: 'Upload your image',
  uploading: 'Uploading…',
  upload: 'Upload',
  clickToSelectImage: 'Click to select an image',
  imagePreviewAlt: 'Image preview',
  imageFormatsHint: 'JPEG, PNG, WebP or GIF · max 2 MB',
  avatarFileTooLarge: 'This image exceeds the 2 MB avatar limit.',
  avatarUploadFailed: 'Could not upload this image. Please try again.',
  removeCurrentAvatar: 'Remove current avatar',
  avatar: 'Avatar',
  changeProjectAvatar: 'Change project avatar',
  name: 'Name',
  projectNamePlaceholder: 'Project name',
  urlSlug: 'URL slug',
  projectNameRequired: 'Project name is required.',
  slugUpdateHint:
    'The URL slug updates automatically when you rename the project.',
  saveChanges: 'Save changes',
  onlyAdminsAndOwnersCanEdit:
    'Only project Admins and Owners can edit settings.',

  // MembersTab
  members: 'Members',
  noMembersYet: 'No members yet.',
  you: 'you',
  removeMember: 'Remove {{name}}',
  inviteMembersHint:
    'To invite new members, use the {{people}} icon in the top bar.',
  peopleIcon: 'People',

  // ProfileTab
  profile: 'Profile',
  changeProfilePicture: 'Change profile picture',
  displayName: 'Display name',
  yourNamePlaceholder: 'Your name',
  emailAddress: 'Email address',
  verified: 'Verified',
  unverified: 'Unverified',
  emailCannotBeChanged: 'Email cannot be changed here.',
  nameRequired: 'Name is required.',

  // SecurityTab
  security: 'Security',
  twoFactorAuthentication: 'Two-factor authentication',
  enabled: 'Enabled',
  disabled: 'Disabled',
  twoFactorDescription:
    'Protect your account with a time-based one-time password (TOTP) from an authenticator app.',
  disabling: 'Disabling…',
  disable2fa: 'Disable 2FA',
  step1ScanQrCode: 'Step 1: Scan the QR code',
  step1Description:
    'Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan the code below.',
  qrCodeAlt: '2FA QR code',
  step2EnterCode: 'Step 2: Enter the 6-digit code',
  step2Description:
    'Enter the code shown in your authenticator app to confirm the setup.',
  invalidCode: 'Invalid code.',
  verifying: 'Verifying…',
  verifyAndEnable: 'Verify & enable',
  generating: 'Generating…',
  setUp2fa: 'Set up 2FA',

  // DangerTab
  dangerZone: 'Danger Zone',
  deleteThisProject: 'Delete this project',
  deleteProjectDescription:
    'Permanently deletes {{projectName}} and all its data. This cannot be undone.',
  deleteProject: 'Delete project',
  leaveThisProject: 'Leave this project',
  leaveProjectDescription:
    'You will lose access to {{projectName}}. You can only rejoin if invited again.',
  leaveProject: 'Leave project',
  deleteProjectConfirmTitle: 'Delete "{{projectName}}"?',
  deleteProjectConfirmDescription:
    'This will permanently delete the project and all its data. This action cannot be undone.',
  leaveProjectConfirmTitle: 'Leave project?',
  leaveProjectConfirmDescription:
    'You will lose access to "{{projectName}}". You can only rejoin if invited again.',

  // CreateProjectPanel
  createAProject: 'Create a project',
  closePanel: 'Close panel',
  createProjectHeading: "Let's start with a name for your project.",
  projectTitlePlaceholder: 'Project Title',
  projectSlugPlaceholder: 'project-slug',
  creating: 'Creating…',
  createProject: 'Create Project',

  // ProjectInvitationModal
  shareProject: 'Share {{projectName}}',
  emailOrNamePlaceholder: 'Email address or name',
  share: 'Share',
  sharing: 'Sharing',
  shareWithLink: 'Share this project with a link',
  linkEnabled: 'Link enabled. Anyone with the link can join.',
  linkDisabled: 'Link disabled',
  copyLink: 'Copy Link',
  create: 'Create',
  disable: 'Disable',
  pendingInvitations: 'Pending invitations',
  projectMembers: 'Project members',
  close: 'Close',
};

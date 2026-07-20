export const calendar = {
  pageTitle: 'Calendar',

  // Weekday headers (short form, Sun-Sat)
  daySun: 'Sun',
  dayMon: 'Mon',
  dayTue: 'Tue',
  dayWed: 'Wed',
  dayThu: 'Thu',
  dayFri: 'Fri',
  daySat: 'Sat',

  // Mini calendar single-letter weekday headers
  dayLetterSun: 'S',
  dayLetterMon: 'M',
  dayLetterTue: 'T',
  dayLetterWed: 'W',
  dayLetterThu: 'T',
  dayLetterFri: 'F',
  dayLetterSat: 'S',

  // Month names
  monthJanuary: 'January',
  monthFebruary: 'February',
  monthMarch: 'March',
  monthApril: 'April',
  monthMay: 'May',
  monthJune: 'June',
  monthJuly: 'July',
  monthAugust: 'August',
  monthSeptember: 'September',
  monthOctober: 'October',
  monthNovember: 'November',
  monthDecember: 'December',

  // Sidebar top card
  create: 'Create',
  switchView: 'Switch month / week view',
  refresh: 'Refresh',
  month: 'Month',
  week: 'Week',
  hideLabel: 'Hide "{{label}}" events',
  showLabel: 'Show "{{label}}" events',

  // Sidebar member list
  searchForPeople: 'Search for people',
  noMembersFound: 'No members found.',
  membersSelectedCount: '{{checked}}/{{total}} selected',
  selectAll: 'Select all',
  deselectAll: 'Deselect all',

  // Sidebar label legend
  moreLabels: '+ {{count}} more',
  showLessLabels: 'Show less',

  // Sidebar task-source filter
  taskSourceFilterLabel: 'Tasks',
  taskSourceAll: 'All',
  taskSourceThisProject: 'This project',
  taskSourceOtherProjects: 'Other projects',

  // Month grid
  moreEvents: '+ {{count}} more',
  classified: 'CLASSIFIED',

  // Day events popup
  close: 'Close',

  // Week grid — short recurrence badges
  daily: 'Daily',
  weeklyShort: 'Weekly',
  monthlyShort: 'Monthly',
  yearlyShort: 'Yearly',

  // Event detail modal
  privateSchedule: 'Private Schedule',
  privateScheduleDescription:
    "This schedule belongs to another project. Only the participant's availability is visible to you.",
  fromBoard: 'From {{board}}',
  openInBoard: 'Open in Board',
  unknownMember: 'Unknown',
  delete: 'Delete',
  edit: 'Edit',

  // Event form modal
  editSchedule: 'Edit Schedule',
  newSchedule: 'New Schedule',
  title: 'Title',
  eventTitlePlaceholder: 'Event title',
  titleRequiredError: 'Please enter a title.',
  startDate: 'Start Date',
  startTime: 'Start Time',
  endDate: 'End Date',
  endTime: 'End Time',
  labels: 'Labels',
  selectLabels: 'Select labels',
  noLabelsInProject: 'No labels in this project yet. Create one from Board.',
  recurrence: 'Recurrence',
  doesNotRepeat: 'Does not repeat',
  weeklyOn: 'Weekly on {{weekday}}',
  monthlyOn: 'Monthly on day {{day}}',
  yearlyOn: 'Annually on {{date}}',
  until: 'until {{date}}',
  endsOn: 'Ends on',
  neverEnds: 'Never',
  assignee: 'Assignee',
  selectAssignees: 'Select assignees',
  assigneeRestrictionNote:
    'Only Owners and Admins can assign schedules to other members.',
  descriptionOptional: 'Description (Optional)',
  eventDescriptionPlaceholder: 'Event details...',
  cancel: 'Cancel',
  saving: 'Saving...',
  saveSchedule: 'Save Schedule',
  endTimeAfterStartTimeError:
    'End time must be after start time. If it ends the next day, please update the End Date.',
  recurrenceEndBeforeStartError:
    'The recurrence end date must be on or after the start date.',
  saveScheduleError: 'Failed to save schedule.',

  // Delete confirmation
  deleteScheduleTitle: 'Delete Schedule',
  deleteScheduleConfirm: 'Are you sure you want to delete this schedule?',

  // Recurrence edit dialog
  editRecurringSchedule: 'Edit Recurring Schedule',
  deleteRecurringSchedule: 'Delete Recurring Schedule',
  recurrenceEditPrompt:
    'This is a repeating schedule. Do you want to {{action}} only this occurrence, or all occurrences?',
  recurrenceActionEdit: 'edit',
  recurrenceActionDelete: 'delete',
  thisOccurrenceOnly: 'This occurrence only',
  allOccurrencesInSeries: 'All occurrences in series',
  confirm: 'Confirm',
};

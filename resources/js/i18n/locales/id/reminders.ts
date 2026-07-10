import type { reminders as en } from '../en/reminders';

export const reminders: typeof en = {
  // Reminder list
  title: 'Pengingat',
  add: 'Tambah',
  search: 'Cari',
  sortLatestFirst: 'Urutkan: terbaru dahulu',
  sortEarliestFirst: 'Urutkan: terlama dahulu',
  onlyWithDueDate: 'Hanya pengingat dengan tanggal jatuh tempo',
  onlyPinned: 'Hanya pengingat yang disematkan',
  noRemindersYet: 'Belum ada pengingat.',
  completedCount: 'Selesai {{count}}',

  // Reminder row
  markAsDone: 'Tandai selesai',
  markAsNotDone: 'Tandai belum selesai',
  deleteReminder: 'Hapus pengingat',
  deleteReminderTitle: 'Hapus Pengingat',
  deleteReminderDescription:
    'Apakah Anda yakin ingin menghapus "{{title}}"? Tindakan ini tidak dapat dibatalkan.',
  deleteReminderConfirm: 'Ya, hapus',

  // No reminder selected
  noReminderSelected: 'Tidak Ada Pengingat Terpilih',

  // Add reminder modal
  addReminder: 'Tambah Pengingat',
  reminderTitleLabel: 'Judul',
  reminderTitlePlaceholder: 'Judul pengingat...',
  dueDate: 'Tanggal jatuh tempo',
  noDueDate: 'Tidak ada tanggal jatuh tempo',
  time: 'Waktu',
  optional: 'Opsional',
  cancel: 'Batal',
  adding: 'Menambahkan...',

  // Reminder detail panel
  close: 'Tutup',
  steps: 'Langkah',
  addStep: 'Tambah Langkah',
  setDueDate: 'Atur tanggal jatuh tempo',
  done: 'Selesai',
  description: 'Deskripsi',
  edit: 'Ubah',
  save: 'Simpan',
  discard: 'Buang',
  descriptionPlaceholder: 'Tambahkan deskripsi yang lebih rinci...',
  clickToEditTitle: 'Klik untuk mengubah judul',

  // Pomodoro timer
  focus: 'Fokus',
  break: 'Istirahat',
  running: '{{label}} · berjalan',
  timerSettings: 'Pengaturan pengatur waktu',
  start: 'Mulai',
  stop: 'Berhenti',
  reset: 'Atur ulang',

  // Pomodoro settings popover
  focusMinutesLabel: 'Fokus (menit)',
  breakMinutesLabel: 'Istirahat (menit)',
};

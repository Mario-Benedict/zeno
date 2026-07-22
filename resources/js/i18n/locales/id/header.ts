// App header: logo/project picker, search, notifications, invite.
import type { header as en } from '../en/header';

export const header: typeof en = {
  selectProject: 'Pilih proyek',
  projectsFallback: 'Proyek',
  menu: 'Menu',
  search: 'Cari di proyek ini',
  searchShortcut: 'Ctrl K',
  searchHint:
    'Ketik minimal dua karakter untuk mencari navigasi, tugas, chat, catatan, acara, dan pengingat.',
  searching: 'Mencari...',
  noSearchResults: 'Tidak ada hasil untuk "{{query}}".',
  searchType: {
    navigation: 'Navigasi',
    board: 'Board',
    card: 'Tugas',
    chat: 'Chat',
    message: 'Pesan',
    note: 'Catatan',
    calendar: 'Acara',
    reminder: 'Pengingat',
  },
  notifications: 'Notifikasi',
  inviteMembers: 'Undang anggota',
  settings: 'Pengaturan',
  yourProjects: 'Proyek Anda',
  seeAllProjects: 'Lihat semua proyek',
  createAProject: 'Buat proyek',
  inbox: 'Kotak masuk',
  chat: 'Obrolan',
  nothingDueSoon: 'Tidak ada yang jatuh tempo segera.',
  assignedToCard: 'Anda ditugaskan ke "{{card}}".',
  noUnreadMessages: 'Tidak ada pesan belum dibaca.',
  overduePrefix: 'Terlambat · ',
  duePrefix: 'Jatuh tempo ',
  groupFallback: 'Grup',
  directMessageFallback: 'Pesan Langsung',
  conflicts: 'Konflik',
  noConflicts: 'Tidak ada konflik jadwal.',
  conflictAssigneePrompt:
    'Anda ditugaskan "{{card}}", yang bertabrakan dengan "{{other}}". Bisakah Anda mengambil keduanya?',
  conflictAssignerAlert:
    '{{name}} tidak bisa mengambil "{{card}}" bersamaan dengan komitmen lain yang sudah ada.',
};

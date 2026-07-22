// App header: logo/project picker, search, notifications, invite.
import type { header as en } from '../en/header';

export const header: typeof en = {
  selectProject: 'Pilih proyek',
  projectsFallback: 'Proyek',
  menu: 'Menu',
  search: 'Cari',
  notifications: 'Notifikasi',
  inviteMembers: 'Undang anggota',
  settings: 'Pengaturan',
  yourProjects: 'Proyek Anda',
  seeAllProjects: 'Lihat semua proyek',
  createAProject: 'Buat proyek',
  projectSettings: 'Pengaturan proyek',
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

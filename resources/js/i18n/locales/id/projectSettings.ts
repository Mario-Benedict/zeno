import type { projectSettings as en } from '../en/projectSettings';

export const projectSettings: typeof en = {
  title: 'Pengaturan',
  navProject: 'Proyek',
  navYourAccount: 'Akun Anda',
  navGeneral: 'Umum',
  navMembers: 'Anggota',
  navProfile: 'Profil',
  navPreferences: 'Preferensi',
  navSecurity: 'Keamanan',
  navDanger: 'Zona Berbahaya',
  close: 'Tutup pengaturan',

  preferencesTitle: 'Preferensi',
  appearance: 'Tampilan',
  appearanceHint: 'Pilih tampilan Zeno di perangkat ini.',
  dark: 'Gelap',
  light: 'Terang',
  language: 'Bahasa',
  languageHint: 'Pilih bahasa yang digunakan di seluruh aplikasi.',
  english: 'English',
  indonesian: 'Bahasa Indonesia',

  calendarVisibility: 'Visibilitas kalender',
  calendarVisibilityHint:
    'Atur seberapa banyak admin proyek lain bisa melihat jadwal Anda saat jadwalnya bertabrakan.',
  visibilityTransparent: 'Transparan',
  visibilityTransparentDescription: 'Tampilkan detail tugas lengkap',
  visibilityMasked: 'Tersamar',
  visibilityMaskedDescription: 'Tampilkan label umum',
  visibilityBusyOnly: 'Hanya Sibuk',
  visibilityBusyOnlyDescription: 'Tampilkan blok sibuk saja',
};

import type { projectSettingsTabs as en } from '../en/projectSettingsTabs';

export const projectSettingsTabs: typeof en = {
  // Shared (settings/shared.tsx)
  saved: 'Tersimpan',
  uploadAvatar: 'Unggah avatar',

  // GeneralTab
  general: 'Umum',
  color: 'Warna',
  uploadYourImage: 'Unggah gambar Anda',
  uploading: 'Mengunggah…',
  upload: 'Unggah',
  clickToSelectImage: 'Klik untuk memilih gambar',
  imageFormatsHint: 'JPEG, PNG, WebP, atau GIF · maks 2 MB',
  removeCurrentAvatar: 'Hapus avatar saat ini',
  avatar: 'Avatar',
  changeProjectAvatar: 'Ubah avatar proyek',
  name: 'Nama',
  projectNamePlaceholder: 'Nama proyek',
  urlSlug: 'Slug URL',
  projectNameRequired: 'Nama proyek wajib diisi.',
  slugUpdateHint:
    'Slug URL diperbarui otomatis saat Anda mengganti nama proyek.',
  saveChanges: 'Simpan perubahan',
  onlyAdminsAndOwnersCanEdit:
    'Hanya Admin dan Pemilik proyek yang dapat mengubah pengaturan.',

  // MembersTab
  members: 'Anggota',
  noMembersYet: 'Belum ada anggota.',
  you: 'Anda',
  removeMember: 'Hapus {{name}}',
  inviteMembersHint:
    'Untuk mengundang anggota baru, gunakan ikon {{people}} di bilah atas.',
  peopleIcon: 'Orang',

  // ProfileTab
  profile: 'Profil',
  displayName: 'Nama tampilan',
  yourNamePlaceholder: 'Nama Anda',
  emailAddress: 'Alamat email',
  verified: 'Terverifikasi',
  unverified: 'Belum terverifikasi',
  emailCannotBeChanged: 'Email tidak dapat diubah di sini.',
  nameRequired: 'Nama wajib diisi.',

  // SecurityTab
  security: 'Keamanan',
  twoFactorAuthentication: 'Autentikasi dua faktor',
  enabled: 'Aktif',
  disabled: 'Nonaktif',
  twoFactorDescription:
    'Lindungi akun Anda dengan kata sandi sekali pakai berbasis waktu (TOTP) dari aplikasi autentikator.',
  disabling: 'Menonaktifkan…',
  disable2fa: 'Nonaktifkan 2FA',
  step1ScanQrCode: 'Langkah 1 — Pindai kode QR',
  step1Description:
    'Buka aplikasi autentikator Anda (Google Authenticator, Authy, 1Password, dll.) lalu pindai kode di bawah ini.',
  qrCodeAlt: 'Kode QR 2FA',
  step2EnterCode: 'Langkah 2 — Masukkan kode 6 digit',
  step2Description:
    'Masukkan kode yang ditampilkan di aplikasi autentikator Anda untuk mengonfirmasi pengaturan.',
  invalidCode: 'Kode tidak valid.',
  verifying: 'Memverifikasi…',
  verifyAndEnable: 'Verifikasi & aktifkan',
  generating: 'Membuat…',
  setUp2fa: 'Siapkan 2FA',

  // DangerTab
  dangerZone: 'Zona Berbahaya',
  deleteThisProject: 'Hapus proyek ini',
  deleteProjectDescription:
    'Menghapus {{projectName}} secara permanen beserta semua datanya. Tindakan ini tidak dapat dibatalkan.',
  deleteProject: 'Hapus proyek',
  leaveThisProject: 'Keluar dari proyek ini',
  leaveProjectDescription:
    'Anda akan kehilangan akses ke {{projectName}}. Anda hanya dapat bergabung kembali jika diundang lagi.',
  leaveProject: 'Keluar dari proyek',
  deleteProjectConfirmTitle: 'Hapus "{{projectName}}"?',
  deleteProjectConfirmDescription:
    'Ini akan menghapus proyek beserta semua datanya secara permanen. Tindakan ini tidak dapat dibatalkan.',
  leaveProjectConfirmTitle: 'Keluar dari proyek?',
  leaveProjectConfirmDescription:
    'Anda akan kehilangan akses ke "{{projectName}}". Anda hanya dapat bergabung kembali jika diundang lagi.',

  // CreateProjectPanel
  createAProject: 'Buat proyek',
  closePanel: 'Tutup panel',
  createProjectHeading: 'Mari mulai dengan nama untuk proyek Anda.',
  projectTitlePlaceholder: 'Judul Proyek',
  projectSlugPlaceholder: 'slug-proyek',
  creating: 'Membuat…',
  createProject: 'Buat Proyek',

  // ProjectInvitationModal
  shareProject: 'Bagikan {{projectName}}',
  emailOrNamePlaceholder: 'Alamat email atau nama',
  share: 'Bagikan',
  sharing: 'Membagikan',
  shareWithLink: 'Bagikan proyek ini dengan tautan',
  linkDisabled: 'Tautan dinonaktifkan',
  save: 'Simpan',
  create: 'Buat',
  disable: 'Nonaktifkan',
  pendingInvitations: 'Undangan tertunda',
  projectMembers: 'Anggota proyek',
  close: 'Tutup',
};

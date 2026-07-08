import type { calendar as en } from '../en/calendar';

export const calendar: typeof en = {
  pageTitle: 'Kalender',

  // Weekday headers (short form, Sun-Sat)
  daySun: 'Min',
  dayMon: 'Sen',
  dayTue: 'Sel',
  dayWed: 'Rab',
  dayThu: 'Kam',
  dayFri: 'Jum',
  daySat: 'Sab',

  // Mini calendar single-letter weekday headers
  dayLetterSun: 'M',
  dayLetterMon: 'S',
  dayLetterTue: 'S',
  dayLetterWed: 'R',
  dayLetterThu: 'K',
  dayLetterFri: 'J',
  dayLetterSat: 'S',

  // Month names
  monthJanuary: 'Januari',
  monthFebruary: 'Februari',
  monthMarch: 'Maret',
  monthApril: 'April',
  monthMay: 'Mei',
  monthJune: 'Juni',
  monthJuly: 'Juli',
  monthAugust: 'Agustus',
  monthSeptember: 'September',
  monthOctober: 'Oktober',
  monthNovember: 'November',
  monthDecember: 'Desember',

  // Sidebar top card
  create: 'Buat',
  switchView: 'Ganti tampilan bulan / minggu',
  refresh: 'Segarkan',
  month: 'Bulan',
  week: 'Minggu',
  priorityLow: 'Rendah',
  priorityMid: 'Sedang',
  priorityHigh: 'Tinggi',
  hidePriority: 'Sembunyikan prioritas {{priority}}',
  showPriority: 'Tampilkan prioritas {{priority}}',

  // Sidebar member list
  searchForPeople: 'Cari orang',
  noMembersFound: 'Tidak ada anggota yang ditemukan.',

  // Month grid
  moreEvents: '+ {{count}} lainnya',
  classified: 'RAHASIA',

  // Day events popup
  close: 'Tutup',

  // Week grid
  weekly: 'Mingguan',

  // Event detail modal
  privateSchedule: 'Jadwal Pribadi',
  privateScheduleDescription:
    'Jadwal ini milik proyek lain. Hanya ketersediaan peserta yang dapat Anda lihat.',
  priorityBadge: 'Prioritas {{priority}}',
  repeatsWeekly: 'Berulang Mingguan',
  unknownMember: 'Tidak diketahui',
  delete: 'Hapus',
  edit: 'Ubah',

  // Event form modal
  editSchedule: 'Ubah Jadwal',
  newSchedule: 'Jadwal Baru',
  title: 'Judul',
  eventTitlePlaceholder: 'Judul acara',
  startDate: 'Tanggal Mulai',
  startTime: 'Waktu Mulai',
  endDate: 'Tanggal Selesai',
  endTime: 'Waktu Selesai',
  priority: 'Prioritas',
  recurrence: 'Pengulangan',
  oneTime: 'Sekali',
  everyWeek: 'Setiap minggu',
  assignee: 'Ditugaskan ke',
  assigneeRestrictionNote:
    'Hanya Pemilik dan Admin yang dapat menugaskan jadwal ke anggota lain.',
  descriptionOptional: 'Deskripsi (Opsional)',
  eventDescriptionPlaceholder: 'Detail acara...',
  cancel: 'Batal',
  saving: 'Menyimpan...',
  saveSchedule: 'Simpan Jadwal',
  endTimeAfterStartTimeError:
    'Waktu selesai harus setelah waktu mulai. Jika berakhir keesokan harinya, silakan perbarui Tanggal Selesai.',
  saveScheduleError: 'Gagal menyimpan jadwal.',

  // Delete confirmation
  deleteScheduleConfirm: 'Apakah Anda yakin ingin menghapus jadwal ini?',

  // Recurrence edit dialog
  editRecurringSchedule: 'Ubah Jadwal Berulang',
  deleteRecurringSchedule: 'Hapus Jadwal Berulang',
  recurrenceEditPrompt:
    'Ini adalah jadwal berulang. Apakah Anda ingin {{action}} hanya kejadian ini, atau semua kejadian?',
  recurrenceActionEdit: 'mengubah',
  recurrenceActionDelete: 'menghapus',
  thisOccurrenceOnly: 'Hanya kejadian ini',
  allOccurrencesInSeries: 'Semua kejadian dalam rangkaian',
  confirm: 'Konfirmasi',
};

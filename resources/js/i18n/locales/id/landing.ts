// Public marketing landing page — Indonesian.
// Imports `typeof en` so a missing/extra key is a compile-time error.
import type { landing as en } from '../en/landing';

export const landing: typeof en = {
  meta: {
    title: 'Satu ruang kerja untuk setiap proyek',
    ogTitle: 'Zeno: satu ruang kerja untuk setiap proyek',
    description:
      'Zeno menyatukan papan, obrolan tim, catatan, kalender, dan asisten AI dalam satu ruang kerja proyek, supaya tim berhenti berpindah antaraplikasi untuk menyelesaikan pekerjaan.',
    ogImageAlt: 'Ruang kerja proyek Zeno',
  },

  nav: {
    skipToContent: 'Lompat ke konten',
    login: 'Masuk',
    signup: 'Daftar',
  },

  hero: {
    badge: 'Ruang kerja proyek serba ada',
    headline: 'Jalankan proyekmu dari satu ruang kerja.',
    subhead:
      'Zeno menaruh papan, obrolan, catatan, kalender, dan asisten AI di dalam satu proyek. Tim tidak perlu lagi berganti aplikasi hanya untuk memindahkan satu tugas.',
    login: 'Masuk',
    signup: 'Daftar',
    note: 'Gratis untuk memulai. Tanpa kartu kredit.',
  },

  heroMockup: {
    projectName: 'Peluncuran Orbit',
    searchPlaceholder: 'Cari',
    account: 'Alex Rivera',
  },

  problem: {
    line: 'Sebuah proyek tidak seharusnya butuh enam tab terbuka.',
    body: 'Papan ada di satu aplikasi, obrolan di aplikasi lain, catatan di tempat lain lagi, dan kalender di jendela keempat. Setiap perpindahan menyita perhatian dari pekerjaan yang sebenarnya. Zeno menyimpan semuanya dalam satu proyek.',
  },

  bento: {
    heading: 'Satu proyek, semua alat yang dibutuhkannya',
    subheading:
      'Papan, obrolan, catatan, kalender, dan asisten AI semuanya ada di dalam proyek yang sama.',
    calendarTag: 'Kalender pintar',
    calendarTitle: 'Kalender yang menangkap jadwal bentrok',
    calendarBody:
      'Zeno memantau tugasmu di semua proyek dan memperingatkan saat dua tugas tumpang tindih, sebelum kamu terlanjur berada di dua tempat sekaligus.',
    kanbanTag: 'Papan',
    kanbanTitle: 'Papan yang kamu bentuk sesuai pekerjaan',
    kanbanBody: 'Kolom, label, dan kartu kustom sesuai cara kerja tiap proyek.',
    chatTag: 'Obrolan dan AI',
    chatTitle: 'Obrolan tim dan asisten AI, menyatu di dalam',
    chatBody:
      'Berkirim pesan ke tim dan bertanya ke asisten AI tanpa keluar dari proyek.',
    notesTag: 'Catatan',
    notesTitle: 'Catatan yang tetap menempel pada proyek',
    notesBody:
      'Tulis spesifikasi, simpan catatan rapat, dan rekam keputusan di dekat pekerjaannya.',
    timelineTag: 'Linimasa',
    timelineTitle: 'Lihat perkembangan tiap proyek',
    timelineBody: 'Tampilan dasbor untuk kemajuan seluruh proyekmu.',
  },

  bentoMockup: {
    kanbanCol1: 'Sedang berjalan',
    kanbanCol2: 'Selesai',
    kanbanCount: '2 kartu',
    kanbanCard1: 'Rilis landing v2',
    kanbanCard2: 'Kontrak API',
    kanbanLabelHigh: 'tinggi',
    kanbanLabelMedium: 'sedang',
    chatCount: '2 obrolan',
    chatRoom1: 'Tim desain',
    chatMsg1: 'Mara: perbaikan sudah dikirim, siap ditinjau',
    chatRoom2: 'Kai Chen',
    chatMsg2: 'Kamu: oke, sedang kugabungkan',
    chatRoom3: 'Sinkron ops',
    notesCount: '3 catatan',
    notesTitle1: 'Spesifikasi: peluncuran v2',
    notesExcerpt1: 'Tujuan, non-tujuan, dan rencana rilis.',
    notesDate1: '2 Agu',
    notesTitle2: 'Catatan tinjauan desain',
    notesExcerpt2: 'Masukan dari sinkron hari Kamis.',
    notesDate2: '1 Agu',
    notesTitle3: 'Ceklis onboarding',
    notesExcerpt3: 'Langkah untuk anggota tim baru.',
    notesDate3: '28 Jul',
    timelineCount: '2 tugas',
    timelineTask1: 'Rilis landing v2',
    timelineTask2: 'Persiapan demo investor',
  },

  calendarMockup: {
    range: '12–18 Jul',
    eventCount: '2 acara',
    event1Name: 'Tinjauan desain',
    event2Name: 'Demo investor',
  },

  spotlight: {
    tag: 'Cara kerja kalender',
    heading: 'Bentrokan tertangkap sebelum kamu menyadarinya.',
    body: 'Saat tugas baru menimpa sesuatu yang sudah kamu janjikan, bahkan di proyek berbeda, Zeno menandai tumpang tindihnya dan membantumu menanganinya sebelum diam-diam merusak minggumu.',
    step1Title: 'Memeriksa lintas proyek',
    step1Body:
      'Bentrokan dilacak per orang, bukan per papan, sehingga tumpang tindih antara dua proyek berbeda tetap muncul.',
    step2Title: 'Memberi tahu kedua orang',
    step2Body:
      'Penerima tugas dan pemberi tugas sama-sama diberi tahu begitu tumpang tindih muncul.',
    step3Title: 'Selesai dalam sekali klik',
    step3Body:
      'Jadwalkan ulang, tolak, atau pertahankan keduanya dan lanjutkan.',
  },

  spotlightMockup: {
    panelInbox: 'Kotak masuk',
    panelChat: 'Obrolan',
    panelConflicts: 'Bentrok',
    assigneePrompt:
      '"Tinjauan desain" bentrok dengan "Demo investor" pada Kamis. Masih bisa keduanya?',
    assigneeTime: 'Kam, 14.00–15.30',
    yes: 'Ya',
    no: 'Tidak',
    assignerAlert: 'Kai punya jadwal bentrok pada "Kontrak API".',
    ok: 'Oke',
  },

  closing: {
    heading: 'Pindahkan proyek pertamamu ke Zeno',
    body: 'Buat ruang kerja, undang timmu, dan jalankan proyek berikutnya di satu tempat. Gratis untuk memulai, tanpa kartu kredit.',
    login: 'Masuk',
    signup: 'Daftar',
  },

  footer: {
    tagline: 'Satu ruang kerja untuk seluruh proyekmu.',
    login: 'Masuk',
    signup: 'Daftar',
    rights: '© 2026 Zeno. Seluruh hak cipta dilindungi.',
  },
};

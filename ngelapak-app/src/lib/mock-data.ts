import type { DemoUser } from "./types";

// ============================================================
// NGELAPAK - Mock Data untuk Prototipe (Tanpa Backend)
// ============================================================

export type SpotStatus = "tersedia" | "dipesan" | "pemeliharaan";
export type TransactionStatus = "menunggu" | "disetujui" | "ditolak";
export type BookingStatus = "aktif" | "selesai" | "dibatalkan" | "menunggu";

export interface Spot {
  id: string;
  kode: string;
  nama: string;
  zona: "rektorat" | "boulevard" | "sc" | "agrokompleks";
  zonaLabel: string;
  lokasi: string;
  ukuran: "2x2" | "3x3" | "4x4";
  ukuranLabel: string;
  daya: number;
  tarifPerHari: number;
  status: SpotStatus;
  fasilitas: string[];
  tags: string[];
  koordinat: { x: number; y: number };
  gambar: string;
  rating: number;
  totalSewa: number;
  deskripsi: string;
  jenisUsaha?: string;
}

export interface Product {
  id: string;
  spotId: string;
  nama: string;
  kategori: string;
  harga: number;
  deskripsi: string;
}

export interface Booking {
  id: string;
  /** Stable local fixture owner ID; mapped to Supabase auth.uid() in production. */
  ownerId?: string;
  spotId: string;
  spotNama: string;
  spotKode: string;
  penyewa: {
    nama: string;
    nim: string;
    fakultas: string;
    telepon: string;
    email: string;
    avatar: string;
  };
  tanggalMulai: string;
  tanggalSelesai: string;
  jumlahHari: number;
  totalBayar: number;
  metodePembayaran: string;
  status: BookingStatus;
  statusVerifikasi: TransactionStatus;
  buktiBayar?: string;
  catatan?: string;
  jenisUsaha: string;
  createdAt: string;
}

export interface SpotManagement {
  id: string;
  kode: string;
  nama: string;
  zona: string;
  zonaLabel: string;
  status: SpotStatus;
  ukuran: string;
  tarifPerHari: number;
  bookingAktif: number;
  pendapatan: number;
  terakhirDiperiksa: string;
  fasilitas: string[];
}

// ============================================================
// CENTRALIZED DEMO ACCOUNTS (fixture only; no credentials)
// ============================================================
export const DEMO_USERS: DemoUser[] = [
  { id: "admin", nama: "I Made Ariawan", email: "ariawan@unud.ac.id", role: "admin" },
  { id: "ayu", nama: "Ni Kadek Ayu Maharani", email: "ayu.maharani@student.unud.ac.id", role: "penyewa" },
  { id: "bayu", nama: "I Wayan Bayu Pratama", email: "bayu.pratama@student.unud.ac.id", role: "penyewa" },
];

// ============================================================
// DATA SPOTS
// ============================================================
export const MOCK_SPOTS: Spot[] = [
  {
    id: "spot-001",
    kode: "A-01",
    nama: "Spot Rektorat A-01",
    zona: "rektorat",
    zonaLabel: "Lapangan Rektorat Jimbaran",
    lokasi: "Lapangan Rektorat, Kampus Bukit Jimbaran",
    ukuran: "2x2",
    ukuranLabel: "Standar (2×2m)",
    daya: 450,
    tarifPerHari: 75000,
    status: "tersedia",
    fasilitas: ["Listrik 450W", "Kanopi Waterproof", "Paving Bersih"],
    tags: ["Ramai Mahasiswa", "Dekat Parkir", "Visibilitas Tinggi"],
    koordinat: { x: 35, y: 25 },
    gambar: "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=800&q=80",
    rating: 4.8,
    totalSewa: 47,
    deskripsi: "Spot premium di Lapangan Rektorat Jimbaran, lokasi sangat strategis dekat gedung administrasi pusat. Cocok untuk stan kuliner, merchandise, maupun pameran karya mahasiswa.",
  },
  {
    id: "spot-002",
    kode: "A-04",
    nama: "Spot Rektorat A-04",
    zona: "rektorat",
    zonaLabel: "Lapangan Rektorat (Dekat Gazebo)",
    lokasi: "Lapangan Rektorat, Sisi Barat, Kampus Jimbaran",
    ukuran: "3x3",
    ukuranLabel: "Medium (3×3m)",
    daya: 900,
    tarifPerHari: 120000,
    status: "tersedia",
    fasilitas: ["Listrik 900W", "Akses Air Bersih", "Tenda Lipat Premium", "Titik Sampah Khusus"],
    tags: ["Dekat Gazebo", "Teduh", "Area Pejalan Kaki"],
    koordinat: { x: 42, y: 30 },
    gambar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    rating: 4.6,
    totalSewa: 32,
    deskripsi: "Spot berukuran medium di area dekat gazebo Lapangan Rektorat. Memiliki akses air bersih dan tenda lipat premium. Cocok untuk usaha kuliner dan minuman.",
  },
  {
    id: "spot-003",
    kode: "B-02",
    nama: "Spot Kuliner Corner B-02",
    zona: "boulevard",
    zonaLabel: "Boulevard Kampus Jimbaran",
    lokasi: "Boulevard Utama, Kampus Bukit Jimbaran",
    ukuran: "2x2",
    ukuranLabel: "Standar (2×2m)",
    daya: 450,
    tarifPerHari: 85000,
    status: "dipesan",
    fasilitas: ["Listrik 450W", "Jalur Air Aktif"],
    tags: ["Ideal Kuliner Cepat", "Lalu Lintas Tinggi", "Dekat Halte"],
    koordinat: { x: 60, y: 45 },
    gambar: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    rating: 4.9,
    totalSewa: 61,
    deskripsi: "Spot di titik paling ramai Boulevard Kampus Jimbaran, jalur utama mahasiswa menuju gedung kuliah. Memiliki jalur air aktif yang memudahkan usaha kuliner.",
    jenisUsaha: "Kuliner - Makanan & Minuman",
  },
  {
    id: "spot-004",
    kode: "C-01",
    nama: "Spot Student Center C-01",
    zona: "sc",
    zonaLabel: "Plaza Gedung SC Udayana",
    lokasi: "Plaza Student Center, Kampus Jimbaran",
    ukuran: "3x3",
    ukuranLabel: "Medium (3×3m)",
    daya: 900,
    tarifPerHari: 110000,
    status: "tersedia",
    fasilitas: ["Listrik 900W", "WiFi Udayana Hotspot", "Meja Pameran"],
    tags: ["Semi-Indoor Sejuk", "Komunitas Mahasiswa", "Akses WiFi"],
    koordinat: { x: 50, y: 60 },
    gambar: "https://images.unsplash.com/photo-1568376794508-ae52c6ab3929?w=800&q=80",
    rating: 4.7,
    totalSewa: 28,
    deskripsi: "Spot semi-indoor di Plaza Student Center, pusat kegiatan organisasi mahasiswa Udayana. Dilengkapi meja pameran dan akses WiFi kampus.",
  },
  {
    id: "spot-005",
    kode: "A-08",
    nama: "Spot Gerbang Utama A-08",
    zona: "rektorat",
    zonaLabel: "Jalur Masuk Rektorat",
    lokasi: "Gerbang Utama Rektorat, Kampus Jimbaran",
    ukuran: "2x2",
    ukuranLabel: "Standar (2×2m)",
    daya: 450,
    tarifPerHari: 70000,
    status: "tersedia",
    fasilitas: ["Listrik 450W", "Kanopi"],
    tags: ["Visibilitas Tertinggi", "Cocok Merchandise", "Gerbang Masuk"],
    koordinat: { x: 20, y: 20 },
    gambar: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80",
    rating: 4.5,
    totalSewa: 55,
    deskripsi: "Spot di jalur masuk gerbang utama Rektorat, visibilitas sangat tinggi karena dilalui seluruh civitas akademika. Ideal untuk penjualan merchandise kampus.",
  },
  {
    id: "spot-006",
    kode: "D-03",
    nama: "Spot Agrokompleks D-03",
    zona: "agrokompleks",
    zonaLabel: "Pelataran Agrokompleks Sudirman",
    lokasi: "Kampus Sudirman, Denpasar",
    ukuran: "4x4",
    ukuranLabel: "Gazebo Besar (4×4m)",
    daya: 1300,
    tarifPerHari: 175000,
    status: "tersedia",
    fasilitas: ["Listrik 1300W", "Akses Kendaraan Box", "Area Luas"],
    tags: ["Kapasitas Besar", "Akses Kendaraan", "Lahan Sudirman"],
    koordinat: { x: 75, y: 70 },
    gambar: "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=800&q=80",
    rating: 4.4,
    totalSewa: 19,
    deskripsi: "Spot terbesar di kawasan Agrokompleks Sudirman dengan luas 4×4m. Dapat diakses kendaraan box untuk bongkar muat. Cocok untuk bazar skala besar.",
  },
  {
    id: "spot-007",
    kode: "B-05",
    nama: "Spot Boulevard B-05",
    zona: "boulevard",
    zonaLabel: "Boulevard Sisi Timur",
    lokasi: "Boulevard Timur, Kampus Jimbaran",
    ukuran: "2x2",
    ukuranLabel: "Standar (2×2m)",
    daya: 450,
    tarifPerHari: 80000,
    status: "tersedia",
    fasilitas: ["Listrik 450W", "Kanopi"],
    tags: ["Dekat Kantin Utama", "Ramai Siang Hari"],
    koordinat: { x: 65, y: 40 },
    gambar: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    rating: 4.6,
    totalSewa: 38,
    deskripsi: "Spot di sisi timur Boulevard dekat kantin utama, ramai pada jam makan siang. Strategis untuk penjualan makanan dan minuman.",
  },
  {
    id: "spot-008",
    kode: "C-03",
    nama: "Spot Student Center C-03",
    zona: "sc",
    zonaLabel: "Teras SC Bagian Selatan",
    lokasi: "Student Center Selatan, Kampus Jimbaran",
    ukuran: "3x3",
    ukuranLabel: "Medium (3×3m)",
    daya: 900,
    tarifPerHari: 105000,
    status: "pemeliharaan",
    fasilitas: ["Listrik 900W", "Kursi & Meja"],
    tags: ["Teras Teduh", "Tempat Duduk Tersedia"],
    koordinat: { x: 55, y: 65 },
    gambar: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    rating: 4.3,
    totalSewa: 22,
    deskripsi: "Spot di teras selatan Student Center dengan kursi dan meja tersedia. Cocok untuk usaha yang membutuhkan area duduk seperti konsultasi atau pameran.",
  },
  {
    id: "spot-009",
    kode: "A-12",
    nama: "Spot Rektorat A-12",
    zona: "rektorat",
    zonaLabel: "Area Parkir Rektorat Utara",
    lokasi: "Parkir Utara Rektorat, Kampus Jimbaran",
    ukuran: "3x3",
    ukuranLabel: "Medium (3×3m)",
    daya: 900,
    tarifPerHari: 95000,
    status: "tersedia",
    fasilitas: ["Listrik 900W", "Area Terbuka Luas"],
    tags: ["Dekat Parkir", "Akses Mudah", "Area Terbuka"],
    koordinat: { x: 30, y: 35 },
    gambar: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
    rating: 4.2,
    totalSewa: 15,
    deskripsi: "Spot di area parkir utara rektorat, mudah diakses dari pintu masuk kampus. Cocok untuk pameran produk atau stan informasi.",
  },
  {
    id: "spot-010",
    kode: "D-07",
    nama: "Spot Agrokompleks D-07",
    zona: "agrokompleks",
    zonaLabel: "Plaza Agrokompleks Sudirman",
    lokasi: "Plaza Agrokompleks, Kampus Sudirman",
    ukuran: "2x2",
    ukuranLabel: "Standar (2×2m)",
    daya: 450,
    tarifPerHari: 65000,
    status: "tersedia",
    fasilitas: ["Listrik 450W"],
    tags: ["Kampus Kedokteran", "Harga Terjangkau"],
    koordinat: { x: 80, y: 75 },
    gambar: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
    rating: 4.1,
    totalSewa: 11,
    deskripsi: "Spot ekonomis di Kampus Sudirman, dekat Fakultas Kedokteran. Cocok untuk penjualan makanan sehat dan perlengkapan medis.",
  },
  {
    id: "spot-011",
    kode: "B-08",
    nama: "Spot Boulevard Bazar B-08",
    zona: "boulevard",
    zonaLabel: "Boulevard Bazar Tengah",
    lokasi: "Pusat Boulevard, Kampus Jimbaran",
    ukuran: "4x4",
    ukuranLabel: "Gazebo Besar (4×4m)",
    daya: 1300,
    tarifPerHari: 160000,
    status: "tersedia",
    fasilitas: ["Listrik 1300W", "Tenda Gazebo Permanen", "Meja 4 Buah"],
    tags: ["Titik Bazar Utama", "Kapasitas Besar", "Gazebo Permanen"],
    koordinat: { x: 58, y: 42 },
    gambar: "https://images.unsplash.com/photo-1516876437184-593fda40c7ce?w=800&q=80",
    rating: 4.9,
    totalSewa: 74,
    deskripsi: "Spot terpopuler di Boulevard dengan gazebo permanen. Menjadi pusat kegiatan bazar kampus. Dilengkapi meja permanen dan daya listrik besar.",
  },
  {
    id: "spot-012",
    kode: "A-16",
    nama: "Spot Rektorat Selatan A-16",
    zona: "rektorat",
    zonaLabel: "Lapangan Selatan Rektorat",
    lokasi: "Lapangan Selatan Rektorat, Kampus Jimbaran",
    ukuran: "3x3",
    ukuranLabel: "Medium (3×3m)",
    daya: 900,
    tarifPerHari: 115000,
    status: "dipesan",
    fasilitas: ["Listrik 900W", "Kanopi", "Area Hijau"],
    tags: ["Pemandangan Asri", "Nyaman", "Area Duduk"],
    koordinat: { x: 40, y: 45 },
    gambar: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&q=80",
    rating: 4.7,
    totalSewa: 29,
    deskripsi: "Spot di lapangan selatan rektorat dengan pemandangan hijau asri. Suasana nyaman dan teduh, cocok untuk usaha yang membutuhkan suasana santai.",
    jenisUsaha: "Kuliner - Makanan & Minuman",
  },
];

// ============================================================
// DATA BOOKINGS / TRANSAKSI
// ============================================================
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: "TXN-2025-001",
    ownerId: "ayu",
    spotId: "spot-001",
    spotNama: "Spot Rektorat A-01",
    spotKode: "A-01",
    penyewa: {
      nama: "Ni Kadek Ayu Maharani",
      nim: "2205541001",
      fakultas: "Fakultas Teknik",
      telepon: "08123456789",
      email: "ayu.maharani@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayu",
    },
    tanggalMulai: "2025-10-25",
    tanggalSelesai: "2025-10-27",
    jumlahHari: 3,
    totalBayar: 225000,
    metodePembayaran: "Transfer BNI",
    status: "menunggu",
    statusVerifikasi: "menunggu",
    jenisUsaha: "Kuliner - Minuman Kekinian",
    catatan: "Stan es teh tarik untuk acara Dies Natalis Udayana",
    createdAt: "2025-10-24T09:15:00",
  },
  {
    id: "TXN-2025-002",
    ownerId: "bayu",
    spotId: "spot-004",
    spotNama: "Spot Student Center C-01",
    spotKode: "C-01",
    penyewa: {
      nama: "I Wayan Bayu Pratama",
      nim: "2105551023",
      fakultas: "Fakultas Ekonomi & Bisnis",
      telepon: "08234567890",
      email: "bayu.pratama@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bayu",
    },
    tanggalMulai: "2025-10-26",
    tanggalSelesai: "2025-10-28",
    jumlahHari: 3,
    totalBayar: 330000,
    metodePembayaran: "Transfer BRI",
    status: "menunggu",
    statusVerifikasi: "menunggu",
    jenisUsaha: "Merchandise - Produk Kreatif Mahasiswa",
    catatan: "Penjualan merchandise HMPS FEB Udayana",
    createdAt: "2025-10-24T11:30:00",
  },
  {
    id: "TXN-2025-003",
    ownerId: "external:deva.mahendra@student.unud.ac.id",
    spotId: "spot-007",
    spotNama: "Spot Boulevard B-05",
    spotKode: "B-05",
    penyewa: {
      nama: "Putu Deva Mahendra",
      nim: "2205531045",
      fakultas: "Fakultas Hukum",
      telepon: "08345678901",
      email: "deva.mahendra@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Deva",
    },
    tanggalMulai: "2025-10-23",
    tanggalSelesai: "2025-10-25",
    jumlahHari: 3,
    totalBayar: 240000,
    metodePembayaran: "QRIS",
    status: "aktif",
    statusVerifikasi: "disetujui",
    jenisUsaha: "Kuliner - Nasi Jinggo",
    createdAt: "2025-10-22T14:20:00",
  },
  {
    id: "TXN-2025-004",
    ownerId: "external:made.arisanti@student.unud.ac.id",
    spotId: "spot-011",
    spotNama: "Spot Boulevard Bazar B-08",
    spotKode: "B-08",
    penyewa: {
      nama: "Ni Luh Made Arisanti",
      nim: "2005521067",
      fakultas: "Fakultas Kedokteran",
      telepon: "08456789012",
      email: "made.arisanti@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arisanti",
    },
    tanggalMulai: "2025-10-20",
    tanggalSelesai: "2025-10-22",
    jumlahHari: 3,
    totalBayar: 480000,
    metodePembayaran: "Transfer Mandiri",
    status: "selesai",
    statusVerifikasi: "disetujui",
    jenisUsaha: "Jasa - Konsultasi Kesehatan Gratis",
    createdAt: "2025-10-19T08:00:00",
  },
  {
    id: "TXN-2025-005",
    ownerId: "external:darma.putra@student.unud.ac.id",
    spotId: "spot-002",
    spotNama: "Spot Rektorat A-04",
    spotKode: "A-04",
    penyewa: {
      nama: "Gede Darma Putra",
      nim: "2205561089",
      fakultas: "Fakultas Pertanian",
      telepon: "08567890123",
      email: "darma.putra@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Darma",
    },
    tanggalMulai: "2025-10-27",
    tanggalSelesai: "2025-10-29",
    jumlahHari: 3,
    totalBayar: 360000,
    metodePembayaran: "Transfer BCA",
    status: "menunggu",
    statusVerifikasi: "menunggu",
    jenisUsaha: "Pameran - Produk Agribisnis",
    catatan: "Pameran tugas akhir produk olahan pertanian",
    createdAt: "2025-10-24T16:45:00",
  },
  {
    id: "TXN-2025-006",
    ownerId: "external:tri.dewi@student.unud.ac.id",
    spotId: "spot-006",
    spotNama: "Spot Agrokompleks D-03",
    spotKode: "D-03",
    penyewa: {
      nama: "Komang Tri Dewi",
      nim: "2105511021",
      fakultas: "Fakultas MIPA",
      telepon: "08678901234",
      email: "tri.dewi@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=TriDewi",
    },
    tanggalMulai: "2025-10-18",
    tanggalSelesai: "2025-10-19",
    jumlahHari: 2,
    totalBayar: 350000,
    metodePembayaran: "Transfer BNI",
    status: "selesai",
    statusVerifikasi: "disetujui",
    jenisUsaha: "Bazar - Science Fair MIPA",
    createdAt: "2025-10-17T10:00:00",
  },
  {
    id: "TXN-2025-007",
    ownerId: "external:reza.saputra@student.unud.ac.id",
    spotId: "spot-009",
    spotNama: "Spot Rektorat A-12",
    spotKode: "A-12",
    penyewa: {
      nama: "I Made Reza Saputra",
      nim: "2305571003",
      fakultas: "Fakultas Hukum",
      telepon: "08789012345",
      email: "reza.saputra@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Reza",
    },
    tanggalMulai: "2025-10-26",
    tanggalSelesai: "2025-10-26",
    jumlahHari: 1,
    totalBayar: 95000,
    metodePembayaran: "QRIS",
    status: "menunggu",
    statusVerifikasi: "menunggu",
    jenisUsaha: "Jasa - Konsultasi Hukum",
    createdAt: "2025-10-25T07:30:00",
  },
  {
    id: "TXN-2025-008",
    ownerId: "external:ayu.lestari@student.unud.ac.id",
    spotId: "spot-005",
    spotNama: "Spot Gerbang Utama A-08",
    spotKode: "A-08",
    penyewa: {
      nama: "Desak Ayu Lestari",
      nim: "2205581034",
      fakultas: "Fakultas Pariwisata",
      telepon: "08890123456",
      email: "ayu.lestari@student.unud.ac.id",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lestari",
    },
    tanggalMulai: "2025-10-15",
    tanggalSelesai: "2025-10-16",
    jumlahHari: 2,
    totalBayar: 140000,
    metodePembayaran: "Transfer BRI",
    status: "selesai",
    statusVerifikasi: "ditolak",
    jenisUsaha: "Kuliner - Jajanan Tradisional Bali",
    catatan: "Bukti pembayaran tidak terbaca",
    createdAt: "2025-10-14T12:00:00",
  },
];

// ============================================================
// DATA MANAJEMEN SPOT (DASHBOARD PENGELOLA)
// ============================================================
export const MOCK_SPOT_MANAGEMENT: SpotManagement[] = [
  {
    id: "spot-001",
    kode: "A-01",
    nama: "Spot Rektorat A-01",
    zona: "rektorat",
    zonaLabel: "Lapangan Rektorat",
    status: "tersedia",
    ukuran: "2×2m",
    tarifPerHari: 75000,
    bookingAktif: 0,
    pendapatan: 3525000,
    terakhirDiperiksa: "2025-10-24",
    fasilitas: ["Listrik 450W", "Kanopi"],
  },
  {
    id: "spot-002",
    kode: "A-04",
    nama: "Spot Rektorat A-04",
    zona: "rektorat",
    zonaLabel: "Lapangan Rektorat",
    status: "dipesan",
    ukuran: "3×3m",
    tarifPerHari: 120000,
    bookingAktif: 1,
    pendapatan: 3840000,
    terakhirDiperiksa: "2025-10-23",
    fasilitas: ["Listrik 900W", "Air Bersih", "Tenda"],
  },
  {
    id: "spot-003",
    kode: "B-02",
    nama: "Spot Kuliner Corner B-02",
    zona: "boulevard",
    zonaLabel: "Boulevard Utama",
    status: "dipesan",
    ukuran: "2×2m",
    tarifPerHari: 85000,
    bookingAktif: 1,
    pendapatan: 5185000,
    terakhirDiperiksa: "2025-10-24",
    fasilitas: ["Listrik 450W", "Jalur Air"],
  },
  {
    id: "spot-004",
    kode: "C-01",
    nama: "Spot Student Center C-01",
    zona: "sc",
    zonaLabel: "Student Center",
    status: "tersedia",
    ukuran: "3×3m",
    tarifPerHari: 110000,
    bookingAktif: 0,
    pendapatan: 3080000,
    terakhirDiperiksa: "2025-10-22",
    fasilitas: ["Listrik 900W", "WiFi", "Meja"],
  },
  {
    id: "spot-005",
    kode: "A-08",
    nama: "Spot Gerbang Utama A-08",
    zona: "rektorat",
    zonaLabel: "Lapangan Rektorat",
    status: "tersedia",
    ukuran: "2×2m",
    tarifPerHari: 70000,
    bookingAktif: 0,
    pendapatan: 3850000,
    terakhirDiperiksa: "2025-10-24",
    fasilitas: ["Listrik 450W", "Kanopi"],
  },
  {
    id: "spot-006",
    kode: "D-03",
    nama: "Spot Agrokompleks D-03",
    zona: "agrokompleks",
    zonaLabel: "Agrokompleks Sudirman",
    status: "tersedia",
    ukuran: "4×4m",
    tarifPerHari: 175000,
    bookingAktif: 0,
    pendapatan: 3325000,
    terakhirDiperiksa: "2025-10-20",
    fasilitas: ["Listrik 1300W", "Akses Kendaraan"],
  },
  {
    id: "spot-008",
    kode: "C-03",
    nama: "Spot Student Center C-03",
    zona: "sc",
    zonaLabel: "Student Center",
    status: "pemeliharaan",
    ukuran: "3×3m",
    tarifPerHari: 105000,
    bookingAktif: 0,
    pendapatan: 2310000,
    terakhirDiperiksa: "2025-10-20",
    fasilitas: ["Listrik 900W", "Kursi & Meja"],
  },
  {
    id: "spot-011",
    kode: "B-08",
    nama: "Spot Boulevard Bazar B-08",
    zona: "boulevard",
    zonaLabel: "Boulevard Utama",
    status: "tersedia",
    ukuran: "4×4m",
    tarifPerHari: 160000,
    bookingAktif: 0,
    pendapatan: 11840000,
    terakhirDiperiksa: "2025-10-25",
    fasilitas: ["Listrik 1300W", "Gazebo", "Meja 4x"],
  },
];

// ============================================================
// STATISTIK DASHBOARD
// ============================================================
export const MOCK_DASHBOARD_STATS = {
  totalSpot: 24,
  spotTerverifikasi: 18,
  spotPemeliharaan: 6,
  pemesananBerjalan: 19,
  tingkatKeterisian: 79.1,
  totalPendapatanBulanIni: 14850000,
  targetPendapatan: 16800000,
  pertumbuhanVsBulanLalu: 12.4,
  targetTercapai: 88,
  pendapatanPerMinggu: [
    { minggu: "Mg 1", pendapatan: 2800000 },
    { minggu: "Mg 2", pendapatan: 3200000 },
    { minggu: "Mg 3", pendapatan: 4100000 },
    { minggu: "Mg 4", pendapatan: 4750000 },
  ],
  persebaranZona: [
    { zona: "Zona A (Rektorat)", spot: 8, bookingAktif: 5, pendapatan: 6300000 },
    { zona: "Zona B (Boulevard)", spot: 6, bookingAktif: 7, pendapatan: 5100000 },
    { zona: "Zona C (Student Center)", spot: 6, bookingAktif: 4, pendapatan: 2250000 },
    { zona: "Zona D (Agrokompleks)", spot: 4, bookingAktif: 3, pendapatan: 1200000 },
  ],
};

// ============================================================
// HELPER
// ============================================================
export const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

export const ZONA_LABELS: Record<string, string> = {
  all: "Semua Zona",
  rektorat: "Zona A – Lapangan Rektorat Jimbaran",
  boulevard: "Zona B – Boulevard Utama Jimbaran",
  sc: "Zona C – Plaza Student Center",
  agrokompleks: "Zona D – Agrokompleks Sudirman",
};

export const ZONA_COUNTS = {
  all: MOCK_SPOTS.filter(s => s.status !== "pemeliharaan").length,
  rektorat: MOCK_SPOTS.filter(s => s.zona === "rektorat" && s.status !== "pemeliharaan").length,
  boulevard: MOCK_SPOTS.filter(s => s.zona === "boulevard" && s.status !== "pemeliharaan").length,
  sc: MOCK_SPOTS.filter(s => s.zona === "sc" && s.status !== "pemeliharaan").length,
  agrokompleks: MOCK_SPOTS.filter(s => s.zona === "agrokompleks" && s.status !== "pemeliharaan").length,
};

export const MOCK_PRODUCTS: Product[] = [
  // Produk B-02
  {
    id: "product-b02-01",
    spotId: "spot-003",
    nama: "Nasi Ayam Sambal Matah",
    kategori: "Makanan",
    harga: 18000,
    deskripsi: "Nasi dengan ayam dan sambal matah khas Bali.",
  },
  {
    id: "product-b02-02",
    spotId: "spot-003",
    nama: "Mie Goreng Spesial",
    kategori: "Makanan",
    harga: 15000,
    deskripsi: "Mie goreng dengan telur dan sayuran.",
  },
  {
    id: "product-b02-03",
    spotId: "spot-003",
    nama: "Es Kopi Susu",
    kategori: "Minuman",
    harga: 12000,
    deskripsi: "Kopi susu dingin untuk menemani aktivitas kuliah.",
  },

  // Produk A-16
  {
    id: "product-a16-01",
    spotId: "spot-012",
    nama: "Nasi Goreng Spesial",
    kategori: "Makanan",
    harga: 17000,
    deskripsi: "Nasi goreng dengan telur dan topping pilihan.",
  },
  {
    id: "product-a16-02",
    spotId: "spot-012",
    nama: "Ayam Geprek",
    kategori: "Makanan",
    harga: 18000,
    deskripsi: "Ayam crispy dengan sambal pedas khas.",
  },
  {
    id: "product-a16-03",
    spotId: "spot-012",
    nama: "Es Teh Manis",
    kategori: "Minuman",
    harga: 5000,
    deskripsi: "Teh manis dingin yang menyegarkan.",
  },
];
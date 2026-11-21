"use client";

import { useSyncExternalStore } from "react";
import {
  DEMO_USERS,
  MOCK_BOOKINGS,
  MOCK_SPOTS,
  MOCK_REVIEWS,
  type Booking,
  type Review,
  type TransactionStatus,
} from "./mock-data";
import type { DemoUser, Role } from "./types";
import {
  cancellationDeadline,
  CANCELLATION_WINDOW_MS,
  CLEANING_DAYS,
  PAYMENT_WINDOW_MS,
  minimumRentalStartDate,
  rentalPeriodsConflict,
  rentalStart,
} from "./rental-policy";

// Demo only: browser storage is editable and is not a security boundary.
const SESSION = "ngelapak-demo-session-v1";
const BOOKINGS = "ngelapak-demo-bookings-v1";
const EVENT = "ngelapak-demo-change";
const PROFILES = "ngelapak-demo-profiles-v1";
const PRODUCTS = "ngelapak-demo-produk-v1";
const REVIEWS = "ngelapak-demo-reviews-v1";

type ProfileOverrides = Record<
  string,
  {
    nama: string;
    email: string;
    nim?: string;
    fakultas?: string;
    telepon?: string;
  }
>;
function getProfileOverrides(): ProfileOverrides {
  try {
    const data = JSON.parse(read(PROFILES));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function getDemoUsers(): DemoUser[] {
  const profiles = getProfileOverrides();

  return DEMO_USERS.map((user) => ({
    ...user,
    ...profiles[user.id],
  }));
}

// Re-export agar komponen yang mengimpor DEMO_USERS dari demo-store
// tetap dapat berjalan tanpa perlu mengubah import-nya.
export { DEMO_USERS };

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function read(key: string, session = false) {
  try {
    return (session ? sessionStorage : localStorage).getItem(key) ?? "";
  } catch {
    return "";
  }
}

const sampleCancellations = [
  { id: "DEMO-R01", ownerId: "ayu", status: "menunggu", alasan: "Jadwal kegiatan kampus berubah." },
  { id: "DEMO-R02", ownerId: "bayu", status: "disetujui", alasan: "Jadwal tim usaha bentrok dengan perkuliahan." },
] as const;

function withSampleCancellations(bookings: Booking[], now: number): Booking[] {
  const examples = sampleCancellations.flatMap(({ id, ownerId, status, alasan }) => {
    if (bookings.some((booking) => booking.id === id)) return [];
    const sample = MOCK_BOOKINGS.find((booking) => booking.ownerId === ownerId);
    if (!sample) return [];
    const nextFreeDay = bookings.reduce((date, existing) => {
      if (existing.spotId !== sample.spotId || existing.status === "dibatalkan" ||
          existing.statusVerifikasi === "ditolak") return date;
      const end = Date.parse(existing.tanggalSelesai + "T00:00:00Z");
      return Number.isFinite(end) ? Math.max(date, end + (CLEANING_DAYS + 1) * CANCELLATION_WINDOW_MS) : date;
    }, now + 20 * CANCELLATION_WINDOW_MS);
    const start = new Date(nextFreeDay).toISOString().slice(0, 10);
    const paidAt = new Date(now - PAYMENT_WINDOW_MS).toISOString();
    const booking: Booking = {
      ...sample,
      id,
      tanggalMulai: start,
      tanggalSelesai: start,
      jumlahHari: 1,
      totalBayar: sample.totalBayar / sample.jumlahHari,
      createdAt: paidAt,
      paidAt,
      metodePembayaran: "midtrans",
      status: status === "menunggu" ? "aktif" : "dibatalkan",
      statusVerifikasi: "disetujui",
      paymentStatus: "settlement",
      pembatalan: {
        nama: sample.penyewa.nama,
        nim: sample.penyewa.nim,
        telepon: sample.penyewa.telepon,
        bank: "Bank Demo",
        nomorRekening: "000002048",
        namaRekening: sample.penyewa.nama,
        alasan,
        diajukanPada: new Date(now).toISOString(),
        status,
        refundCompleted: status === "disetujui",
      },
    };
    return [booking];
  });
  return [...bookings, ...examples];
}

function parseBookings(raw: string): Booking[] {
  const now = Date.now();
  try {
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      const bookings = data.map((booking: Booking): Booking =>
        booking.status === "menunggu" && booking.paymentExpiresAt && Date.parse(booking.paymentExpiresAt) <= now
          ? { ...booking, status: "dibatalkan", statusVerifikasi: "ditolak", paymentStatus: "expire" }
          : booking);
      return withSampleCancellations(bookings, now);
    }
  } catch {
    // Use fixtures on first visit.
  }

  return withSampleCancellations(MOCK_BOOKINGS, now);
}

export function getAllDemoBookings() {
  return parseBookings(read(BOOKINGS));
}

export function attachDemoBookingProof(bookingId: string, proofRef: string) {
  const bookings = parseBookings(read(BOOKINGS));
  const booking = bookings.find((item) => item.id === bookingId);
  if (!booking) throw new Error("Pesanan demo tidak ditemukan.");
  save(bookings.map((item) => item.id === bookingId ? { ...item, buktiBayar: proofRef } : item));
}

function currentUser() {
  return getDemoUsers().find(
    (user) => user.id === read(SESSION, true),
  ) ?? null;
}

function requireRole(role: Role) {
  const user = currentUser();

  if (user?.role !== role) {
    throw new Error("Anda tidak memiliki akses untuk tindakan ini.");
  }

  return user;
}

function save(bookings: Booking[]) {
  localStorage.setItem(BOOKINGS, JSON.stringify(bookings));
  window.dispatchEvent(new Event(EVENT));
}

// ============================================================
// BOOKING VISIBILITY
// ============================================================

/**
 * Aturan visibilitas pesanan:
 * - Pengguna yang belum login tidak dapat melihat pesanan.
 * - Admin dapat melihat seluruh pesanan.
 * - Penyewa hanya dapat melihat pesanan miliknya sendiri.
 * - ownerId menjadi identitas utama kepemilikan pesanan.
 * - Email menjadi fallback untuk data lama yang belum memiliki ownerId.
 */
export function visibleBookings(
  user: DemoUser | null,
  bookings: Booking[],
) {
  if (!user) {
    return [];
  }

  if (user.role === "admin") {
    return bookings;
  }

  return bookings.filter((booking) => {
    if (booking.ownerId) {
      return booking.ownerId === user.id;
    }

    return (
      booking.penyewa.email.toLowerCase() ===
      user.email.toLowerCase()
    );
  });
}

// ============================================================
// DEMO SESSION
// ============================================================

export function useDemo() {
  const userId = useSyncExternalStore(
    subscribe,
    () => read(SESSION, true),
    () => "",
  );

  const raw = useSyncExternalStore(
    subscribe,
    () => read(BOOKINGS),
    () => "",
  );

  const user = getDemoUsers().find(
    (user) => user.id === userId,
  ) ?? null;

  return {
    user,
    bookings: user ? visibleBookings(user, parseBookings(raw)) : [],
  };
}

// ============================================================
// LOGIN
// ============================================================

export function demoLogin(id: string) {
  if (!getDemoUsers().some((user) => user.id === id)) {
    throw new Error("Akun demo tidak dikenal.");
  }

  sessionStorage.setItem(SESSION, id);
  window.dispatchEvent(new Event(EVENT));
}

// ============================================================
// UPDATE PROFILE
// ============================================================

export function updateDemoProfile(input: {
  nama: string;
  email: string;
  nim: string;
  fakultas: string;
  telepon: string;
}) {
  const user = currentUser();

  if (!user) {
    throw new Error("Silakan masuk terlebih dahulu.");
  }

  const nama = input.nama.trim();
  const email = input.email.trim().toLowerCase();
  const nim = input.nim.trim();
  const fakultas = input.fakultas.trim();
  const telepon = input.telepon.trim();

  if (!nama || !email || !nim || !fakultas || !telepon) {
    throw new Error("Semua data profil wajib diisi.");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    throw new Error("Format email tidak valid.");
  }

  const duplicate = getDemoUsers().some(
    (item) =>
      item.id !== user.id &&
      item.email.toLowerCase() === email,
  );

  if (duplicate) {
    throw new Error("Email sudah digunakan oleh akun lain.");
  }

  const profiles = getProfileOverrides();

  profiles[user.id] = {
    nama,
    email,
    nim,
    fakultas,
    telepon,
  };

  try {
    localStorage.setItem(PROFILES, JSON.stringify(profiles));
  } catch {
    throw new Error("Profil gagal disimpan di browser.");
  }

  window.dispatchEvent(new Event(EVENT));
}

function readProductMap(): Record<string, string> {
  try {
    const data = JSON.parse(read(PRODUCTS));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function readProductCaption(spotId: string) {
  const text = readProductMap()[spotId];
  return typeof text === "string" ? text : "";
}

export function canEditProductCaption(spotId: string) {
  const user = currentUser();
  return user?.role === "penyewa" && getAllDemoBookings().some((booking) =>
    booking.ownerId === user.id &&
    booking.spotId === spotId &&
    booking.status !== "dibatalkan" &&
    booking.statusVerifikasi === "disetujui" &&
    Boolean(booking.paidAt) &&
    (booking.metodePembayaran !== "midtrans" || booking.paymentStatus === "settlement"),
  );
}

export function saveProductCaption(spotId: string, text: string) {
  const user = currentUser();

  if (user?.role !== "penyewa") {
    throw new Error("Hanya penyewa yang dapat mengubah deskripsi produk.");
  }

  if (!canEditProductCaption(spotId)) {
    throw new Error("Deskripsi produk hanya dapat diisi setelah pesanan Anda lunas.");
  }

  const captions = readProductMap();
  captions[spotId] = text.trim();

  try {
    localStorage.setItem(PRODUCTS, JSON.stringify(captions));
  } catch {
    throw new Error("Deskripsi produk gagal disimpan di browser.");
  }

  window.dispatchEvent(new Event(EVENT));
}

// ============================================================
// LOGOUT
// ============================================================

export function demoLogout() {
  sessionStorage.removeItem(SESSION);
  window.dispatchEvent(new Event(EVENT));
}

// ============================================================
// DATE HELPER
// ============================================================

export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// ============================================================
// CREATE BOOKING
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;

function isActiveBlockingBooking(booking: Booking, now = Date.now()) {
  if (booking.status === "dibatalkan" || booking.statusVerifikasi === "ditolak") {
    return false;
  }

  // Pesanan menunggu tanpa bukti yang sudah lewat 1×24 jam tidak menahan jadwal.
  if (
    booking.status === "menunggu" &&
    booking.statusVerifikasi === "menunggu" &&
    !booking.buktiBayar &&
    booking.metodePembayaran !== "midtrans"
  ) {
    const created = new Date(booking.createdAt).getTime();
    if (Number.isFinite(created) && now - created >= DAY_MS) {
      return false;
    }
  }

  return true;
}

export function createDemoBooking(input: {
  spotId: string;
  tanggalMulai: string;
  jumlahHari: number;
  jenisUsaha: string;
  namaUsaha?: string;
  kategoriPenjual?: string;
  catatan: string;
  metodePembayaran: string;
  buktiBayar?: string;
}) {
  const user = requireRole("penyewa");

  // Bersihkan dulu pesanan bayar-nanti yang kedaluwarsa agar tidak memblokir slot.
  expireUnpaidDemoBookings();

  const spot = MOCK_SPOTS.find(
    (spot) => spot.id === input.spotId,
  );

  if (!spot || spot.status === "pemeliharaan") {
    throw new Error("Lapak ini belum tersedia untuk dipesan.");
  }

  const jumlahHari = Math.round(Number(input.jumlahHari));
  const start = new Date(input.tanggalMulai + "T00:00:00Z");
  const now = Date.now();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.tanggalMulai) ||
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== input.tanggalMulai ||
    input.tanggalMulai < minimumRentalStartDate() ||
    !Number.isInteger(jumlahHari) ||
    jumlahHari < 1 ||
    jumlahHari > 30 ||
    !input.jenisUsaha.trim()
  ) {
    throw new Error(
      "Isi jenis usaha, tanggal mulai minimal dua hari dari sekarang, dan durasi 1–30 hari.",
    );
  }
  if (input.metodePembayaran === "midtrans" && now + PAYMENT_WINDOW_MS > rentalStart(input.tanggalMulai)) {
    throw new Error("Pemesanan ditutup satu jam sebelum sewa mulai (08.00 WITA).");
  }

  start.setUTCDate(start.getUTCDate() + jumlahHari - 1);
  const end = start.toISOString().slice(0, 10);
  const bookings = parseBookings(read(BOOKINGS));

  if (spot.jadwalOperasional?.some((schedule) =>
    rentalPeriodsConflict(input.tanggalMulai, end, schedule.startDate, schedule.endDate)
  )) {
    throw new Error("Jadwal bertabrakan dengan masa sewa atau pembersihan spot. Pilih tanggal berbeda.");
  }

  if (
    bookings.some(
      (booking) =>
        booking.spotId === spot.id &&
        isActiveBlockingBooking(booking) &&
        rentalPeriodsConflict(input.tanggalMulai, end, booking.tanggalMulai, booking.tanggalSelesai),
    )
  ) {
    throw new Error(
      "Jadwal bertabrakan dengan pemesanan lain. Pilih tanggal berbeda.",
    );
  }

  const fixture =
    MOCK_BOOKINGS.find((booking) => booking.ownerId === user.id) ??
    MOCK_BOOKINGS.find(
      (booking) =>
        booking.penyewa.email.toLowerCase() ===
        DEMO_USERS.find((item) => item.id === user.id)?.email.toLowerCase(),
    );

  if (!fixture) {
    throw new Error("Data profil penyewa tidak ditemukan.");
  }

  const booking: Booking = {
    id: `TXN-${crypto.randomUUID()}`,
    ownerId: user.id,
    spotId: spot.id,
    spotNama: spot.nama,
    spotKode: spot.kode,
    penyewa: {
      ...fixture.penyewa,
      nama: user.nama,
      email: user.email,
    },
    tanggalMulai: input.tanggalMulai,
    tanggalSelesai: end,
    jumlahHari,
    totalBayar: spot.tarifPerHari * jumlahHari,
    metodePembayaran: input.metodePembayaran,
    status: "menunggu",
    statusVerifikasi: "menunggu",
    jenisUsaha: input.jenisUsaha.trim(),
    namaUsaha: input.namaUsaha?.trim() || undefined,
    kategoriPenjual: input.kategoriPenjual?.trim() || undefined,
    catatan: input.catatan?.trim() || undefined,
    createdAt: new Date(now).toISOString(),
    // Bayar Nanti: bukti boleh kosong; boleh dilengkapi dalam 1×24 jam.
    ...(input.buktiBayar ? { buktiBayar: input.buktiBayar } : {}),
    paymentExpiresAt: input.metodePembayaran === "midtrans" ? new Date(now + PAYMENT_WINDOW_MS).toISOString() : undefined,
    paymentStatus: input.metodePembayaran === "midtrans" ? "pending" : undefined,
  };

  save([booking, ...bookings]);
  return booking.id;
}

/** Batalkan pesanan demo yang belum bayar melewati tenggat 1×24 jam. */
export function expireUnpaidDemoBookings(now = Date.now()) {
  const raw = read(BOOKINGS);
  if (!raw) return [];
  const bookings = parseBookings(raw);
  let changed = false;

  const next = bookings.map((item) => {
    if (
      item.status === "menunggu" &&
      item.statusVerifikasi === "menunggu" &&
      !item.buktiBayar &&
      item.metodePembayaran !== "midtrans"
    ) {
      const created = new Date(item.createdAt).getTime();
      if (Number.isFinite(created) && now - created >= DAY_MS) {
        changed = true;
        return { ...item, status: "dibatalkan" as const };
      }
    }
    // Midtrans expiry is handled in parseBookings via paymentExpiresAt.
    return item;
  });

  if (changed) save(next);
  return next;
}

export function completeDemoPayment(id: string) {
  const user = requireRole("penyewa");
  const bookings = parseBookings(read(BOOKINGS));
  const booking = bookings.find((item) => item.id === id && item.ownerId === user.id);
  if (!booking || booking.metodePembayaran !== "midtrans" || booking.status !== "menunggu") {
    throw new Error("Pembayaran demo tidak tersedia atau sudah kedaluwarsa.");
  }
  save(bookings.map((item) => item.id === id ? {
    ...item, status: "aktif", statusVerifikasi: "disetujui", paymentStatus: "settlement", paidAt: new Date().toISOString(),
  } : item));
}

export function canCancelBooking(booking: Booking, now = Date.now()) {
  if (booking.metodePembayaran === "midtrans") {
    if (booking.status !== "aktif" || !booking.paidAt || booking.pembatalan) return false;
    const cutoff = cancellationDeadline(booking.tanggalMulai, booking.paidAt);
    return Date.parse(booking.paidAt) < cutoff && now <= cutoff;
  }
  if (booking.status === "dibatalkan" || booking.statusVerifikasi !== "menunggu") {
    return false;
  }

  const created = new Date(booking.createdAt).getTime();
  return Number.isFinite(created) && now - created < CANCELLATION_WINDOW_MS;
}

export function cancelDemoBooking(
  id: string,
  input?: {
    nama: string;
    nim: string;
    telepon: string;
    bank: string;
    nomorRekening: string;
    namaRekening: string;
    alasan: string;
  },
) {
  const user = requireRole("penyewa");
  const bookings = parseBookings(read(BOOKINGS));
  const booking = bookings.find((item) => item.id === id);

  if (!booking || booking.ownerId !== user.id) {
    throw new Error("Pesanan ini bukan milik Anda.");
  }

  if (!canCancelBooking(booking)) {
    throw new Error(booking.metodePembayaran === "midtrans"
      ? "Pesanan belum lunas atau batas pengajuan pembatalan sudah lewat."
      : "Pembatalan hanya tersedia dalam 1x24 jam sebelum admin memverifikasi.");
  }
  if (booking.metodePembayaran === "midtrans" && !input) throw new Error("Isi pengajuan pembatalan.");

  if (input !== undefined) {
    const nama = input.nama.trim();
    const nim = input.nim.trim();
    const telepon = input.telepon.trim();
    const bank = input.bank.trim();
    const nomorRekening = input.nomorRekening.trim();
    const namaRekening = input.namaRekening.trim();
    const alasan = input.alasan.trim();

    if (!nama || !nim || !telepon || !bank || !nomorRekening || !namaRekening || !alasan) {
      throw new Error("Lengkapi identitas, rekening, dan alasan pembatalan.");
    }

    save(
      bookings.map((item) =>
        item.id === id
          ? {
            ...item,
            // Midtrans: hold schedule until admin approves. Legacy transfer: cancel immediately.
            status: item.metodePembayaran === "midtrans" ? item.status : "dibatalkan",
            pembatalan: {
              nama,
              nim,
              telepon,
              bank,
              nomorRekening,
              namaRekening,
              alasan,
              diajukanPada: new Date().toISOString(),
              status: "menunggu",
            },
          }
          : item,
      ),
    );
  } else {
    save(bookings.map((item) =>
      item.id === id ? { ...item, status: "dibatalkan" } : item,
    ));
  }
}



// ============================================================
// VERIFY BOOKING
// ============================================================

export function verifyDemoBooking(
  id: string,
  status: TransactionStatus,
) {
  requireRole("admin");

  const bookings = parseBookings(read(BOOKINGS));

  const booking = bookings.find(
    (booking) => booking.id === id,
  );

  if (
    !booking ||
    booking.metodePembayaran === "midtrans" ||
    booking.status === "dibatalkan" ||
    booking.statusVerifikasi !== "menunggu" ||
    status === "menunggu"
  ) {
    throw new Error(
      "Pesanan ini tidak lagi menunggu verifikasi.",
    );
  }

  save(
    bookings.map((booking) =>
      booking.id === id
        ? {
          ...booking,
          statusVerifikasi: status,
          status:
            status === "disetujui"
              ? "aktif"
              : "dibatalkan",
        }
        : booking,
    ),
  );
}

export function reviewDemoCancellation(id: string, decision: "disetujui" | "ditolak" | "refund", note = "") {
  requireRole("admin");
  const bookings = parseBookings(read(BOOKINGS));
  const booking = bookings.find((entry) => entry.id === id);
  const request = booking?.pembatalan;
  if (!booking || !request || (decision === "refund"
    ? request.status !== "disetujui" || request.refundCompleted
    : request.status !== "menunggu")) {
    throw new Error("Pengajuan tidak dapat diproses.");
  }
  if (decision === "disetujui" && Date.now() >= rentalStart(booking.tanggalMulai)) {
    throw new Error("Pembatalan hanya dapat disetujui sebelum sewa mulai.");
  }
  const adminNote = note.trim();
  if (decision === "ditolak" && (!adminNote || adminNote.length > 1000)) {
    throw new Error("Isi catatan penolakan maksimal 1.000 karakter.");
  }
  save(bookings.map((item) => item.id === id ? {
    ...item,
    status: decision === "disetujui" ? "dibatalkan" : item.status,
    pembatalan: {
      ...request,
      status: decision === "refund" ? "disetujui" : decision,
      refundCompleted: decision === "refund",
      adminNote: decision === "ditolak" ? adminNote : request.adminNote,
    },
  } : item));
}

// ============================================================
// DEMO REVIEWS MANAGEMENT
// ============================================================

export function getDemoReviews(spotId?: string): Review[] {
  try {
    const raw = read(REVIEWS);
    const stored: Review[] = raw ? JSON.parse(raw) : [];
    const all = [...stored, ...MOCK_REVIEWS.filter((m) => !stored.some((s) => s.id === m.id || s.bookingId === m.bookingId))];
    if (spotId) {
      return all.filter((r) => r.spotId === spotId);
    }
    return all;
  } catch {
    return spotId ? MOCK_REVIEWS.filter((r) => r.spotId === spotId) : MOCK_REVIEWS;
  }
}

export function getDemoReviewByBookingId(bookingId: string): Review | null {
  const reviews = getDemoReviews();
  return reviews.find((r) => r.bookingId === bookingId) || null;
}

export function saveDemoReview(reviewData: {
  bookingId: string;
  spotId: string;
  ownerId?: string;
  nama: string;
  fakultas?: string;
  rating: number;
  komentar: string;
}): Review {
  const raw = read(REVIEWS);
  const stored: Review[] = raw ? JSON.parse(raw) : [];
  
  const existingIndex = stored.findIndex((r) => r.bookingId === reviewData.bookingId);
  const now = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const formattedDate = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  let result: Review;

  if (existingIndex >= 0) {
    result = {
      ...stored[existingIndex],
      rating: reviewData.rating,
      komentar: reviewData.komentar,
      tanggal: formattedDate,
      createdAt: now.toISOString(),
    };
    stored[existingIndex] = result;
  } else {
    result = {
      id: `rev-${Date.now()}`,
      bookingId: reviewData.bookingId,
      spotId: reviewData.spotId,
      ownerId: reviewData.ownerId,
      nama: reviewData.nama,
      fakultas: reviewData.fakultas,
      rating: reviewData.rating,
      komentar: reviewData.komentar,
      tanggal: formattedDate,
      createdAt: now.toISOString(),
    };
    stored.unshift(result);
  }

  try {
    localStorage.setItem(REVIEWS, JSON.stringify(stored));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // fallback ignore storage error
  }

  return result;
}

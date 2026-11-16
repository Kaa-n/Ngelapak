"use client";

import { useSyncExternalStore } from "react";
import {
  DEMO_USERS,
  MOCK_BOOKINGS,
  MOCK_SPOTS,
  type Booking,
  type TransactionStatus,
} from "./mock-data";
import type { DemoUser, Role } from "./types";

// Demo only: browser storage is editable and is not a security boundary.
const SESSION = "ngelapak-demo-session-v1";
const BOOKINGS = "ngelapak-demo-bookings-v1";
const EVENT = "ngelapak-demo-change";
const PROFILES = "ngelapak-demo-profiles-v1";
const PRODUCTS = "ngelapak-demo-produk-v1";

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

function parseBookings(raw: string): Booking[] {
  try {
    const data = JSON.parse(raw);

    if (Array.isArray(data)) {
      return data;
    }
  } catch {
    // Use fixtures on first visit.
  }

  return MOCK_BOOKINGS;
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

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function currentUser() {
  return getDemoUsers().find(
    (user) => user.id === read(SESSION, true),
  ) ?? null;
}

function requireRole(role: Role) {
  const user = currentUser();

  if (user?.role !== role) {
    throw new Error(
      role === "penyewa"
        ? "Pembatalan demo hanya untuk akun demo penyewa (Ayu/Bayu). Akun Supabase memakai pembatalan server."
        : "Anda tidak memiliki akses untuk tindakan ini.",
    );
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

  const all = parseBookings(raw);

  return {
    user,
    bookings: visibleBookings(user, all),
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

export function saveProductCaption(spotId: string, text: string) {
  const user = currentUser();

  if (user?.role !== "penyewa") {
    throw new Error("Hanya penyewa yang dapat mengubah deskripsi produk.");
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

function rangesOverlapWithCleaning(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  const cleaningEndA = addDays(endA, 3);
  const cleaningEndB = addDays(endB, 3);
  return startA <= cleaningEndB && cleaningEndA >= startB;
}

function isActiveBlockingBooking(booking: Booking, now = Date.now()) {
  if (booking.status === "dibatalkan" || booking.statusVerifikasi === "ditolak") {
    return false;
  }

  // Pesanan menunggu tanpa bukti yang sudah lewat 1×24 jam tidak menahan jadwal.
  if (
    booking.status === "menunggu" &&
    booking.statusVerifikasi === "menunggu" &&
    !booking.buktiBayar
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

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.tanggalMulai) ||
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== input.tanggalMulai ||
    input.tanggalMulai < today() ||
    !Number.isInteger(jumlahHari) ||
    jumlahHari < 1 ||
    jumlahHari > 30 ||
    !input.jenisUsaha.trim()
  ) {
    throw new Error(
      "Isi jenis usaha, tanggal mulai hari ini atau setelahnya, dan durasi 1–30 hari.",
    );
  }

  start.setUTCDate(start.getUTCDate() + jumlahHari - 1);
  const end = start.toISOString().slice(0, 10);
  const bookings = parseBookings(read(BOOKINGS));

  if (
    spot.jadwalOperasional?.some((schedule) =>
      rangesOverlapWithCleaning(
        input.tanggalMulai,
        end,
        schedule.startDate,
        schedule.endDate,
      ),
    )
  ) {
    throw new Error(
      "Jadwal bertabrakan dengan masa sewa atau pembersihan spot. Pilih tanggal berbeda.",
    );
  }

  if (
    bookings.some(
      (booking) =>
        booking.spotId === spot.id &&
        isActiveBlockingBooking(booking) &&
        rangesOverlapWithCleaning(
          input.tanggalMulai,
          end,
          booking.tanggalMulai,
          booking.tanggalSelesai,
        ),
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
    catatan: input.catatan?.trim() || undefined,
    createdAt: new Date().toISOString(),
    // Bayar Nanti: bukti boleh kosong; boleh dilengkapi dalam 1×24 jam.
    ...(input.buktiBayar ? { buktiBayar: input.buktiBayar } : {}),
  };

  save([booking, ...bookings]);
  return booking.id;
}

/** Batalkan pesanan demo yang belum bayar melewati tenggat 1×24 jam. */
export function expireUnpaidDemoBookings(now = Date.now()) {
  const bookings = parseBookings(read(BOOKINGS));
  let changed = false;

  const next = bookings.map((item) => {
    if (
      item.status === "menunggu" &&
      item.statusVerifikasi === "menunggu" &&
      !item.buktiBayar
    ) {
      const created = new Date(item.createdAt).getTime();
      if (Number.isFinite(created) && now - created >= DAY_MS) {
        changed = true;
        return { ...item, status: "dibatalkan" as const };
      }
    }
    return item;
  });

  if (changed) save(next);
  return next;
}

export function canCancelBooking(booking: Booking, now = Date.now()) {
  if (booking.status === "dibatalkan" || booking.statusVerifikasi !== "menunggu") {
    return false;
  }

  const created = new Date(booking.createdAt).getTime();
  return Number.isFinite(created) && now - created < DAY_MS;
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
    throw new Error("Pembatalan hanya tersedia dalam 1x24 jam sebelum admin memverifikasi.");
  }

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
            status: "dibatalkan",
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

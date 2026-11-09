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

function currentUser() {
  return DEMO_USERS.find(
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

  const user = DEMO_USERS.find(
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
  if (!DEMO_USERS.some((user) => user.id === id)) {
    throw new Error("Akun demo tidak dikenal.");
  }

  sessionStorage.setItem(SESSION, id);
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

export function createDemoBooking(input: {
  spotId: string;
  tanggalMulai: string;
  jumlahHari: number;
  jenisUsaha: string;
  catatan: string;
  metodePembayaran: string;
}) {
  const user = requireRole("penyewa");

  const spot = MOCK_SPOTS.find(
    (spot) => spot.id === input.spotId,
  );

  if (!spot || spot.status !== "tersedia") {
    throw new Error("Lapak ini belum tersedia untuk dipesan.");
  }

  const start = new Date(input.tanggalMulai + "T00:00:00Z");

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.tanggalMulai) ||
    !Number.isFinite(start.getTime()) ||
    start.toISOString().slice(0, 10) !== input.tanggalMulai ||
    input.tanggalMulai < today() ||
    !Number.isInteger(input.jumlahHari) ||
    input.jumlahHari < 1 ||
    input.jumlahHari > 30 ||
    !input.jenisUsaha.trim()
  ) {
    throw new Error(
      "Isi jenis usaha, tanggal mulai hari ini atau setelahnya, dan durasi 1–30 hari.",
    );
  }

  start.setUTCDate(
    start.getUTCDate() + input.jumlahHari - 1,
  );

  const end = start.toISOString().slice(0, 10);

  const bookings = parseBookings(read(BOOKINGS));

  // Periksa bentrok jadwal dengan pesanan lain.
  if (
    bookings.some(
      (booking) =>
        booking.spotId === spot.id &&
        booking.status !== "dibatalkan" &&
        booking.statusVerifikasi !== "ditolak" &&
        booking.tanggalMulai <= end &&
        booking.tanggalSelesai >= input.tanggalMulai,
    )
  ) {
    throw new Error(
      "Jadwal bertabrakan dengan pemesanan lain. Pilih tanggal berbeda.",
    );
  }

  // Ambil profil penyewa berdasarkan email akun yang sedang login.
  const fixture = MOCK_BOOKINGS.find(
    (booking) =>
      booking.penyewa.email.toLowerCase() ===
      user.email.toLowerCase(),
  );

  if (!fixture) {
    throw new Error(
      "Data profil penyewa tidak ditemukan.",
    );
  }

  const booking: Booking = {
    ...input,
    id: `TXN-${crypto.randomUUID()}`,

    // Identitas pemilik pesanan.
    ownerId: user.id,

    spotNama: spot.nama,
    spotKode: spot.kode,
    penyewa: { ...fixture.penyewa },
    tanggalSelesai: end,
    totalBayar: spot.tarifPerHari * input.jumlahHari,
    status: "menunggu",
    statusVerifikasi: "menunggu",
    createdAt: new Date().toISOString(),
  };

  save([booking, ...bookings]);

  return booking.id;
}

// ============================================================
// CANCEL BOOKING
// ============================================================

export function cancelDemoBooking(id: string) {
  const user = requireRole("penyewa");
  const bookings = parseBookings(read(BOOKINGS));
  const booking = bookings.find((item) => item.id === id);

  const belongsToUser = booking && (booking.ownerId
    ? booking.ownerId === user.id
    : booking.penyewa.email.toLowerCase() === user.email.toLowerCase());

  if (!booking || !belongsToUser) {
    throw new Error("Pesanan tidak ditemukan atau bukan milik Anda.");
  }

  if (
    booking.status === "dibatalkan" ||
    booking.status === "selesai" ||
    booking.tanggalMulai < today()
  ) {
    throw new Error("Pesanan ini sudah tidak dapat dibatalkan.");
  }

  save(bookings.map((item) =>
    item.id === id ? { ...item, status: "dibatalkan" } : item,
  ));
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

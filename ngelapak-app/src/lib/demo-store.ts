"use client";

import { useSyncExternalStore } from "react";
import { MOCK_BOOKINGS, MOCK_SPOTS, type Booking, type TransactionStatus } from "./mock-data";
import type { DemoUser, Role } from "./types";

// Demo only: browser storage is editable and is not a security boundary.
const SESSION = "ngelapak-demo-session-v1";
const BOOKINGS = "ngelapak-demo-bookings-v1";
const EVENT = "ngelapak-demo-change";
export const DEMO_USERS: DemoUser[] = [
  { id: "admin", nama: "I Made Ariawan", email: "ariawan@unud.ac.id", role: "admin" },
  { id: "ayu", nama: "Ni Kadek Ayu Maharani", email: "ayu.maharani@student.unud.ac.id", role: "penyewa" },
  { id: "bayu", nama: "I Wayan Bayu Pratama", email: "bayu.pratama@student.unud.ac.id", role: "penyewa" },
];
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
}
function read(key: string, session = false) {
  try { return (session ? sessionStorage : localStorage).getItem(key) ?? ""; } catch { return ""; }
}
function parseBookings(raw: string): Booking[] {
  try { const data = JSON.parse(raw); if (Array.isArray(data)) return data; } catch { /* Use fixtures on first visit. */ }
  return MOCK_BOOKINGS;
}
function currentUser() { return DEMO_USERS.find(user => user.id === read(SESSION, true)) ?? null; }
function requireRole(role: Role) {
  const user = currentUser();
  if (user?.role !== role) throw new Error("Anda tidak memiliki akses untuk tindakan ini.");
  return user;
}
function save(bookings: Booking[]) {
  localStorage.setItem(BOOKINGS, JSON.stringify(bookings));
  window.dispatchEvent(new Event(EVENT));
}
export function visibleBookings(user: DemoUser | null, bookings: Booking[]) {
  return user?.role === "admin" ? bookings : user ? bookings.filter(b => b.penyewa.email === user.email) : [];
}
export function useDemo() {
  const userId = useSyncExternalStore(subscribe, () => read(SESSION, true), () => "");
  const raw = useSyncExternalStore(subscribe, () => read(BOOKINGS), () => "");
  const user = DEMO_USERS.find(user => user.id === userId) ?? null;
  const all = parseBookings(raw);
  return { user, bookings: visibleBookings(user, all) };
}
export function demoLogin(id: string) {
  if (!DEMO_USERS.some(user => user.id === id)) throw new Error("Akun demo tidak dikenal.");
  sessionStorage.setItem(SESSION, id);
  window.dispatchEvent(new Event(EVENT));
}
export function demoLogout() {
  sessionStorage.removeItem(SESSION);
  window.dispatchEvent(new Event(EVENT));
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function createDemoBooking(input: { spotId: string; tanggalMulai: string; jumlahHari: number; jenisUsaha: string; catatan: string; metodePembayaran: string }) {
  const user = requireRole("penyewa");
  const spot = MOCK_SPOTS.find(s => s.id === input.spotId);
  if (!spot || spot.status !== "tersedia") throw new Error("Lapak ini belum tersedia untuk dipesan.");
  const start = new Date(input.tanggalMulai + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.tanggalMulai) || !Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== input.tanggalMulai || input.tanggalMulai < today() || !Number.isInteger(input.jumlahHari) || input.jumlahHari < 1 || input.jumlahHari > 30 || !input.jenisUsaha.trim()) throw new Error("Isi jenis usaha, tanggal mulai hari ini atau setelahnya, dan durasi 1–30 hari.");
  start.setUTCDate(start.getUTCDate() + input.jumlahHari - 1);
  const end = start.toISOString().slice(0, 10);
  const bookings = parseBookings(read(BOOKINGS));
  if (bookings.some(b => b.spotId === spot.id && b.status !== "dibatalkan" && b.statusVerifikasi !== "ditolak" && b.tanggalMulai <= end && b.tanggalSelesai >= input.tanggalMulai)) throw new Error("Jadwal bertabrakan dengan pemesanan lain. Pilih tanggal berbeda.");
  const fixture = MOCK_BOOKINGS.find(b => b.penyewa.email === user.email)!;
  const booking: Booking = { ...input, id: `TXN-${crypto.randomUUID()}`, spotNama: spot.nama, spotKode: spot.kode, penyewa: { ...fixture.penyewa }, tanggalSelesai: end, totalBayar: spot.tarifPerHari * input.jumlahHari, status: "menunggu", statusVerifikasi: "menunggu", createdAt: new Date().toISOString() };
  save([booking, ...bookings]);
  return booking.id;
}
export function verifyDemoBooking(id: string, status: TransactionStatus) {
  requireRole("admin");
  const bookings = parseBookings(read(BOOKINGS));
  const booking = bookings.find(b => b.id === id);
  if (!booking || booking.statusVerifikasi !== "menunggu" || status === "menunggu") throw new Error("Pesanan ini tidak lagi menunggu verifikasi.");
  save(bookings.map(b => b.id === id ? { ...b, statusVerifikasi: status, status: status === "disetujui" ? "aktif" : "dibatalkan" } : b));
}

import { createClient } from "@/lib/supabase/client";
import type { Booking, BookingStatus, TransactionStatus } from "@/lib/mock-data";
import type { Database } from "@/types/database";

interface CreateBookingInput {
  id: string;
  spotKode: string;
  tanggalMulai: string;
  jumlahHari: number;
  totalBayar: number;
  jenisUsaha: string;
  namaUsaha: string;
  kategoriPenjual: string;
  catatan: string;
  setuju: boolean;
}

export async function createSupabaseBooking(input: CreateBookingInput) {
  const response = await fetch("/api/pembayaran/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  if (!response.ok || typeof result.bookingId !== "string") {
    throw new Error(result.error ?? "Pembayaran tidak dapat dimulai.");
  }
  return { id: result.bookingId as string, checkoutUrl: result.checkoutUrl as string | null };
}

export async function refreshPayment(id: string) {
  const response = await fetch("/api/pembayaran/status", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error("Status pembayaran belum dapat diperiksa. Coba lagi.");
}

export async function resumePayment(id: string) {
  const response = await fetch("/api/pembayaran/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, resume: true }),
  });
  const result = await response.json();
  if (!response.ok || typeof result.checkoutUrl !== "string") throw new Error("Tautan pembayaran belum tersedia. Periksa status pesanan atau coba lagi.");
  return result.checkoutUrl as string;
}

type SupabaseBookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function mapSupabaseBooking(row: SupabaseBookingRow): Booking {
  const status: BookingStatus =
    row.status === "aktif" ||
    row.status === "selesai" ||
    row.status === "dibatalkan"
      ? row.status
      : "menunggu";

  const statusVerifikasi: TransactionStatus =
    row.status_verifikasi === "disetujui" ||
    row.status_verifikasi === "ditolak"
      ? row.status_verifikasi
      : "menunggu";

  return {
    id: row.id,
    ownerId: row.owner_id ?? undefined,
    spotId: row.spot_id ?? "",
    spotNama: row.spot_nama ?? "",
    spotKode: row.spot_kode ?? "",

    penyewa: {
      nama: row.penyewa_nama ?? "",
      nim: row.penyewa_nim ?? "",
      fakultas: row.penyewa_fakultas ?? "",
      telepon: row.penyewa_telepon ?? "",
      email: row.penyewa_email ?? "",
      avatar: row.penyewa_avatar ?? "",
    },

    tanggalMulai: row.tanggal_mulai,
    tanggalSelesai: row.tanggal_selesai,
    jumlahHari: Number(row.jumlah_hari),
    totalBayar: Number(row.total_bayar),
    metodePembayaran: row.metode_pembayaran ?? "",
    status,
    statusVerifikasi,
    buktiBayar: row.bukti_bayar ?? undefined,
    catatan: row.catatan ?? undefined,
    jenisUsaha: row.jenis_usaha ?? "",
    createdAt: row.created_at,
    paidAt: row.verified_at ?? undefined,
    paymentExpiresAt: row.payment_expires_at ?? undefined,
    paymentStatus: row.midtrans_status ?? undefined,
    checkoutUrl: row.midtrans_checkout_url ?? undefined,
  };
}

/**
 * Mengambil daftar booking dari Supabase.
 * Hasil query mengikuti RLS:
 * - Penyewa hanya mendapatkan booking miliknya.
 * - Admin mendapatkan seluruh booking.
 */
export async function getSupabaseBookings(): Promise<Booking[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapSupabaseBooking);
}

export async function getSupabaseBookingDetail(id: string) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("bookings").select().eq("id", id).maybeSingle();
  if (error) throw new Error("Detail pesanan gagal dimuat.");
  if (!row) return null;
  const { data: cancellation, error: requestError } = await supabase
    .from("cancellations").select().eq("booking_id", id)
    .order("diajukan_pada", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle();
  if (requestError) throw new Error("Status pembatalan gagal dimuat.");
  return { booking: mapSupabaseBooking(row), cancellation };
}

export async function requestSupabaseCancellation(input: Database["public"]["Functions"]["cancel_booking_as_tenant"]["Args"]) {
  const { error } = await createClient().rpc("cancel_booking_as_tenant", input);
  if (error) throw new Error(error.message);
}

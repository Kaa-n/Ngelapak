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
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.bookingId !== "string" || typeof result.checkoutUrl !== "string") {
    throw new Error(
      typeof result.error === "string" && result.error
        ? result.error
        : "Pembayaran tidak dapat dimulai.",
    );
  }
  return { id: result.bookingId as string, checkoutUrl: result.checkoutUrl as string };
}

export async function refreshPayment(id: string) {
  const response = await fetch("/api/pembayaran/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error("Status pembayaran belum dapat diperiksa. Coba lagi.");
}

export async function resumePayment(id: string) {
  const response = await fetch("/api/pembayaran/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, resume: true }),
  });
  const result = await response.json();
  if (!response.ok || typeof result.checkoutUrl !== "string") {
    throw new Error("Tautan pembayaran belum tersedia. Periksa status pesanan atau coba lagi.");
  }
  return result.checkoutUrl as string;
}

type CancellationRow = Database["public"]["Tables"]["cancellations"]["Row"];
type SupabaseBookingRow = Database["public"]["Tables"]["bookings"]["Row"] & {
  cancellations?: CancellationRow[] | null;
};

function mapPembatalan(cancellation: CancellationRow): NonNullable<Booking["pembatalan"]> {
  return {
    nama: cancellation.nama ?? "",
    nim: cancellation.nim ?? "",
    telepon: cancellation.telepon ?? "",
    bank: cancellation.bank ?? "",
    nomorRekening: cancellation.nomor_rekening ?? "",
    namaRekening: cancellation.nama_rekening ?? "",
    alasan: cancellation.alasan ?? "",
    diajukanPada: cancellation.diajukan_pada,
    status:
      cancellation.status === "disetujui" || cancellation.status === "ditolak"
        ? cancellation.status
        : "menunggu",
    refundCompleted: Boolean(cancellation.bukti_refund),
    adminNote: cancellation.admin_catatan ?? undefined,
  };
}

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

  const cancellation = [...(row.cancellations ?? [])].sort((a, b) =>
    b.diajukan_pada.localeCompare(a.diajukan_pada),
  )[0];

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
    namaUsaha: row.nama_usaha ?? undefined,
    kategoriPenjual: row.kategori_penjual ?? undefined,
    createdAt: row.created_at,
    paidAt: row.verified_at ?? undefined,
    paymentExpiresAt: row.payment_expires_at ?? undefined,
    paymentStatus: row.midtrans_status ?? undefined,
    checkoutUrl: row.midtrans_checkout_url ?? undefined,
    ...(cancellation ? { pembatalan: mapPembatalan(cancellation) } : {}),
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
    .select("*, cancellations(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapSupabaseBooking(row as SupabaseBookingRow));
}

export async function uploadBookingProof(bookingId: string, file: File): Promise<void> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk kembali.");
  let uploadFile = file;
  if (file.type.startsWith("image/")) {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / bitmap.width);
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Gagal mengompres gambar."))),
        "image/jpeg",
        0.8,
      ),
    );
    uploadFile = new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" });
  }
  if (
    uploadFile.size > 6 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "application/pdf"].includes(uploadFile.type)
  ) {
    throw new Error("Gunakan JPG, PNG, atau PDF maksimal 6 MB.");
  }
  const path = `${auth.user.id}/${bookingId}-${crypto.randomUUID()}-${uploadFile.name}`;
  const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, uploadFile);
  if (uploadError) {
    throw new Error(
      /bucket not found/i.test(uploadError.message)
        ? "Bucket payment-proofs belum tersedia. Terapkan migrasi Supabase."
        : uploadError.message,
    );
  }
  const { error } = await supabase
    .from("bookings")
    .update({ bukti_bayar: path })
    .eq("id", bookingId)
    .eq("owner_id", auth.user.id);
  if (error) {
    await supabase.storage.from("payment-proofs").remove([path]);
    throw new Error(error.message);
  }
}

export async function cancelSupabaseBooking(
  bookingId: string,
  input: {
    nama: string;
    nim: string;
    telepon: string;
    bank: string;
    nomorRekening: string;
    namaRekening: string;
    alasan: string;
  },
): Promise<void> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Silakan masuk kembali sebelum membatalkan pesanan.");

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

  const { error } = await supabase.rpc("cancel_booking_as_tenant", {
    p_booking_id: bookingId,
    p_nama: nama,
    p_nim: nim,
    p_telepon: telepon,
    p_bank: bank,
    p_nomor_rekening: nomorRekening,
    p_nama_rekening: namaRekening,
    p_alasan: alasan,
  });

  if (error) {
    const message = error.message || "Gagal membatalkan pesanan.";
    if (/hak|akses|milik|permission|policy/i.test(message)) {
      throw new Error("Anda tidak memiliki hak untuk membatalkan pesanan ini.");
    }
    if (/24 jam|kedaluwarsa|expired/i.test(message)) {
      throw new Error("Batas waktu pembatalan mandiri (1×24 jam) telah habis.");
    }
    if (/diproses|diverifikasi|verifikasi/i.test(message)) {
      throw new Error("Pesanan yang sudah diverifikasi tidak dapat dibatalkan mandiri.");
    }
    throw new Error(message);
  }
}

export async function getSupabaseBookingDetail(id: string) {
  const supabase = createClient();
  const { data: row, error } = await supabase.from("bookings").select().eq("id", id).maybeSingle();
  if (error) throw new Error("Detail pesanan gagal dimuat.");
  if (!row) return null;
  const { data: cancellation, error: requestError } = await supabase
    .from("cancellations")
    .select()
    .eq("booking_id", id)
    .order("diajukan_pada", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (requestError) throw new Error("Status pembatalan gagal dimuat.");
  return {
    booking: mapSupabaseBooking({
      ...(row as Database["public"]["Tables"]["bookings"]["Row"]),
      cancellations: cancellation ? [cancellation] : [],
    }),
    cancellation,
  };
}

export async function requestSupabaseCancellation(
  input: Database["public"]["Functions"]["cancel_booking_as_tenant"]["Args"],
) {
  const { error } = await createClient().rpc("cancel_booking_as_tenant", input);
  if (error) throw new Error(error.message);
}

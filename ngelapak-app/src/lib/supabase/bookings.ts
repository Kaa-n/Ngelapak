
import { createClient } from "@/lib/supabase/client";
import { getUploadPath, proofMimeTypes } from "@/lib/supabase/storage";
import type { Database } from "@/types/database";

interface CreateBookingInput {
  spotKode: string;
  tanggalMulai: string;
  jumlahHari: number;
  totalBayar: number;
  metodePembayaran: string;
  jenisUsaha: string;
  namaUsaha: string;
  kategoriPenjual: string;
  catatan: string;
  buktiBayar: File;
}

export async function createSupabaseBooking(
  input: CreateBookingInput
): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Silakan masuk kembali untuk mengirim pembayaran.");
  const path = getUploadPath(input.buktiBayar, proofMimeTypes, user.id);
  const bucket = supabase.storage.from("payment-proofs");
  const { error: uploadError } = await bucket.upload(path, input.buktiBayar);
  if (uploadError) throw new Error("Bukti transfer gagal diunggah.");

  const { data, error } = await supabase.rpc(
    "submit_booking_with_payment",
    {
      p_spot_kode: input.spotKode,
      p_tanggal_mulai: input.tanggalMulai,
      p_jumlah_hari: input.jumlahHari,
      p_total_bayar: input.totalBayar,
      p_metode_pembayaran: input.metodePembayaran,
      p_jenis_usaha: input.jenisUsaha,
      p_nama_usaha: input.namaUsaha,
      p_kategori_penjual: input.kategoriPenjual,
      p_catatan: input.catatan,
      p_bukti_bayar: path,
    }
  );

  if (error) {
    await bucket.remove([path]);
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("ID pemesanan tidak diterima dari server.");
  }

  return data as string;
}


    import type {
    Booking,
    BookingStatus,
    TransactionStatus,
    } from "@/lib/mock-data";

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

    return (data ?? []).map((row) =>
        mapSupabaseBooking(row)
    );
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

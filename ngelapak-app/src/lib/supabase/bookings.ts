
import { createClient } from "@/lib/supabase/client";

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
}

export async function createSupabaseBooking(
  input: CreateBookingInput
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "create_booking_with_payment",
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
    }
  );

  if (error) {
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

    interface SupabaseBookingRow {
    id: string;
    owner_id: string;
    spot_id: string;
    spot_nama: string;
    spot_kode: string;
    penyewa_nama: string;
    penyewa_nim: string | null;
    penyewa_fakultas: string | null;
    penyewa_telepon: string | null;
    penyewa_email: string;
    penyewa_avatar?: string | null;
    tanggal_mulai: string;
    tanggal_selesai: string;
    jumlah_hari: number;
    total_bayar: number;
    metode_pembayaran: string;
    status: string;
    status_verifikasi: string;
    bukti_bayar: string | null;
    catatan: string | null;
    jenis_usaha: string;
    nama_usaha?: string | null;
    kategori_penjual?: string | null;
    created_at: string;
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

    return {
        id: row.id,
        ownerId: row.owner_id,
        spotId: row.spot_id,
        spotNama: row.spot_nama,
        spotKode: row.spot_kode,

        penyewa: {
        nama: row.penyewa_nama,
        nim: row.penyewa_nim ?? "",
        fakultas: row.penyewa_fakultas ?? "",
        telepon: row.penyewa_telepon ?? "",
        email: row.penyewa_email,
        avatar: row.penyewa_avatar ?? "",
        },

        tanggalMulai: row.tanggal_mulai,
        tanggalSelesai: row.tanggal_selesai,
        jumlahHari: Number(row.jumlah_hari),
        totalBayar: Number(row.total_bayar),
        metodePembayaran: row.metode_pembayaran,
        status,
        statusVerifikasi,
        buktiBayar: row.bukti_bayar ?? undefined,
        catatan: row.catatan ?? undefined,
        jenisUsaha: row.jenis_usaha,
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
        mapSupabaseBooking(row as SupabaseBookingRow)
    );
    }

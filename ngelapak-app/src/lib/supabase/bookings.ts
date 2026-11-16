
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
  buktiBayar?: string;
}

export async function createSupabaseBooking(
  input: CreateBookingInput
): Promise<string> {
  const supabase = createClient();

  const params: Record<string, string | number | null> = {
    p_spot_kode: input.spotKode,
    p_tanggal_mulai: input.tanggalMulai,
    p_jumlah_hari: input.jumlahHari,
    p_total_bayar: input.totalBayar,
    p_metode_pembayaran: input.metodePembayaran,
    p_jenis_usaha: input.jenisUsaha,
    p_nama_usaha: input.namaUsaha,
    p_kategori_penjual: input.kategoriPenjual,
    p_catatan: input.catatan,
    // null = Bayar Nanti (bukti opsional, tenggat 1×24 jam di server)
    p_bukti_bayar: input.buktiBayar?.trim() ? input.buktiBayar : null,
  };

  const { data, error } = await supabase.rpc(
    "create_booking_with_payment",
    params,
  );

  if (error) {
    const message = error.message || "Gagal membuat pesanan.";
    if (/bukti/i.test(message)) {
      throw new Error(
        "Server masih mewajibkan bukti. Terapkan migrasi 003_allow_pay_later_without_proof.sql, lalu coba lagi.",
      );
    }
    if (/overlap|no_overlapping|conflict|bentrok|dipesan/i.test(message)) {
      throw new Error(
        "Tanggal yang dipilih bentrok dengan pesanan lain. Pilih tanggal berbeda.",
      );
    }
    if (/tidak ditemukan|not found|lapak/i.test(message)) {
      throw new Error(
        "Lapak tidak ditemukan di database. Pastikan kode lapak sudah tersinkron ke Supabase.",
      );
    }
    throw new Error(message);
  }

  if (!data) {
    throw new Error("ID pemesanan tidak diterima dari server.");
  }

  return data as string;
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
    canvas.width = bitmap.width * scale; canvas.height = bitmap.height * scale;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Gagal mengompres gambar.")), "image/jpeg", 0.8));
    uploadFile = new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" });
  }
  if (uploadFile.size > 6 * 1024 * 1024 || !["image/jpeg", "image/png", "application/pdf"].includes(uploadFile.type)) throw new Error("Gunakan JPG, PNG, atau PDF maksimal 6 MB.");
  const path = `${auth.user.id}/${bookingId}-${crypto.randomUUID()}-${uploadFile.name}`;
  const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, uploadFile);
  if (uploadError) throw new Error(/bucket not found/i.test(uploadError.message) ? "Bucket payment-proofs belum tersedia. Terapkan migrasi Supabase." : uploadError.message);
  const { error } = await supabase.from("bookings").update({ bukti_bayar: path }).eq("id", bookingId).eq("owner_id", auth.user.id);
  if (error) { await supabase.storage.from("payment-proofs").remove([path]); throw new Error(error.message); }
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


    import type {
    Booking,
    BookingStatus,
    TransactionStatus,
    } from "@/lib/mock-data";

    interface SupabaseCancellationRow {
    nama: string | null;
    nim: string | null;
    telepon: string | null;
    bank: string | null;
    nomor_rekening: string | null;
    nama_rekening: string | null;
    alasan: string | null;
    diajukan_pada: string;
    status: string;
    }

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
    cancellations?: SupabaseCancellationRow[] | null;
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
        ...(cancellation
          ? {
              pembatalan: {
                nama: cancellation.nama ?? "",
                nim: cancellation.nim ?? "",
                telepon: cancellation.telepon ?? "",
                bank: cancellation.bank ?? "",
                nomorRekening: cancellation.nomor_rekening ?? "",
                namaRekening: cancellation.nama_rekening ?? "",
                alasan: cancellation.alasan ?? "",
                diajukanPada: cancellation.diajukan_pada,
                status:
                  cancellation.status === "disetujui" ||
                  cancellation.status === "ditolak"
                    ? cancellation.status
                    : "menunggu",
              },
            }
          : {}),
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

    return (data ?? []).map((row) =>
        mapSupabaseBooking(row as SupabaseBookingRow)
    );
    }

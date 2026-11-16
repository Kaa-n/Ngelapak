
import { createClient } from "@/lib/supabase/client";
import type {
  Spot,
  SpotStatus,
  JadwalOperasionalItem,
} from "@/lib/mock-data";

export async function getSupabaseSpots(
  period: { start: string; end: string },
  schedulePeriod = period
): Promise<{
  spots: Spot[];
  availabilityKnown: boolean;
}> {
  const supabase = createClient();

  const [{ data, error }, reservations, bookings] = await Promise.all([
    // Ambil seluruh data spot
    supabase.from("spots").select().order("kode"),

    // Ambil informasi ketersediaan spot
    supabase.rpc("get_unavailable_lapak_ids", {
      p_start: period.start,
      p_end: period.end,
    }),

    // Ambil jadwal operasional melalui RPC publik
    supabase.rpc("get_public_operational_schedule", {
      p_start: schedulePeriod.start,
      p_end: schedulePeriod.end,
    }),
  ]);

  console.log("PERIOD:", period);
  console.log("BOOKINGS ERROR:", bookings.error);
  console.log("BOOKINGS DATA:", bookings.data);

  if (error) {
    throw new Error(`Gagal mengambil data spot: ${error.message}`);
  }

  if (bookings.error) {
    console.error("Gagal mengambil jadwal operasional:", bookings.error);
  }

  const availabilityKnown = !reservations.error;

  const unavailable = new Set(
    reservations.data?.map((row) => row.spot_id) ?? []
  );

  const bookingsBySpot = new Map<string, JadwalOperasionalItem[]>();

  for (const booking of bookings.data ?? []) {
    if (!booking.spot_id) continue;

    const isActive =
      booking.tanggal_mulai <= period.end &&
      booking.tanggal_selesai >= period.start;

    const jadwal: JadwalOperasionalItem = {
      id: booking.booking_id,
      penjual: booking.nama_usaha ?? "Penjual",
      kategori: "Mahasiswa Wirausaha",
      startDate: booking.tanggal_mulai,
      endDate: booking.tanggal_selesai,
      status: isActive ? "Active" : "Upcoming",
      productCaption: booking.product_caption ?? undefined,
    };

    const existing = bookingsBySpot.get(booking.spot_id) ?? [];
    existing.push(jadwal);
    bookingsBySpot.set(booking.spot_id, existing);
  }

  const spots: Spot[] = (data ?? []).map((item) => {
    const jadwalOperasional = bookingsBySpot.get(item.id) ?? [];

    const activeBooking = jadwalOperasional.find(
      (jadwal) => jadwal.status === "Active"
    );

    const relevantBooking = activeBooking ?? jadwalOperasional[0];

    return {
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      zona: item.zona,
      zonaLabel: item.zona_label ?? "",
      lokasi: item.lokasi ?? "",
      ukuran: item.ukuran,
      ukuranLabel: item.ukuran_label ?? "",
      daya: item.daya ?? 0,
      tarifPerHari: item.tarif_per_hari,
      status:
        availabilityKnown && item.status !== "pemeliharaan"
          ? unavailable.has(item.id)
            ? "dipesan"
            : "tersedia"
          : (item.status as SpotStatus),
      fasilitas: item.fasilitas ?? [],
      tags: item.tags ?? [],
      koordinat: {
        x: Number(item.koordinat_x ?? 0),
        y: Number(item.koordinat_y ?? 0),
      },
      gambar: item.gambar ?? "",
      rating: Number(item.rating ?? 0),
      totalSewa: item.total_sewa ?? 0,
      deskripsi: item.deskripsi ?? "",
      jenisUsaha: relevantBooking?.penjual
        ? (jadwalOperasional.length > 0
            ? item.jenis_usaha ?? undefined
            : undefined)
        : item.jenis_usaha ?? undefined,
      jadwalOperasional,
    };
  });

  return { spots, availabilityKnown };
}


import { createClient } from "@/lib/supabase/client";
import type { Spot, SpotStatus } from "@/lib/mock-data";

export async function getSupabaseSpots(): Promise<Spot[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .order("kode", { ascending: true });

  if (error) {
    throw new Error(`Gagal mengambil data spot: ${error.message}`);
  }

  return (data ?? []).map((item) => ({
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
    status: item.status as SpotStatus,
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
    jenisUsaha: item.jenis_usaha ?? undefined,
    jadwalOperasional: [],
  }));
}

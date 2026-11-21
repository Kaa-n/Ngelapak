import { createClient } from "@/lib/supabase/server";
import type { Spot, SpotStatus } from "@/lib/mock-data";
import { parseSpotImages } from "@/lib/mock-data";

export async function getSpotByKode(kode: string): Promise<Spot | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("spots").select("*").eq("kode", kode).maybeSingle();
  if (error || !data) return null;
  const parsedImg = parseSpotImages(data.gambar);
  return {
    id: data.id, kode: data.kode, nama: data.nama, zona: data.zona,
    zonaLabel: data.zona_label ?? "", lokasi: data.lokasi ?? "",
    ukuran: data.ukuran, ukuranLabel: data.ukuran_label ?? data.ukuran,
    daya: data.daya ?? 0, tarifPerHari: data.tarif_per_hari, status: data.status as SpotStatus,
    fasilitas: data.fasilitas ?? [], tags: data.tags ?? [],
    koordinat: { x: Number(data.koordinat_x ?? 0), y: Number(data.koordinat_y ?? 0) },
    gambar: parsedImg.primary, gambarList: parsedImg.list, rating: Number(data.rating ?? 0), totalSewa: data.total_sewa ?? 0,
    deskripsi: data.deskripsi ?? "", jenisUsaha: data.jenis_usaha ?? undefined, jadwalOperasional: [],
  };
}

/** Returns all spot kodes for sitemap generation */
export async function getSpotKodes(): Promise<string[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from("spots").select("kode").order("kode");
  return (data ?? []).map((row) => row.kode).filter(Boolean);
}

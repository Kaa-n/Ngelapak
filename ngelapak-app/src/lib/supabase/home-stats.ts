
import { createClient } from "@/lib/supabase/client";

export interface HomeStats {
  totalSpots: number;
  successfulPayments: number;
  availableFacilities: string;
}

export async function getHomeStats(): Promise<HomeStats> {
  const supabase = createClient();

  // Ambil data spot dan statistik pembayaran melalui RPC
  const [spotsResult, paymentsResult] = await Promise.all([
    supabase.from("spots").select("id, fasilitas"),
    supabase.rpc("get_public_home_stats"),
  ]);

  if (spotsResult.error) {
    throw new Error(
      `Gagal mengambil statistik spot: ${spotsResult.error.message}`
    );
  }

  if (paymentsResult.error) {
    throw new Error(
      `Gagal mengambil statistik pembayaran: ${paymentsResult.error.message}`
    );
  }

  const spots = spotsResult.data ?? [];
  const successfulPayments = Number(paymentsResult.data ?? 0);

  // Periksa fasilitas yang tercatat di seluruh spot
  const allFacilities = spots.flatMap((spot) =>
    (spot.fasilitas ?? []).map((item) => item.toLowerCase())
  );

  const hasElectricity = allFacilities.some((item) =>
    item.includes("listrik")
  );

  const hasWater = allFacilities.some((item) =>
    item.includes("air")
  );

  const availableFacilities = [
    hasElectricity ? "Listrik" : null,
    hasWater ? "Air" : null,
  ]
    .filter(Boolean)
    .join(" & ") || "Belum Tersedia";

  return {
    totalSpots: spots.length,
    successfulPayments,
    availableFacilities,
  };
}
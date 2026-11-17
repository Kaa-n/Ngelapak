import type { Metadata } from "next";
import { Suspense, cache } from "react";
import { redirect } from "next/navigation";
import { getSpotByKode } from "@/lib/supabase/spots-server";
import { formatRupiah } from "@/lib/mock-data";

type Props = { params: Promise<{ spotId: string }> };
const lookupSpot = cache(getSpotByKode);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { spotId } = await params;
  const spot = await lookupSpot(spotId);
  if (!spot) return { title: "Lapak tidak ditemukan | Ngelapak" };
  return {
    title: `${spot.nama} (${spot.kode}) | Ngelapak`,
    description: `${spot.deskripsi} Sewa mulai ${formatRupiah(spot.tarifPerHari)} per hari di ${spot.lokasi}.`,
    openGraph: {
      title: spot.nama,
      description: `${spot.ukuranLabel}, ${spot.daya}W · ${formatRupiah(spot.tarifPerHari)}/hari`,
      images: spot.gambar ? [spot.gambar] : [],
    },
  };
}

async function SpotRedirector({ params }: Props) {
  const { spotId } = await params;
  redirect(`/?view=detail&spot=${encodeURIComponent(spotId)}`);
  return null;
}

export default function SpotDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-4">
          <p className="text-sm font-semibold text-[#003466]">Memuat detail lapak…</p>
        </div>
      }
    >
      <SpotRedirector params={params} />
    </Suspense>
  );
}

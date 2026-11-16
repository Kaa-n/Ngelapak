import type { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
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

export default async function SpotDetailPage({ params }: Props) {
  const { spotId } = await params;
  redirect(`/?view=detail&spot=${encodeURIComponent(spotId)}`);
}

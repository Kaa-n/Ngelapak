import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSpotByKode } from "@/lib/supabase/spots-server";
import ReservationWizard from "@/components/booking/ReservationWizard";
import ProductDescription from "@/components/spot-detail/ProductDescription";
import { formatRupiah } from "@/lib/mock-data";

type Props = { params: Promise<{ spotId: string }> };

async function getData(spotId: string) {
  const spot = await getSpotByKode(decodeURIComponent(spotId));
  if (!spot) return null;
  const supabase = await createClient();
  const [{ data: bookingRows }, { data: captions }, { data: auth }] = await Promise.all([
    supabase.from("bookings").select("tanggal_mulai,tanggal_selesai,status,status_verifikasi,owner_id,created_at,payment_deadline").eq("spot_id", spot.id).neq("status", "dibatalkan"),
    supabase.from("product_captions").select("konten,owner_id").eq("spot_id", spot.id).order("updated_at", { ascending: false }).limit(1),
    supabase.auth.getUser(),
  ]);
  const now = new Date().toISOString().slice(0, 10);
  const active = (bookingRows ?? []).find((b) => b.status === "aktif" && b.status_verifikasi === "disetujui" && b.tanggal_mulai <= now && b.tanggal_selesai >= now);
  return { spot, occupied: (bookingRows ?? []).filter(b=>b.status !== "dibatalkan" && b.status_verifikasi !== "ditolak" && (b.payment_deadline ? b.payment_deadline > new Date().toISOString() : new Date(b.created_at).getTime() + 86400000 > Date.now())).map(b=>({start:b.tanggal_mulai,end:b.tanggal_selesai})), caption: captions?.[0]?.konten ?? "", captionOwner: captions?.[0]?.owner_id ?? null, userId: auth.user?.id ?? null, active: active ? { userId: active.owner_id, active: true } : null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { spotId } = await params; const data = await getData(spotId);
  if (!data) return { title: "Lapak tidak ditemukan | Ngelapak" };
  const { spot } = data;
  return { title: `${spot.nama} (${spot.kode}) | Ngelapak`, description: `${spot.deskripsi} Sewa mulai ${formatRupiah(spot.tarifPerHari)} per hari di ${spot.lokasi}.`, openGraph: { title: spot.nama, description: `${spot.ukuranLabel}, ${spot.daya}W · ${formatRupiah(spot.tarifPerHari)}/hari`, images: spot.gambar ? [spot.gambar] : [] } };
}

export default async function SpotDetailPage({ params }: Props) {
  const { spotId } = await params; const data = await getData(spotId); if (!data) notFound();
  const { spot } = data;
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: spot.nama, description: spot.deskripsi, image: spot.gambar ? [spot.gambar] : undefined, sku: spot.kode, offers: { "@type": "Offer", priceCurrency: "IDR", price: spot.tarifPerHari, availability: spot.status === "tersedia" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability", url: `/katalog/${encodeURIComponent(spot.kode)}` }, aggregateRating: spot.rating > 0 ? { "@type": "AggregateRating", ratingValue: spot.rating, reviewCount: Math.max(spot.totalSewa, 1) } : undefined };
  return <main className="min-h-screen bg-[#faf8ff] px-4 py-8"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} /><div className="mx-auto max-w-6xl"><a href="/" className="text-sm font-semibold text-blue-900">← Kembali ke katalog</a><div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-[1.2fr_0.8fr]"><div className="space-y-6"><div className="overflow-hidden rounded-2xl bg-white shadow-sm"><img src={spot.gambar || "/placeholder.png"} alt={spot.nama} className="h-72 w-full object-cover sm:h-96" /><div className="p-5"><p className="text-sm font-semibold text-amber-700">{spot.zonaLabel} · {spot.kode}</p><h1 className="mt-1 text-3xl font-bold text-slate-900">{spot.nama}</h1><p className="mt-2 text-slate-600">{spot.lokasi}</p><p className="mt-4 text-slate-700">{spot.deskripsi}</p><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><p className="rounded-lg bg-slate-50 p-3">Dimensi <strong className="block">{spot.ukuranLabel}</strong></p><p className="rounded-lg bg-slate-50 p-3">Daya listrik <strong className="block">{spot.daya} Watt</strong></p><p className="rounded-lg bg-slate-50 p-3">Rating <strong className="block">{spot.rating} / 5</strong></p><p className="rounded-lg bg-slate-50 p-3">Tarif / hari <strong className="block">{formatRupiah(spot.tarifPerHari)}</strong></p></div></div></div><section className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Fasilitas & lokasi mikro</h2><p className="mt-2 text-sm text-slate-600">{spot.lokasi} · Koordinat peta kampus {spot.koordinat.x}, {spot.koordinat.y}</p><div className="mt-3 flex flex-wrap gap-2">{spot.fasilitas.map(x=><span key={x} className="rounded-full bg-blue-50 px-3 py-1 text-sm">{x}</span>)}</div></section><ProductDescription spotId={spot.id} initialText={data.caption} currentUserId={data.userId} activeBooking={data.active} /><section className="rounded-2xl border bg-white p-5"><h2 className="text-xl font-bold">Ulasan</h2><p className="mt-2 text-sm text-slate-600">Rating rata-rata {spot.rating} dari 5 berdasarkan {spot.totalSewa} penyewaan.</p></section></div><div className="md:sticky md:top-6 md:self-start"><ReservationWizard spot={spot} occupied={data.occupied} /></div></div></div></main>;
}

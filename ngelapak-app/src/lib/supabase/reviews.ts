import { createClient } from "./client";
import type { Review } from "@/lib/mock-data";

function formatReviewDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return isoString;
  }
}

export async function getSupabaseReviewsBySpot(spotId: string): Promise<Review[]> {
  try {
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("spot_id", spotId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((r: any) => ({
      id: r.id,
      bookingId: r.booking_id,
      spotId: r.spot_id,
      ownerId: r.owner_id,
      nama: r.nama,
      fakultas: r.fakultas || undefined,
      rating: r.rating,
      komentar: r.komentar,
      tanggal: formatReviewDate(r.created_at),
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getSupabaseReviewByBooking(bookingId: string): Promise<Review | null> {
  try {
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      bookingId: data.booking_id,
      spotId: data.spot_id,
      ownerId: data.owner_id,
      nama: data.nama,
      fakultas: data.fakultas || undefined,
      rating: data.rating,
      komentar: data.komentar,
      tanggal: formatReviewDate(data.created_at),
      createdAt: data.created_at,
    };
  } catch {
    return null;
  }
}

export async function saveSupabaseReview(reviewData: {
  bookingId: string;
  spotId: string;
  nama: string;
  fakultas?: string;
  rating: number;
  komentar: string;
}): Promise<Review> {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();

  const payload: any = {
    booking_id: reviewData.bookingId,
    spot_id: reviewData.spotId,
    owner_id: user?.id,
    nama: reviewData.nama,
    fakultas: reviewData.fakultas || null,
    rating: reviewData.rating,
    komentar: reviewData.komentar,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("reviews")
    .upsert(payload, { onConflict: "booking_id" })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Gagal menyimpan ulasan.");
  }

  return {
    id: data.id,
    bookingId: data.booking_id,
    spotId: data.spot_id,
    ownerId: data.owner_id,
    nama: data.nama,
    fakultas: data.fakultas || undefined,
    rating: data.rating,
    komentar: data.komentar,
    tanggal: formatReviewDate(data.created_at),
    createdAt: data.created_at,
  };
}

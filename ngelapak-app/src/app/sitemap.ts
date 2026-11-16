import type { MetadataRoute } from "next";
import { getSpotKodes } from "@/lib/supabase/spots-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://ngelapak-ayorvup1k-kan04.vercel.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/?view=katalog`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/masuk`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/daftar`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic spot pages
  let spotPages: MetadataRoute.Sitemap = [];
  try {
    const kodes = await getSpotKodes();
    spotPages = kodes.map((kode) => ({
      url: `${base}/katalog/${encodeURIComponent(kode)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    // Supabase unavailable at build time — omit dynamic entries
  }

  return [...staticPages, ...spotPages];
}

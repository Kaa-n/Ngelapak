import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/katalog/", "/validasi/"],
        disallow: ["/admin/", "/api/", "/demo/"],
      },
    ],
    sitemap: "https://ngelapak-ayorvup1k-kan04.vercel.app/sitemap.xml",
  };
}

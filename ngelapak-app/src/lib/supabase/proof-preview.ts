import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getProofPreview(
  supabase: SupabaseClient<Database>,
  bucket: "payment-proofs" | "refund-proofs",
  path: string | null,
): Promise<{ url: string; type: "link" | "pdf" | "image" } | null> {
  if (!path) return null;
  if (/^https:\/\//i.test(path)) {
    // Stored HTTPS URLs predate object paths. Open them on demand.
    return { url: path, type: "link" as const };
  }
  if (path.includes("://")) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 900);
  if (!data) return null;
  const type = /\.pdf$/i.test(path) ? "pdf" : "image";
  return { url: data.signedUrl, type };
}

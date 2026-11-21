import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function getProofPreview(
  _supabase: SupabaseClient<Database>,
  bucket: "payment-proofs" | "refund-proofs",
  path: string | null,
): Promise<{ url: string; type: "link" | "pdf" | "image" } | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) {
    // Stored HTTPS URLs predate object paths. Open them on demand.
    return { url: path, type: "link" as const };
  }
  if (path.includes("://")) return null;

  try {
    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient.storage.from(bucket).createSignedUrl(path, 3600);
    if (!data || error) return null;
    const type = /\.pdf$/i.test(path) ? "pdf" : "image";
    return { url: data.signedUrl, type };
  } catch {
    return null;
  }
}

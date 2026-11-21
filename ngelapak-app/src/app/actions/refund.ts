"use server";

import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Menghasilkan signed URL yang valid (1 jam) untuk bukti refund
 * menggunakan service role client sehingga bypass RLS storage.
 */
export async function getRefundProofSignedUrl(path: string | null | undefined): Promise<string | null> {
  if (!path || !path.trim()) return null;
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.includes("://")) return null;

  try {
    const serviceClient = createServiceRoleClient();
    const { data, error } = await serviceClient.storage
      .from("refund-proofs")
      .createSignedUrl(trimmed, 3600);

    if (error || !data) {
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}

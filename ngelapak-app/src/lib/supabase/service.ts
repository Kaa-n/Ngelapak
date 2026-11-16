import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service Role Client khusus untuk operasi backend/server-side yang memerlukan hak istimewa
 * (misalnya mengunggah gambar lapak dan bukti transaksi ke Supabase Storage setelah peran admin divalidasi).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase URL atau Service Role Key tidak terkonfigurasi.");
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

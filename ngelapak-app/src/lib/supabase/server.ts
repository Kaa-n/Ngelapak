
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { cookies } from "next/headers";
import { connection } from "next/server";

export async function createClient() {
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie tidak dapat diubah dari Server Component.
            // Pembaruan sesi akan ditangani oleh proxy.
          }
        },
      },
    }
  );
}

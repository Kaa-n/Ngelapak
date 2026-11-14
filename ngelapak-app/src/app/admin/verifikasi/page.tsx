import { requireAdmin } from "@/lib/supabase/admin";

export default async function Page() {
  await requireAdmin();
  return <h1 className="text-2xl font-bold text-[#003466]">Verifikasi Pembayaran</h1>;
}

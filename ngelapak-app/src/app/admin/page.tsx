import { Suspense } from "react";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminPageLoading from "@/components/admin/AdminPageLoading";

const metricsSchema = z.object({
  today: z.iso.date(),
  total_revenue: z.number().nonnegative(),
  occupancy: z.array(z.object({ zona: z.string(), occupied: z.number().int(), capacity: z.number().int() })),
  trend: z.array(z.object({ week_start: z.iso.date(), amount: z.number().nonnegative() })),
});

export default function DashboardPage() {
  return <Suspense fallback={<AdminPageLoading />}><DashboardData /></Suspense>;
}

async function DashboardData() {
  const { supabase } = await requireAdmin();
  const [stats, queue, refunds] = await Promise.all([
    supabase.rpc("get_admin_rental_metrics"),
    supabase.from("bookings").select("id", { count: "exact", head: true })
      .eq("status", "menunggu").eq("status_verifikasi", "menunggu"),
    supabase.from("cancellations").select("id", { count: "exact", head: true }).eq("status", "menunggu"),
  ]);
  const parsed = metricsSchema.safeParse(stats.data);
  const metrics = !stats.error && parsed.success ? parsed.data : null;
  return <AdminDashboard
    metrics={metrics}
    paymentCount={queue.error ? null : queue.count}
    refundCount={refunds.error ? null : refunds.count}
    metricMessage={metrics ? undefined : stats.error?.code === "PGRST202"
      ? "Metrik belum tersedia. Hubungi pengelola untuk menyiapkan database dasbor."
      : "Metrik dasbor gagal dimuat. Coba muat ulang halaman."}
    basePath="/admin"
    addSpotHref="/admin/spots?tambah=1#tambah-lapak"
  />;
}

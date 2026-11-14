import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";
import { panelClass } from "@/components/admin/styles";

const metricsSchema = z.object({
  today: z.iso.date(),
  total_revenue: z.number().nonnegative(),
  occupancy: z.array(z.object({ zona: z.string(), occupied: z.number().int(), capacity: z.number().int() })),
  trend: z.array(z.object({ week_start: z.iso.date(), amount: z.number().nonnegative() })),
});

const zones = {
  rektorat: "Rektorat",
  boulevard: "Boulevard",
  sc: "Student Center",
  agrokompleks: "Agrokompleks",
};

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const [stats, queue, refunds] = await Promise.all([
    supabase.rpc("get_admin_rental_metrics"),
    supabase.from("bookings").select("id", { count: "exact", head: true })
      .eq("status", "menunggu").eq("status_verifikasi", "menunggu"),
    supabase.from("cancellations").select("id", { count: "exact", head: true }).eq("status", "menunggu"),
  ]);
  if (stats.error || queue.error || refunds.error) throw new Error("Metrik dasbor gagal dimuat.");
  const metrics = metricsSchema.parse(stats.data);
  const maxRevenue = Math.max(1, ...metrics.trend.map((week) => week.amount));

  return (
    <>
      <h1 className="text-2xl font-bold text-[#003466]">Dasbor Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <section className={panelClass}>
          <h2 className="text-sm font-semibold">Total pendapatan sewa</h2>
          <p className="my-2 break-words text-2xl font-bold text-[#003466]">{currency.format(metrics.total_revenue)}</p>
          <p className="text-sm text-[#424750]">Pembayaran lunas sepanjang waktu, sebelum refund.</p>
        </section>
        <section className={panelClass}>
          <h2 className="text-sm font-semibold">Pembayaran menunggu</h2>
          <p className="my-2 text-2xl font-bold text-[#003466]">{queue.count ?? 0}</p>
          <Link href="/admin/verifikasi" className="text-sm font-semibold text-[#003466] underline">Buka verifikasi</Link>
        </section>
        <section className={panelClass}>
          <h2 className="text-sm font-semibold">Pembatalan menunggu</h2>
          <p className="my-2 text-2xl font-bold text-[#003466]">{refunds.count ?? 0}</p>
          <Link href="/admin/refund" className="text-sm font-semibold text-[#003466] underline">Buka pembatalan & refund</Link>
        </section>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${panelClass} min-w-0`}>
          <h2 className="font-semibold">Okupansi hari ini per zona</h2>
          <p className="mt-1 text-sm text-[#424750]">{date.format(new Date(metrics.today))} WITA · Kapasitas di luar pemeliharaan</p>
          <ul className="mt-4 space-y-4">
            {Object.entries(zones).map(([key, label]) => {
              const { occupied, capacity } = metrics.occupancy.find((zone) => zone.zona === key) ?? { occupied: 0, capacity: 0 };
              const percentage = capacity ? Math.round(100 * occupied / capacity) : 0;
              return (
                <li key={key}>
                  <div className="mb-1 flex flex-wrap justify-between gap-1 text-sm">
                    <span className="font-medium">{label}</span>
                    <span>{capacity ? `${percentage}% · ${occupied}/${capacity} lapak` : "Tidak ada kapasitas"}</span>
                  </div>
                  <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-[#eaedff]">
                    <div className="h-full rounded-full bg-[#003466]" style={{ width: `${percentage}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <section className={`${panelClass} min-w-0`}>
          <h2 className="font-semibold">Tren pendapatan mingguan</h2>
          <p className="mt-1 text-sm text-[#424750]">8 minggu berdasarkan tanggal verifikasi (WITA).</p>
          <ul className="mt-4 space-y-3">
            {metrics.trend.map((week) => (
              <li key={week.week_start}>
                <div className="mb-1 flex flex-wrap justify-between gap-1 text-sm">
                  <span>Mulai {date.format(new Date(week.week_start))}</span>
                  <span className="font-semibold">{currency.format(week.amount)}</span>
                </div>
                <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-[#eaedff]">
                  <div className="h-full rounded-full bg-[#003466]" style={{ width: `${100 * week.amount / maxRevenue}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

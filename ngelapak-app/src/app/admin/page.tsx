import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/supabase/admin";
import { AdminEmptyState, AdminHeading } from "@/components/admin/AdminPresentation";
import { actionLinkClass, panelClass, primaryLinkClass } from "@/components/admin/styles";

const metricsSchema = z.object({
  today: z.iso.date(),
  total_revenue: z.number().nonnegative(),
  occupancy: z.array(z.object({ zona: z.string(), occupied: z.number().int(), capacity: z.number().int() })),
  trend: z.array(z.object({ week_start: z.iso.date(), amount: z.number().nonnegative() })),
});

const zones = [
  ["rektorat", "Rektorat", "bg-[#1a4b84]"],
  ["boulevard", "Boulevard", "bg-[#6196dc]"],
  ["sc", "Student Center", "bg-[#21815d]"],
  ["agrokompleks", "Agrokompleks", "bg-[#bc761d]"],
] as const;

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

function QueueCard({ title, count, icon, tone, href, linkLabel }: {
  title: string;
  count: number | null;
  icon: string;
  tone: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <section className={`${panelClass} flex flex-col justify-between gap-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#424750]">{title}</h2>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-[#131b2e] tabular-nums sm:text-3xl">
            {count ?? "Belum tersedia"}
          </p>
        </div>
        <span aria-hidden="true" className={`material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-xl text-[22px] ${tone}`}>{icon}</span>
      </div>
      <Link href={href} className={`${actionLinkClass} self-start`}>
        {linkLabel}
        <span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span>
      </Link>
    </section>
  );
}

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();
  const [stats, queue, refunds] = await Promise.all([
    supabase.rpc("get_admin_rental_metrics"),
    supabase.from("bookings").select("id", { count: "exact", head: true })
      .eq("status", "menunggu").eq("status_verifikasi", "menunggu"),
    supabase.from("cancellations").select("id", { count: "exact", head: true }).eq("status", "menunggu"),
  ]);
  const parsed = metricsSchema.safeParse(stats.data);
  const metrics = !stats.error && parsed.success ? parsed.data : null;
  const maxRevenue = Math.max(1, ...(metrics?.trend.map((week) => week.amount) ?? []));

  return (
    <>
      <AdminHeading
        title="Dasbor Admin"
        description="Pantau pendapatan sewa, keterisian lapak, dan pengajuan yang perlu ditinjau."
        actions={
          <Link href="/admin/spots?tambah=1#tambah-lapak" className={primaryLinkClass}>
            <span aria-hidden="true" className="material-symbols-outlined text-xl">add</span>
            Tambah lapak
          </Link>
        }
      />
      {!metrics && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-[#f6d59b] bg-[#fff5e6] px-4 py-3 text-sm text-[#6b4300]">
          <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-[19px]">info</span>
          {stats.error?.code === "PGRST202"
            ? "Metrik belum tersedia. Hubungi pengelola untuk menyiapkan database dasbor."
            : "Metrik dasbor gagal dimuat. Coba muat ulang halaman."}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <section className="flex min-h-40 min-w-0 flex-col justify-between gap-4 rounded-2xl bg-linear-to-br from-[#003466] to-[#1a4b84] p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#e1ecff]">Total pendapatan sewa</h2>
            <span aria-hidden="true" className="material-symbols-outlined grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 text-[22px]">account_balance_wallet</span>
          </div>
          <div>
            <p className="break-words text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {metrics ? currency.format(metrics.total_revenue) : "Belum tersedia"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#e1ecff]">Pembayaran lunas sepanjang waktu, sebelum refund.</p>
          </div>
        </section>
        <QueueCard title="Pembayaran menunggu" count={queue.error ? null : queue.count} icon="receipt_long"
          tone="bg-[#fff0dd] text-[#855300]" href="/admin/verifikasi" linkLabel="Buka verifikasi" />
        <QueueCard title="Pembatalan menunggu" count={refunds.error ? null : refunds.count} icon="assignment_return"
          tone="bg-[#e7efff] text-[#003466]" href="/admin/refund" linkLabel="Buka pembatalan & refund" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={`${panelClass} min-w-0 space-y-4`}>
          <div>
            <h2 className="font-bold text-[#131b2e]">Tren pendapatan mingguan</h2>
            <p className="mt-1 text-sm text-[#424750]">8 minggu berdasarkan tanggal verifikasi (WITA).</p>
          </div>
          {!metrics?.trend.some((week) => week.amount > 0) ? (
            <AdminEmptyState icon="bar_chart" title={metrics ? "Belum ada pendapatan terverifikasi pada periode ini" : "Data tren belum tersedia"} />
          ) : (
            <>
              <ul aria-label="Pendapatan per minggu" className="grid min-w-0 grid-cols-8 gap-1.5 sm:gap-3">
                {metrics.trend.map((week, index) => {
                  const label = shortDate.format(new Date(week.week_start));
                  return (
                    <li key={week.week_start} title={`Minggu mulai ${label} — ${currency.format(week.amount)}`} className="min-w-0">
                      <span className="sr-only">Minggu mulai {label}, {currency.format(week.amount)}</span>
                      <div aria-hidden="true" className="flex h-36 items-end justify-center border-b border-[#d7def5] bg-[linear-gradient(to_top,#eaedff_1px,transparent_1px)] bg-size-[100%_25%] sm:h-44">
                        <div className={`w-full max-w-13 rounded-t-lg ${index === metrics.trend.length - 1 ? "bg-[#003466]" : "bg-[#8eb4e8]"}`}
                          style={{ height: `${100 * week.amount / maxRevenue}%` }} />
                      </div>
                      <p aria-hidden="true" className="mt-2 text-center text-[10px] leading-tight text-[#424750] sm:text-xs">{label}</p>
                    </li>
                  );
                })}
              </ul>
              <details className="text-sm text-[#424750]">
                <summary className="cursor-pointer font-semibold text-[#003466]">Rincian mingguan</summary>
                <dl className="mt-2 divide-y divide-[#e2e7ff]">
                  {metrics.trend.map((week) => (
                    <div key={week.week_start} className="flex flex-wrap justify-between gap-x-3 py-1.5">
                      <dt>Minggu mulai {shortDate.format(new Date(week.week_start))}</dt>
                      <dd className="font-semibold tabular-nums">{currency.format(week.amount)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </>
          )}
        </section>
        <section className={`${panelClass} min-w-0 space-y-4`}>
          <div>
            <h2 className="font-bold text-[#131b2e]">Okupansi hari ini per zona</h2>
            <p className="mt-1 text-sm text-[#424750]">
              {metrics && `${shortDate.format(new Date(metrics.today))} WITA · `}Kapasitas di luar pemeliharaan
            </p>
          </div>
          {metrics ? (
            <ul className="space-y-4">
              {zones.map(([key, label, color]) => {
                const { occupied, capacity } = metrics.occupancy.find((zone) => zone.zona === key) ?? { occupied: 0, capacity: 0 };
                const percentage = capacity ? Math.round(100 * occupied / capacity) : 0;
                return (
                  <li key={key}>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 text-sm">
                      <span className="font-semibold text-[#283044]">{label}</span>
                      <span className="text-[#424750] tabular-nums">{capacity ? `${percentage}% · ${occupied}/${capacity} lapak` : "Tidak ada kapasitas"}</span>
                    </div>
                    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-[#eaedff]">
                      <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <AdminEmptyState icon="location_on" title="Data okupansi belum tersedia" />}
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import RevenueBars from "@/components/admin/RevenueBars";
import { ArrowRight, Info, Plus, ReceiptText, Undo2, Wallet, type LucideIcon } from "lucide-react";
import { AdminEmptyState, AdminHeading } from "@/components/admin/AdminPresentation";
import { actionLinkClass, panelClass, primaryLinkClass } from "@/components/admin/styles";

export type RentalMetrics = {
  today: string;
  total_revenue: number;
  occupancy: { zona: string; occupied: number; capacity: number }[];
  trend: { week_start: string; amount: number }[];
};

const zones = [
  ["rektorat", "Rektorat", "bg-[#1a4b84]"],
  ["boulevard", "Boulevard", "bg-[#6196dc]"],
  ["sc", "Student Center", "bg-[#21815d]"],
  ["agrokompleks", "Agrokompleks", "bg-[#bc761d]"],
] as const;

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

function QueueCard({ title, count, icon: Icon, tone, href, linkLabel }: {
  title: string;
  count: number | null;
  icon: LucideIcon;
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
        <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
          <Icon className="size-[22px]" />
        </span>
      </div>
      <Link href={href} className={`${actionLinkClass} self-start`}>
        {linkLabel}
        <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
      </Link>
    </section>
  );
}

export default function AdminDashboard({ metrics, paymentCount, refundCount, metricMessage, addSpotHref, basePath }: {
  metrics: RentalMetrics | null;
  paymentCount: number | null;
  refundCount: number | null;
  metricMessage?: string;
  addSpotHref?: string;
  basePath: "/admin" | "/demo/admin";
}) {
  return (
    <>
      <AdminHeading
        title="Dasbor Admin"
        description="Pantau pendapatan sewa, keterisian lapak, dan pengajuan yang perlu ditinjau."
        actions={addSpotHref &&
          <Link href={addSpotHref} className={primaryLinkClass}>
            <Plus aria-hidden="true" className="size-5 shrink-0" />
            Tambah lapak
          </Link>
        }
      />
      {metricMessage && (
        <p role="status" className="flex items-start gap-2 rounded-xl border border-[#f6d59b] bg-[#fff5e6] px-4 py-3 text-sm text-[#6b4300]">
          <Info aria-hidden="true" className="size-[19px] shrink-0" />
          {metricMessage}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <section className="flex min-h-40 min-w-0 flex-col justify-between gap-4 rounded-2xl bg-linear-to-br from-[#003466] to-[#1a4b84] p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#e1ecff]">Total pendapatan sewa</h2>
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15">
              <Wallet className="size-[22px]" />
            </span>
          </div>
          <div>
            <p className="break-words text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {metrics ? currency.format(metrics.total_revenue) : "Belum tersedia"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#e1ecff]">Pembayaran lunas sepanjang waktu, sebelum refund.</p>
          </div>
        </section>
        <QueueCard title="Pembayaran menunggu" count={paymentCount} icon={ReceiptText}
          tone="bg-[#fff0dd] text-[#855300]" href={basePath + "/pembayaran"} linkLabel="Buka riwayat pembayaran" />
        <QueueCard title="Pembatalan menunggu" count={refundCount} icon={Undo2}
          tone="bg-[#e7efff] text-[#003466]" href={basePath + "/refund"} linkLabel="Buka pembatalan & refund" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className={`${panelClass} min-w-0 space-y-4`}>
          <div>
            <h2 className="font-bold text-[#131b2e]">Tren pendapatan mingguan</h2>
            <p className="mt-1 text-sm text-[#424750]">8 minggu berdasarkan tanggal konfirmasi pembayaran (WITA).</p>
          </div>
          {!metrics?.trend.some((week) => week.amount > 0) ? (
            <AdminEmptyState icon="bar_chart" title={metrics ? "Belum ada pendapatan terverifikasi pada periode ini" : "Data tren belum tersedia"} />
          ) : (
            <>
              <RevenueBars weeks={metrics.trend.map((week) => ({
                date: week.week_start,
                label: shortDate.format(new Date(week.week_start)),
                value: currency.format(week.amount),
                amount: week.amount,
              }))} />
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

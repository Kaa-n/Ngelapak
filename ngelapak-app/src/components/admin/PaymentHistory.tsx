import Link from "next/link";
import { AdminEmptyState, AdminHeading, StatusPill } from "@/components/admin/AdminPresentation";
import { actionLinkClass, panelClass } from "@/components/admin/styles";
import { formatRentalTime, paymentLabel } from "@/lib/rental-policy";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export type PaymentHistoryRow = {
  id: string; spot: string; tenant: string; amount: number | null; status: string;
  providerStatus?: string | null; reference?: string | null; paidAt?: string | null;
  method?: string | null; legacyReview?: boolean;
};

export default function PaymentHistory({ rows, total }: { rows: PaymentHistoryRow[]; total: number }) {
  return (
    <>
      <AdminHeading title="Riwayat Pembayaran" description="Pantau pembayaran sewa dan status konfirmasi Midtrans." />
      <section className={panelClass}>
        <h2 className="mb-4 font-bold">Pembayaran ({total})</h2>
        {rows.length ? (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border border-[#e2e7ff] px-3 py-3 text-sm sm:px-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="break-words font-semibold">{row.tenant} · {row.spot}</p>
                    <p className="mt-1 break-words text-xs text-[#424750]">{row.id} · {row.method === "midtrans" ? "Midtrans" : row.method || "Transfer manual"}</p>
                    {row.paidAt && <p className="mt-1 text-xs text-[#424750]">Dikonfirmasi {formatRentalTime(Date.parse(row.paidAt))}</p>}
                    {row.reference && <p className="mt-1 break-words text-xs text-[#424750]">ID Midtrans {row.reference}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {row.amount != null && <span className="font-semibold tabular-nums">{currency.format(row.amount)}</span>}
                    <StatusPill status={row.status} label={row.legacyReview ? "Perlu verifikasi manual" : paymentLabel(row.status, row.providerStatus)} />
                    {row.legacyReview && <Link className={actionLinkClass} href={{ pathname: "/admin/verifikasi", query: { id: row.id } }}>Periksa bukti lama</Link>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : <AdminEmptyState icon="receipt_long" title="Belum ada pembayaran." />}
      </section>
    </>
  );
}

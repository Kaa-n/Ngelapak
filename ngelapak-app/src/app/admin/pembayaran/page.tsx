import { Suspense } from "react";
import Link from "next/link";
import AdminPageLoading from "@/components/admin/AdminPageLoading";
import PaymentHistory from "@/components/admin/PaymentHistory";
import { actionLinkClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/supabase/admin";

type PageProps = { searchParams: Promise<{ page?: string }> };

export default function PaymentHistoryPage(props: PageProps) {
  return <Suspense fallback={<AdminPageLoading />}><HistoryData {...props} /></Suspense>;
}

async function HistoryData({ searchParams }: PageProps) {
  const { supabase } = await requireAdmin();
  const { page } = await searchParams;
  const current = Math.max(1, Math.min(10000, Math.trunc(Number(page)) || 1));
  const offset = (current - 1) * 25;
  const { data, count, error } = await supabase.from("bookings")
    .select("*", { count: "exact" }).order("created_at", { ascending: false }).order("id").range(offset, offset + 24);
  if (error) throw new Error("Riwayat pembayaran gagal dimuat.");

  return (
    <>
      <PaymentHistory total={count ?? 0} rows={data.map((booking) => ({
        id: booking.id, spot: booking.spot_nama || "Lapak", tenant: booking.penyewa_nama || "Penyewa",
        amount: booking.total_bayar, status: booking.status_verifikasi, providerStatus: booking.midtrans_status,
        reference: booking.midtrans_transaction_id, paidAt: booking.verified_at, method: booking.metode_pembayaran,
        legacyReview: booking.metode_pembayaran !== "midtrans" && booking.status === "menunggu" && booking.status_verifikasi === "menunggu",
      }))} />
      <nav aria-label="Halaman pembayaran" className="flex flex-wrap gap-3">
        {current > 1 && <Link className={actionLinkClass} href={`?page=${current - 1}`}>Sebelumnya</Link>}
        {(count ?? 0) > offset + 25 && <Link className={actionLinkClass} href={`?page=${current + 1}`}>Berikutnya</Link>}
      </nav>
    </>
  );
}

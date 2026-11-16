import Link from "next/link";
import { Suspense } from "react";
import ActionForm from "@/components/admin/ActionForm";
import AdminPageLoading from "@/components/admin/AdminPageLoading";
import { AdminEmptyState, AdminHeading, StatusPill } from "@/components/admin/AdminPresentation";
import ProofPreview from "@/components/admin/ProofPreview";
import { actionLinkClass, inputClass, panelClass, primaryLinkClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/supabase/admin";
import { formatRupiah } from "@/lib/mock-data";
import { getProofPreview } from "@/lib/supabase/proof-preview";
import { recordRefund, reviewCancellation } from "./actions";

type RefundPageProps = { searchParams: Promise<{ id?: string; page?: string }> };

export default function RefundPage(props: RefundPageProps) {
  return <Suspense fallback={<AdminPageLoading />}><RefundData {...props} /></Suspense>;
}

async function RefundData({ searchParams }: RefundPageProps) {
  const { supabase } = await requireAdmin();
  const { id, page } = await searchParams;
  const currentPage = Math.min(10000, Math.max(1, Math.trunc(Number(page)) || 1));
  const offset = (currentPage - 1) * 25;
  const { data: requests, error, count } = await supabase.from("cancellations")
    .select("id, booking_id, nama, status, diajukan_pada", { count: "exact" })
    .order("status", { ascending: false }).order("diajukan_pada", { ascending: false }).order("id").range(offset, offset + 24);
  if (error) throw new Error("Daftar pembatalan gagal dimuat.");

  const { data: request, error: requestError } = id
    ? await supabase.from("cancellations").select().eq("id", id).maybeSingle()
    : { data: null, error: null };
  if (requestError && requestError.code !== "22P02") throw new Error("Pengajuan gagal dimuat.");

  const { data: booking, error: bookingError } = request
    ? await supabase.from("bookings").select().eq("id", request.booking_id).maybeSingle()
    : { data: null, error: null };
  const isMidtrans = booking?.metode_pembayaran === "midtrans";
  const { data: payment, error: paymentError } = booking && !isMidtrans
    ? await supabase.from("payments").select("bukti_url").eq("booking_id", booking.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle()
    : { data: null, error: null };
  if (bookingError || paymentError) throw new Error("Data pembayaran gagal dimuat.");

  const [paymentProof, refundProof] = await Promise.all([
    getProofPreview(supabase, "payment-proofs", payment?.bukti_url || booking?.bukti_bayar || null),
    getProofPreview(supabase, "refund-proofs", request?.bukti_refund || null),
  ]);
  const needsRefund = request?.status === "disetujui" && !request.bukti_refund;

  return (
    <>
      <AdminHeading title="Kelola Pembatalan & Refund" description="Tinjau alasan pembatalan, rekening tujuan, dan bukti refund." />
      {id && !request && <p role="status" className={panelClass}>Pengajuan tidak ditemukan.</p>}
      {request && (
        <div id="tinjau-pengajuan" className="grid min-w-0 scroll-mt-4 gap-4 md:grid-cols-2">
          <section className={`${panelClass} min-w-0 space-y-4`}>
            <h2 className="font-semibold">Detail pengajuan</h2>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              {[
                ["ID pesanan", request.booking_id], ["Lapak", booking?.spot_nama],
                ["Nama", request.nama], ["NIM", request.nim], ["Telepon", request.telepon],
                ["Alasan", request.alasan], ["Nama bank", request.bank], ["Nomor rekening", request.nomor_rekening],
                ["Pemilik rekening", request.nama_rekening], ["Status", request.status],
                ["Catatan admin", request.admin_catatan],
                ["Refund", request.status === "disetujui" ? (request.bukti_refund ? "Selesai" : "Sedang diproses") : null],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-[#424750]">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words font-medium">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {request.status === "menunggu" && (
              <section aria-label="Keputusan pembatalan" className="space-y-4 border-t border-[#e2e7ff] pt-4">
                <h3 className="font-semibold">Keputusan pembatalan</h3>
                <ActionForm action={reviewCancellation.bind(null, request.id, true)} label="Setujui pembatalan">
                  {isMidtrans ? <p className="text-sm text-[#424750]">Jadwal akan tersedia kembali. Catat bukti transfer setelah refund diproses.</p> :
                  <label className="grid gap-1 text-sm">Bukti refund (JPG, PNG, PDF, maks. 6 MB)
                    <input type="file" name="bukti_refund" className={inputClass} accept="image/jpeg,image/png,application/pdf" required />
                  </label>}
                </ActionForm>
                <ActionForm action={reviewCancellation.bind(null, request.id, false)} label="Tolak pembatalan" danger>
                  <label className="grid gap-1 text-sm">Catatan untuk penyewa
                    <textarea name="catatan" className={inputClass} rows={3} maxLength={1000} required />
                  </label>
                </ActionForm>
              </section>
            )}
            {needsRefund && (
              <ActionForm action={recordRefund.bind(null, request.id)} label="Catat refund selesai">
                <label className="grid gap-1 text-sm">Bukti refund (JPG, PNG, PDF, maks. 6 MB)
                  <input type="file" name="bukti_refund" className={inputClass} accept="image/jpeg,image/png,application/pdf" required />
                </label>
              </ActionForm>
            )}
          </section>
          <div className="min-w-0 space-y-4">
            {isMidtrans ? <section className={panelClass}>
              <h2 className="font-semibold">Pembayaran Midtrans</h2>
              <p className="mt-2 break-words text-sm">ID transaksi {booking?.midtrans_transaction_id ?? "—"}</p>
              {booking?.total_bayar != null && <p className="mt-1 text-sm">Pembayaran tercatat {formatRupiah(booking.total_bayar)}</p>}
            </section> : <ProofPreview proof={paymentProof} title="Bukti pembayaran asli" />}
            {request.bukti_refund && <ProofPreview proof={refundProof} title="Bukti refund" />}
          </div>
        </div>
      )}
      <section className={panelClass}>
        <h2 className="mb-4 font-bold">Pengajuan pembatalan ({count ?? 0})</h2>
        {requests.length ? (
          <ul className="space-y-2">
            {requests.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e2e7ff] px-3 py-3 text-sm sm:px-4">
                <div className="min-w-0 flex-1 basis-52">
                  <p className="break-words font-semibold">{row.nama ?? "Penyewa"}</p>
                  <p className="mt-0.5 break-words text-xs text-[#424750]">{row.booking_id}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill status={row.status} />
                  <Link className={row.status === "menunggu" ? primaryLinkClass : actionLinkClass}
                    href={{ pathname: "/admin/refund", query: { id: row.id, page: currentPage }, hash: "tinjau-pengajuan" }}>
                    {row.status === "menunggu" ? "Tinjau pengajuan" : "Lihat pengajuan"}
                    <span className="sr-only">pesanan {row.booking_id}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : <AdminEmptyState icon="assignment_return" title="Belum ada pengajuan di halaman ini." />}
        <nav aria-label="Halaman pengajuan" className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[#003466]">
          {currentPage > 1 && <Link href={`?page=${currentPage - 1}`}>← Sebelumnya</Link>}
          {(count ?? 0) > currentPage * 25 && <Link href={`?page=${currentPage + 1}`}>Berikutnya →</Link>}
        </nav>
      </section>
    </>
  );
}

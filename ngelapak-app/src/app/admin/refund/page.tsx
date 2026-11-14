import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import ProofPreview from "@/components/admin/ProofPreview";
import { inputClass, panelClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/supabase/admin";
import { getProofPreview } from "@/lib/supabase/proof-preview";
import { reviewCancellation } from "./actions";

export default async function RefundPage({ searchParams }: {
  searchParams: Promise<{ id?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id, page } = await searchParams;
  const currentPage = Math.min(10000, Math.max(1, Math.trunc(Number(page)) || 1));
  const offset = (currentPage - 1) * 25;
  const { data: requests, error, count } = await supabase.from("cancellations")
    .select("id, booking_id, nama, status, diajukan_pada", { count: "exact" })
    .order("diajukan_pada", { ascending: false }).order("id").range(offset, offset + 24);
  if (error) throw new Error("Daftar pembatalan gagal dimuat.");

  const { data: request, error: requestError } = id
    ? await supabase.from("cancellations").select().eq("id", id).maybeSingle()
    : { data: null, error: null };
  if (requestError && requestError.code !== "22P02") throw new Error("Pengajuan gagal dimuat.");

  const { data: booking, error: bookingError } = request
    ? await supabase.from("bookings").select("id, spot_nama, bukti_bayar").eq("id", request.booking_id).maybeSingle()
    : { data: null, error: null };
  const { data: payment, error: paymentError } = booking
    ? await supabase.from("payments").select("bukti_url").eq("booking_id", booking.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle()
    : { data: null, error: null };
  if (bookingError || paymentError) throw new Error("Data pembayaran gagal dimuat.");

  const [paymentProof, refundProof] = await Promise.all([
    getProofPreview(supabase, "payment-proofs", payment?.bukti_url || booking?.bukti_bayar || null),
    getProofPreview(supabase, "refund-proofs", request?.bukti_refund || null),
  ]);

  return (
    <>
      <h1 className="text-2xl font-bold text-[#003466]">Kelola Pembatalan & Refund</h1>
      {id && !request && <p role="status" className={panelClass}>Pengajuan tidak ditemukan.</p>}
      {request && (
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <section className={`${panelClass} min-w-0 space-y-4`}>
            <h2 className="font-semibold">Detail pengajuan</h2>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
              {[
                ["ID pesanan", request.booking_id], ["Lapak", booking?.spot_nama],
                ["Nama", request.nama], ["NIM", request.nim], ["Telepon", request.telepon],
                ["Alasan", request.alasan], ["Nama bank", request.bank], ["Nomor rekening", request.nomor_rekening],
                ["Pemilik rekening", request.nama_rekening], ["Status", request.status],
                ["Catatan admin", request.admin_catatan],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-[#424750]">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words font-medium">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {request.status === "menunggu" && (
              <div className="space-y-4 border-t border-[#e2e7ff] pt-4">
                <ActionForm action={reviewCancellation.bind(null, request.id, true)} label="Setujui pembatalan">
                  <label className="grid gap-1 text-sm">Bukti refund (JPG, PNG, PDF, maks. 6 MB)
                    <input type="file" name="bukti_refund" className={inputClass} accept="image/jpeg,image/png,application/pdf" required />
                  </label>
                </ActionForm>
                <ActionForm action={reviewCancellation.bind(null, request.id, false)} label="Tolak pembatalan" danger>
                  <label className="grid gap-1 text-sm">Catatan untuk penyewa
                    <textarea name="catatan" className={inputClass} rows={3} maxLength={1000} required />
                  </label>
                </ActionForm>
              </div>
            )}
          </section>
          <div className="min-w-0 space-y-4">
            <ProofPreview proof={paymentProof} title="Bukti pembayaran asli" />
            {request.status === "disetujui" && <ProofPreview proof={refundProof} title="Bukti refund" />}
          </div>
        </div>
      )}
      <section className={panelClass}>
        <h2 className="mb-3 font-semibold">Pengajuan pembatalan ({count ?? 0})</h2>
        {requests.length ? (
          <ul className="divide-y divide-[#e2e7ff]">
            {requests.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="break-words font-semibold">{row.nama ?? "Penyewa"} · {row.booking_id}</p>
                  <p className="capitalize text-[#424750]">{row.status}</p>
                </div>
                <Link className="font-semibold text-[#003466] underline" href={{ pathname: "/admin/refund", query: { id: row.id, page: currentPage } }}>
                  Lihat pengajuan <span className="sr-only">pesanan {row.booking_id}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-[#424750]">Belum ada pengajuan di halaman ini.</p>}
        <nav aria-label="Halaman pengajuan" className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[#003466]">
          {currentPage > 1 && <Link href={`?page=${currentPage - 1}`}>← Sebelumnya</Link>}
          {(count ?? 0) > currentPage * 25 && <Link href={`?page=${currentPage + 1}`}>Berikutnya →</Link>}
        </nav>
      </section>
    </>
  );
}

import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import ProofPreview from "@/components/admin/ProofPreview";
import { panelClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/supabase/admin";
import { getProofPreview } from "@/lib/supabase/proof-preview";
import { reviewPayment } from "./actions";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function VerificationPage({ searchParams }: {
  searchParams: Promise<{ id?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id, page } = await searchParams;
  const currentPage = Math.min(10000, Math.max(1, Math.trunc(Number(page)) || 1));
  const offset = (currentPage - 1) * 25;
  const { data: queue, error, count } = await supabase.from("bookings")
    .select("id, spot_nama, penyewa_nama, tanggal_mulai, tanggal_selesai, total_bayar", { count: "exact" })
    .eq("status", "menunggu").eq("status_verifikasi", "menunggu")
    .order("created_at", { ascending: true }).order("id").range(offset, offset + 24);
  if (error) throw new Error("Antrean gagal dimuat.");

  const { data: booking, error: detailError } = id
    ? await supabase.from("bookings").select().eq("id", id).maybeSingle()
    : { data: null, error: null };
  if (detailError) throw new Error("Detail pesanan gagal dimuat.");

  const { data: payment, error: paymentError } = booking
    ? await supabase.from("payments").select("bukti_url, nominal, status").eq("booking_id", booking.id)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle()
    : { data: null, error: null };
  if (paymentError) throw new Error("Pembayaran gagal dimuat.");

  const proof = booking
    ? await getProofPreview(supabase, "payment-proofs", payment?.bukti_url || booking.bukti_bayar)
    : null;
  const { count: cancellations, error: cancelError } = booking
    ? await supabase.from("cancellations").select("id", { count: "exact", head: true })
      .eq("booking_id", booking.id).eq("status", "menunggu")
    : { count: 0, error: null };
  if (cancelError) throw new Error("Status pembatalan gagal dimuat.");

  const canReview = booking?.status === "menunggu" && booking.status_verifikasi === "menunggu"
    && (!payment || payment.status === "menunggu") && !cancellations;

  return (
    <>
      <h1 className="text-2xl font-bold text-[#003466]">Verifikasi Pembayaran</h1>
      {booking && (
        <section className="space-y-4">
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <section className={panelClass}>
              <h2 className="font-semibold">Data penyewa</h2>
              <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                {[
                  ["ID pesanan", booking.id], ["Nama", booking.penyewa_nama], ["NIM", booking.penyewa_nim],
                  ["Fakultas", booking.penyewa_fakultas], ["Email", booking.penyewa_email],
                  ["Telepon", booking.penyewa_telepon], ["Lapak", booking.spot_nama],
                  ["Periode", `${booking.tanggal_mulai} – ${booking.tanggal_selesai}`],
                  ["Tagihan", booking.total_bayar === null ? null : currency.format(booking.total_bayar)],
                  ["Nominal pembayaran", payment?.nominal == null ? null : currency.format(payment.nominal)],
                  ["Metode", booking.metode_pembayaran], ["Status", booking.status_verifikasi],
                ].map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-[#424750]">{label}</dt>
                    <dd className="break-words font-medium">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
              {canReview && (
                <div className="mt-4 flex flex-wrap gap-3">
                  {proof && <ActionForm action={reviewPayment.bind(null, booking.id, true)} label="Setujui pembayaran" />}
                  <ActionForm action={reviewPayment.bind(null, booking.id, false)} label="Tolak pembayaran" danger />
                </div>
              )}
              {!!cancellations && <p className="mt-4 text-sm">Ada pengajuan pembatalan. <Link href="/admin/refund" className="underline">Buka refund</Link></p>}
            </section>
            <ProofPreview proof={proof} title="Bukti transfer" />
          </div>
        </section>
      )}
      {id && !booking && <p role="status" className={panelClass}>Pesanan tidak ditemukan.</p>}
      <section className={panelClass}>
        <h2 className="mb-3 font-semibold">Menunggu verifikasi ({count ?? 0})</h2>
        {queue.length ? (
          <ul className="divide-y divide-[#e2e7ff]">
            {queue.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="break-words font-semibold">{row.penyewa_nama ?? "Penyewa"} · {row.spot_nama ?? "Lapak"}</p>
                  <p className="break-words text-[#424750]">{row.id} · {row.tanggal_mulai} – {row.tanggal_selesai}</p>
                </div>
                <Link className="font-semibold text-[#003466] underline" href={{ pathname: "/admin/verifikasi", query: { id: row.id, page: currentPage } }}>
                  Periksa bukti <span className="sr-only">pesanan {row.id}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-[#424750]">Tidak ada pesanan menunggu verifikasi di halaman ini.</p>}
        <nav aria-label="Halaman antrean" className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-[#003466]">
          {currentPage > 1 && <Link href={`?page=${currentPage - 1}`}>← Sebelumnya</Link>}
          {(count ?? 0) > currentPage * 25 && <Link href={`?page=${currentPage + 1}`}>Berikutnya →</Link>}
        </nav>
      </section>
    </>
  );
}

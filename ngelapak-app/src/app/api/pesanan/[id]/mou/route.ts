import { createClient } from "@/lib/supabase/server";
import { rentalAgreementPdf } from "@/lib/pdf/rentalAgreement";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^MT-[a-f0-9]{32}$/.test(id)) return new Response(null, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });
  const { data: order, error } = await supabase.from("bookings")
    .select("id,penyewa_nama,spot_nama,spot_kode,tanggal_mulai,tanggal_selesai,total_bayar,verified_at")
    .eq("id", id).eq("owner_id", user.id).eq("metode_pembayaran", "midtrans")
    .eq("status_verifikasi", "disetujui").in("status", ["aktif", "selesai"]).maybeSingle();
  if (error) return new Response(null, { status: 503 });
  if (!order?.verified_at || order.total_bayar == null) return new Response(null, { status: 404 });
  const { count, error: requestError } = await supabase.from("cancellations")
    .select("id", { count: "exact", head: true }).eq("booking_id", id).in("status", ["menunggu", "disetujui"]);
  if (requestError) return new Response(null, { status: 503 });
  if (count !== 0) return new Response(null, { status: 409 });
  const pdf = await rentalAgreementPdf({
    id, tenant: order.penyewa_nama ?? "", spot: `${order.spot_nama ?? ""} (${order.spot_kode ?? ""})`,
    start: order.tanggal_mulai, end: order.tanggal_selesai, amount: order.total_bayar, paidAt: order.verified_at,
  });
  return new Response(new Uint8Array(pdf), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="MOU-${id}.pdf"`,
    "Cache-Control": "private, no-store",
  } });
}

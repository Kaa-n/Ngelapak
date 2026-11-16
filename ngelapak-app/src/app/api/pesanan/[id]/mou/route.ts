import { createClient } from "@/lib/supabase/server";
import { rentalAgreementPdf } from "@/lib/pdf/rentalAgreement";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id || typeof id !== "string" || id.length > 100) {
    return new Response(null, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response(null, { status: 401 });

  const { data: order, error } = await supabase
    .from("bookings")
    .select(
      "id,owner_id,spot_id,penyewa_nama,penyewa_nim,penyewa_fakultas,penyewa_telepon,penyewa_email,spot_nama,spot_kode,tanggal_mulai,tanggal_selesai,jumlah_hari,total_bayar,metode_pembayaran,jenis_usaha,nama_usaha,kategori_penjual,verified_at"
    )
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("status_verifikasi", "disetujui")
    .in("status", ["aktif", "selesai"])
    .maybeSingle();

  if (error) return new Response(null, { status: 503 });
  if (!order?.verified_at || order.total_bayar == null) return new Response(null, { status: 404 });

  const { count, error: requestError } = await supabase
    .from("cancellations")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", id)
    .in("status", ["menunggu", "disetujui"]);

  if (requestError) return new Response(null, { status: 503 });
  if (count !== 0) return new Response(null, { status: 409 });

  let spotDetail: {
    lokasi?: string | null;
    zona?: string | null;
    zona_label?: string | null;
    ukuran?: string | null;
    daya?: number | null;
  } | null = null;

  if (order.spot_id) {
    const { data: s } = await supabase
      .from("spots")
      .select("lokasi,zona,zona_label,ukuran,daya")
      .eq("id", order.spot_id)
      .maybeSingle();
    spotDetail = s;
  }

  const lokasiStr = spotDetail?.lokasi || "Kampus Bukit Jimbaran, Universitas Udayana";
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `Universitas Udayana ${lokasiStr}`
  )}`;

  const pdf = await rentalAgreementPdf({
    id,
    tenant: order.penyewa_nama ?? "",
    nim: order.penyewa_nim ?? undefined,
    fakultas: order.penyewa_fakultas ?? undefined,
    telepon: order.penyewa_telepon ?? undefined,
    email: order.penyewa_email ?? undefined,
    namaUsaha: order.nama_usaha ?? undefined,
    jenisUsaha: order.jenis_usaha ?? undefined,
    spot: `${order.spot_nama ?? ""} (${order.spot_kode ?? ""})`,
    spotKode: order.spot_kode ?? undefined,
    lokasi: lokasiStr,
    zonaLabel: spotDetail?.zona_label ?? undefined,
    ukuran: spotDetail?.ukuran ?? undefined,
    daya: spotDetail?.daya ?? undefined,
    start: order.tanggal_mulai,
    end: order.tanggal_selesai,
    jumlahHari: order.jumlah_hari ? Number(order.jumlah_hari) : undefined,
    amount: Number(order.total_bayar),
    metodePembayaran: order.metode_pembayaran ?? "Midtrans / Transfer Bank",
    paidAt: order.verified_at,
    googleMapsUrl,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="MOU-${id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

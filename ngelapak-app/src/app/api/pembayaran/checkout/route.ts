import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { midtransBookingId, openSnap, paymentServices, syncMidtransPayment } from "@/lib/midtrans/server";
import { CLEANING_DAYS, minimumRentalStartDate, shiftRentalDate } from "@/lib/rental-policy";
import type { Database } from "@/types/database";

const inputFields = z.object({
  id: midtransBookingId,
  spotKode: z.string().min(1).max(80),
  tanggalMulai: z.iso.date(),
  jumlahHari: z.number().int().min(1).max(30),
  totalBayar: z.number().int().positive().max(2147483647),
  jenisUsaha: z.string().trim().min(1).max(200),
  namaUsaha: z.string().trim().min(1).max(200),
  kategoriPenjual: z.enum(["Mahasiswa Wirausaha", "UMKM Umum"]),
  catatan: z.string().max(1000),
  setuju: z.literal(true),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const input = inputFields.safeParse(payload);
  const resume = z.object({ id: midtransBookingId, resume: z.literal(true) }).safeParse(payload);
  if (!input.success && !resume.success) return Response.json({ error: "Periksa data pesanan dan centang persetujuan." }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const appUrl = process.env.NGELAPAK_APP_URL;
  if (!appUrl) return Response.json({ error: "Pembayaran Midtrans belum dikonfigurasi." }, { status: 503 });

  try {
    const services = paymentServices();
    if (resume.success) {
      const { data: booking, error } = await supabase.from("bookings").select()
        .eq("id", resume.data.id).eq("owner_id", user.id).eq("metode_pembayaran", "midtrans").maybeSingle();
      if (error || !booking) return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
      return await checkoutResponse(services, booking, appUrl);
    }
    if (!input.success) return new Response(null, { status: 400 });
    const order = input.data;
    if (order.tanggalMulai < minimumRentalStartDate()) {
      return Response.json({ error: "Tanggal mulai sewa paling cepat dua hari dari hari ini." }, { status: 400 });
    }
    const { data: expired, error: expiredError } = await services.db.from("bookings")
      .select("id,total_bayar,payment_expires_at,spots!inner(kode)")
      .eq("spots.kode", order.spotKode).eq("metode_pembayaran", "midtrans")
      .eq("status", "menunggu").lte("payment_expires_at", new Date().toISOString())
      .lte("tanggal_mulai", shiftRentalDate(order.tanggalMulai, order.jumlahHari - 1 + CLEANING_DAYS))
      .gte("tanggal_selesai", shiftRentalDate(order.tanggalMulai, -CLEANING_DAYS)).limit(10);
    if (expiredError) throw new Error("Ketersediaan untuk pembayaran belum dapat diperiksa.");
    await Promise.allSettled((expired ?? []).map((item) => syncMidtransPayment(services, item)));
    const { data: booking, error } = await services.db.rpc("reserve_midtrans_booking", {
      p_booking_id: order.id, p_owner: user.id, p_spot_kode: order.spotKode, p_tanggal_mulai: order.tanggalMulai,
      p_jumlah_hari: order.jumlahHari, p_total_bayar: order.totalBayar, p_jenis_usaha: order.jenisUsaha,
      p_nama_usaha: order.namaUsaha, p_kategori_penjual: order.kategoriPenjual, p_catatan: order.catatan,
    });
    if (error || !booking) {
      const message = error?.code === "PGRST202" || error?.code === "42703"
        ? "Pembayaran Midtrans belum tersedia di database."
        : error?.message ?? "Pesanan gagal dibuat.";
      return Response.json({ error: message }, { status: 409 });
    }
    return await checkoutResponse(services, booking, appUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("belum dikonfigurasi")) {
      return Response.json({ error: message }, { status: 503 });
    }
    return Response.json({ error: "Pembayaran Midtrans belum tersedia. Coba lagi atau hubungi pengelola." }, { status: 503 });
  }
}

async function checkoutResponse(
  services: ReturnType<typeof paymentServices>,
  booking: Database["public"]["Tables"]["bookings"]["Row"],
  appUrl: string,
) {
  if (booking.status !== "menunggu" || booking.midtrans_status === "perlu_ditinjau" ||
      !booking.payment_expires_at || Date.parse(booking.payment_expires_at) <= Date.now()) {
    return Response.json({
      bookingId: booking.id,
      error: "Batas pembayaran sudah habis atau pesanan tidak bisa dilanjutkan. Buat pesanan baru.",
    }, { status: 409 });
  }
  if (booking.midtrans_checkout_url) {
    return Response.json({ bookingId: booking.id, checkoutUrl: booking.midtrans_checkout_url });
  }
  try {
    const finishUrl = new URL("/", appUrl);
    finishUrl.searchParams.set("pesanan", booking.id);
    const checkoutUrl = await openSnap(services, booking, finishUrl.href);
    const { error } = await services.db.from("bookings")
      .update({ midtrans_checkout_url: checkoutUrl }).eq("id", booking.id);
    if (error) throw error;
    return Response.json({ bookingId: booking.id, checkoutUrl });
  } catch (error) {
    const message = error instanceof Error && error.message
      ? error.message
      : "Halaman pembayaran Midtrans gagal dibuka. Periksa Server Key Sandbox lalu coba lagi.";
    return Response.json({ bookingId: booking.id, error: message }, { status: 502 });
  }
}

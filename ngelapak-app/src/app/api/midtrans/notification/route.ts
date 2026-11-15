import { notificationFields, paymentServices, syncMidtransPayment, verifyNotification } from "@/lib/midtrans/server";

export async function POST(request: Request) {
  const parsed = notificationFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  try {
    const services = paymentServices();
    if (!verifyNotification(services.serverKey, parsed.data)) return new Response(null, { status: 401 });
    const { data: booking, error } = await services.db.from("bookings")
      .select("id,total_bayar,payment_expires_at")
      .eq("id", parsed.data.order_id).eq("metode_pembayaran", "midtrans").maybeSingle();
    if (error) throw error;
    if (booking) await syncMidtransPayment(services, booking);
    return Response.json({ ok: true });
  } catch {
    return new Response(null, { status: 503 });
  }
}

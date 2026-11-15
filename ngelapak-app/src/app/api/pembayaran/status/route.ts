import { createClient } from "@/lib/supabase/server";
import { midtransBookingId, paymentServices, syncMidtransPayment } from "@/lib/midtrans/server";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const id = midtransBookingId.safeParse(payload?.id);
  if (!id.success) return new Response(null, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(null, { status: 401 });
  const { data: booking } = await supabase.from("bookings")
    .select("id,total_bayar,payment_expires_at,status")
    .eq("id", id.data).eq("owner_id", user.id).eq("metode_pembayaran", "midtrans").maybeSingle();
  if (!booking) return new Response(null, { status: 404 });
  try {
    if (booking.status === "menunggu") await syncMidtransPayment(paymentServices(), booking);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}

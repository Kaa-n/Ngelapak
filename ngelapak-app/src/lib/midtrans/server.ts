import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";

export const midtransBookingId = z.string().regex(/^MT-[a-f0-9]{32}$/);

export function paymentServices() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serverKey || !supabaseKey || !supabaseUrl) throw new Error("Pembayaran Midtrans belum dikonfigurasi.");
  const production = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return {
    serverKey,
    snapOrigin: production ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
    coreOrigin: production ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com",
    db: createClient<Database>(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

type Services = ReturnType<typeof paymentServices>;
type Payment = Pick<Database["public"]["Tables"]["bookings"]["Row"], "id" | "total_bayar" | "payment_expires_at">;

async function midtransFetch(services: Services, url: string, body?: unknown) {
  return fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(services.serverKey + ":").toString("base64")}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(9000),
  });
}

export async function openSnap(services: Services, booking: Payment & { created_at: string }, finishUrl: string) {
  const wib = new Date(Date.parse(booking.created_at) + 7 * 3600000)
    .toISOString().slice(0, 19).replace("T", " ");
  const response = await midtransFetch(services, services.snapOrigin + "/snap/v1/transactions", {
    transaction_details: { order_id: booking.id, gross_amount: booking.total_bayar },
    expiry: { start_time: wib + " +0700", duration: 60, unit: "minute" },
    callbacks: { finish: finishUrl },
    credit_card: { secure: true },
  });
  const result = z.object({ redirect_url: z.url() }).safeParse(await response.json());
  if (!response.ok || !result.success || new URL(result.data.redirect_url).origin !== services.snapOrigin) {
    throw new Error("Halaman pembayaran belum bisa dibuka. Coba lanjutkan dari Detail Pesanan.");
  }
  return result.data.redirect_url;
}

const statusFields = z.object({
  order_id: midtransBookingId,
  transaction_id: z.string().min(1),
  transaction_status: z.string(),
  status_code: z.string(),
  gross_amount: z.string().regex(/^\d+(?:\.0+)?$/),
  currency: z.literal("IDR").optional(),
  fraud_status: z.string().optional(),
  settlement_time: z.string().optional(),
  transaction_time: z.string().optional(),
});

export const notificationFields = z.object({
  order_id: midtransBookingId,
  status_code: z.string(),
  gross_amount: z.string(),
  signature_key: z.string().regex(/^[a-f0-9]{128}$/i),
});

export function verifyNotification(key: string, notice: z.infer<typeof notificationFields>) {
  const expected = createHash("sha512")
    .update(notice.order_id + notice.status_code + notice.gross_amount + key).digest();
  return timingSafeEqual(expected, Buffer.from(notice.signature_key, "hex"));
}

export async function syncMidtransPayment(services: Services, booking: Payment) {
  const response = await midtransFetch(services, `${services.coreOrigin}/v2/${booking.id}/status`);
  const payload = await response.json();
  if (response.status === 404 || payload?.status_code === "404") {
    // Snap has no Core API record until a payment channel is selected.
    // Give in-flight channel creation time to appear before freeing the hold.
    if (booking.payment_expires_at && Date.now() >= Date.parse(booking.payment_expires_at) + 120000) {
      await saveStatus(services, booking, "expire", null, null);
    }
    return;
  }
  const status = statusFields.safeParse(payload);
  if (!response.ok || !status.success || status.data.order_id !== booking.id ||
      Number(status.data.gross_amount) !== booking.total_bayar) {
    throw new Error("Status pembayaran belum dapat diperiksa.");
  }
  const data = status.data;
  if (data.status_code === "200" && (!data.fraud_status || data.fraud_status === "accept") &&
      (data.transaction_status === "settlement" || data.transaction_status === "capture")) {
    const timestamp = data.settlement_time ?? data.transaction_time;
    const paidAt = timestamp && Date.parse(timestamp.replace(" ", "T") + "+07:00");
    if (typeof paidAt !== "number" || !Number.isFinite(paidAt)) throw new Error("Waktu pembayaran tidak tersedia.");
    await saveStatus(services, booking, "lunas", data.transaction_id, new Date(paidAt).toISOString());
  } else if (["expire", "cancel", "deny", "failure"].includes(data.transaction_status)) {
    await saveStatus(services, booking, data.transaction_status, data.transaction_id, null);
  }
}

async function saveStatus(services: Services, booking: Payment, status: string, transactionId: string | null, paidAt: string | null) {
  if (booking.total_bayar == null) throw new Error("Tagihan tidak ditemukan.");
  const { error } = await services.db.rpc("apply_midtrans_status", {
    p_booking_id: booking.id, p_amount: booking.total_bayar, p_transaction_id: transactionId,
    p_status: status, p_paid_at: paidAt,
  });
  if (error) throw new Error("Status pembayaran gagal disimpan.");
}

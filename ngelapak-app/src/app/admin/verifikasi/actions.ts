"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/admin/ActionForm";
import { getUploadPath, proofMimeTypes } from "@/lib/supabase/storage";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function reviewPayment(id: string, approve: boolean): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("review_booking_payment", { p_booking_id: id, p_approve: approve });
  if (error) return { error: error.message };
  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/refund");
  revalidatePath("/admin");
  return { success: approve ? "Pembayaran diverifikasi dan jadwal dikunci." : "Pembayaran ditolak." };
}

export async function uploadPaymentProof(bookingId: string, _state: ActionState, data: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const file = data.get("bukti_bayar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih berkas bukti pembayaran (JPG, PNG, PDF maks 6 MB)." };
  }

  // Cari data booking untuk mendapatkan owner_id
  const { data: booking, error: bError } = await supabase
    .from("bookings")
    .select("id, owner_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bError || !booking) {
    return { error: "Data pesanan tidak ditemukan." };
  }

  let proofPath: string;
  try {
    proofPath = getUploadPath(file, proofMimeTypes, booking.owner_id || undefined);
  } catch (err) {
    return { error: (err as Error).message };
  }

  const storageClient = createServiceRoleClient();
  const bucket = storageClient.storage.from("payment-proofs");
  const { error: uploadError } = await bucket.upload(proofPath, file, { upsert: true });
  if (uploadError) {
    return { error: `Bukti transfer gagal diunggah ke storage: ${uploadError.message}` };
  }

  // Update bukti_bayar di bookings
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ bukti_bayar: proofPath })
    .eq("id", bookingId);

  if (updateError) {
    return { error: `Gagal memperbarui pesanan: ${updateError.message}` };
  }

  // Update bukti_url di payments
  await supabase
    .from("payments")
    .update({ bukti_url: proofPath })
    .eq("booking_id", bookingId);

  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin");
  return { success: "Bukti pembayaran berhasil diunggah ke bucket storage 'payment-proofs' Supabase." };
}

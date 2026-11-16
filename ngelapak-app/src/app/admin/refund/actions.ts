"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/supabase/admin";
import { getUploadPath, proofMimeTypes } from "@/lib/supabase/storage";
import { createServiceRoleClient } from "@/lib/supabase/service";

export async function reviewCancellation(id: string, approve: boolean, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { error: "ID pembatalan tidak valid." };

  let proof: string | null = null;
  let note: string | null = null;
  const storageClient = createServiceRoleClient();
  const bucket = storageClient.storage.from("refund-proofs");

  const file = form.get("bukti_refund");
  if (approve && file !== null && file instanceof File && file.size > 0) {
    try {
      proof = getUploadPath(file, proofMimeTypes, id);
    } catch (error) {
      return { error: (error as Error).message };
    }

    const { error } = await bucket.upload(proof, file, { upsert: true });
    if (error) return { error: `Bukti refund gagal diunggah: ${error.message}` };
  } else if (!approve) {
    const raw = form.get("catatan");
    note = typeof raw === "string" ? raw.trim() : "";
    if (!note || note.length > 1000) return { error: "Isi catatan penolakan maksimal 1.000 karakter." };
  }

  // 1. Coba panggil RPC jika tersedia di database
  const rpcResult = await supabase.rpc("review_booking_cancellation", {
    p_cancellation_id: id,
    p_approve: approve,
    p_proof: proof,
    p_note: note,
  });

  // 2. Jika RPC tidak ditemukan di schema cache (PGRST202), jalankan fallback pembaruan langsung
  if (rpcResult.error && rpcResult.error.code === "PGRST202") {
    // Cari data pengajuan pembatalan
    const { data: request, error: reqErr } = await storageClient
      .from("cancellations")
      .select("id, booking_id, status")
      .eq("id", id)
      .maybeSingle();

    if (reqErr || !request) {
      if (proof) await bucket.remove([proof]);
      return { error: "Data pengajuan pembatalan tidak ditemukan." };
    }

    if (approve) {
      // Update status pembatalan
      const { error: cancelErr } = await storageClient
        .from("cancellations")
        .update({
          status: "disetujui",
          resolved_at: new Date().toISOString(),
          ...(proof ? { bukti_refund: proof } : {}),
        })
        .eq("id", id);

      if (cancelErr) {
        if (proof) await bucket.remove([proof]);
        return { error: `Gagal memperbarui status pembatalan: ${cancelErr.message}` };
      }

      // Update status pesanan lapak menjadi dibatalkan agar jadwal terbuka kembali
      await storageClient
        .from("bookings")
        .update({ status: "dibatalkan" })
        .eq("id", request.booking_id);
    } else {
      const { error: cancelErr } = await storageClient
        .from("cancellations")
        .update({
          status: "ditolak",
          admin_catatan: note,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (cancelErr) {
        return { error: `Gagal memperbarui status pembatalan: ${cancelErr.message}` };
      }
    }
  } else if (rpcResult.error) {
    if (proof) await bucket.remove([proof]);
    return { error: rpcResult.error.message };
  }

  revalidatePath("/admin/refund");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin");
  return {
    success: approve
      ? proof
        ? "Refund tercatat dan jadwal lapak kembali tersedia."
        : "Pembatalan disetujui. Jadwal lapak kembali tersedia dan refund menunggu pencatatan."
      : "Pengajuan ditolak dan catatan tersimpan.",
  };
}

export async function recordRefund(id: string, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const file = form.get("bukti_refund");
  if (!z.uuid().safeParse(id).success || !(file instanceof File)) return { error: "Isi bukti refund yang valid." };
  let path: string;
  try {
    path = getUploadPath(file, proofMimeTypes, id);
  } catch (error) {
    return { error: (error as Error).message };
  }
  const storageClient = createServiceRoleClient();
  const bucket = storageClient.storage.from("refund-proofs");
  const upload = await bucket.upload(path, file, { upsert: true });
  if (upload.error) return { error: `Bukti refund gagal diunggah: ${upload.error.message}` };

  const rpcResult = await supabase.rpc("record_booking_refund", { p_cancellation_id: id, p_proof: path });

  if (rpcResult.error && rpcResult.error.code === "PGRST202") {
    // Fallback direct update bukti_refund
    const { error: updateErr } = await storageClient
      .from("cancellations")
      .update({ bukti_refund: path })
      .eq("id", id);

    if (updateErr) {
      await bucket.remove([path]);
      return { error: `Gagal mencatat bukti refund: ${updateErr.message}` };
    }
  } else if (rpcResult.error) {
    await bucket.remove([path]);
    return { error: rpcResult.error.message };
  }

  revalidatePath("/admin/refund");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin");
  return { success: "Bukti refund tersimpan." };
}

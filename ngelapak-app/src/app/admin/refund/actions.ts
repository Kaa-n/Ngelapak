"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/supabase/admin";
import { getUploadPath, proofMimeTypes } from "@/lib/supabase/storage";

export async function reviewCancellation(id: string, approve: boolean, _state: ActionState, form: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return { error: "ID pembatalan tidak valid." };

  let proof: string | null = null;
  let note: string | null = null;
  const bucket = supabase.storage.from("refund-proofs");

  const file = form.get("bukti_refund");
  if (approve && file !== null) {
    if (!(file instanceof File)) return { error: "Unggah bukti refund." };
    try {
      proof = getUploadPath(file, proofMimeTypes, id);
    } catch (error) {
      return { error: (error as Error).message };
    }

    const { error } = await bucket.upload(proof, file);
    if (error) return { error: "Bukti refund gagal diunggah." };
  } else if (!approve) {
    const raw = form.get("catatan");
    note = typeof raw === "string" ? raw.trim() : "";
    if (!note || note.length > 1000) return { error: "Isi catatan penolakan maksimal 1.000 karakter." };
  }

  const { error } = await supabase.rpc("review_booking_cancellation", {
    p_cancellation_id: id, p_approve: approve, p_proof: proof, p_note: note,
  });
  if (error) {
    if (proof) await bucket.remove([proof]);
    return { error: error.message };
  }
  revalidatePath("/admin/refund");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin");
  return { success: approve
    ? proof ? "Refund tercatat dan jadwal lapak kembali tersedia." : "Pembatalan disetujui. Jadwal lapak kembali tersedia dan refund menunggu pencatatan."
    : "Pengajuan ditolak dan catatan tersimpan." };
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
  const bucket = supabase.storage.from("refund-proofs");
  const upload = await bucket.upload(path, file);
  if (upload.error) return { error: "Bukti refund gagal diunggah." };
  const { error } = await supabase.rpc("record_booking_refund", { p_cancellation_id: id, p_proof: path });
  if (error) {
    await bucket.remove([path]);
    return { error: error.message };
  }
  revalidatePath("/admin/refund");
  return { success: "Bukti refund tersimpan." };
}

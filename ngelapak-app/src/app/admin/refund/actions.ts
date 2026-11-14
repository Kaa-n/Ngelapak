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

  if (approve) {
    const file = form.get("bukti_refund");
    if (!(file instanceof File)) return { error: "Unggah bukti refund." };
    try {
      proof = getUploadPath(file, proofMimeTypes, id);
    } catch (error) {
      return { error: (error as Error).message };
    }

    const { error } = await bucket.upload(proof, file);
    if (error) return { error: "Bukti refund gagal diunggah." };
  } else {
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
  revalidatePath("/admin/verifikasi");
  revalidatePath("/admin");
  return { success: approve ? "Refund tercatat dan jadwal lapak kembali tersedia." : "Pengajuan ditolak dan catatan tersimpan." };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin";
import type { ActionState } from "@/components/admin/ActionForm";

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

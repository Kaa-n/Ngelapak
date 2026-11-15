"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/supabase/admin";
import { getUploadPath } from "@/lib/supabase/storage";

const zoneLabels = {
  rektorat: "Rektorat", boulevard: "Boulevard", sc: "Student Center", agrokompleks: "Agrokompleks",
};

const inventory = z.object({
  kode: z.string().trim().min(1).max(40),
  nama: z.string().trim().min(1).max(120),
  lokasi: z.string().trim().min(1).max(180),
  zona: z.enum(["rektorat", "boulevard", "sc", "agrokompleks"]),
  ukuran: z.enum(["2x2", "3x3", "4x4"]),
  tarif_per_hari: z.coerce.number().int().min(1).max(70_000_000),
  daya: z.coerce.number().int().min(0).max(100_000),
  status: z.enum(["tersedia", "pemeliharaan", "dipesan"]),
  deskripsi: z.string().trim().max(2000),
  koordinat_x: z.string().max(30).trim(),
  koordinat_y: z.string().max(30).trim(),
});

export async function saveSpot(id: string | null, _state: ActionState, data: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const parsed = inventory.safeParse(Object.fromEntries(data));
  if (!parsed.success) return { error: "Periksa kode, nama, lokasi, tarif, dan daya lapak." };

  const { zona, ukuran, koordinat_x, koordinat_y, status, ...values } = parsed.data;
  const x = koordinat_x ? Number(koordinat_x) : null;
  const y = koordinat_y ? Number(koordinat_y) : null;
  if ((x === null) !== (y === null) || (x !== null && !Number.isFinite(x)) || (y !== null && !Number.isFinite(y))) {
    return { error: "Isi kedua koordinat peta dengan angka atau kosongkan keduanya." };
  }

  if (status === "dipesan") {
    if (!id) return { error: "Pilih status Tersedia atau Pemeliharaan." };
    const { data: current } = await supabase.from("spots").select("status").eq("id", id).maybeSingle();
    if (current?.status !== "dipesan") return { error: "Status lapak sudah berubah. Muat ulang halaman." };
  }

  const changes = {
    ...values, zona, ukuran, status, zona_label: zoneLabels[zona],
    ukuran_label: ukuran.replace("x", " × ") + " m", koordinat_x: x, koordinat_y: y,
  };
  const bucket = supabase.storage.from("spot-images");
  const file = data.get("gambar");
  let newImagePath: string | undefined;
  let imageUrl: string | undefined;
  if (file instanceof File && file.size > 0) {
    try {
      newImagePath = getUploadPath(file, ["image/jpeg", "image/png", "image/webp"]);
    } catch (error) {
      return { error: (error as Error).message };
    }

    const { error } = await bucket.upload(newImagePath, file);
    if (error) return { error: "Foto gagal diunggah. Coba lagi." };
    imageUrl = bucket.getPublicUrl(newImagePath).data.publicUrl;
  }

  const payload = imageUrl ? { ...changes, gambar: imageUrl } : changes;
  const result = await (id
    ? supabase.from("spots").update(payload).eq("id", id).select("id").maybeSingle()
    : supabase.from("spots").insert(payload).select("id").single());

  if (result.error || !result.data) {
    if (newImagePath) await bucket.remove([newImagePath]);
    return { error: result.error?.code === "23505" ? "Kode lapak sudah digunakan." : "Lapak gagal disimpan. Coba lagi." };
  }

  revalidatePath("/admin/spots");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: id ? "Perubahan lapak tersimpan." : "Lapak baru tersimpan." };
}

export async function deleteSpot(id: string): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("spots").delete().eq("id", id).select("id").maybeSingle();
  if (error?.code === "23503") return { error: "Lapak punya riwayat sewa. Ubah status ke Pemeliharaan." };
  if (error || !data) return { error: "Lapak tidak dapat dihapus." };
  revalidatePath("/admin/spots");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: "Lapak dihapus." };
}

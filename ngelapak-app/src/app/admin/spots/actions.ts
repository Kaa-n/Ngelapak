"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/components/admin/ActionForm";
import { requireAdmin } from "@/lib/supabase/admin";
import { getUploadPath } from "@/lib/supabase/storage";
import { createServiceRoleClient } from "@/lib/supabase/service";

const defaultZoneLabels: Record<string, string> = {
  rektorat: "Lapangan Rektorat Jimbaran",
  boulevard: "Boulevard Kampus",
  sc: "Student Center",
  agrokompleks: "Agrokompleks Sudirman",
};

const inventory = z.object({
  kode: z.string().trim().min(1).max(40),
  nama: z.string().trim().min(1).max(120),
  lokasi: z.string().trim().min(1).max(180),
  zona: z.string().trim().min(1).max(60),
  zona_label: z.string().trim().max(120).optional(),
  ukuran: z.string().trim().min(1).max(40),
  tarif_per_hari: z.coerce.number().int().min(1).max(70_000_000),
  daya: z.coerce.number().int().min(0).max(100_000),
  status: z.enum(["tersedia", "pemeliharaan", "dipesan"]),
  deskripsi: z.string().trim().max(2000),
  koordinat_x: z.string().max(30).trim().optional(),
  koordinat_y: z.string().max(30).trim().optional(),
  existing_gambar: z.string().trim().optional(),
});

export async function saveSpot(id: string | null, _state: ActionState, data: FormData): Promise<ActionState> {
  const { supabase } = await requireAdmin();
  const rawData = Object.fromEntries(data);
  const parsed = inventory.safeParse(rawData);
  if (!parsed.success) {
    return { error: "Periksa kode, nama, lokasi, tarif, dan daya lapak." };
  }

  const { zona, zona_label, ukuran, koordinat_x, koordinat_y, status, existing_gambar, ...values } = parsed.data;
  const x = koordinat_x ? Number(koordinat_x) : null;
  const y = koordinat_y ? Number(koordinat_y) : null;
  if ((x === null) !== (y === null) || (x !== null && !Number.isFinite(x)) || (y !== null && !Number.isFinite(y))) {
    return { error: "Tentukan titik koordinat pada peta atau kosongkan." };
  }

  if (status === "dipesan") {
    if (!id) return { error: "Pilih status Tersedia atau Pemeliharaan." };
    const { data: current } = await supabase.from("spots").select("status").eq("id", id).maybeSingle();
    if (current?.status !== "dipesan") return { error: "Status lapak sudah berubah. Muat ulang halaman." };
  }

  // Parse fasilitas (bisa dari JSON string atau array)
  let fasilitas: string[] = [];
  const fasilitasRaw = data.get("fasilitas_json");
  if (typeof fasilitasRaw === "string" && fasilitasRaw.trim()) {
    try {
      const parsedFasilitas = JSON.parse(fasilitasRaw);
      if (Array.isArray(parsedFasilitas)) {
        fasilitas = parsedFasilitas.filter((f) => typeof f === "string" && f.trim().length > 0);
      }
    } catch {
      // Fallback split comma
      fasilitas = fasilitasRaw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else {
    fasilitas = data.getAll("fasilitas").map(String).filter(Boolean);
  }

  // Parse tags (bisa dari JSON string atau array)
  let tags: string[] = [];
  const tagsRaw = data.get("tags_json");
  if (typeof tagsRaw === "string" && tagsRaw.trim()) {
    try {
      const parsedTags = JSON.parse(tagsRaw);
      if (Array.isArray(parsedTags)) {
        tags = parsedTags.filter((t) => typeof t === "string" && t.trim().length > 0);
      }
    } catch {
      // Fallback split comma
      tags = tagsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  } else {
    tags = data.getAll("tags").map(String).filter(Boolean);
  }

  const resolvedZonaLabel = zona_label && zona_label.trim()
    ? zona_label.trim()
    : (defaultZoneLabels[zona] || zona.charAt(0).toUpperCase() + zona.slice(1));

  const resolvedUkuranLabel = ukuran.includes("x")
    ? ukuran.replace("x", " × ") + " m"
    : ukuran;

  const changes = {
    ...values,
    zona,
    zona_label: resolvedZonaLabel,
    ukuran,
    ukuran_label: resolvedUkuranLabel,
    status,
    fasilitas,
    tags,
    koordinat_x: x,
    koordinat_y: y,
  };

  const storageClient = createServiceRoleClient();
  const bucket = storageClient.storage.from("spot-images");
  const file = data.get("gambar");
  let newImagePath: string | undefined;
  let imageUrl: string | undefined = existing_gambar || undefined;

  if (file instanceof File && file.size > 0) {
    try {
      newImagePath = getUploadPath(file, ["image/jpeg", "image/png", "image/webp"]);
    } catch (error) {
      return { error: (error as Error).message };
    }

    const { error } = await bucket.upload(newImagePath, file, { upsert: true });
    if (error) return { error: `Foto gagal diunggah ke storage: ${error.message}` };
    imageUrl = bucket.getPublicUrl(newImagePath).data.publicUrl;
  }

  const payload = imageUrl ? { ...changes, gambar: imageUrl } : changes;
  const result = await (id
    ? supabase.from("spots").update(payload as any).eq("id", id).select("id").maybeSingle()
    : supabase.from("spots").insert(payload as any).select("id").single());

  if (result.error || !result.data) {
    if (newImagePath) await bucket.remove([newImagePath]);
    return {
      error:
        result.error?.code === "23505"
          ? "Kode lapak sudah digunakan."
          : `Lapak gagal disimpan: ${result.error?.message || "Coba lagi."}`,
    };
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

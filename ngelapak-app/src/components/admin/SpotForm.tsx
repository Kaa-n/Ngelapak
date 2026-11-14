import type { Database } from "@/types/database";
import { deleteSpot, saveSpot } from "@/app/admin/spots/actions";
import ActionForm from "./ActionForm";
import { inputClass } from "./styles";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

export default function SpotForm({ spot }: { spot?: Spot }) {
  return (
    <div className="space-y-4 pt-4">
      <ActionForm action={saveSpot.bind(null, spot?.id ?? null)} label={spot ? "Simpan perubahan" : "Tambah lapak"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">Kode
            <input className={inputClass} name="kode" defaultValue={spot?.kode} maxLength={40} required />
          </label>
          <label className="grid gap-1 text-sm">Nama lapak
            <input className={inputClass} name="nama" defaultValue={spot?.nama} maxLength={120} required />
          </label>
          <label className="grid gap-1 text-sm">Zona
            <select className={inputClass} name="zona" defaultValue={spot?.zona ?? "rektorat"}>
              <option value="rektorat">Rektorat</option><option value="boulevard">Boulevard</option>
              <option value="sc">Student Center</option><option value="agrokompleks">Agrokompleks</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Ukuran
            <select name="ukuran" className={inputClass} defaultValue={spot?.ukuran ?? "2x2"}>
              <option value="2x2">2 × 2 m</option><option value="3x3">3 × 3 m</option><option value="4x4">4 × 4 m</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Lokasi
            <input className={inputClass} name="lokasi" defaultValue={spot?.lokasi ?? ""} maxLength={180} required />
          </label>
          <label className="grid gap-1 text-sm">Status
            <select name="status" className={inputClass} defaultValue={spot?.status ?? "tersedia"}>
              {spot?.status === "dipesan" && <option value="dipesan">Dipesan (status saat ini)</option>}
              <option value="tersedia">Tersedia</option><option value="pemeliharaan">Pemeliharaan</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">Tarif per hari (Rp)
            <input className={inputClass} name="tarif_per_hari" type="number" min={1} max={70000000} defaultValue={spot?.tarif_per_hari} required />
          </label>
          <label className="grid gap-1 text-sm">Daya listrik (W)
            <input className={inputClass} name="daya" type="number" min={0} max={100000} defaultValue={spot?.daya ?? 0} required />
          </label>
          <label className="grid gap-1 text-sm">Koordinat X
            <input className={inputClass} name="koordinat_x" type="number" step="any" defaultValue={spot?.koordinat_x ?? ""} />
          </label>
          <label className="grid gap-1 text-sm">Koordinat Y
            <input className={inputClass} name="koordinat_y" type="number" step="any" defaultValue={spot?.koordinat_y ?? ""} />
          </label>
        </div>
        <label className="grid gap-1 text-sm">Deskripsi lokasi
          <textarea className={inputClass} name="deskripsi" defaultValue={spot?.deskripsi ?? ""} maxLength={2000} rows={2} />
        </label>
        <label className="grid gap-1 text-sm">Foto lapak (JPG, PNG, WebP, maks. 6 MB)
          <input className={inputClass} name="gambar" type="file" accept="image/jpeg,image/png,image/webp" />
        </label>
      </ActionForm>
      {spot && (
        <details className="border-t border-[#e2e7ff] pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-red-700">Hapus lapak</summary>
          <div className="mt-3">
            <ActionForm action={deleteSpot.bind(null, spot.id)} label="Konfirmasi hapus" danger>
              <p className="text-sm">Lapak akan dihapus dari inventaris dan katalog.</p>
            </ActionForm>
          </div>
        </details>
      )}
    </div>
  );
}

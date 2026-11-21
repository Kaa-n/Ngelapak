"use client";

import { useState, useTransition, useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react";
import type { Database } from "@/types/database";
import { deleteSpot, saveSpot } from "@/app/admin/spots/actions";
import { parseSpotImages } from "@/lib/mock-data";
import ActionForm from "./ActionForm";
import { inputClass } from "./styles";
import SpotMapPicker from "./SpotMapPicker";

type Spot = Database["public"]["Tables"]["spots"]["Row"];

const PRESET_ZONES: { id: string; label: string }[] = [
  { id: "rektorat", label: "Lapangan Rektorat Jimbaran" },
  { id: "boulevard", label: "Boulevard Kampus" },
  { id: "sc", label: "Student Center" },
  { id: "agrokompleks", label: "Agrokompleks Sudirman" },
];

const PRESET_FACILITIES = [
  "Listrik 450W",
  "Listrik 900W",
  "Listrik 1300W",
  "Air Bersih",
  "Kanopi Waterproof",
  "Paving Bersih",
  "Meja & Kursi",
  "Akses WiFi Kampus",
  "Dekat Toilet",
  "Dekat Parkir",
  "Keamanan CCTV",
  "Tempat Sampah Terpadu",
  "Ventilasi Terbuka",
];

const PRESET_TAGS = [
  "Ramai Mahasiswa",
  "Dekat Parkir",
  "Visibilitas Tinggi",
  "Strategis",
  "Dekat Kantin",
  "Dekat ATM",
  "Zona Kuliner",
  "Zona Merchandise",
  "Akses Kendaraan",
  "Teduh & Nyaman",
];

export default function SpotForm({ spot }: { spot?: Spot }) {
  // Koordinat
  const [coords, setCoords] = useState<{ x: number | null; y: number | null }>({
    x: spot?.koordinat_x != null ? Number(spot.koordinat_x) : 35,
    y: spot?.koordinat_y != null ? Number(spot.koordinat_y) : 25,
  });

  // Zona & Zona Label
  const initialZona = spot?.zona ?? "rektorat";
  const isCustomInitial =
    spot?.zona && !PRESET_ZONES.some((z) => z.id === spot.zona);

  const [selectedZona, setSelectedZona] = useState<string>(
    isCustomInitial ? "__custom__" : initialZona
  );
  const [customZonaCode, setCustomZonaCode] = useState<string>(
    isCustomInitial ? spot.zona : ""
  );
  const [zonaLabel, setZonaLabel] = useState<string>(
    spot?.zona_label ??
      PRESET_ZONES.find((z) => z.id === initialZona)?.label ??
      "Lapangan Rektorat Jimbaran"
  );

  function handleZonaChange(e: ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedZona(val);
    if (val !== "__custom__") {
      const found = PRESET_ZONES.find((z) => z.id === val);
      if (found) {
        setZonaLabel(found.label);
      }
    } else {
      setZonaLabel("");
    }
  }

  // Fasilitas
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>(() => {
    if (Array.isArray(spot?.fasilitas)) return spot.fasilitas;
    return ["Listrik 450W", "Kanopi Waterproof", "Paving Bersih"];
  });
  const [customFacilityInput, setCustomFacilityInput] = useState("");

  function toggleFacility(item: string) {
    setSelectedFacilities((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  }

  function addCustomFacility() {
    const trimmed = customFacilityInput.trim();
    if (trimmed && !selectedFacilities.includes(trimmed)) {
      setSelectedFacilities((prev) => [...prev, trimmed]);
      setCustomFacilityInput("");
    }
  }

  function handleFacilityKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomFacility();
    }
  }

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    if (Array.isArray(spot?.tags)) return spot.tags;
    return ["Ramai Mahasiswa", "Dekat Parkir"];
  });
  const [customTagInput, setCustomTagInput] = useState("");

  function toggleTag(item: string) {
    setSelectedTags((prev) =>
      prev.includes(item) ? prev.filter((t) => t !== item) : [...prev, item]
    );
  }

  function addCustomTag() {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setCustomTagInput("");
    }
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  }

  // Preview & Manajemen Foto Lapak (Maksimal 5 foto)
  const initialImages = parseSpotImages(spot?.gambar).list;
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [newFiles, setNewFiles] = useState<{ id: string; file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sinkronisasi file input dengan state newFiles via DataTransfer
  useEffect(() => {
    if (!fileInputRef.current) return;
    try {
      const dt = new DataTransfer();
      newFiles.forEach((item) => dt.items.add(item.file));
      fileInputRef.current.files = dt.files;
    } catch {
      // Fallback untuk browser yang membatasi manipulasi DataTransfer
    }
  }, [newFiles]);

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const remainingSlots = 5 - (existingImages.length + newFiles.length);
    if (remainingSlots <= 0) return;

    const toAdd = selected.slice(0, remainingSlots).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setNewFiles((prev) => [...prev, ...toAdd]);
    // Reset file input value agar event onChange tetap terpicu jika file yang sama dipilih ulang
    if (e.target) e.target.value = "";
  }

  function removeExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewFile(id: string) {
    setNewFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== id);
    });
  }

  // Ukuran custom / preset
  const [ukuran, setUkuran] = useState<string>(spot?.ukuran ?? "2x2");

  const effectiveZona =
    selectedZona === "__custom__"
      ? customZonaCode.toLowerCase().replace(/[^a-z0-9_-]/g, "")
      : selectedZona;

  return (
    <div className="space-y-6 pt-4">
      <ActionForm
        action={saveSpot.bind(null, spot?.id ?? null)}
        label={spot ? "Simpan Perubahan Lapak" : "Tambah Lapak Baru"}
      >
        {/* Hidden inputs untuk koordinat, fasilitas, tags, dan zona */}
        <input type="hidden" name="koordinat_x" value={coords.x ?? ""} />
        <input type="hidden" name="koordinat_y" value={coords.y ?? ""} />
        <input
          type="hidden"
          name="fasilitas_json"
          value={JSON.stringify(selectedFacilities)}
        />
        <input
          type="hidden"
          name="tags_json"
          value={JSON.stringify(selectedTags)}
        />
        <input type="hidden" name="zona" value={effectiveZona} />
        <input
          type="hidden"
          name="existing_gambar_json"
          value={JSON.stringify(existingImages)}
        />
        {existingImages[0] && (
          <input type="hidden" name="existing_gambar" value={existingImages[0]} />
        )}

        {/* ── BAGIAN 1: INFORMASI UTAMA LAPAK ── */}
        <div className="bg-[#faf8ff] p-4 sm:p-5 rounded-2xl border border-[#e2e7ff] space-y-4">
          <h3 className="font-bold text-sm text-[#003466] flex items-center gap-1.5 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">info</span>
            Identitas &amp; Spesifikasi Lapak
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Kode Lapak <span className="text-red-500">*</span>
              <input
                className={inputClass}
                name="kode"
                defaultValue={spot?.kode}
                maxLength={40}
                placeholder="Contoh: A-01 atau LAP-RKT-01"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Nama Lapak <span className="text-red-500">*</span>
              <input
                className={inputClass}
                name="nama"
                defaultValue={spot?.nama}
                maxLength={120}
                placeholder="Contoh: Spot Rektorat A-01"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Tarif per Hari (Rp) <span className="text-red-500">*</span>
              <input
                className={inputClass}
                name="tarif_per_hari"
                type="number"
                min={1}
                max={70000000}
                defaultValue={spot?.tarif_per_hari ?? 75000}
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Daya Listrik (Watt) <span className="text-red-500">*</span>
              <input
                className={inputClass}
                name="daya"
                type="number"
                min={0}
                max={100000}
                defaultValue={spot?.daya ?? 450}
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Ukuran Lapak <span className="text-red-500">*</span>
              <select
                name="ukuran"
                className={inputClass}
                value={ukuran}
                onChange={(e) => setUkuran(e.target.value)}
              >
                <option value="2x2">2 × 2 m (Standar Bazar)</option>
                <option value="3x3">3 × 3 m (Sedang)</option>
                <option value="4x4">4 × 4 m (Besar/VIP)</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Status Ketersediaan <span className="text-red-500">*</span>
              <select
                name="status"
                className={inputClass}
                defaultValue={spot?.status ?? "tersedia"}
              >
                {spot?.status === "dipesan" && (
                  <option value="dipesan">Sedang Beroperasi (Dipesan)</option>
                )}
                <option value="tersedia">Tersedia untuk Disewa</option>
                <option value="pemeliharaan">Dalam Pemeliharaan</option>
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
            Deskripsi Lokasi Lapak
            <textarea
              className={inputClass}
              name="deskripsi"
              defaultValue={spot?.deskripsi ?? ""}
              maxLength={2000}
              rows={2}
              placeholder="Deskripsikan keunggulan lokasi, posisi lapak terhadap fasilitas sekitar, dan rekomendasi jenis usaha..."
            />
          </label>
        </div>

        {/* ── BAGIAN 2: ZONA & ZONA LABEL (BISA DARI DAFTAR ATAU TAMBAH DAFTAR) ── */}
        <div className="bg-[#faf8ff] p-4 sm:p-5 rounded-2xl border border-[#e2e7ff] space-y-4">
          <h3 className="font-bold text-sm text-[#003466] flex items-center gap-1.5 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">category</span>
            Zona &amp; Label Lokasi
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Pilih Zona
              <select
                className={inputClass}
                value={selectedZona}
                onChange={handleZonaChange}
              >
                {PRESET_ZONES.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.label} ({z.id})
                  </option>
                ))}
                {isCustomInitial && (
                  <option value="__custom__">Zona Kustom ({spot?.zona})</option>
                )}
                <option value="__custom__">+ Tambah Daftar Zona Baru...</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
              Zona Label (Nama Tampilan Zona) <span className="text-red-500">*</span>
              <input
                className={inputClass}
                name="zona_label"
                value={zonaLabel}
                onChange={(e) => setZonaLabel(e.target.value)}
                maxLength={120}
                placeholder="Contoh: Lapangan Rektorat Jimbaran"
                required
              />
            </label>
          </div>

          {/* Form input jika memilih tambah zona baru */}
          {selectedZona === "__custom__" && (
            <div className="p-3 bg-white rounded-xl border border-[#003466]/20 space-y-2">
              <p className="text-xs font-semibold text-[#003466] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Konfigurasi Zona Baru
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-[#424750]">
                  Kode Zona Baru (huruf kecil &amp; tanda hubung saja)
                  <input
                    type="text"
                    className={inputClass}
                    value={customZonaCode}
                    onChange={(e) => setCustomZonaCode(e.target.value)}
                    placeholder="misal: teknik atau fk"
                    required
                  />
                </label>
                <div className="text-xs text-[#737781] flex items-center pt-4">
                  Zona baru akan otomatis terdaftar dan bisa dipilih untuk lapak lainnya.
                </div>
              </div>
            </div>
          )}

          <label className="grid gap-1 text-sm font-medium text-[#131b2e]">
            Alamat / Detail Lokasi <span className="text-red-500">*</span>
            <input
              className={inputClass}
              name="lokasi"
              defaultValue={spot?.lokasi ?? ""}
              maxLength={180}
              placeholder="Contoh: Lapangan Rektorat, Kampus Bukit Jimbaran"
              required
            />
          </label>
        </div>

        {/* ── BAGIAN 3: PEMASANG PIN KOORDINAT DI PETA INTERAKTIF ── */}
        <div className="bg-[#faf8ff] p-4 sm:p-5 rounded-2xl border border-[#e2e7ff] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-[#003466] flex items-center gap-1.5 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                Koordinat Spot (Pasang Pin di Peta)
              </h3>
              <p className="text-xs text-[#424750] mt-0.5">
                Klik langsung pada peta di bawah ini untuk menancapkan atau memindahkan posisi pin spot.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[#e2e7ff] text-xs font-mono font-bold text-[#003466]">
              <span>X: {coords.x ?? "—"}</span>
              <span className="text-gray-300">|</span>
              <span>Y: {coords.y ?? "—"}</span>
            </div>
          </div>

          <SpotMapPicker
            initialX={coords.x}
            initialY={coords.y}
            onChange={(c) => {
              setCoords({ x: c.x, y: c.y });
            }}
          />
        </div>

        {/* ── BAGIAN 4: FASILITAS (DARI DAFTAR ATAU KETIK KUSTOM) ── */}
        <div className="bg-[#faf8ff] p-4 sm:p-5 rounded-2xl border border-[#e2e7ff] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#003466] flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              Fasilitas Lapak
            </h3>
            <span className="text-xs text-[#737781]">
              {selectedFacilities.length} fasilitas terpilih
            </span>
          </div>

          <p className="text-xs text-[#424750]">
            Pilih fasilitas dari daftar yang tersedia, atau ketik fasilitas baru di bawah:
          </p>

          {/* Daftar fasilitas bawaan */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_FACILITIES.map((fac) => {
              const active = selectedFacilities.includes(fac);
              return (
                <button
                  key={fac}
                  type="button"
                  onClick={() => toggleFacility(fac)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-[#003466] text-white shadow-xs"
                      : "bg-white text-[#424750] border border-[#e2e7ff] hover:bg-[#eaedff]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {active ? "check" : "add"}
                  </span>
                  <span>{fac}</span>
                </button>
              );
            })}
          </div>

          {/* Input tambah fasilitas kustom */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={customFacilityInput}
              onChange={(e) => setCustomFacilityInput(e.target.value)}
              onKeyDown={handleFacilityKeyDown}
              placeholder="Ketik fasilitas lain (misal: Wastafel Portable)..."
              className={`${inputClass} text-xs py-2`}
            />
            <button
              type="button"
              onClick={addCustomFacility}
              className="px-4 py-2 rounded-lg bg-[#003466] text-white font-semibold text-xs hover:bg-[#004785] transition-colors shrink-0 cursor-pointer"
            >
              Tambah
            </button>
          </div>

          {/* Ringkasan fasilitas aktif */}
          {selectedFacilities.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-[#e2e7ff] space-y-1.5">
              <span className="text-[11px] font-bold text-[#737781] uppercase tracking-wide block">
                Fasilitas yang akan disimpan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedFacilities.map((fac) => (
                  <span
                    key={fac}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#eef2f9] text-[#003466] text-xs font-semibold"
                  >
                    <span>{fac}</span>
                    <button
                      type="button"
                      onClick={() => toggleFacility(fac)}
                      className="hover:text-red-600 cursor-pointer flex items-center"
                      title="Hapus fasilitas"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── BAGIAN 5: TAGS (DARI DAFTAR ATAU KETIK KUSTOM) ── */}
        <div className="bg-[#faf8ff] p-4 sm:p-5 rounded-2xl border border-[#e2e7ff] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#003466] flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">label</span>
              Tags Promosi &amp; Daya Tarik
            </h3>
            <span className="text-xs text-[#737781]">{selectedTags.length} tags terpilih</span>
          </div>

          <p className="text-xs text-[#424750]">
            Pilih tag dari rekomendasi atau ketik tag baru untuk meningkatkan visibilitas lapak:
          </p>

          {/* Daftar tags bawaan */}
          <div className="flex flex-wrap gap-1.5">
            {PRESET_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-[#855300] text-white shadow-xs"
                      : "bg-white text-[#424750] border border-[#e2e7ff] hover:bg-[#fff6ea]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {active ? "check" : "add"}
                  </span>
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>

          {/* Input tambah tag kustom */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Ketik tag baru (misal: Dekat Fakultas Kedokteran)..."
              className={`${inputClass} text-xs py-2`}
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="px-4 py-2 rounded-lg bg-[#855300] text-white font-semibold text-xs hover:bg-[#9e6300] transition-colors shrink-0 cursor-pointer"
            >
              Tambah
            </button>
          </div>

          {/* Ringkasan tags aktif */}
          {selectedTags.length > 0 && (
            <div className="p-3 bg-white rounded-xl border border-[#e2e7ff] space-y-1.5">
              <span className="text-[11px] font-bold text-[#737781] uppercase tracking-wide block">
                Tags yang akan disimpan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#fff6ea] text-[#855300] text-xs font-semibold"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:text-red-600 cursor-pointer flex items-center"
                      title="Hapus tag"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── BAGIAN 6: UPLOAD FOTO SPOT KE BUCKET STORAGE SUPABASE (MAKSIMAL 5 FOTO) ── */}
        <div className="bg-[#faf8ff] p-4 sm:p-5 rounded-2xl border border-[#e2e7ff] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#003466] flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
              Foto Lapak (Hingga 5 Foto di Supabase Storage &apos;spot-images&apos;)
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-[#e2e7ff] text-[#003466]">
              {existingImages.length + newFiles.length} / 5 Foto
            </span>
          </div>

          <p className="text-xs text-[#424750]">
            Unggah hingga 5 foto lapak dari berbagai sudut. Foto pertama akan menjadi sampul utama di kartu katalog.
          </p>

          {/* Grid Preview Foto Lapak */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Foto-foto existing */}
            {existingImages.map((url, idx) => (
              <div
                key={`existing-${idx}`}
                className="relative aspect-square rounded-xl bg-gray-100 border border-[#e2e7ff] overflow-hidden group shadow-xs"
              >
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                  {idx === 0 ? "Utama" : `#${idx + 1}`}
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingImage(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer shadow-sm"
                  title="Hapus foto ini"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}

            {/* Foto-foto baru yang dipilih */}
            {newFiles.map((item, idx) => {
              const displayIndex = existingImages.length + idx + 1;
              return (
                <div
                  key={item.id}
                  className="relative aspect-square rounded-xl bg-gray-100 border-2 border-dashed border-[#003466]/40 overflow-hidden group shadow-xs"
                >
                  <img
                    src={item.preview}
                    alt={`Foto Baru ${displayIndex}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#003466] text-white text-[10px] font-semibold">
                    {displayIndex === 1 ? "Utama (Baru)" : `Baru #${displayIndex}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeNewFile(item.id)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer shadow-sm"
                    title="Hapus foto baru ini"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              );
            })}

            {/* Tombol / Slot Tambah Foto jika belum mencapai 5 */}
            {existingImages.length + newFiles.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-[#c5cbe0] hover:border-[#003466] bg-white hover:bg-[#f2f3ff] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center">
                <span className="material-symbols-outlined text-[28px] text-[#003466]">add_photo_alternate</span>
                <span className="text-[11px] font-semibold text-[#003466]">Tambah Foto</span>
                <span className="text-[9px] text-[#737781]">JPG, PNG, WebP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Hidden input yang menampung file-file baru untuk form submission */}
          <input
            ref={fileInputRef}
            name="gambar"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <p className="text-[11px] text-[#737781]">
            Foto yang diunggah akan disimpan di bucket storage resmi Supabase &apos;spot-images&apos; dan otomatis ditampilkan dalam bentuk swipe carousel interaktif di halaman detail lapak.
          </p>
        </div>
      </ActionForm>

      {/* Tombol Hapus Lapak (Khusus saat mode edit) */}
      {spot && (
        <details className="border-t border-[#e2e7ff] pt-4">
          <summary className="cursor-pointer text-sm font-semibold text-red-700 hover:text-red-800 flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Hapus lapak dari inventaris
          </summary>
          <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <ActionForm
              action={deleteSpot.bind(null, spot.id)}
              label="Konfirmasi Hapus Lapak"
              danger
            >
              <p className="text-sm text-red-900">
                Peringatan: Lapak <strong>{spot.nama} ({spot.kode})</strong> akan dihapus permanen dari inventaris kampus dan katalog publik.
              </p>
            </ActionForm>
          </div>
        </details>
      )}
    </div>
  );
}

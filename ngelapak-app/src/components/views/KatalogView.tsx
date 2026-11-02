"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import SpotCard from "@/components/ui-custom/SpotCard";
const MapComponent = dynamic(
  () => import("@/components/home/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-xl bg-[#eaedff] flex items-center justify-center">
        <span className="text-sm text-[#424750]">
          Memuat peta...
        </span>
      </div>
    ),
  }
);
import { MOCK_SPOTS, ZONA_LABELS, ZONA_COUNTS } from "@/lib/mock-data";
import type { Spot } from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";
import { today } from "@/lib/demo-store";

type ZonaFilter = "all" | "rektorat" | "boulevard" | "sc" | "agrokompleks";
type UkuranFilter = "all" | "2x2" | "3x3" | "4x4";
type SortOption = "populer" | "harga-asc" | "harga-desc" | "terbaru";

interface KatalogViewProps {
  onNavigateToDetail: (spot: Spot) => void;
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
}

const ITEMS_PER_PAGE = 6;

export default function KatalogView({ onNavigateToDetail, onShowToast }: KatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [zonaFilter, setZonaFilter] = useState<ZonaFilter>("all");
  const [ukuranFilter, setUkuranFilter] = useState<UkuranFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("populer");
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set(["listrik"]));
  const [currentPage, setCurrentPage] = useState(1);
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState(today);
  const [isFiltering, setIsFiltering] = useState(false);
  const [mapPinHover, setMapPinHover] = useState<string | null>(null);

  const CHIP_OPTIONS = [
    { id: "listrik", label: "Listrik 450W+" },
    { id: "air", label: "Air Bersih" },
    { id: "kanopi", label: "Tenda Kanopi" },
    { id: "meja", label: "Meja & Kursi" },
    { id: "wifi", label: "WiFi Hotspot" },
  ];

  const toggleChip = useCallback((chipId: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) next.delete(chipId);
      else next.add(chipId);
      return next;
    });
  }, []);

  const filteredAndSorted = useMemo(() => {
    let spots = [...MOCK_SPOTS];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      spots = spots.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.kode.toLowerCase().includes(q) ||
          s.zonaLabel.toLowerCase().includes(q) ||
          s.lokasi.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Zona
    if (zonaFilter !== "all") {
      spots = spots.filter((s) => s.zona === zonaFilter);
    }

    // Ukuran
    if (ukuranFilter !== "all") {
      spots = spots.filter((s) => s.ukuran === ukuranFilter);
    }

    // Sort
    switch (sortBy) {
      case "harga-asc":
        spots.sort((a, b) => a.tarifPerHari - b.tarifPerHari);
        break;
      case "harga-desc":
        spots.sort((a, b) => b.tarifPerHari - a.tarifPerHari);
        break;
      case "terbaru":
        spots.sort((a, b) => parseInt(b.id.split("-")[1]) - parseInt(a.id.split("-")[1]));
        break;
      case "populer":
      default:
        spots.sort((a, b) => b.totalSewa - a.totalSewa);
        break;
    }

    return spots;
  }, [searchQuery, zonaFilter, ukuranFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedSpots = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApplyFilter = () => {
    setIsFiltering(true);
    setCurrentPage(1);
    setTimeout(() => {
      setIsFiltering(false);
      onShowToast({
        type: "success",
        message: `Filter diterapkan`,
        description: `Menampilkan ${filteredAndSorted.length} spot`,
      });
    }, 600);
  };

  const handleReset = () => {
    setSearchQuery("");
    setZonaFilter("all");
    setUkuranFilter("all");
    setSortBy("populer");
    setActiveChips(new Set(["listrik"]));
    setCurrentPage(1);
    setDateStart("2025-10-25");
    setDateEnd("2025-10-27");
  };

  const MAP_PINS = [
    { zona: "rektorat", label: "Zona A (Rektorat)", color: "#003466", bgColor: "#003466", icon: "store", x: "33%", y: "28%", spots: MOCK_SPOTS.filter(s => s.zona === "rektorat" && s.status === "tersedia").length },
    { zona: "boulevard", label: "Zona B (Boulevard)", color: "#855300", bgColor: "#855300", icon: "local_cafe", x: "62%", y: "45%", spots: MOCK_SPOTS.filter(s => s.zona === "boulevard" && s.status === "tersedia").length },
    { zona: "sc", label: "Zona C (SC)", color: "#003c27", bgColor: "#003c27", icon: "hub", x: "50%", y: "62%", spots: MOCK_SPOTS.filter(s => s.zona === "sc" && s.status === "tersedia").length },
    { zona: "agrokompleks", label: "Zona D (Agro)", color: "#424750", bgColor: "#424750", icon: "eco", x: "77%", y: "72%", spots: MOCK_SPOTS.filter(s => s.zona === "agrokompleks" && s.status === "tersedia").length },
  ];

  return (
    <div className="bg-[#faf8ff] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ========================================================
            HERO + FILTER CARD
            ======================================================== */}
        <div className="relative overflow-hidden rounded-2xl bg-[#f2f3ff] shadow-sm p-6 md:p-10 mb-8 border border-[#e2e7ff]">
          {/* Decorative blobs */}
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#d5e3ff] opacity-50 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-56 h-56 rounded-full bg-[#ffddb8] opacity-30 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#003466] text-[12px] font-semibold shadow-sm mb-4">
              <span className="material-symbols-outlined text-[14px] text-[#003466]">verified</span>
              <span>Katalog Resmi Sentra Usaha & Bazar Kampus Udayana</span>
            </div>
            <h1 className="text-[28px] md:text-[32px] font-bold text-[#131b2e] mb-3 leading-tight tracking-tight">
              Sewa Spot Usaha Strategis di Sekitar Kampus Udayana
            </h1>
            <p className="text-[15px] text-[#424750] max-w-2xl leading-relaxed">
              Temukan lapak temporer legal di Lapangan Rektorat, Gedung Agrokompleks, & Kampus Sudirman
              untuk bazar, pop-up kuliner, dan merchandise mahasiswa.
            </p>
          </div>

          {/* Filter Card */}
          <div className="mt-8 bg-white rounded-xl shadow-md p-5 md:p-6 relative z-10">
            <form
              onSubmit={(e) => { e.preventDefault(); handleApplyFilter(); }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                    Pencarian Lapak
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[#737781] text-[18px] pointer-events-none">
                      storefront
                    </span>
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full h-11 pl-10 pr-3 bg-[#f2f3ff] text-[#131b2e] placeholder:text-[#737781] text-[14px] rounded-lg shadow-sm outline-none focus:bg-white focus:shadow-md focus:ring-2 focus:ring-[#003466]/20 transition-all"
                      placeholder="Cari nama lapak atau area..."
                      type="text"
                    />
                  </div>
                </div>

                {/* Zona Dropdown */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                    Lokasi / Zona
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[#737781] text-[18px] pointer-events-none">
                      location_on
                    </span>
                    <select
                      value={zonaFilter}
                      onChange={(e) => { setZonaFilter(e.target.value as ZonaFilter); setCurrentPage(1); }}
                      className="w-full h-11 pl-10 pr-8 bg-[#f2f3ff] text-[#131b2e] text-[14px] rounded-lg shadow-sm outline-none appearance-none cursor-pointer focus:bg-white transition-all"
                    >
                      <option value="all">Semua Zona</option>
                      <option value="rektorat">Zona A – Lapangan Rektorat</option>
                      <option value="boulevard">Zona B – Boulevard Utama</option>
                      <option value="sc">Zona C – Plaza Student Center</option>
                      <option value="agrokompleks">Zona D – Agrokompleks Sudirman</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-[#737781] text-[16px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Ukuran */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                    Dimensi
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[#737781] text-[18px] pointer-events-none">
                      aspect_ratio
                    </span>
                    <select
                      value={ukuranFilter}
                      onChange={(e) => { setUkuranFilter(e.target.value as UkuranFilter); setCurrentPage(1); }}
                      className="w-full h-11 pl-10 pr-8 bg-[#f2f3ff] text-[#131b2e] text-[14px] rounded-lg shadow-sm outline-none appearance-none cursor-pointer focus:bg-white transition-all"
                    >
                      <option value="all">Semua Ukuran</option>
                      <option value="2x2">Standar (2×2m)</option>
                      <option value="3x3">Medium (3×3m)</option>
                      <option value="4x4">Gazebo Besar (4×4m)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 text-[#737781] text-[16px] pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Date Range */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                    Periode Sewa
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full h-11 px-2.5 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg shadow-sm outline-none cursor-pointer focus:bg-white transition-all"
                    />
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full h-11 px-2.5 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg shadow-sm outline-none cursor-pointer focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Chips & Action */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[#424750] font-semibold mr-1 flex items-center gap-1 uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[14px]">tune</span>
                    Fasilitas:
                  </span>
                  {CHIP_OPTIONS.map((chip) => {
                    const isActive = activeChips.has(chip.id);
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => toggleChip(chip.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-[12px] font-semibold shadow-sm transition-all flex items-center gap-1
                          ${isActive
                            ? "bg-[#003466] text-white"
                            : "bg-[#f2f3ff] text-[#424750] hover:bg-[#eaedff]"
                          }
                        `}
                      >
                        {isActive && (
                          <span className="material-symbols-outlined text-[12px]">check</span>
                        )}
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 self-end lg:self-center">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="h-10 px-4 rounded-lg text-[13px] font-semibold text-[#424750] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isFiltering}
                    className="h-10 px-5 rounded-lg bg-[#003466] text-white text-[13px] font-bold hover:bg-[#1a4b84] shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
                  >
                    {isFiltering ? (
                      <>
                        <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">filter_list</span>
                        <span>Terapkan Filter</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* ========================================================
            STATS BAR + ZONE TABS
            ======================================================== */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
              <h2 className="text-[15px] font-semibold text-[#131b2e]">
                Menampilkan{" "}
                <span className="text-[#003466] font-bold">
                  {filteredAndSorted.length} Spot
                  {zonaFilter !== "all" && ` di ${ZONA_LABELS[zonaFilter]?.split("–")[1]?.trim()}`}
                </span>
                {filteredAndSorted.some(s => s.status === "tersedia") && (
                  <span className="text-[#424750] font-normal">
                    {" "}({filteredAndSorted.filter(s => s.status === "tersedia").length} Tersedia)
                  </span>
                )}
              </h2>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-[#737781] uppercase tracking-wide font-medium">Urutkan:</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortOption); setCurrentPage(1); }}
                  className="h-9 pl-3 pr-8 bg-white text-[#131b2e] text-[13px] rounded-lg shadow-sm outline-none cursor-pointer focus:bg-[#f2f3ff] transition-all border border-[#e2e7ff]"
                >
                  <option value="populer">Paling Populer</option>
                  <option value="harga-asc">Harga Terendah</option>
                  <option value="harga-desc">Harga Tertinggi</option>
                  <option value="terbaru">Terbaru Ditambahkan</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1.5 text-[#737781] text-[16px] pointer-events-none">
                  unfold_more
                </span>
              </div>
            </div>
          </div>

          {/* Zone Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {(Object.keys(ZONA_COUNTS) as ZonaFilter[]).map((zona) => {
              const isActive = zonaFilter === zona;
              const count = ZONA_COUNTS[zona];
              const label = zona === "all" ? "Semua Spot" : ZONA_LABELS[zona]?.split("–")[1]?.trim() || zona;
              return (
                <button
                  key={zona}
                  onClick={() => { setZonaFilter(zona); setCurrentPage(1); }}
                  className={`
                    px-4 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap shadow-sm transition-all flex items-center gap-2
                    ${isActive
                      ? "bg-[#1a4b84] text-white"
                      : "bg-white text-[#424750] hover:bg-[#eaedff] hover:text-[#131b2e] border border-[#e2e7ff]"
                    }
                  `}
                >
                  <span>{label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-[#e2e7ff] text-[#424750]"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================
            SPOT GRID
            ======================================================== */}
        {isFiltering ? (
          /* Skeleton Loading */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-[#e2e7ff]">
                <div className="h-44 skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-2/3 skeleton" />
                  <div className="h-5 w-full skeleton" />
                  <div className="h-10 skeleton rounded-lg" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 skeleton rounded" />
                    <div className="h-5 w-20 skeleton rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 w-24 skeleton" />
                    <div className="h-9 w-24 skeleton rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#eaedff] flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[40px] text-[#424750]">search_off</span>
            </div>
            <h3 className="text-[18px] font-bold text-[#131b2e] mb-2">Tidak ada spot ditemukan</h3>
            <p className="text-[14px] text-[#424750] max-w-xs leading-relaxed mb-6">
              Coba ubah filter pencarian atau pilih zona yang berbeda.
            </p>
            <button
              onClick={handleReset}
              className="h-10 px-5 rounded-lg bg-[#003466] text-white text-[13px] font-semibold hover:bg-[#1a4b84] transition-all"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {paginatedSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} onViewDetail={onNavigateToDetail} />
            ))}
          </div>
        )}

        {/* ========================================================
            PETA SPASIAL KAMPUS
            ======================================================== */}
        {!isFiltering && filteredAndSorted.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm mb-10 flex flex-col lg:flex-row items-stretch gap-6 border border-[#e2e7ff]">
            
            {/* Informasi Zona */}
            <div className="lg:w-1/3 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#eaedff] text-[#003466] text-[12px] font-semibold mb-3">
                  <span className="material-symbols-outlined text-[14px]">
                    map
                  </span>
                  Peta Spasial Udayana
                </div>

                <h3 className="text-[20px] font-bold text-[#131b2e] mb-2 leading-snug">
                  Tinjau Sebaran Lapak di Kampus Jimbaran
                </h3>

                <p className="text-[14px] text-[#424750] leading-relaxed mb-5">
                  Pilih titik secara presisi berdekatan dengan pusat aktivitas
                  mahasiswa, gedung kuliah bersama, halte bus kampus, dan kantin
                  sentral.
                </p>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="w-full self-start">
            <MapComponent
                spots={MOCK_SPOTS}
                defaultStatus="tersedia"
                context="katalog"
                onSelectSpot={onNavigateToDetail}
              />
            </div>

          </div>
        )}

        {/* ========================================================
            PAGINATION
            ======================================================== */}
        {totalPages > 1 && !isFiltering && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8">
            <span className="text-[13px] text-[#424750]">
              Menampilkan{" "}
              <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSorted.length)}</strong>{" "}
              dari <strong>{filteredAndSorted.length}</strong> titik lapak
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#eaedff] text-[#424750] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#dae2fd] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-colors ${
                    currentPage === i + 1
                      ? "bg-[#003466] text-white shadow-sm"
                      : "bg-white text-[#424750] hover:bg-[#eaedff] border border-[#e2e7ff]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-9 px-3 flex items-center justify-center gap-1 rounded-lg bg-white text-[#131b2e] text-[13px] font-semibold hover:bg-[#eaedff] transition-colors border border-[#e2e7ff] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Berikutnya</span>
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full bg-white shadow-[0_-1px_8px_rgba(0,0,0,0.04)] mt-auto border-t border-[#e2e7ff]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#003466] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[16px]">storefront</span>
                </div>
                <span className="text-[#003466] font-bold text-[15px]">Ngelapak</span>
              </div>
              <p className="text-[13px] text-[#424750] mb-4 leading-relaxed">
                Platform marketplace tata kelola sewa titik dan lapak usaha temporer civitas akademika Universitas Udayana.
              </p>
              <div className="flex items-center gap-2 text-[#424750]">
                <span className="material-symbols-outlined text-[16px] text-[#4edea3]">verified</span>
                <span className="text-[11px]">Sistem Resmi Kampus Udayana</span>
              </div>
            </div>
            {[
              {
                title: "Zonasi Kampus",
                items: ["Kampus Bukit Jimbaran", "Kampus Sudirman Denpasar", "Plaza Fakultas Teknik", "Kantin & Selasar FEB"],
              },
              {
                title: "Layanan & Panduan",
                items: ["Prosedur Izin Usaha Mahasiswa", "Ketentuan Tarif & Kebersihan", "Verifikasi Rekening & Bukti Bayar", "Peta Spasial & Titik Lokasi"],
              },
              {
                title: "Pusat Bantuan",
                items: ["Biro Umum & Pengelolaan Aset", "aset.lapak@unud.ac.id", "(0361) 701954 ext. 202", "Senin–Jumat, 08.00–16.00 WITA"],
              },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="text-[14px] font-bold text-[#131b2e] mb-3">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item}>
                      <a href="#" className="text-[13px] text-[#424750] hover:text-[#003466] transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-[#e2e7ff] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-[#737781]">
              © 2025 Ngelapak – Universitas Udayana. Hak cipta dilindungi undang-undang.
            </p>
            <div className="flex items-center gap-4 text-[12px] text-[#737781]">
              <a href="#" className="hover:text-[#003466] transition-colors">Kebijakan Privasi</a>
              <a href="#" className="hover:text-[#003466] transition-colors">Syarat & Ketentuan</a>
              <a href="#" className="hover:text-[#003466] transition-colors">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

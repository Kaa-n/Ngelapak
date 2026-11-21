"use client";

import React from "react";
import FasilitasDropdown from "@/components/ui-custom/FasilitasDropdown";
import KatalogZoneTabs from "./KatalogZoneTabs";
import KatalogGrid from "./KatalogGrid";
import type { Spot } from "@/lib/mock-data";
import { minimumRentalStartDate } from "@/lib/rental-policy";

export type ZonaFilter = string;
export type UkuranFilter = "all" | "2x2" | "3x3" | "4x4";
export type SortOption = "populer" | "harga-asc" | "harga-desc" | "terbaru";

export interface ChipOption {
  id: string;
  label: string;
}

export const DEFAULT_CHIP_OPTIONS: ChipOption[] = [
  { id: "listrik", label: "Listrik 450W+" },
  { id: "air", label: "Air Bersih" },
  { id: "kanopi", label: "Tenda Kanopi" },
  { id: "meja", label: "Meja & Kursi" },
  { id: "wifi", label: "WiFi Hotspot" },
];

export interface KatalogHeroProps {
  // Search & Filters
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  zonaFilter: ZonaFilter;
  setZonaFilter: (val: ZonaFilter) => void;
  ukuranFilter: UkuranFilter;
  setUkuranFilter: (val: UkuranFilter) => void;
  dateStart: string;
  setDateStart: (val: string) => void;
  dateEnd: string;
  setDateEnd: (val: string) => void;
  activeChips: Set<string>;
  toggleChip: (chipId: string) => void;
  onResetChips?: () => void;
  isFiltering: boolean;
  onApplyFilter: () => void;
  onReset: () => void;
  chipOptions?: ChipOption[];
  allFacilityItems?: { id: string; label: string }[];
  availableZones?: { id: string; label: string }[];
  allSpots?: Spot[];

  // Tabs & Sorting
  totalCount: number;
  availableCount: number;
  customLokasi: string | null;
  setCustomLokasi: (val: string | null) => void;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
  onResetPage?: () => void;

  // Spot Grid & Pagination
  spots: Spot[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onNavigateToDetail: (spot: Spot) => void;
}

export default function KatalogHero({
  searchQuery,
  setSearchQuery,
  zonaFilter,
  setZonaFilter,
  ukuranFilter,
  setUkuranFilter,
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd,
  activeChips,
  toggleChip,
  onResetChips,
  isFiltering,
  onApplyFilter,
  onReset,
  chipOptions = DEFAULT_CHIP_OPTIONS,
  allFacilityItems,
  availableZones,
  allSpots,

  totalCount,
  availableCount,
  customLokasi,
  setCustomLokasi,
  sortBy,
  setSortBy,
  onResetPage,

  spots,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onNavigateToDetail,
}: KatalogHeroProps) {
  const minimumStart = minimumRentalStartDate();
  return (
    <div className="relative rounded-2xl bg-[#f2f3ff] shadow-sm p-6 md:p-10 mb-8 border border-[#e2e7ff]">
      {/* Decorative blobs wrapped in dedicated overflow-hidden container */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-[#d5e3ff] opacity-50 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-56 h-56 rounded-full bg-[#ffddb8] opacity-30 blur-2xl pointer-events-none" />
      </div>

      {/* 1. Hero Text Header */}
      <div className="relative z-10 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#003466] text-[12px] font-semibold shadow-sm mb-2">
          <span className="material-symbols-outlined text-[14px] text-[#003466]">verified</span>
          <span>Katalog Resmi Sentra Usaha & Bazar Kampus Udayana</span>
        </div>
        <h1 className="text-[28px] md:text-[32px] font-bold text-[#131b2e] mb-1 leading-tight tracking-tight">
          Sewa Spot Usaha Strategis di Sekitar Kampus Udayana
        </h1>
        <p className="text-[15px] text-[#424750] max-w-2xl leading-relaxed">
          Temukan lapak temporer legal di Lapangan Rektorat, Gedung Agrokompleks, & Kampus Sudirman
          untuk bazar, pop-up kuliner, dan merchandise mahasiswa.
        </p>
      </div>

      {/* 2. Button Pintasan: Jelajahi Peta Spasial */}
      <button
        type="button"
        onClick={() => {
          const el = document.getElementById("peta-spasial");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className="hidden md:flex absolute top-21 right-10 z-20 w-72 flex-col overflow-hidden rounded-xl border border-[#c9d6f5] shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group"
        aria-label="Jelajahi Peta Spasial"
      >
        <div className="relative w-full overflow-hidden" style={{ paddingBottom: "25%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image.png"
            alt="Peta Kampus Udayana"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70 saturate-[0.6]"
            draggable={false}
          />
          <div className="absolute inset-0 bg-[#dce8f8]/40 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#003466] text-[28px] drop-shadow group-hover:scale-110 transition-transform duration-200">
              explore
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-3 py-2 bg-white gap-1">
          <span className="text-[12px] font-semibold text-[#003466] leading-tight">
            Jelajahi Peta Spasial
          </span>
          <span className="material-symbols-outlined text-[14px] text-[#003466] opacity-70 group-hover:translate-x-0.5 transition-transform duration-200">
            east
          </span>
        </div>
      </button>

      {/* 3. Filter Card Form */}
      <div suppressHydrationWarning className="mt-4 bg-white rounded-xl shadow-md px-5 py-2 md:px-6 md:py-3 relative z-10 mb-6">
        <form
          suppressHydrationWarning
          onSubmit={(e) => {
            e.preventDefault();
            onApplyFilter();
          }}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input */}
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (onResetPage) onResetPage();
                  }}
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
                  onChange={(e) => {
                    setZonaFilter(e.target.value as ZonaFilter);
                    if (onResetPage) onResetPage();
                  }}
                  className="w-full h-11 pl-10 pr-8 bg-[#f2f3ff] text-[#131b2e] text-[14px] rounded-lg shadow-sm outline-none appearance-none cursor-pointer focus:bg-white transition-all"
                >
                  <option value="all">Semua Zona</option>
                  {availableZones && availableZones.length > 0 ? (
                    availableZones.map((z) => (
                      <option key={z.id} value={z.id}>{z.label}</option>
                    ))
                  ) : (
                    <>
                      <option value="rektorat">Zona A – Lapangan Rektorat</option>
                      <option value="boulevard">Zona B – Boulevard Utama</option>
                      <option value="sc">Zona C – Plaza Student Center</option>
                      <option value="agrokompleks">Zona D – Agrokompleks Sudirman</option>
                    </>
                  )}
                </select>
                <span className="material-symbols-outlined absolute right-3 text-[#737781] text-[16px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Ukuran Filter */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                Dimensi Lapak
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[#737781] text-[18px] pointer-events-none">
                  aspect_ratio
                </span>
                <select
                  value={ukuranFilter}
                  onChange={(e) => {
                    setUkuranFilter(e.target.value as UkuranFilter);
                    if (onResetPage) onResetPage();
                  }}
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
                  min={minimumStart}
                  onChange={(e) => {
                    const nextStart = e.target.value;
                    setDateStart(nextStart);
                    if (dateEnd < nextStart) setDateEnd(nextStart);
                  }}
                  className="w-full h-11 px-2.5 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg shadow-sm outline-none cursor-pointer focus:bg-white transition-all"
                />
                <input
                  type="date"
                  value={dateEnd}
                  min={dateStart || minimumStart}
                  onChange={(e) => setDateEnd(e.target.value < dateStart ? dateStart : e.target.value)}
                  className="w-full h-11 px-2.5 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg shadow-sm outline-none cursor-pointer focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Chips & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-[#424750] font-semibold mr-1 flex items-center gap-1 uppercase tracking-wide">
                <span className="material-symbols-outlined text-[14px]">tune</span>
                Fasilitas:
              </span>
              {chipOptions.map((chip) => {
                const isActive = activeChips.has(chip.id);
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => toggleChip(chip.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-semibold shadow-sm transition-all flex items-center gap-1 ${
                      isActive
                        ? "bg-[#003466] text-white"
                        : "bg-[#f2f3ff] text-[#424750] hover:bg-[#eaedff]"
                    }`}
                  >
                    {isActive && (
                      <span className="material-symbols-outlined !text-[11px]">check</span>
                    )}
                    {chip.label}
                  </button>
                );
              })}

              {/* Reusable FasilitasDropdown */}
              <FasilitasDropdown
                activeChips={activeChips}
                onToggleChip={toggleChip}
                onReset={onResetChips}
                items={allFacilityItems || chipOptions.map((c) => ({ id: c.id, label: c.label }))}
              />
            </div>

            <div className="flex items-center gap-3 self-end lg:self-center">
              <button
                type="button"
                onClick={onReset}
                className="h-10 px-4 rounded-lg text-[13px] font-semibold text-[#424750] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isFiltering}
                className="h-10 px-5 rounded-lg bg-[#003466] text-white text-[12px] font-bold hover:bg-[#1a4b84] shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isFiltering ? (
                  <>
                    <span className="material-symbols-outlined !text-[16px] animate-spin">refresh</span>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined !text-[16px]">filter_list</span>
                    <span>Terapkan Filter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 4. Stats Bar, Zone Tabs & Sort (Inside the Unified Card) */}
      <KatalogZoneTabs
        spots={allSpots || spots}
        totalCount={totalCount}
        availableCount={availableCount}
        zonaFilter={zonaFilter}
        setZonaFilter={setZonaFilter}
        customLokasi={customLokasi}
        setCustomLokasi={setCustomLokasi}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onResetPage={onResetPage}
      />

      {/* 5. Spot Grid & Pagination (Inside the Unified Card) */}
      <KatalogGrid
        spots={spots}
        totalFilteredCount={totalCount}
        isFiltering={isFiltering}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onNavigateToDetail={onNavigateToDetail}
        onReset={onReset}
      />
    </div>
  );
}

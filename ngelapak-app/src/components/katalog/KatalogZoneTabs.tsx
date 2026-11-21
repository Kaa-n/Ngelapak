"use client";

import React, { useMemo } from "react";
import LokasiDropdown, { LokasiItem } from "@/components/ui-custom/LokasiDropdown";
import { ZONA_LABELS, ZONA_COUNTS, type Spot } from "@/lib/mock-data";
import type { ZonaFilter } from "./KatalogHero";

export type SortOption = "populer" | "harga-asc" | "harga-desc" | "terbaru";

export interface KatalogZoneTabsProps {
  spots?: Spot[];
  totalCount: number;
  availableCount: number;
  zonaFilter: ZonaFilter;
  setZonaFilter: (val: ZonaFilter) => void;
  customLokasi: string | null;
  setCustomLokasi: (val: string | null) => void;
  sortBy: SortOption;
  setSortBy: (val: SortOption) => void;
  onResetPage?: () => void;
}

export default function KatalogZoneTabs({
  spots,
  totalCount,
  availableCount,
  zonaFilter,
  setZonaFilter,
  customLokasi,
  setCustomLokasi,
  sortBy,
  setSortBy,
  onResetPage,
}: KatalogZoneTabsProps) {
  // Hitung zona dan opsi lokasi langsung dari data database spots
  const { visibleZonas, extraLokasiOptions, zoneCounts, zoneLabels } = useMemo(() => {
    const counts: Record<string, number> = {};
    const labels: Record<string, string> = { ...ZONA_LABELS };

    if (spots && spots.length > 0) {
      counts.all = spots.length;
      for (const s of spots) {
        if (s.zona) {
          counts[s.zona] = (counts[s.zona] || 0) + 1;
          if (s.zonaLabel && !labels[s.zona]) {
            labels[s.zona] = s.zonaLabel;
          }
        }
      }
    } else {
      Object.assign(counts, ZONA_COUNTS);
    }

    const allZonas = Object.keys(counts).filter((z) => z !== "all");
    allZonas.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));

    const top2 = allZonas.slice(0, 2);
    const visible: ZonaFilter[] = ["all", ...top2];
    const hidden = allZonas.slice(2);

    // Opsi zona tambahan dari database untuk dropdown (filter berbasis zona)
    const options: LokasiItem[] = hidden.map((z) => ({
      id: z,
      label: labels[z]?.split("–")[1]?.trim() ?? labels[z] ?? z,
      zona: z,
    }));

    return {
      visibleZonas: visible,
      extraLokasiOptions: options,
      zoneCounts: counts,
      zoneLabels: labels,
    };
  }, [spots]);

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-2.5 mt-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]" />
        <h2 className="text-[15px] font-semibold text-[#131b2e]">
          Menampilkan{" "}
          <span className="text-[#003466] font-bold">
            {totalCount} Spot
            {customLokasi
              ? ` di ${customLokasi}`
              : zonaFilter !== "all"
                ? ` di ${zoneLabels[zonaFilter]?.split("–")[1]?.trim() ?? zoneLabels[zonaFilter] ?? zonaFilter}`
                : ""}
          </span>
          {availableCount > 0 && (
            <span className="text-[#424750] font-normal">
              {" "}({availableCount} Tersedia)
            </span>
          )}
        </h2>
      </div>

      {/* Tabs & Sort Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        {/* Zone Tabs */}
        <div className="flex items-center gap-2 flex-wrap pb-1 -mx-1 px-1">
          {visibleZonas.map((zona) => {
            const isActive = zonaFilter === zona;
            const count = zoneCounts[zona] ?? 0;
            const label =
              zona === "all"
                ? "Semua Lokasi"
                : zoneLabels[zona]?.split("–")[1]?.trim() || zoneLabels[zona] || zona;

            return (
              <button
                key={zona}
                type="button"
                onClick={() => {
                  setZonaFilter(zona);
                  setCustomLokasi(null);
                  if (onResetPage) onResetPage();
                }}
                className={`px-4 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-sm transition-all flex items-center gap-2 ${isActive
                  ? "bg-[#1a4b84] text-white"
                  : "bg-white text-[#424750] hover:bg-[#eaedff] hover:text-[#131b2e] border border-[#e2e7ff]"
                  }`}
              >
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-[#e2e7ff] text-[#424750]"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Reusable LokasiDropdown for "Lokasi Lainnya" (Zona Tambahan) */}
          <LokasiDropdown
            selectedLokasi={customLokasi}
            options={extraLokasiOptions}
            onSelect={(item) => {
              if (!item) {
                setCustomLokasi(null);
                setZonaFilter("all");
              } else {
                setCustomLokasi(item.label);
                setZonaFilter(item.zona || item.id);
              }

              if (onResetPage) onResetPage();
            }}
          />
        </div>

        {/* Sort Dropdown anchored on the far right */}
        <div className="flex items-center gap-2 self-end sm:self-auto ml-auto flex-shrink-0">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                if (onResetPage) onResetPage();
              }}
              className="h-9 pl-3 pr-8 bg-white text-[#131b2e] text-[11px] font-semibold rounded-lg shadow-sm outline-none cursor-pointer focus:bg-[#f2f3ff] transition-all border border-[#e2e7ff] appearance-none"
            >
              <option value="populer">Paling Populer</option>
              <option value="harga-asc">Harga Terendah</option>
              <option value="harga-desc">Harga Tertinggi</option>
              <option value="terbaru">Terbaru Ditambahkan</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1.5 text-[#737781] text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

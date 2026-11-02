"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { Spot } from "@/lib/mock-data";

// Import dinamis InteractiveMap dengan ssr: false karena Leaflet.js membutuhkan object window browser
const InteractiveMap = dynamic(
  () => import("@/components/ui-custom/InteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[440px] rounded-2xl bg-[#eaedff] flex flex-col items-center justify-center gap-2.5 border border-[#e2e7ff]">
        <span className="material-symbols-outlined text-[#003466] text-3xl animate-spin">
          progress_activity
        </span>
        <span className="text-xs sm:text-sm font-semibold text-[#003466]">
          Memuat Peta Spasial Kampus (Leaflet.js)...
        </span>
      </div>
    ),
  }
);

export interface MapComponentProps {
  /**
   * Data spot yang akan dipetakan.
   */
  spots?: Spot[];

  /**
   * Callback ketika pengguna mengklik salah satu pin lapak pada peta.
   */
  onSelectSpot?: (spot: Spot) => void;

  /**
   * Kelas styling tambahan untuk fleksibilitas pembungkus kontainer peta.
   */
  className?: string;

  /**
   * Status filter awal (default di Beranda / Home adalah "dipesan" / Sedang Beroperasi).
   */
  defaultStatus?: "dipesan" | "tersedia" | "all";
}


export default function MapComponent({
  spots,
  onSelectSpot,
  className = "",
  defaultStatus = "dipesan",
}: MapComponentProps) {
  return (
    <InteractiveMap
      spots={spots}
      defaultStatus={defaultStatus}
      context="home"
      onSelectSpot={onSelectSpot}
      className={className}
    />
  );
}

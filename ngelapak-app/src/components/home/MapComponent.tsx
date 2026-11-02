"use client";

import dynamic from "next/dynamic";
import type { Spot } from "@/lib/mock-data";

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
          Memuat Peta Spasial Kampus...
        </span>
      </div>
    ),
  }
);

export interface MapComponentProps {
  spots?: Spot[];
  onSelectSpot?: (spot: Spot) => void;
  className?: string;
  defaultStatus?: "dipesan" | "tersedia" | "all";
  context?: "home" | "katalog";
}

export default function MapComponent({
  spots = [],
  onSelectSpot,
  className = "",
  defaultStatus = "dipesan",
  context = "home",
}: MapComponentProps) {
  return (
    <div className={`w-full ${className}`}>
      <InteractiveMap
      spots={spots}
      defaultStatus={defaultStatus}
      onSelectSpot={onSelectSpot}
      className={className}
      />
    </div>
  );
}
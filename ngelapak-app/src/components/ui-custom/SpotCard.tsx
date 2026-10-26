"use client";

import { useState } from "react";
import type { Spot } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/mock-data";

interface SpotCardProps {
  spot: Spot;
  onViewDetail: (spot: Spot) => void;
}

const STATUS_CONFIG = {
  tersedia: {
    label: "Tersedia",
    bg: "bg-[#6ffbbe]",
    text: "text-[#002113]",
  },
  dipesan: {
    label: "Dipesan",
    bg: "bg-[#ffddb8]",
    text: "text-[#2a1700]",
  },
  pemeliharaan: {
    label: "Pemeliharaan",
    bg: "bg-[#e2e7ff]",
    text: "text-[#424750]",
  },
};

const ZONA_COLORS = {
  rektorat: "text-[#003466]",
  boulevard: "text-[#855300]",
  sc: "text-[#003c27]",
  agrokompleks: "text-[#424750]",
};

export default function SpotCard({ spot, onViewDetail }: SpotCardProps) {
  const [imgError, setImgError] = useState(false);
  const status = STATUS_CONFIG[spot.status];
  const zonaColor = ZONA_COLORS[spot.zona];

  const gradients = [
    "from-[#003466]/40 to-[#1a4b84]/30",
    "from-[#003c27]/40 to-[#005639]/30",
    "from-[#855300]/40 to-[#684000]/30",
    "from-[#131b2e]/50 to-[#283044]/40",
  ];
  const gradient = gradients[spot.id.charCodeAt(spot.id.length - 1) % gradients.length];

  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 cursor-pointer border border-[#e2e7ff]/60">
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden bg-[#eaedff]" onClick={() => onViewDetail(spot)}>
        {!imgError ? (
          <img
            src={spot.gambar}
            alt={spot.nama}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-white/40 text-[64px]">storefront</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Zone Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
          <span className="material-symbols-outlined text-[#003466] text-[14px]">pin_drop</span>
          <span className="text-[#003466] text-[12px] font-semibold">{spot.kode}</span>
        </div>

        {/* Status Badge */}
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full ${status.bg} ${status.text} text-[11px] font-bold uppercase tracking-wide shadow-sm`}>
          {status.label}
        </span>

        {/* Rating */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
          <span className="material-symbols-outlined text-[#fea619] text-[12px]">star</span>
          <span className="text-white text-[11px] font-semibold">{spot.rating}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between" onClick={() => onViewDetail(spot)}>
        <div>
          {/* Location */}
          <div className={`flex items-center gap-1 ${zonaColor} text-[12px] font-semibold mb-1`}>
            <span className="material-symbols-outlined text-[14px]">domain</span>
            <span className="truncate">{spot.zonaLabel}</span>
          </div>

          {/* Name */}
          <h3 className="text-[16px] font-bold text-[#131b2e] group-hover:text-[#003466] transition-colors line-clamp-1 mb-2.5 leading-snug">
            {spot.nama}
          </h3>

          {/* Specs Grid */}
          <div className="grid grid-cols-2 gap-1.5 mb-3 p-2.5 rounded-lg bg-[#f2f3ff] text-[12px] text-[#424750]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#003466]">aspect_ratio</span>
              <span>Ukuran: <strong className="text-[#131b2e]">{spot.ukuranLabel.split("(")[1]?.replace(")", "") || spot.ukuranLabel}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#003466]">bolt</span>
              <span>Daya: <strong className="text-[#131b2e]">{spot.daya}W</strong></span>
            </div>
          </div>

          {/* Facilities Tags */}
          <div className="flex flex-wrap gap-1 mb-3">
            {spot.fasilitas.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-[#eaedff] text-[#424750] text-[10px] font-medium"
              >
                {f}
              </span>
            ))}
            {spot.fasilitas.length > 3 && (
              <span className="px-2 py-0.5 rounded bg-[#eaedff] text-[#424750] text-[10px] font-medium">
                +{spot.fasilitas.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#e2e7ff] flex items-center justify-between gap-2">
          <div>
            <span className="block text-[10px] text-[#737781] leading-none font-medium uppercase tracking-wide">
              Tarif Sewa
            </span>
            <div className="text-[#131b2e] mt-1 text-[17px] font-bold leading-none">
              {formatRupiah(spot.tarifPerHari)}{" "}
              <span className="text-[11px] text-[#737781] font-normal">/ hari</span>
            </div>
          </div>

          {spot.status === "tersedia" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetail(spot); }}
              className="h-9 px-3.5 rounded-lg bg-[#003466] text-white text-[13px] font-semibold hover:bg-[#1a4b84] shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <span>Lihat Detail</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          ) : spot.status === "dipesan" ? (
            <button
              onClick={(e) => { e.stopPropagation(); onViewDetail(spot); }}
              className="h-9 px-3.5 rounded-lg bg-[#eaedff] text-[#424750] text-[13px] font-semibold hover:bg-[#e2e7ff] transition-all flex items-center gap-1.5"
            >
              <span>Cek Jadwal</span>
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            </button>
          ) : (
            <button
              disabled
              className="h-9 px-3.5 rounded-lg bg-[#e2e7ff] text-[#737781] text-[13px] font-semibold cursor-not-allowed flex items-center gap-1.5"
            >
              <span>Pemeliharaan</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

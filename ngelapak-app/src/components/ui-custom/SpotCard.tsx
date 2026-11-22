"use client";

import { useState } from "react";
import type { Spot } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/mock-data";

interface SpotCardProps {
  spot: Spot;
  onViewDetail: (spot: Spot, initialTab?: "detail" | "operasional" | "fasilitas" | "ulasan") => void;
  onViewProducts?: (spot: Spot) => void;
  variant?: "default" | "home";
  badgeText?: string;
  badgeColor?: { bg: string; text: string };
  scheduleDate?: string;
  initialTab?: "detail" | "operasional" | "fasilitas" | "ulasan";
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

export default function SpotCard({
  spot,
  onViewDetail,
  onViewProducts,
  variant = "default",
  badgeText,
  badgeColor,
  scheduleDate,
  initialTab,
}: SpotCardProps) {
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

  // Tampilan khusus Beranda
  if (variant === "home") {
    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-[#e2e7ff]/60 flex flex-col justify-between h-full">
        <div>
          {/* Image */}
          <div
            className="relative h-44 w-full overflow-hidden bg-[#eaedff] cursor-pointer group"
            onClick={() => onViewDetail(spot, initialTab ?? "operasional")}
          >
            {!imgError ? (
              <img
                src={spot.gambar}
                alt={spot.nama}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
              >
                <span className="material-symbols-outlined text-white/40 text-[64px]">
                  storefront
                </span>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {/* Kode Spot */}
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm">
              <span className="material-symbols-outlined text-[#003466] text-[14px]">
                pin_drop
              </span>
              <span className="text-[#003466] text-[12px] font-semibold">
                {spot.kode}
              </span>
            </div>

            {/* Badge Status Operasional */}
            {badgeText && (
              <span
                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full ${badgeColor?.bg ?? "bg-[#e2fced]"
                  } ${badgeColor?.text ?? "text-[#003c27]"
                  } text-[11px] font-bold tracking-wide shadow-sm flex items-center gap-1.5`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{badgeText}</span>
              </span>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Nama Lapak — hyperlink ke Lihat Detail */}
            <h3
              onClick={() => onViewDetail(spot, initialTab ?? "operasional")}
              className="text-[17px] font-bold text-[#131b2e] mb-1 leading-snug cursor-pointer hover:text-[#003466] hover:underline transition-colors group-hover/card:text-[#003466]"
            >
              {spot.nama}
            </h3>
            <button
              type="button"
              onClick={() => onViewDetail(spot, initialTab ?? "operasional")}
              className="inline-flex items-center gap-0.5 text-[11px] text-[#003466] font-semibold hover:underline mb-2 cursor-pointer"
            >
              <span>Lihat Detail</span>
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>

            {/* Lokasi */}
            <div className="flex items-start gap-1.5 text-[12px] text-[#424750] mb-2">
              <span className="material-symbols-outlined text-[16px] text-[#003466] shrink-0 mt-0.5">
                location_on
              </span>
              <span className="line-clamp-1">{spot.lokasi}</span>
            </div>

            {/* Deskripsi / Jenis Usaha */}
            <div className="flex items-center gap-1.5 text-[12px] text-[#424750] mb-3">
              <span className="material-symbols-outlined text-[16px] text-[#003466] shrink-0">
                restaurant
              </span>
              <span className="line-clamp-1">{spot.jenisUsaha || "Kuliner & Stan Mahasiswa"}</span>
            </div>

            {/* Informasi Tanggal Operasional */}
            {scheduleDate && (
              <div className="flex items-center gap-2 text-[12px] text-[#003466] font-semibold bg-[#eef2f9] px-2.5 py-1.5 rounded-lg mb-3 border border-[#d5e3ff]">
                <span className="material-symbols-outlined text-[16px] text-[#855300] shrink-0">
                  calendar_month
                </span>
                <span className="line-clamp-1">Jadwal: {scheduleDate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 pt-0">
          {/* Tombol CTA: Deskripsi Produk (jika tersedia) atau fallback Lihat Detail */}
          {onViewProducts ? (
            <button
              type="button"
              onClick={() => onViewProducts(spot)}
              className="w-full h-10 rounded-lg bg-[#003466] hover:bg-[#1a4b84] active:bg-[#002144] text-white text-[13px] font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>Deskripsi Produk</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onViewDetail(spot, initialTab ?? "operasional")}
              className="w-full h-10 rounded-lg bg-[#003466] hover:bg-[#1a4b84] active:bg-[#002144] text-white text-[13px] font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:shadow-md"
            >
              <span>Lihat Detail</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>
    );
  }

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

        {/* Active / Operating Badge */}
        {/* {spot.status === "dipesan" && (
          <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#002113]/85 text-[#6ffbbe] text-[11px] font-bold shadow-md backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              Sedang Beroperasi
            </span>
          </div>
        )} */}

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

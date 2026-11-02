"use client";

import React, { useState } from "react";
import type { Spot } from "@/lib/mock-data";
import { formatRupiah } from "@/lib/mock-data";

/** TIMPA SAJA NANTI DENGAN YANG LEAFLET.JS **/

export interface MapComponentProps {
  /**
   * Data spot yang akan dipetakan (opsional, fallback ke mock internal jika tidak dipass).
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
}


export default function MapComponent({
  spots = [],
  onSelectSpot,
  className = "",
}: MapComponentProps) {
  // State filter zona peta
  const [selectedZone, setSelectedZone] = useState<string>("all");
  // State pin yang sedang aktif di-hover atau diklik
  const [activePin, setActivePin] = useState<Spot | null>(null);

  // Zona-zona kampus Universitas Udayana
  const ZONES = [
    { id: "all", label: "Semua Kawasan", badge: "4 Zona" },
    { id: "rektorat", label: "Lapangan Rektorat", badge: "Zona A" },
    { id: "boulevard", label: "Boulevard Utama", badge: "Zona B" },
    { id: "sc", label: "Student Center", badge: "Zona C" },
    { id: "agrokompleks", label: "Agrokompleks Sudirman", badge: "Zona D" },
  ];


  const DEFAULT_MAP_PINS = [
    {
      id: "pin-rek-1",
      kode: "A-01",
      nama: "Spot Rektorat A-01",
      zona: "rektorat",
      lokasi: "Sisi Utara Lapangan Rektorat",
      status: "tersedia",
      tarif: 75000,
      x: "34%",
      y: "28%",
    },
    {
      id: "pin-rek-2",
      kode: "A-04",
      nama: "Spot Rektorat A-04",
      zona: "rektorat",
      lokasi: "Dekat Gazebo Rektorat",
      status: "tersedia",
      tarif: 120000,
      x: "42%",
      y: "32%",
    },
    {
      id: "pin-blv-1",
      kode: "B-02",
      nama: "Spot Kuliner Corner B-02",
      zona: "boulevard",
      lokasi: "Boulevard Gerbang Utama",
      status: "dipesan",
      tarif: 85000,
      x: "62%",
      y: "48%",
    },
    {
      id: "pin-sc-1",
      kode: "C-01",
      nama: "Spot Student Center C-01",
      zona: "sc",
      lokasi: "Plaza Utama Student Center",
      status: "tersedia",
      tarif: 110000,
      x: "50%",
      y: "65%",
    },
    {
      id: "pin-agro-1",
      kode: "D-03",
      nama: "Spot Agro Sudirman D-03",
      zona: "agrokompleks",
      lokasi: "Plaza Agrokompleks",
      status: "dipesan",
      tarif: 95000,
      x: "78%",
      y: "75%",
    },
  ];

  const filteredPins =
    selectedZone === "all"
      ? DEFAULT_MAP_PINS
      : DEFAULT_MAP_PINS.filter((p) => p.zona === selectedZone);

  return (
    <div
      className={`rounded-2xl bg-white border border-[#e2e7ff] shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* ========================================================
          HEADER KONTROL PETA
          ======================================================== */}
      <div className="p-4 sm:p-5 border-b border-[#e2e7ff] bg-[#faf8ff] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#003466] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">
              map
            </span>
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold text-[#131b2e] leading-tight">
              Peta Interaktif Sebaran Lapak Kampus
            </h4>
            <p className="text-xs text-[#424750]">
              Kampus Bukit Jimbaran &amp; Kampus Sudirman, Universitas Udayana
            </p>
          </div>
        </div>


        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ZONES.map((zone) => {
            const isActive = selectedZone === zone.id;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZone(zone.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${isActive
                    ? "bg-[#003466] text-white shadow-xs"
                    : "bg-white text-[#424750] border border-[#e2e7ff] hover:bg-[#eaedff] hover:text-[#003466]"
                  }`}
              >
                {zone.label}
              </button>
            );
          })}
        </div>
      </div>


      <div className="relative w-full h-[360px] sm:h-[420px] bg-[#eef2f9] overflow-hidden select-none">
        {/* Latar Grid Pola Kampus Simbolis */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#003466 1px, transparent 1px), radial-gradient(#fea619 1px, #eef2f9 1px)`,
            backgroundSize: "40px 40px",
            backgroundPosition: "0 0, 20px 20px",
          }}
        />

        {/* Garis Jalan Utama Kampus (Visual Mockup) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 50 400 Q 250 250 450 180 T 850 80"
            fill="none"
            stroke="#003466"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M 250 250 Q 350 350 650 380"
            fill="none"
            stroke="#855300"
            strokeWidth="8"
            strokeDasharray="6 6"
          />
        </svg>

        {/* Zona Label di Peta */}
        <div className="absolute top-6 left-8 bg-white/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-bold text-[#003466] shadow-xs pointer-events-none border border-white">
          Zona A — Lapangan Rektorat
        </div>
        <div className="absolute top-28 right-16 bg-white/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-bold text-[#855300] shadow-xs pointer-events-none border border-white">
          Zona B — Boulevard Utama
        </div>
        <div className="absolute bottom-16 left-1/3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-bold text-[#003c27] shadow-xs pointer-events-none border border-white">
          Zona C — Student Center
        </div>
        <div className="absolute bottom-8 right-12 bg-white/80 backdrop-blur-md px-3 py-1 rounded-md text-[11px] font-bold text-[#424750] shadow-xs pointer-events-none border border-white">
          Zona D — Agrokompleks
        </div>

        {/* Titik Pin Marker Interaktif */}
        {filteredPins.map((pin) => {
          const isOperated = pin.status === "dipesan";
          return (
            <div
              key={pin.id}
              style={{ left: pin.x, top: pin.y }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
            >
              {/* Pin Button */}
              <button
                type="button"
                onClick={() => {
                  const matched = spots.find((s) => s.kode === pin.kode);
                  if (matched && onSelectSpot) onSelectSpot(matched);
                }}
                onMouseEnter={() => {
                  const matched = spots.find((s) => s.kode === pin.kode);
                  setActivePin(
                    matched ||
                    ({
                      id: pin.id,
                      nama: pin.nama,
                      kode: pin.kode,
                      zona: pin.zona,
                      lokasi: pin.lokasi,
                      status: pin.status,
                      tarifPerHari: pin.tarif,
                    } as Spot)
                  );
                }}
                className={`relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg transition-transform duration-200 hover:scale-125 focus:outline-none ${isOperated
                    ? "bg-[#fea619] text-[#2a1700] ring-4 ring-[#fea619]/30"
                    : "bg-[#003466] text-white ring-4 ring-[#003466]/20"
                  }`}
                title={`${pin.nama} (${pin.kode})`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isOperated ? "storefront" : "pin_drop"}
                </span>

                {/* Pulsing indicator untuk lapak sedang beroperasi */}
                {isOperated && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fea619] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#fea619]" />
                  </span>
                )}
              </button>

              {/* Tooltip Card Mini saat Hover */}
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col bg-[#131b2e] text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap z-30 min-w-[160px]">
                <div className="font-bold flex items-center justify-between gap-2">
                  <span>{pin.nama}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${isOperated
                        ? "bg-[#fea619] text-[#2a1700]"
                        : "bg-[#4edea3] text-[#002113]"
                      }`}
                  >
                    {isOperated ? "Beroperasi" : "Tersedia"}
                  </span>
                </div>
                <span className="text-[#a6c8ff] text-[10px] mt-0.5">
                  {pin.lokasi}
                </span>
                <span className="text-white font-semibold text-[11px] mt-1">
                  {formatRupiah(pin.tarif)}
                  <span className="text-[#c3c6d1] font-normal text-[10px]">
                    /hari
                  </span>
                </span>
              </div>
            </div>
          );
        })}

        {/* Detail Card Pin Terpilih (Hover / Click Preview) */}
        {activePin && (
          <div className="absolute top-4 right-4 z-30 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-[#e2e7ff] text-xs max-w-[220px] transition-all">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-bold text-[#131b2e] truncate">{activePin.nama}</span>
              <button
                type="button"
                onClick={() => setActivePin(null)}
                className="text-[#737781] hover:text-[#131b2e] cursor-pointer"
                title="Tutup"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
            <p className="text-[11px] text-[#424750]">{activePin.lokasi}</p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="font-semibold text-[#003466]">
                {formatRupiah(activePin.tarifPerHari)}
                <span className="text-[10px] text-[#737781] font-normal">/hari</span>
              </span>
              <button
                type="button"
                onClick={() => onSelectSpot && onSelectSpot(activePin)}
                className="px-2.5 py-1 bg-[#003466] text-white rounded-md text-[10px] font-semibold hover:bg-[#1a4b84] cursor-pointer"
              >
                Lihat Detail
              </button>
            </div>
          </div>
        )}


        <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-xl shadow-md border border-[#e2e7ff]">
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#eaedff] text-[#003466] transition-colors"
            title="Perbesar Peta"
            onClick={() => { }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
          <div className="h-px bg-[#e2e7ff]" />
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#eaedff] text-[#003466] transition-colors"
            title="Perkecil Peta"
            onClick={() => { }}
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <div className="h-px bg-[#e2e7ff]" />
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#eaedff] text-[#003466] transition-colors"
            title="Pusatkan Ulang Peta"
            onClick={() => setSelectedZone("all")}
          >
            <span className="material-symbols-outlined text-[18px]">
              my_location
            </span>
          </button>
        </div>

        {/* Legend Peta di Pojok Kiri Bawah */}
        <div className="absolute left-4 bottom-4 z-20 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-[#e2e7ff] text-[11px] flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#131b2e] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fea619]" />
            <span>Sedang Beroperasi</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#131b2e] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#003466]" />
            <span>Tersedia untuk Disewa</span>
          </div>
        </div>
      </div>


      <div className="px-5 py-3 bg-[#f2f3ff] border-t border-[#e2e7ff] text-xs text-[#424750] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#003466]">
            info
          </span>
          Klik atau sentuh pin spot pada peta untuk melihat informasi ketersediaan
          dan mengajukan sewa.
        </span>
        <span className="text-[11px] text-[#737781]">
          Koordinat Kampus: -8.7983, 115.1706
        </span>
      </div>
    </div>
  );
}

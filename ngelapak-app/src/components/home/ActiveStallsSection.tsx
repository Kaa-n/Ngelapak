"use client";

import React, { useState } from "react";
import SpotCard from "@/components/ui-custom/SpotCard";
import MapComponent from "./MapComponent";
import { MOCK_SPOTS, type Spot } from "@/lib/mock-data";

export interface ActiveStallsSectionProps {
  /**
   * Data spot lapak yang sedang aktif / beroperasi.
   * Jika tidak disediakan, komponen akan menyaring dari MOCK_SPOTS.
   */
  spots?: Spot[];

  /**
   * Status simulasi pemuatan data (skeleton loading).
   */
  isLoading?: boolean;

  /**
   * Callback saat kartu lapak diklik untuk melihat rincian spot.
   */
  onViewDetail?: (spot: Spot) => void;

  /**
   * Callback untuk menavigasi ke KatalogView lengkap.
   */
  onNavigateToKatalog?: () => void;

  /**
   * Kelas styling tambahan opsional untuk penyesuaian container.
   */
  className?: string;
}

/**
 * Seksi "Lapak Sedang Beroperasi" (ActiveStallsSection)
 *
 * Menampilkan stan usaha mahasiswa dan UMKM binaan kampus yang sedang aktif beroperasi
 * di Universitas Udayana. Menggunakan struktur grid responsif yang persis sama dengan
 * KatalogView (1 kolom mobile, 2 kolom tablet, 3 kolom desktop), serta menyediakan
 * wadah khusus di bawah grid untuk pemanggilan komponen peta (`MapComponent`).
 */
export default function ActiveStallsSection({
  spots,
  isLoading = false,
  onViewDetail = () => { },
  onNavigateToKatalog,
  className = "",
}: ActiveStallsSectionProps) {
  // State filter tab zona aktif di seksi ini
  const [selectedZona, setSelectedZona] = useState<string>("all");

  // Filter default: ambil spot dengan status 'dipesan' (artinya sedang aktif beroperasi/disewa)
  // atau ambil 6 spot pertama sebagai demonstrasi prototype jika data spesifik belum ada
  // TODO (Tim Backend/Database):
  // Hubungkan query Supabase `select * from spots where status = 'beroperasi'` atau
  // berdasarkan tanggal booking aktif hari ini (today()).
  const allSpots = spots && spots.length > 0 ? spots : MOCK_SPOTS;
  const activeSpots = allSpots.filter(
    (s) => s.status === "dipesan" || s.status === "tersedia"
  );

  // Filter berdasarkan zona yang dipilih pengguna
  const displayedSpots =
    selectedZona === "all"
      ? activeSpots
      : activeSpots.filter((s) => s.zona === selectedZona);

  // Tab filter zona kampus
  const ZONA_TABS = [
    { id: "all", label: "Semua Zona" },
    { id: "rektorat", label: "Lapangan Rektorat" },
    { id: "boulevard", label: "Boulevard Utama" },
    { id: "sc", label: "Student Center" },
    { id: "agrokompleks", label: "Agrokompleks Sudirman" },
  ];

  return (
    <section aria-labelledby="active-stalls-heading" className={`w-full ${className}`}>
      {/* ========================================================
          HEADER SEKSI: "Lapak Sedang Beroperasi"
          ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          {/* Badge Indikator Operasional Real-time */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e2fced] text-[#003c27] text-xs font-semibold mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#005639]" />
            </span>
            <span>Operasional Hari Ini</span>
          </div>

          <h2
            id="active-stalls-heading"
            className="text-2xl sm:text-3xl font-bold text-[#131b2e] tracking-tight"
          >
            Lapak Sedang Beroperasi
          </h2>
          <p className="text-sm text-[#424750] mt-1 max-w-2xl">
            Daftar stan bazar kuliner, minuman, dan merchandise mahasiswa yang sedang
            buka dan melayani pengunjung di lingkungan Universitas Udayana.
          </p>
        </div>

        {/* Tombol pintasan ke Katalog Lengkap */}
        {onNavigateToKatalog && (
          <button
            type="button"
            onClick={onNavigateToKatalog}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#003466] hover:text-[#1a4b84] hover:underline self-start md:self-auto cursor-pointer"
          >
            <span>Lihat Semua Spot di Katalog</span>
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {/* ========================================================
          BAR FILTER TAB ZONA
          TODO (Tim Frontend): Tambahkan opsi filter waktu/kategori
          makanan & non-makanan jika ada kebutuhan survei pengguna.
          ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {ZONA_TABS.map((tab) => {
          const isActive = selectedZona === tab.id;
          const count =
            tab.id === "all"
              ? activeSpots.length
              : activeSpots.filter((s) => s.zona === tab.id).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedZona(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer ${isActive
                  ? "bg-[#003466] text-white shadow-xs"
                  : "bg-white text-[#424750] border border-[#e2e7ff] hover:bg-[#eaedff] hover:text-[#003466]"
                }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#e2e7ff] text-[#424750]"
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          GRID SPOT KARTU (PERSIS SAMA DENGAN STRUKTUR KATALOGVIEW)
          Struktur: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10
          ======================================================== */}
      {isLoading ? (
        /* SKELETON LOADING STATE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl overflow-hidden border border-[#e2e7ff] shadow-xs"
            >
              <div className="h-44 skeleton" />
              <div className="p-4 space-y-3">
                <div className="h-3 w-2/3 skeleton rounded" />
                <div className="h-5 w-full skeleton rounded" />
                <div className="h-10 skeleton rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 skeleton rounded" />
                  <div className="h-5 w-20 skeleton rounded" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 w-24 skeleton rounded" />
                  <div className="h-9 w-24 skeleton rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedSpots.length === 0 ? (
        /* EMPTY STATE */
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-[#e2e7ff] mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#eaedff] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px] text-[#424750]">
              storefront
            </span>
          </div>
          <h3 className="text-base md:text-lg font-bold text-[#131b2e] mb-1">
            Belum ada stan yang beroperasi di zona ini
          </h3>
          <p className="text-xs md:text-sm text-[#424750] max-w-sm mb-4">
            Silakan pilih zona lain atau kunjungi katalog untuk melihat seluruh spot
            yang tersedia untuk reservasi.
          </p>
          <button
            type="button"
            onClick={() => setSelectedZona("all")}
            className="h-9 px-4 rounded-lg bg-[#003466] text-white text-xs font-semibold hover:bg-[#1a4b84] transition-all cursor-pointer"
          >
            Tampilkan Semua Zona
          </button>
        </div>
      ) : (
        /* GRID KARTU LAPAK AKTIF */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {displayedSpots.slice(0, 6).map((spot) => (
            <div key={spot.id} className="relative group">
              {/* Badge khusus stan sedang beroperasi */}
              {spot.status === "dipesan" && (
                <div className="absolute top-3 left-3 z-20 pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#002113]/85 text-[#6ffbbe] text-[11px] font-bold shadow-md backdrop-blur-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
                    Sedang Beroperasi
                  </span>
                </div>
              )}

              {/* Komponen SpotCard standar (Re-used dari katalog) */}
              <SpotCard spot={spot} onViewDetail={onViewDetail} />
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          TEMPAT KHUSUS UNTUK PEMANGGILAN KOMPONEN PETA (MapComponent)
          ======================================================== */}
      <div className="mt-8 pt-8 border-t border-[#e2e7ff]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003466] uppercase tracking-wider mb-1">
              <span className="material-symbols-outlined text-[16px]">
                explore
              </span>
              <span>Pemetaan Geografis Kampus</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#131b2e] tracking-tight">
              Peta Lokasi &amp; Sebaran Spot Kampus
            </h3>
            <p className="text-xs sm:text-sm text-[#424750]">
              Visualisasi tata letak spasial zona lapak di sekitar Kampus Jimbaran &amp;
              Sudirman.
            </p>
          </div>

          {/* Status Gateway Peta */}
          <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#f2f3ff] border border-[#e2e7ff] text-xs text-[#003466] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            <span>Peta Spasial Aktif</span>
          </div>
        </div>

        {/* PEMANGGILAN KOMPONEN PETA (MapComponent) */}

        <MapComponent
          spots={allSpots}
          onSelectSpot={onViewDetail}
          className="mt-2"
        />
      </div>
    </section>
  );
}


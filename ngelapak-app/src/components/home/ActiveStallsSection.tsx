"use client";

import React, { useState } from "react";
import SpotCard from "@/components/ui-custom/SpotCard";
import LokasiDropdown, { LokasiItem } from "@/components/ui-custom/LokasiDropdown";
import MapComponent from "./MapComponent";
import {
  MOCK_SPOTS,
  MOCK_PRODUCTS,
  ZONA_LABELS,
  type Spot,
  type JadwalOperasionalItem,
} from "@/lib/mock-data";

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
  onViewDetail?: (
    spot: Spot,
    initialTab?: "detail" | "operasional" | "fasilitas" | "ulasan"
  ) => void;

  /**
   * Callback untuk menavigasi ke KatalogView lengkap.
   */
  onNavigateToKatalog?: () => void;

  /**
   * Kelas styling tambahan opsional untuk penyesuaian container.
   */
  className?: string;
}

const ITEMS_PER_PAGE = 6;

/**
 * Helper untuk memformat rentang tanggal jadwal operasional (misal "12 – 15 Nov 2026")
 */
function formatJadwalRange(startDateStr: string, endDateStr: string): string {
  try {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return `${startDateStr} – ${endDateStr}`;
    }
    const startDay = start.getDate();
    const startMonth = months[start.getMonth()];
    const startYear = start.getFullYear();

    const endDay = end.getDate();
    const endMonth = months[end.getMonth()];
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      if (startMonth === endMonth) {
        return `${startDay} – ${endDay} ${startMonth} ${startYear}`;
      }
      return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`;
  } catch {
    return `${startDateStr} – ${endDateStr}`;
  }
}

/**
 * Komponen Baris Pagination & Indikator Jumlah Titik Lapak
 * Menampilkan "Menampilkan X–Y dari Z titik lapak" dan tombol navigasi < 1 2 Berikutnya >
 */
function PaginationBar({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8 ${className}`}
    >
      <span className="text-[13px] text-[#424750]">
        Menampilkan <strong>{startItem}–{endItem}</strong> dari{" "}
        <strong>{totalItems}</strong> titik lapak
      </span>
      <div className="flex items-center gap-1.5">
        {/* Tombol Sebelumnya */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#eaedff] text-[#424750] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#dae2fd] transition-colors cursor-pointer"
          aria-label="Halaman sebelumnya"
        >
          <span className="material-symbols-outlined text-[18px]">
            chevron_left
          </span>
        </button>

        {/* Nomor Halaman */}
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPageChange(i + 1)}
            className={`h-9 w-9 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-colors cursor-pointer ${
              currentPage === i + 1
                ? "bg-[#003466] text-white shadow-sm"
                : "bg-white text-[#424750] hover:bg-[#eaedff] border border-[#e2e7ff]"
            }`}
          >
            {i + 1}
          </button>
        ))}

        {/* Tombol Berikutnya */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-9 px-3 flex items-center justify-center gap-1 rounded-lg bg-white text-[#131b2e] text-[13px] font-semibold hover:bg-[#eaedff] transition-colors border border-[#e2e7ff] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Berikutnya</span>
          <span className="material-symbols-outlined text-[16px]">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Seksi "Lapak Sedang Beroperasi" & "Operasional Mendatang" (ActiveStallsSection)
 *
 * Menampilkan stan usaha mahasiswa dan UMKM binaan kampus yang sedang aktif beroperasi
 * dan jadwal operasional mendatang di Universitas Udayana. Masing-masing seksi dilengkapi
 * filter lokasi mandiri dan kontrol pagination sesuai visual katalog.
 */
export default function ActiveStallsSection({
  spots,
  isLoading = false,
  onViewDetail = () => {},
  onNavigateToKatalog,
  className = "",
}: ActiveStallsSectionProps) {
  // ==========================================
  // STATE SEKSI: LAPAK SEDANG BEROPERASI
  // ==========================================
  const [activeZona, setActiveZona] = useState<string>("all");
  const [customActiveLokasi, setCustomActiveLokasi] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);

  // ==========================================
  // STATE SEKSI: OPERASIONAL MENDATANG
  // ==========================================
  const [upcomingZona, setUpcomingZona] = useState<string>("all");
  const [customUpcomingLokasi, setCustomUpcomingLokasi] = useState<string | null>(null);
  const [upcomingPage, setUpcomingPage] = useState<number>(1);

  // Modal rincian produk lapak
  const [selectedProductSpot, setSelectedProductSpot] = useState<Spot | null>(null);

  const allSpots = spots && spots.length > 0 ? spots : MOCK_SPOTS;

  // 1. Filter stan aktif beroperasi hari ini
  const activeSpots = allSpots.filter((s) => s.status === "dipesan");
  const displayedActiveSpots =
    activeZona === "all"
      ? activeSpots
      : activeZona === "custom" && customActiveLokasi
      ? activeSpots.filter((s) =>
          s.lokasi.toLowerCase().includes(customActiveLokasi.toLowerCase())
        )
      : activeSpots.filter((s) => s.zona === activeZona);

  const paginatedActiveSpots = displayedActiveSpots.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE
  );

  // 2. Filter spot dengan jadwal operasional mendatang (Upcoming)
  const upcomingSpots = allSpots
    .map((spot) => {
      const upcoming = spot.jadwalOperasional?.find((j) => j.status === "Upcoming");
      return upcoming ? { spot, upcoming } : null;
    })
    .filter(
      (item): item is { spot: Spot; upcoming: JadwalOperasionalItem } => item !== null
    );

  const displayedUpcomingSpots =
    upcomingZona === "all"
      ? upcomingSpots
      : upcomingZona === "custom" && customUpcomingLokasi
      ? upcomingSpots.filter((item) =>
          item.spot.lokasi.toLowerCase().includes(customUpcomingLokasi.toLowerCase())
        )
      : upcomingSpots.filter((item) => item.spot.zona === upcomingZona);

  const paginatedUpcomingSpots = displayedUpcomingSpots.slice(
    (upcomingPage - 1) * ITEMS_PER_PAGE,
    upcomingPage * ITEMS_PER_PAGE
  );

  // Zona kampus utama yang selalu tampil (Semua Lokasi + 2 zona teratas)
  const visibleZonas = ["all", "rektorat", "boulevard"] as const;

  // Opsi dropdown "Lokasi Lainnya" untuk seksi Lapak Sedang Beroperasi
  const extraActiveOptions: LokasiItem[] = [
    {
      id: "sc",
      label: ZONA_LABELS["sc"]?.split("–")[1]?.trim() ?? "Plaza Student Center",
      zona: "sc",
    },
    {
      id: "agrokompleks",
      label:
        ZONA_LABELS["agrokompleks"]?.split("–")[1]?.trim() ??
        "Agrokompleks Sudirman",
      zona: "agrokompleks",
    },
    { id: "kantin_teknik", label: "Kantin Fakultas Teknik" },
    { id: "halte_bus", label: "Halte Bus Kampus" },
    { id: "gedung_rektorat", label: "Depan Gedung Rektorat" },
  ];

  // Opsi dropdown "Lokasi Lainnya" untuk seksi Operasional Mendatang
  const extraUpcomingOptions: LokasiItem[] = [
    {
      id: "sc",
      label: ZONA_LABELS["sc"]?.split("–")[1]?.trim() ?? "Plaza Student Center",
      zona: "sc",
    },
    {
      id: "agrokompleks",
      label:
        ZONA_LABELS["agrokompleks"]?.split("–")[1]?.trim() ??
        "Agrokompleks Sudirman",
      zona: "agrokompleks",
    },
    { id: "kantin_teknik", label: "Kantin Fakultas Teknik" },
    { id: "halte_bus", label: "Halte Bus Kampus" },
    { id: "gedung_rektorat", label: "Depan Gedung Rektorat" },
  ];

  return (
    <section
      id="active-stalls-section"
      aria-labelledby="active-stalls-heading"
      className={`w-full ${className}`}
    >
      {/* ========================================================
          1. HEADER SEKSI: "Lapak Sedang Beroperasi"
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
          BAR FILTER TAB ZONA: LAPAK SEDANG BEROPERASI
          ======================================================== */}
      <div className="flex items-center gap-2 flex-wrap pb-1 -mx-1 px-1 mb-6">
        {visibleZonas.map((zona) => {
          const isActive = activeZona === zona && customActiveLokasi === null;
          const count =
            zona === "all"
              ? activeSpots.length
              : activeSpots.filter((s) => s.zona === zona).length;
          const label =
            zona === "all"
              ? "Semua Lokasi"
              : ZONA_LABELS[zona]?.split("–")[1]?.trim() || zona;

          return (
            <button
              key={zona}
              type="button"
              onClick={() => {
                setActiveZona(zona);
                setCustomActiveLokasi(null);
                setActivePage(1);
              }}
              className={`px-4 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                isActive
                  ? "bg-[#1a4b84] text-white"
                  : "bg-white text-[#424750] hover:bg-[#eaedff] hover:text-[#131b2e] border border-[#e2e7ff]"
              }`}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[#e2e7ff] text-[#424750]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}

        {/* Dropdown Lokasi Lainnya */}
        <LokasiDropdown
          selectedLokasi={customActiveLokasi}
          options={extraActiveOptions}
          onSelect={(item) => {
            setActivePage(1);
            if (!item) {
              setCustomActiveLokasi(null);
              setActiveZona("all");
            } else {
              setCustomActiveLokasi(item.label);
              if (item.zona) {
                setActiveZona(item.zona);
              } else {
                setActiveZona("custom");
              }
            }
          }}
        />
      </div>

      {/* ========================================================
          GRID SPOT KARTU: LAPAK SEDANG BEROPERASI
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
      ) : displayedActiveSpots.length === 0 ? (
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
            onClick={() => {
              setActiveZona("all");
              setCustomActiveLokasi(null);
              setActivePage(1);
            }}
            className="h-9 px-4 rounded-lg bg-[#003466] text-white text-xs font-semibold hover:bg-[#1a4b84] transition-all cursor-pointer"
          >
            Tampilkan Semua Zona
          </button>
        </div>
      ) : (
        /* GRID KARTU LAPAK AKTIF */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {paginatedActiveSpots.map((spot) => (
              <div key={spot.id} className="relative group">
                <SpotCard
                  spot={spot}
                  onViewDetail={onViewDetail}
                  onViewProducts={setSelectedProductSpot}
                  variant="home"
                  initialTab="operasional"
                  badgeText="Buka Hari Ini"
                  badgeColor={{ bg: "bg-[#e2fced]", text: "text-[#003c27]" }}
                />
              </div>
            ))}
          </div>

          {/* Pagination Bar Lapak Sedang Beroperasi */}
          <PaginationBar
            currentPage={activePage}
            totalItems={displayedActiveSpots.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setActivePage}
          />
        </div>
      )}

      {/* ========================================================
          2. SEKSI: "Operasional Mendatang"
          ======================================================== */}
      <div className="mt-8 pt-10 border-t border-[#e2e7ff]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            {/* Badge Indikator Operasional Mendatang */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff6ea] text-[#855300] text-xs font-semibold mb-2">
              <span className="material-symbols-outlined text-[15px]">
                event_upcoming
              </span>
              <span>Jadwal Terkonfirmasi</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-[#131b2e] tracking-tight">
              Operasional Mendatang
            </h3>
            <p className="text-sm text-[#424750] mt-1 max-w-2xl">
              Daftar stan bazar kuliner dan usaha mahasiswa yang telah terkonfirmasi
              dan segera buka dalam waktu dekat di lingkungan Universitas Udayana.
            </p>
          </div>
        </div>

        {/* ========================================================
            BAR FILTER TAB ZONA: OPERASIONAL MENDATANG
            ======================================================== */}
        <div className="flex items-center gap-2 flex-wrap pb-1 -mx-1 px-1 mb-6">
          {visibleZonas.map((zona) => {
            const isActive =
              upcomingZona === zona && customUpcomingLokasi === null;
            const count =
              zona === "all"
                ? upcomingSpots.length
                : upcomingSpots.filter((i) => i.spot.zona === zona).length;
            const label =
              zona === "all"
                ? "Semua Lokasi"
                : ZONA_LABELS[zona]?.split("–")[1]?.trim() || zona;

            return (
              <button
                key={zona}
                type="button"
                onClick={() => {
                  setUpcomingZona(zona);
                  setCustomUpcomingLokasi(null);
                  setUpcomingPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#1a4b84] text-white"
                    : "bg-white text-[#424750] hover:bg-[#eaedff] hover:text-[#131b2e] border border-[#e2e7ff]"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#e2e7ff] text-[#424750]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Dropdown Lokasi Lainnya untuk Operasional Mendatang */}
          <LokasiDropdown
            selectedLokasi={customUpcomingLokasi}
            options={extraUpcomingOptions}
            onSelect={(item) => {
              setUpcomingPage(1);
              if (!item) {
                setCustomUpcomingLokasi(null);
                setUpcomingZona("all");
              } else {
                setCustomUpcomingLokasi(item.label);
                if (item.zona) {
                  setUpcomingZona(item.zona);
                } else {
                  setUpcomingZona("custom");
                }
              }
            }}
          />
        </div>

        {displayedUpcomingSpots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-2xl border border-[#e2e7ff] mb-10">
            <div className="w-14 h-14 rounded-2xl bg-[#eaedff] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[28px] text-[#424750]">
                calendar_today
              </span>
            </div>
            <h4 className="text-base font-bold text-[#131b2e] mb-1">
              Belum ada jadwal operasional mendatang di zona ini
            </h4>
            <p className="text-xs md:text-sm text-[#424750] max-w-sm mb-4">
              Silakan pilih zona lain untuk melihat stan dan bazar yang akan hadir berikutnya.
            </p>
            <button
              type="button"
              onClick={() => {
                setUpcomingZona("all");
                setCustomUpcomingLokasi(null);
                setUpcomingPage(1);
              }}
              className="h-9 px-4 rounded-lg bg-[#003466] text-white text-xs font-semibold hover:bg-[#1a4b84] transition-all cursor-pointer"
            >
              Tampilkan Semua Zona
            </button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedUpcomingSpots.map(({ spot, upcoming }) => (
                <div key={`${spot.id}-${upcoming.id}`} className="relative group">
                  <SpotCard
                    spot={spot}
                    onViewDetail={onViewDetail}
                    onViewProducts={setSelectedProductSpot}
                    variant="home"
                    initialTab="operasional"
                    scheduleDate={formatJadwalRange(
                      upcoming.startDate,
                      upcoming.endDate
                    )}
                    badgeText="Segera Hadir"
                    badgeColor={{ bg: "bg-[#fff6ea]", text: "text-[#855300]" }}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Bar Operasional Mendatang */}
            <PaginationBar
              currentPage={upcomingPage}
              totalItems={displayedUpcomingSpots.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setUpcomingPage}
            />
          </div>
        )}
      </div>

      {/* ========================================================
          3. TEMPAT KHUSUS UNTUK PEMANGGILAN KOMPONEN PETA (MapComponent)
          ======================================================== */}
      <div id="peta-spasial" className="mt-8 pt-8 border-t border-[#e2e7ff]">
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
          onSelectSpot={(spot) => onViewDetail(spot, "operasional")}
          className="mt-2"
        />
      </div>

      {/* MODAL DOKUMEN INFORMASI & MENU LAPAK */}
      {selectedProductSpot && (() => {
        const activeJadwal =
          selectedProductSpot.jadwalOperasional?.find(
            (j) => j.status === "Active"
          ) || selectedProductSpot.jadwalOperasional?.[0];
        const penjualNama = activeJadwal?.penjual || selectedProductSpot.nama;
        const kategoriPenjual = activeJadwal?.kategori || "Wirausaha Kampus";
        const products = MOCK_PRODUCTS.filter(
          (product) => product.spotId === selectedProductSpot.id
        );

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[88vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#e2e7ff] overflow-hidden">
              {/* Header Modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e7ff] bg-[#faf8ff]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#003466] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="material-symbols-outlined text-[20px]">
                      description
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#003466] uppercase tracking-wider block">
                      Dokumen Informasi &amp; Menu Stan
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-[#131b2e] leading-snug">
                      {penjualNama} ({selectedProductSpot.kode})
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProductSpot(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-[#e2e7ff] text-[#424750] flex items-center justify-center transition-colors cursor-pointer border border-[#e2e7ff]"
                  aria-label="Tutup dokumen"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              </div>

              {/* Isi Lembar Dokumen Teks (Document Paper Layout) */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#131b2e] bg-[#faf8ff]/50">
                {/* Lembar Dokumen Kertas */}
                <div className="bg-white rounded-xl p-5 sm:p-7 border border-[#e2e7ff] shadow-xs space-y-6">
                  {/* Kop Dokumen */}
                  <div className="pb-4 border-b border-[#e2e7ff]">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e2fced] text-[#003c27] text-[11px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#005639]" />
                        Stan Beroperasi Hari Ini
                      </span>
                      <span className="text-[11px] text-[#737781] font-mono">
                        Titik: {selectedProductSpot.kode} • {selectedProductSpot.zonaLabel}
                      </span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-[#131b2e]">
                      {penjualNama}
                    </h4>
                    <p className="text-xs text-[#424750] mt-0.5">
                      {selectedProductSpot.lokasi} • Pengelola: <strong>{kategoriPenjual}</strong>
                    </p>
                  </div>

                  {/* 1. Deskripsi Usaha dari Pemilik Lapak */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#003466] flex items-center gap-1.5 mb-2">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Tentang Stan &amp; Sambutan Pemilik
                    </h5>
                    <div className="bg-[#f2f3ff] rounded-xl p-4 text-[13px] text-[#424750] leading-relaxed border border-[#e2e7ff]">
                      <p>
                        {selectedProductSpot.deskripsi ||
                          `Selamat datang di stan ${penjualNama}! Kami hadir di ${selectedProductSpot.lokasi} menyajikan aneka sajian kuliner dan minuman segar berkualitas dengan harga ramah kantong civitas akademika Universitas Udayana. Semua produk dipersiapkan setiap hari dengan standar higienis dan porsi memuaskan.`}
                      </p>
                    </div>
                  </div>

                  {/* 2. Daftar Menu & Rincian Harga (Teks Dokumen Menu) */}
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#003466] flex items-center gap-1.5 mb-3">
                      <span className="material-symbols-outlined text-[16px]">restaurant_menu</span>
                      Daftar Menu &amp; Rincian Harga
                    </h5>

                    {products.length > 0 ? (
                      <div className="divide-y divide-[#e2e7ff] border border-[#e2e7ff] rounded-xl overflow-hidden">
                        {products.map((item, idx) => (
                          <div
                            key={item.id}
                            className="p-3.5 sm:p-4 bg-white hover:bg-[#faf8ff] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#737781] font-mono">
                                  {(idx + 1).toString().padStart(2, "0")}.
                                </span>
                                <span className="text-[13px] font-bold text-[#131b2e]">
                                  {item.nama}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eaedff] text-[#003466] font-semibold">
                                  {item.kategori}
                                </span>
                              </div>
                              <p className="text-xs text-[#737781] pl-6">
                                {item.deskripsi}
                              </p>
                            </div>

                            <span className="text-sm font-bold text-[#003466] sm:text-right shrink-0 pl-6 sm:pl-0">
                              Rp {item.harga.toLocaleString("id-ID")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-[#e2e7ff] bg-white text-xs text-[#424750] space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-[#f2f3ff]">
                          <span className="font-semibold">• Menu Reguler Harian Stan</span>
                          <span className="font-bold text-[#003466]">Mulai Rp 15.000</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-[#f2f3ff]">
                          <span className="font-semibold">• Aneka Minuman Dingin &amp; Hangat</span>
                          <span className="font-bold text-[#003466]">Mulai Rp 5.000</span>
                        </div>
                        <p className="text-[11px] text-[#737781] italic pt-1">
                          * Silakan langsung kunjungi stan di lokasi untuk melihat varian menu harian selengkapnya.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 3. Catatan Operasional & Layanan Pemilik */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#fff6ea] border border-[#ffddb8] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#855300]">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        Jam Operasional Stan
                      </div>
                      <p className="text-xs text-[#424750]">
                        Buka pukul <strong>08.30 – 17.00 WITA</strong> (Senin s/d Jumat selama kegiatan perkuliahan).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#eef2f9] border border-[#d5e3ff] space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#003466]">
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        Metode Pembayaran
                      </div>
                      <p className="text-xs text-[#424750]">
                        Menerima <strong>QRIS</strong> (BCA, Mandiri, GoPay, OVO, ShopeePay) &amp; Uang Tunai.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f2f3ff] border border-[#e2e7ff] space-y-1 sm:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#003466]">
                        <span className="material-symbols-outlined text-[16px]">moped</span>
                        Pesan Antar &amp; Kontak Pemesanan
                      </div>
                      <p className="text-xs text-[#424750]">
                        Melayani pemesanan langsung di stan dan pesan antar (delivery) ke gedung fakultas sekitar. Untuk pemesanan dalam jumlah banyak, silakan hubungi kontak stan di <strong>0812-3456-7890 (WhatsApp)</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Footer Dokumen */}
                  <div className="pt-3 border-t border-[#e2e7ff] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#737781]">
                    <span>Dokumen Resmi Informasi Stan Ngelapak</span>
                    <span className="inline-flex items-center gap-1 text-[#005639] font-medium">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      Izin Resmi Biro Pengelolaan Aset Universitas Udayana
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-4 border-t border-[#e2e7ff] bg-white flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedProductSpot(null)}
                  className="h-10 px-6 rounded-lg bg-[#003466] text-white text-sm font-semibold hover:bg-[#1a4b84] transition-colors cursor-pointer shadow-xs"
                >
                  Tutup Dokumen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

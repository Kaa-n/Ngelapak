"use client";

import React, { useState, useMemo, useEffect, useLayoutEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MOCK_SPOTS, formatRupiah, type Spot } from "@/lib/mock-data";
import { minimumRentalStartDate } from "@/lib/rental-policy";
import { getSupabaseSpots } from "@/lib/supabase/spots";

export interface InteractiveMapProps {
  /**
   * Data spot yang akan dipetakan.
   * Jika tidak diberikan, default mengambil seluruh data dari MOCK_SPOTS.
   */
  spots?: Spot[];
  /** Availability for the selected rental period; operating status stays based on today. */
  availabilitySpots?: Spot[];

  /**
   * Filter status awal/default pada peta:
   * - "dipesan": Sedang Beroperasi (Default untuk Halaman Home)
   * - "tersedia": Tersedia untuk Disewa (Default untuk Halaman Jelajah Lapak)
   * - "all": Tampilkan semua status
   */
  defaultStatus?: "dipesan" | "tersedia" | "all";

  /**
   * Filter zona awal/default (misal: "all", "rektorat", "boulevard", "sc", "agrokompleks").
   */
  defaultZone?: string;

  /**
   * Apakah bilah filter (status & zona) ditampilkan di atas peta? (default: true)
   */
  showFilters?: boolean;

  /**
   * Apakah legenda penanda (Beroperasi vs Tersedia) ditampilkan di pojok peta? (default: true)
   */
  showLegend?: boolean;

  /**
   * Callback ketika tombol 'Lihat Detail' atau aksi pada popup spot diklik.
   */
  onSelectSpot?: (spot: Spot) => void;

  /**
   * Kelas styling tambahan untuk container peta.
   */
  className?: string;

  /**
   * Konteks penggunaan peta ("home" | "katalog" | "detail").
   */
  context?: "home" | "katalog" | "detail";

  /** Rental period used to calculate availability when the rentable tab is selected. */
  rentalPeriod?: { start: string; end: string };
  onRentalPeriodChange?: (period: { start: string; end: string }) => void;
}

/**
 * Ikon Google Maps multi-color SVG resmi
 */
function GoogleMapsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2C10.48 2 6 6.48 6 12c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10Z"
        fill="#EA4335"
      />
      <path
        d="M16 2c-5.52 0-10 4.48-10 10 0 2.5 1 4.9 2.5 6.8L16 12V2Z"
        fill="#4285F4"
      />
      <path
        d="M8.5 18.8C10.2 21.2 13 25 16 30V24c-3.1 0-5.6-2.1-7.5-5.2Z"
        fill="#34A853"
      />
      <path
        d="M8.5 18.8 16 12v12c-3.1 0-5.6-2.1-7.5-5.2Z"
        fill="#FBBC04"
      />
      <circle cx="16" cy="12" r="4" fill="#FFFFFF" />
      <circle cx="16" cy="12" r="2" fill="#4285F4" />
    </svg>
  );
}

/**
 * Helper Sub-Komponen untuk mengontrol perpindahan koordinat peta (flyTo)
 * saat pengguna memilih zona kampus tertentu.
 */
function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function TouchGestureController() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        map.dragging.enable();
      } else {
        map.dragging.disable();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) {
        map.dragging.disable();
      }
    };

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
      capture: true,
    });
    container.addEventListener("touchend", handleTouchEnd, {
      passive: true,
      capture: true,
    });
    container.addEventListener("touchcancel", handleTouchEnd, {
      passive: true,
      capture: true,
    });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart, true);
      container.removeEventListener("touchend", handleTouchEnd, true);
      container.removeEventListener("touchcancel", handleTouchEnd, true);
    };
  }, [map]);

  return null;
}

/**
 * Konfigurasi pusat koordinat & level zoom per zona kampus Universitas Udayana.
 */
const ZONE_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  all: { center: [-8.796, 115.176], zoom: 16 },
  rektorat: { center: [-8.798, 115.173], zoom: 17 },
  boulevard: { center: [-8.796, 115.178], zoom: 17 },
  sc: { center: [-8.794, 115.176], zoom: 17 },
  agrokompleks: { center: [-8.791, 115.181], zoom: 17 },
};

/**
 * Menghitung koordinat latitude/longitude dari representasi spasial (x, y).
 */
const getSpotLatLng = (spot: Spot): [number, number] => {
  const y = spot.koordinat?.y ?? 50;
  const x = spot.koordinat?.x ?? 50;
  return [-8.796 + (y - 50) * 0.0002, 115.176 + (x - 50) * 0.0002];
};

/**
 * Membuat custom Leaflet divIcon sesuai penanda visual Home:
 * - Sedang Beroperasi (dipesan): Amber #fea619 dengan ikon storefront & efek pulse ping radar.
 * - Tersedia untuk Disewa (tersedia): Navy #003466 dengan ikon pin_drop.
 * - Pemeliharaan: Abu-abu #737781 dengan ikon build.
 */
const createMarkerIcon = (status: "tersedia" | "dipesan" | "pemeliharaan") => {
  const isOperated = status === "dipesan";
  const isMaintenance = status === "pemeliharaan";

  let bgClass = "bg-[#003466] text-white ring-4 ring-[#003466]/25";
  let iconName = "pin_drop";

  if (isOperated) {
    bgClass = "bg-[#fea619] text-[#2a1700] ring-4 ring-[#fea619]/40";
    iconName = "storefront";
  } else if (isMaintenance) {
    bgClass = "bg-[#737781] text-white ring-4 ring-[#737781]/25";
    iconName = "build";
  }

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full ${bgClass} shadow-lg transition-transform duration-200 hover:scale-125 cursor-pointer">
        <span class="material-symbols-outlined" style="font-size: 18px; line-height: 1; user-select: none;">${iconName}</span>
        ${
          isOperated
            ? `<span class="absolute -top-1 -right-1 flex h-3 w-3">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fea619] opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-3 w-3 bg-[#fea619]"></span>
               </span>`
            : ""
        }
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

/**
 * Komponen Peta Interaktif Leaflet (InteractiveMap)
 *
 * Mendukung filter status dan zona sesuai kebutuhan:
 * - Di Home: Default status adalah "Sedang Beroperasi" (dipesan)
 * - Di Jelajah Lapak: Default status adalah "Tersedia untuk Disewa" (tersedia)
 * - Penanda marker disesuaikan persis dengan gaya penanda Home Ngelapak
 */
export default function InteractiveMap({
  spots = MOCK_SPOTS,
  availabilitySpots,
  defaultStatus = "tersedia",
  defaultZone = "all",
  showFilters = true,
  showLegend = true,
  onSelectSpot,
  className = "",
  context,
  rentalPeriod,
  onRentalPeriodChange,
}: InteractiveMapProps) {
  // State filter interaktif (utamakan aksi klik pengguna, fallback ke prop default)
  const [userStatusFilter, setUserStatusFilter] = useState<
    "dipesan" | "tersedia" | "all" | null
  >(null);
  const [userZoneFilter, setUserZoneFilter] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [localPeriod, setLocalPeriod] = useState(() => {
    const start = minimumRentalStartDate();
    return { start, end: start };
  });
  const [localAvailabilitySpots, setLocalAvailabilitySpots] = useState<Spot[] | null>(null);

  useLayoutEffect(() => {
    // Next.js keeps hidden routes mounted, but React Leaflet removes the map
    // in its effect cleanup. Remount the canvas when the route is shown again.
    return () => setMapKey((key) => key + 1);
  }, []);

  const statusFilter = userStatusFilter ?? defaultStatus;
  const selectedZone = userZoneFilter ?? defaultZone;

  const isSingleSpot = spots.length === 1 || context === "detail";
  const shouldShowFilters = showFilters && !isSingleSpot;
  const shouldShowLegend = showLegend && !isSingleSpot;
  const minimumStart = minimumRentalStartDate();
  const mapStart = rentalPeriod?.start || localPeriod.start;
  const mapEnd = rentalPeriod?.end || localPeriod.end;
  const availabilitySource = availabilitySpots ?? localAvailabilitySpots ?? spots;

  function updateRentalPeriod(start: string, end: string) {
    const next = { start, end: end < start ? start : end };
    setLocalPeriod(next);
    onRentalPeriodChange?.(next);
  }

  useEffect(() => {
    if (statusFilter !== "tersedia" || availabilitySpots) return;
    let active = true;
    void getSupabaseSpots(localPeriod).then((result) => {
      if (active) setLocalAvailabilitySpots(result.spots);
    }).catch(() => {
      if (active) setLocalAvailabilitySpots(null);
    });
    return () => { active = false; };
  }, [availabilitySpots, localPeriod, statusFilter]);

  // Tab Zona Kampus
  const ZONES = [
    { id: "all", label: "Semua Kawasan" },
    { id: "rektorat", label: "Lapangan Rektorat" },
    { id: "boulevard", label: "Boulevard Utama" },
    { id: "sc", label: "Student Center" },
    { id: "agrokompleks", label: "Agrokompleks Sudirman" },
  ];

  // Hitung jumlah spot per status untuk label badge
  const counts = useMemo(() => {
    const zoneFiltered =
      selectedZone === "all"
        ? spots
        : spots.filter((s) => s.zona === selectedZone);

    return {
      total: zoneFiltered.length,
      dipesan: zoneFiltered.filter((s) => s.status === "dipesan").length,
      tersedia: availabilitySource.filter((s) =>
        (selectedZone === "all" || s.zona === selectedZone) && s.status === "tersedia",
      ).length,
    };
  }, [availabilitySource, spots, selectedZone]);

  // Filter spot yang akan digambar di peta
  const filteredSpots = useMemo(() => {
    if (isSingleSpot) return spots;

    const availabilityById = new Map(availabilitySource.map((spot) => [spot.id, spot]));
    return spots.flatMap((spot) => {
      // Filter Zona
      const matchesZone = selectedZone === "all" || spot.zona === selectedZone;
      // Filter Status
      const availability = availabilityById.get(spot.id);
      const effectiveStatus = statusFilter === "tersedia" ? availability?.status ?? spot.status : spot.status;
      const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;

      return matchesZone && matchesStatus ? [{ ...spot, status: effectiveStatus }] : [];
    });
  }, [availabilitySource, spots, selectedZone, statusFilter, isSingleSpot]);

  // Tentukan pusat koordinat kamera peta
  const activeCenter = useMemo(() => {
    if (spots.length === 1) {
      return { center: getSpotLatLng(spots[0]), zoom: 17 };
    }
    return ZONE_CENTERS[selectedZone] || ZONE_CENTERS.all;
  }, [spots, selectedZone]);

  return (
    <div
      className={`relative isolate rounded-2xl bg-white border border-[#e2e7ff] shadow-sm overflow-hidden flex flex-col ${className}`}
      style={{ isolation: "isolate" }}
    >
      {/* ========================================================
          FILTER & KONTROL BAR PETA (SESUAI MAPS HOME)
          ======================================================== */}
      {shouldShowFilters && (
        <div className="relative z-[100] shrink-0 p-4 sm:p-5 border-b border-[#e2e7ff] bg-[#faf8ff] flex flex-col gap-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Header info */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#003466] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-[20px]">
                  map
                </span>
              </div>
              <div>
                <h4 className="text-sm md:text-base font-bold text-[#131b2e] leading-tight">
                  Peta Spasial &amp; Titik Lapak Kampus
                </h4>
                <p className="text-xs text-[#424750]">
                  {context === "home"
                    ? "Memantau stan operasional & titik sewa di sekitar kampus"
                    : "Pilih titik lokasi strategis sesuai preferensi usahamu"}
                </p>
              </div>
            </div>

            {/* Filter Status Utama (Sedang Beroperasi vs Tersedia untuk Disewa vs Semua) */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#e2e7ff] self-start lg:self-auto shadow-xs">
              {/* Tab Sedang Beroperasi */}
              <button
                type="button"
                onClick={() => setUserStatusFilter("dipesan")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  statusFilter === "dipesan"
                    ? "bg-[#fea619] text-[#2a1700] shadow-xs"
                    : "text-[#424750] hover:text-[#131b2e] hover:bg-[#f2f3ff]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#855300]" />
                <span>Sedang Beroperasi</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === "dipesan"
                      ? "bg-black/15 text-[#2a1700]"
                      : "bg-[#e2e7ff] text-[#424750]"
                  }`}
                >
                  {counts.dipesan}
                </span>
              </button>

              {/* Tab Tersedia untuk Disewa */}
              <button
                type="button"
                onClick={() => setUserStatusFilter("tersedia")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  statusFilter === "tersedia"
                    ? "bg-[#003466] text-white shadow-xs"
                    : "text-[#424750] hover:text-[#131b2e] hover:bg-[#f2f3ff]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                <span>Tersedia untuk Disewa</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === "tersedia"
                      ? "bg-white/20 text-white"
                      : "bg-[#e2e7ff] text-[#424750]"
                  }`}
                >
                  {counts.tersedia}
                </span>
              </button>

              {/* Tab Semua Status */}
              <button
                type="button"
                onClick={() => setUserStatusFilter("all")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-[#131b2e] text-white shadow-xs"
                    : "text-[#737781] hover:text-[#131b2e] hover:bg-[#f2f3ff]"
                }`}
              >
                <span>Semua</span>
                <span className="ml-1 text-[10px] font-bold">({counts.total})</span>
              </button>
            </div>
          </div>

          {/* Baris Filter Zona Kampus */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-[#737781] uppercase tracking-wide mr-1 shrink-0">
              Zona:
            </span>
            {ZONES.map((zone) => {
              const isActive = selectedZone === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setUserZoneFilter(zone.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#003466] text-white shadow-xs font-semibold"
                      : "bg-white text-[#424750] border border-[#e2e7ff] hover:bg-[#eaedff] hover:text-[#003466]"
                  }`}
                >
                  {zone.label}
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================
          KANVAS PETA LEAFLET
          ======================================================== */}
      <div className="relative z-0 shrink-0 w-full h-[400px] sm:h-[440px] bg-[#eef2f9] overflow-hidden">
        <MapContainer
          key={mapKey}
          center={activeCenter.center}
          zoom={activeCenter.zoom}
          scrollWheelZoom={false}
          touchZoom={true}
          dragging={true}
          className="w-full h-full"
        >

        <TouchGestureController />

          {/* Tile Layer OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Pengontrol Dinamis Posisi Peta */}
          <MapController
            center={activeCenter.center}
            zoom={activeCenter.zoom}
          />

          {/* Marker Titik Lapak */}
          {filteredSpots.map((spot) => {
            const position = getSpotLatLng(spot);
            const icon = createMarkerIcon(spot.status);

            return (
              <Marker key={spot.id} position={position} icon={icon}>
                <Popup className="custom-leaflet-popup">
                  <div className="p-3.5 min-w-[240px] max-w-[290px]">
                    {/* Header Popup */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-[#737781] uppercase tracking-wide">
                        {spot.zonaLabel} ({spot.kode})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          spot.status === "dipesan"
                            ? "bg-[#fea619] text-[#2a1700]"
                            : spot.status === "tersedia"
                            ? "bg-[#6ffbbe] text-[#002113]"
                            : "bg-[#e2e7ff] text-[#424750]"
                        }`}
                      >
                        {spot.status === "dipesan"
                          ? "Sedang Beroperasi"
                          : spot.status === "tersedia"
                          ? "Tersedia"
                          : "Pemeliharaan"}
                      </span>
                    </div>

                    {/* Nama Spot */}
                    <h4 className="text-sm font-bold text-[#131b2e] leading-snug mb-1">
                      {spot.nama}
                    </h4>

                    {/* Lokasi */}
                    <p className="text-xs text-[#424750] line-clamp-2 mb-2.5">
                      {spot.lokasi}
                    </p>

                    {/* Tarif & Tombol Aksi */}
                    <div className="pt-2 border-t border-[#e2e7ff] flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-[#737781] block">Tarif</span>
                        <span className="text-xs font-bold text-[#003466]">
                          {formatRupiah(spot.tarifPerHari)}
                          <span className="text-[10px] text-[#737781] font-normal">
                            /hari
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Tombol Google Maps Berdasarkan Koordinat Spasial */}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${position[0].toFixed(6)},${position[1].toFixed(6)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka rute di Google Maps"
                          aria-label={`Buka lokasi ${spot.nama} di Google Maps`}
                          className="h-8 w-8 rounded-lg bg-white hover:bg-[#eaedff] active:bg-[#d5e3ff] border border-[#e2e7ff] hover:border-[#4285F4]/50 flex items-center justify-center transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs group shrink-0"
                        >
                          <GoogleMapsIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </a>

                        {/* Tombol Lihat Detail */}
                        {onSelectSpot && (
                          <button
                            type="button"
                            onClick={() => onSelectSpot(spot)}
                            className="h-8 px-2.5 rounded-lg bg-[#003466] hover:bg-[#1a4b84] active:bg-[#002144] text-white text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 shadow-xs hover:shadow-sm shrink-0"
                          >
                            <span>Lihat Detail</span>
                            <span className="material-symbols-outlined text-[14px]">
                              arrow_forward
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Informasi jika tidak ada titik yang cocok dengan filter */}
        {filteredSpots.length === 0 && (
          <div className="absolute inset-x-4 top-4 z-[1000] flex justify-center pointer-events-none">
            <div className="bg-[#131b2e]/90 backdrop-blur-md text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-2 pointer-events-auto">
              <span className="material-symbols-outlined text-[16px] text-[#fea619]">
                info
              </span>
              <span>Tidak ada titik lapak dengan kombinasi filter ini.</span>
              <button
                type="button"
                onClick={() => {
                  setUserStatusFilter("all");
                  setUserZoneFilter("all");
                }}
                className="underline text-[#a6c8ff] hover:text-white font-semibold ml-1 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          </div>
        )}

        {/* Legenda Penanda Peta di Pojok Kiri Bawah */}
        {shouldShowLegend && (
          <div className="absolute left-3 bottom-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-[#e2e7ff] text-[11px] flex flex-wrap items-center gap-3.5">
            <div className="flex items-center gap-1.5 text-[#131b2e] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fea619] ring-2 ring-[#fea619]/30" />
              <span>Sedang Beroperasi</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#131b2e] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#003466] ring-2 ring-[#003466]/30" />
              <span>Tersedia untuk Disewa</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          FOOTER INFORMASI PETA
          ======================================================== */}
      <div className="px-5 py-2.5 bg-[#f2f3ff] border-t border-[#e2e7ff] text-xs text-[#424750] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-[#003466]">
            touch_app
          </span>
          Klik penanda ikon pada peta untuk melihat info lengkap dan membuka reservasi.
        </span>
        <span className="text-[11px] text-[#737781] font-mono">
          Menampilkan {filteredSpots.length} dari {spots.length} titik lapak
        </span>
      </div>

      {statusFilter === "tersedia" && !isSingleSpot && (
        <div className="border-t border-[#e2e7ff] bg-white px-5 py-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#424750]">
            Periode Sewa untuk Cek Ketersediaan
          </p>
          <div className="grid max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs text-[#424750]">
              Tanggal mulai
              <input type="date" value={mapStart} min={minimumStart}
                onChange={(event) => updateRentalPeriod(event.target.value, mapEnd)}
                className="mt-1 h-10 w-full rounded-lg bg-[#f8f9ff] px-2.5 text-sm outline-none ring-1 ring-[#d7def5] focus:ring-2 focus:ring-[#003466]/20" />
            </label>
            <label className="text-xs text-[#424750]">
              Tanggal selesai
              <input type="date" value={mapEnd} min={mapStart || minimumStart}
                onChange={(event) => updateRentalPeriod(mapStart, event.target.value)}
                className="mt-1 h-10 w-full rounded-lg bg-[#f8f9ff] px-2.5 text-sm outline-none ring-1 ring-[#d7def5] focus:ring-2 focus:ring-[#003466]/20" />
            </label>
          </div>
          <p className="mt-2 text-[11px] text-[#737781]">Pemesanan tersedia mulai H+2; tanggal selesai tidak dapat mendahului tanggal mulai.</p>
        </div>
      )}
    </div>
  );
}

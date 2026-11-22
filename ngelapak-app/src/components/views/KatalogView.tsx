"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { KatalogHero } from "@/components/katalog";
import type { ZonaFilter, UkuranFilter, SortOption } from "@/components/katalog";
import { MOCK_SPOTS, type Spot } from "@/lib/mock-data";
import { getSupabaseSpots } from "@/lib/supabase/spots";
import type { ToastMessage } from "@/lib/types";
import { minimumRentalStartDate, rentalDateInMakassar } from "@/lib/rental-policy";

const InteractiveMap = dynamic(
  () => import("@/components/ui-custom/InteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-xl bg-[#eaedff] flex items-center justify-center">
        <span className="text-sm text-[#424750]">Memuat peta...</span>
      </div>
    ),
  }
);

interface KatalogViewProps {
  onNavigateToDetail: (spot: Spot) => void;
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
  demoMode?: boolean;
}

const ITEMS_PER_PAGE = 6;

export default function KatalogView({ onNavigateToDetail, onShowToast, demoMode = false }: KatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [zonaFilter, setZonaFilter] = useState<ZonaFilter>("all");
  const [ukuranFilter, setUkuranFilter] = useState<UkuranFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("populer");
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [dateStart, setDateStart] = useState(minimumRentalStartDate);
  const [dateEnd, setDateEnd] = useState(minimumRentalStartDate);
  const [period, setPeriod] = useState(() => {
    const date = minimumRentalStartDate();
    return { start: date, end: date };
  });
  const [customLokasi, setCustomLokasi] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [mapSpots, setMapSpots] = useState<Spot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(true);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [availabilityKnown, setAvailabilityKnown] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUrlInitialized, setIsUrlInitialized] = useState(false);

  // Sinkronkan filter katalog dari URL (termasuk klik footer zonasi)
  useEffect(() => {
    const zona = searchParams.get("zona");
    const ukuran = searchParams.get("ukuran");
    const fasilitas = searchParams.get("fasilitas");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    const validUkuran = ["all", "2x2", "3x3", "4x4"];
    const validSort = ["populer", "harga-asc", "harga-desc", "terbaru"];

    setZonaFilter(zona || "all");
    setUkuranFilter(validUkuran.includes(ukuran ?? "") ? (ukuran as UkuranFilter) : "all");
    setSortBy(validSort.includes(sort ?? "") ? (sort as SortOption) : "populer");
    setSearchQuery(search ?? "");
    setActiveChips(
      fasilitas
        ? new Set(fasilitas.split(",").map((item) => item.trim()).filter(Boolean))
        : new Set(),
    );
    setCurrentPage(1);
    setIsUrlInitialized(true);

    const hash = window.location.hash.replace(/^#/, "");
    if (hash) {
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [searchParams]);

  // Menyimpan perubahan filter ke URL
useEffect(() => {
  if (!isUrlInitialized) return;

  const params = new URLSearchParams();

  params.set("view", "katalog");

  if (searchQuery.trim()) {
    params.set("search", searchQuery.trim());
  }

  if (zonaFilter !== "all") {
    params.set("zona", zonaFilter);
  }

  if (ukuranFilter !== "all") {
    params.set("ukuran", ukuranFilter);
  }

  if (activeChips.size > 0) {
    params.set("fasilitas", [...activeChips].sort().join(","));
  }

  if (sortBy !== "populer") {
    params.set("sort", sortBy);
  }

  const newUrl = `/?${params.toString()}`;

  if (`${window.location.pathname}${window.location.search}` !== newUrl) {
    router.replace(newUrl, { scroll: false });
  }
}, [
  isUrlInitialized,
  searchQuery,
  zonaFilter,
  ukuranFilter,
  activeChips,
  sortBy,
  router,
]);

  useEffect(() => {
    let isMounted = true;

    async function loadSpots() {
      if (demoMode) {
        setSpots(MOCK_SPOTS);
        setMapSpots(MOCK_SPOTS);
        setIsLoadingSpots(false);
        setSpotError(null);
        setAvailabilityKnown(true);
        return;
      }
      try {
        setIsLoadingSpots(true);
        setSpotError(null);
        setAvailabilityKnown(false);

        const currentDate = rentalDateInMakassar();
        const [data, currentMapData] = await Promise.all([
          getSupabaseSpots(period),
          getSupabaseSpots({ start: currentDate, end: currentDate }),
        ]);

        // Hanya tampilkan inventaris Supabase; jangan fallback ke MOCK_SPOTS.
        if (isMounted) {
          setSpots(data.spots);
          setMapSpots(currentMapData.spots);
          setAvailabilityKnown(data.availabilityKnown);
        }
      } catch (error) {
        if (isMounted) {
          setSpots([]);
          setMapSpots([]);
          setAvailabilityKnown(false);
          setSpotError(
            error instanceof Error
              ? error.message
              : "Gagal mengambil data spot."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSpots(false);
        }
      }
    }

    loadSpots();

    return () => {
      isMounted = false;
    };
  }, [period, demoMode]);
  

  const toggleChip = useCallback((chipId: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) next.delete(chipId);
      else next.add(chipId);
      return next;
    });
  }, []);

  const handleResetChips = useCallback(() => {
    setActiveChips(new Set());
  }, []);

  const filteredAndSorted = useMemo(() => {
    let filteredSpots = [...spots];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();

      filteredSpots = filteredSpots.filter(
        (s) =>
          s.nama.toLowerCase().includes(q) ||
          s.kode.toLowerCase().includes(q) ||
          s.zonaLabel.toLowerCase().includes(q) ||
          s.lokasi.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (zonaFilter !== "all") {
      filteredSpots = filteredSpots.filter(
        (s) => s.zona === zonaFilter
      );
    }

    if (ukuranFilter !== "all") {
      filteredSpots = filteredSpots.filter(
        (s) => s.ukuran === ukuranFilter
      );
    }

    // Filter fasilitas
    if (activeChips.size > 0) {
      const facilityKeywords: Record<string, string[]> = {
        listrik: ["listrik"],
        air: ["air bersih", "air"],
        kanopi: ["kanopi"],
        meja: ["meja", "kursi"],
        wifi: ["wifi", "wi-fi"],
        parkir: ["parkir"],
        toilet: ["toilet"],
        genset: ["genset"],
        cctv: ["cctv"],
        sampah: ["sampah"],
        atm: ["atm", "m-banking"],
        ventilasi: ["ventilasi"],
      };

      filteredSpots = filteredSpots.filter((spot) =>
        [...activeChips].every((chipId) => {
          const keywords = facilityKeywords[chipId] || [chipId.toLowerCase()];

          return spot.fasilitas.some((facility) => {
            const normalized = facility.toLowerCase();

            return keywords.some((keyword) =>
              normalized.includes(keyword) || keyword.includes(normalized)
            );
          });
        })
      );
    }

    switch (sortBy) {
      case "harga-asc":
        filteredSpots.sort(
          (a, b) => a.tarifPerHari - b.tarifPerHari
        );
        break;

      case "harga-desc":
        filteredSpots.sort(
          (a, b) => b.tarifPerHari - a.tarifPerHari
        );
        break;

      case "terbaru":
        filteredSpots.sort((a, b) =>
          b.kode.localeCompare(a.kode, undefined, {
            numeric: true,
          })
        );
        break;

      case "populer":
      default:
        filteredSpots.sort(
          (a, b) => b.totalSewa - a.totalSewa
        );
        break;
    }

    return filteredSpots;
    }, [
      spots,
      searchQuery,
      zonaFilter,
      customLokasi,
      ukuranFilter,
      sortBy,
      activeChips,
    ]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedSpots = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApplyFilter = () => {
    const minimumStart = minimumRentalStartDate();
    if (dateStart < minimumStart) {
      onShowToast({ type: "error", message: "Tanggal mulai sewa paling cepat dua hari dari hari ini." });
      return;
    }
    const duration = (Date.parse(dateEnd) - Date.parse(dateStart)) / 86_400_000 + 1;
    if (!Number.isFinite(duration) || duration < 1 || duration > 30) {
      onShowToast({ type: "error", message: "Pilih rentang sewa antara 1 dan 30 hari." });
      return;
    }
    setCurrentPage(1);
    setPeriod({ start: dateStart, end: dateEnd });
  };

  const handleReset = () => {
    setSearchQuery("");
    setZonaFilter("all");
    setUkuranFilter("all");
    setSortBy("populer");
    setActiveChips(new Set());
    setCustomLokasi(null);
    setCurrentPage(1);
    const minimumStart = minimumRentalStartDate();
    setDateStart(minimumStart);
    setDateEnd(minimumStart);
    setPeriod({ start: minimumStart, end: minimumStart });
  };

  const availableSpotsCount = useMemo(
    () => filteredAndSorted.filter((s) => s.status === "tersedia").length,
    [filteredAndSorted]
  );

  // Hitung fasilitas terpopuler berdasarkan frekuensi kemunculan di spot
  const { topFacilityChips, allFacilityItems } = useMemo(() => {
    const freqMap = new Map<string, number>();
    for (const spot of spots) {
      if (Array.isArray(spot.fasilitas)) {
        for (const f of spot.fasilitas) {
          const trimmed = f.trim();
          if (trimmed) {
            freqMap.set(trimmed, (freqMap.get(trimmed) || 0) + 1);
          }
        }
      }
    }
    if (freqMap.size === 0) {
      return { topFacilityChips: undefined, allFacilityItems: undefined };
    }

    // Urutkan dari yang paling populer (paling sering muncul)
    const sorted = Array.from(freqMap.entries()).sort((a, b) => b[1] - a[1]);
    
    // 5 chip teratas untuk baris cepat (cukup 1 baris)
    const top5 = sorted.slice(0, 5).map(([label]) => ({ id: label, label }));
    // Seluruh fasilitas diurutkan popularitas untuk dropdown "Lainnya"
    const all = sorted.map(([label]) => ({ id: label, label }));

    return { topFacilityChips: top5, allFacilityItems: all };
  }, [spots]);

  // Ambil zona unik langsung dari data database
  const dynamicZones = useMemo(() => {
    const map = new Map<string, string>();
    for (const spot of spots) {
      if (spot.zona && !map.has(spot.zona)) {
        map.set(spot.zona, spot.zonaLabel || spot.zona.charAt(0).toUpperCase() + spot.zona.slice(1));
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [spots]);

  return (
    <div className="bg-[#faf8ff] min-h-screen flex flex-col">
      <div id="katalog-konten" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 scroll-mt-24">
        {/* ========================================================
            1. KATALOG HERO (KESATUAN UTAMA: Banner, Filter Card,
               Zone Tabs, Spot Grid, & Paginasi di dalam Card)
            ======================================================== */}
        {spotError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{spotError}</p>}
        {!demoMode && !isLoadingSpots && !spotError && !availabilityKnown && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">
            Jadwal sewa belum bisa diperiksa. Daftar ini menampilkan status umum lapak.
          </p>
        )}
        <KatalogHero
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          zonaFilter={zonaFilter}
          setZonaFilter={setZonaFilter}
          ukuranFilter={ukuranFilter}
          setUkuranFilter={setUkuranFilter}
          dateStart={dateStart}
          setDateStart={setDateStart}
          dateEnd={dateEnd}
          setDateEnd={setDateEnd}
          activeChips={activeChips}
          toggleChip={toggleChip}
          onResetChips={handleResetChips}
          isFiltering={isLoadingSpots}
          onApplyFilter={handleApplyFilter}
          onReset={handleReset}
          onResetPage={() => setCurrentPage(1)}
          totalCount={filteredAndSorted.length}
          availableCount={availabilityKnown ? availableSpotsCount : 0}
          customLokasi={customLokasi}
          setCustomLokasi={setCustomLokasi}
          sortBy={sortBy}
          setSortBy={setSortBy}
          chipOptions={topFacilityChips}
          allFacilityItems={allFacilityItems}
          availableZones={dynamicZones}
          allSpots={spots}
          spots={paginatedSpots}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          onNavigateToDetail={onNavigateToDetail}
        />

        {/* ========================================================
            2. PETA SPASIAL KAMPUS (FULL WIDTH)
            ======================================================== */}
        {!isLoadingSpots && filteredAndSorted.length > 0 && (
          <div id="peta-spasial" className="mt-8 pt-8 border-t border-[#e2e7ff] mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003466] tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[16px]">
                    explore
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-[#131b2e] tracking-tight">Pemetaan Geografis Kampus</span>
                </div>
                
              </div>

              {/* Status Gateway Peta */}
              <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#f2f3ff] border border-[#e2e7ff] text-xs text-[#003466] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                <span>Peta Spasial Aktif</span>
              </div>
            </div>

            {/* FULL WIDTH INTERACTIVE MAP */}
            <InteractiveMap
              spots={mapSpots}
              availabilitySpots={spots}
              defaultStatus={availabilityKnown ? "tersedia" : "all"}
              defaultZone={zonaFilter}
              context="katalog"
              rentalPeriod={{ start: dateStart, end: dateEnd }}
              onRentalPeriodChange={({ start, end }) => {
                setDateStart(start);
                setDateEnd(end);
                setPeriod({ start, end });
                setCurrentPage(1);
              }}
              onSelectSpot={onNavigateToDetail}
              className="mt-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}

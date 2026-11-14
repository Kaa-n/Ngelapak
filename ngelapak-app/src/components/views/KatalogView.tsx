"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { KatalogHero } from "@/components/katalog";
import type { ZonaFilter, UkuranFilter, SortOption } from "@/components/katalog";
import type { Spot } from "@/lib/mock-data";
import { getSupabaseSpots } from "@/lib/supabase/spots";
import type { ToastMessage } from "@/lib/types";
import { today } from "@/lib/demo-store";

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
}

const ITEMS_PER_PAGE = 6;

export default function KatalogView({ onNavigateToDetail, onShowToast }: KatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [zonaFilter, setZonaFilter] = useState<ZonaFilter>("all");
  const [ukuranFilter, setUkuranFilter] = useState<UkuranFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("populer");
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set(["listrik"]));
  const [currentPage, setCurrentPage] = useState(1);
  const [dateStart, setDateStart] = useState(today);
  const [dateEnd, setDateEnd] = useState(today);
  const [period, setPeriod] = useState(() => ({ start: today(), end: today() }));
  const [customLokasi, setCustomLokasi] = useState<string | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(true);
  const [spotError, setSpotError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSpots() {
      try {
        setIsLoadingSpots(true);
        setSpotError(null);

        const data = await getSupabaseSpots(period);

        if (isMounted) {
          setSpots(data);
        }
      } catch (error) {
        if (isMounted) {
          setSpots([]);
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
  }, [period]);
  

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
  }, [spots, searchQuery, zonaFilter, ukuranFilter, sortBy]);

  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedSpots = filteredAndSorted.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApplyFilter = () => {
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
    const now = today();
    setDateStart(now);
    setDateEnd(now);
    setPeriod({ start: now, end: now });
  };

  const availableSpotsCount = useMemo(
    () => filteredAndSorted.filter((s) => s.status === "tersedia").length,
    [filteredAndSorted]
  );

  return (
    <div className="bg-[#faf8ff] min-h-screen flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {/* ========================================================
            1. KATALOG HERO (KESATUAN UTAMA: Banner, Filter Card,
               Zone Tabs, Spot Grid, & Paginasi di dalam Card)
            ======================================================== */}
        {spotError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{spotError}</p>}
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
          availableCount={availableSpotsCount}
          customLokasi={customLokasi}
          setCustomLokasi={setCustomLokasi}
          sortBy={sortBy}
          setSortBy={setSortBy}
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
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003466] uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  <span>Pemetaan Geografis Kampus</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-[#131b2e] tracking-tight">
                  Peta Lokasi &amp; Sebaran Spot Kampus
                </h3>
                <p className="text-xs sm:text-sm text-[#424750]">
                  Visualisasi tata letak spasial zona lapak di sekitar Kampus Jimbaran &amp; Sudirman.
                </p>
              </div>

              {/* Status Gateway Peta */}
              <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#f2f3ff] border border-[#e2e7ff] text-xs text-[#003466] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                <span>Peta Spasial Aktif</span>
              </div>
            </div>

            {/* FULL WIDTH INTERACTIVE MAP */}
            <InteractiveMap
              spots={spots}
              defaultStatus="tersedia"
              defaultZone={zonaFilter}
              context="katalog"
              onSelectSpot={onNavigateToDetail}
              className="mt-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import HomeView from "../components/views/HomeView";
import KatalogView from "../components/views/KatalogView";
import DetailSpotView from "../components/views/DetailSpotView";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/layout/Navbar";
import MobileNav from "../components/layout/MobileNav";
import Footer from "../components/ui-custom/Footer";
import Toast from "../components/ui-custom/Toast";
import PesananView from "../components/views/PesananView";
import EditProfileView from "../components/views/EditProfileView";
import SettingsView from "../components/views/SettingsView";
import DetailPesananView from "../components/views/DetailPesananView";
import { useDemo, demoLogout } from "../lib/demo-store";
import { canAccess } from "../lib/types";
import { MOCK_SPOTS, type Spot } from "../lib/mock-data";
import type { PageView, ToastMessage } from "../lib/types";
import {
  getCurrentSupabaseProfile,
  signOutSupabase,
  type SupabaseProfile,
} from "../lib/supabase/auth";
import { getSupabaseSpots } from "../lib/supabase/spots";
import HelpCenterView from "../components/views/HelpCenterView";
import { getHomeStats } from "@/lib/supabase/home-stats";
import type { HomeStats } from "@/components/views/HomeView";

export type { PageView, ToastMessage };

export default function Home() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center text-[#003466]"
          role="status"
        >
          Memuat Ngelapak...
        </div>
      }
    >
      <DemoHome />
    </Suspense>
  );
}

function DemoHome() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedOrder = searchParams.get("pesanan");
  const requestedView = searchParams.get("view");
  const requestedSpot = searchParams.get("spot");

  const returningOrder = /^MT-[a-f0-9]{32}$/.test(requestedOrder ?? "")
    ? requestedOrder
    : null;
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotsLoading, setSpotsLoading] = useState(true);
  const [homeStats, setHomeStats] = useState<HomeStats>({
    totalSpots: 0,
    successfulPayments: 0,
    availableFacilities: "Listrik & Air",
  });

const [statsLoading, setStatsLoading] = useState(true);
  const [supabaseProfile, setSupabaseProfile] =
    useState<SupabaseProfile | null>(null);

  function handleProfileUpdated(updatedProfile: SupabaseProfile) {
    setSupabaseProfile(updatedProfile);
  }
  const { user: demoUser } = useDemo();
  const user = supabaseProfile ?? (demoUser?.role === "penyewa" ? demoUser : null);
  // Memulihkan sesi Supabase ketika halaman dibuka atau di-refresh.
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const profile = await getCurrentSupabaseProfile();

        if (isMounted) {
          setSupabaseProfile(profile);
        }
      } catch (error) {
        console.error("Gagal memulihkan sesi Supabase:", error);

        if (isMounted) {
          setSupabaseProfile(null);
        }
      } finally {
        if (isMounted) setSessionLoaded(true);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Mengambil data lapak dari Supabase
useEffect(() => {
  let isMounted = true;

  async function loadSpots() {
    try {
      const now = new Date();

      // Menggunakan tanggal lokal browser
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");

      // Rentang ketersediaan lapak: hari ini
      const availabilityPeriod = {
        start: today,
        end: today,
      };

      // Rentang jadwal operasional: hari ini sampai 90 hari ke depan
      const scheduleEnd = new Date(now);
      scheduleEnd.setDate(scheduleEnd.getDate() + 90);

      const scheduleEndDate = [
        scheduleEnd.getFullYear(),
        String(scheduleEnd.getMonth() + 1).padStart(2, "0"),
        String(scheduleEnd.getDate()).padStart(2, "0"),
      ].join("-");

      const result = await getSupabaseSpots(
        availabilityPeriod,
        {
          start: today,
          end: scheduleEndDate,
        }
      );

      console.log("DATA DARI SUPABASE:", result.spots);
      console.log("JUMLAH LAPAK:", result.spots.length);

      if (isMounted) {
        setSpots(result.spots);
      }
    } catch (error) {
      console.error("Gagal mengambil data lapak:", error);

      if (isMounted) {
        setSpots([]);
      }
    } finally {
      if (isMounted) {
        setSpotsLoading(false);
      }
    }
  }

  loadSpots();

  return () => {
    isMounted = false;
  };
}, []);

useEffect(() => {
  let isMounted = true;

  async function loadHomeStats() {
    try {
      const result = await getHomeStats();

      if (isMounted) {
        setHomeStats(result);
      }
    } catch (error) {
      console.error("Gagal mengambil statistik:", error);
    } finally {
      if (isMounted) {
        setStatsLoading(false);
      }
    }
  }

  loadHomeStats();

  return () => {
    isMounted = false;
  };
}, []);
  // Default tampilan awal saat aplikasi dibuka: "home" (Halaman Home / Beranda)
  const [currentView, setCurrentView] = useState<PageView>(() => {
    if (returningOrder || requestedView === "detail-pesanan") return "detail-pesanan";
    if (requestedView === "detail" || requestedSpot) return "detail";
    if (requestedView === "katalog") return "katalog";
    if (requestedView === "pesanan") return "pesanan";
    if (requestedView === "edit-profile") return "edit-profile";
    if (requestedView === "settings") return "settings";
    if (requestedView === "help-center") return "help-center";
    return "home";
  });
  const [selectedSpot, setSelectedSpot] = useState<Spot>(() => {
    if (requestedSpot) {
      const match = MOCK_SPOTS.find(
        (s) => s.kode.toLowerCase() === requestedSpot.toLowerCase()
      );
      if (match) return match;
    }
    return MOCK_SPOTS[0];
  });
  const [detailInitialTab, setDetailInitialTab] = useState<"detail" | "operasional" | "fasilitas" | "ulasan">("detail");
  const [orderId, setOrderId] = useState<string | null>(returningOrder);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sinkronisasi selectedSpot jika spots dari Supabase baru selesai dimuat
  useEffect(() => {
    const spotParam = searchParams.get("spot");
    if (spotParam) {
      const allSpots = spots.length > 0 ? spots : MOCK_SPOTS;
      const found = allSpots.find(
        (s) => s.kode.toLowerCase() === spotParam.toLowerCase()
      );
      if (found) {
        setSelectedSpot(found);
      }
    }
  }, [searchParams, spots]);

  // Sinkronisasi browser back/forward buttons dengan URL searchParams
  useEffect(() => {
    const v = searchParams.get("view") as PageView | null;
    const p = searchParams.get("pesanan");
    const s = searchParams.get("spot");

    if (p) {
      setOrderId(p);
      setCurrentView("detail-pesanan");
    } else if (v === "detail" || s) {
      setCurrentView("detail");
    } else if (v === "katalog") {
      setCurrentView("katalog");
    } else if (v === "pesanan") {
      setCurrentView("pesanan");
    } else if (v === "edit-profile") {
      setCurrentView("edit-profile");
    } else if (v === "settings") {
      setCurrentView("settings");
    } else if (v === "help-center") {
      setCurrentView("help-center");
    } else if (!v) {
      if (!p) setCurrentView("home");
    }
  }, [searchParams]);

  const navigate = useCallback((
    view: PageView,
    spot?: Spot,
    initialTab?: "detail" | "operasional" | "fasilitas" | "ulasan"
  ) => {
    if (view === "masuk" || view === "daftar") {
      router.push(view === "masuk" ? "/masuk" : "/daftar");
      return;
    }

    if (!canAccess(view, user?.role)) {
      if (user) setCurrentView("katalog");
      else router.push("/masuk");
      return;
    }

    if (view === "dasbor" || view === "verifikasi") {
      router.push(view === "dasbor" ? "/admin" : "/admin/pembayaran");
      return;
    }

    setCurrentView(view);

    const targetSpot = spot ?? selectedSpot;
    if (spot) setSelectedSpot(spot);

    setDetailInitialTab(initialTab ?? "detail");

    // Sinkronisasi seluruh navigasi view ke URL searchParams
    const params = new URLSearchParams(searchParams.toString());

    // Bersihkan parameter spesifik view sebelumnya
    if (view !== "detail") {
      params.delete("spot");
    }
    if (view !== "detail-pesanan") {
      params.delete("pesanan");
    }

    if (view === "home") {
      params.delete("view");
      params.delete("zona");
      params.delete("ukuran");
      params.delete("fasilitas");
      params.delete("search");
      params.delete("sort");
    } else if (view === "katalog") {
      params.set("view", "katalog");
    } else if (view === "detail") {
      params.set("view", "detail");
      if (targetSpot?.kode) {
        params.set("spot", targetSpot.kode);
      }
    } else if (view === "pesanan") {
      params.set("view", "pesanan");
    } else if (view === "detail-pesanan") {
      params.set("view", "detail-pesanan");
      if (orderId) params.set("pesanan", orderId);
    } else if (view === "edit-profile") {
      params.set("view", "edit-profile");
    } else if (view === "settings") {
      params.set("view", "settings");
    } else if (view === "help-center") {
      params.set("view", "help-center");
    }

    const query = params.toString();
    router.push(query ? `/?${query}` : "/", { scroll: false });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user, router, searchParams, selectedSpot, orderId]);

  const showToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Sinkronisasi document.title dengan SPA view aktif
  useEffect(() => {
    const titles: Record<string, string> = {
      home: "Ngelapak – Marketplace Lapak Kampus Universitas Udayana",
      katalog: "Katalog Lapak | Ngelapak",
      detail: selectedSpot
        ? `${selectedSpot.nama} (${selectedSpot.kode}) | Ngelapak`
        : "Detail Lapak | Ngelapak",
      pesanan: "Pesanan Saya | Ngelapak",
      "detail-pesanan": "Detail Pesanan | Ngelapak",
      "edit-profile": "Edit Profil | Ngelapak",
      settings: "Pengaturan Akun | Ngelapak",
      "help-center": "Pusat Bantuan | Ngelapak",
    };
    document.title = titles[currentView] ?? "Ngelapak";
  }, [currentView, selectedSpot]);

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8ff] dark:bg-[#0b0f19] transition-colors duration-150">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={navigate}
        user={user}
        onLogout={async () => {
        try {
          if (demoUser) {
            demoLogout();
        } else {
          await signOutSupabase();
          setSupabaseProfile(null);
        }

        setCurrentView("home");
        setToasts([]);
      } catch (error) {
        console.error("Gagal keluar:", error);
        showToast({
          type: "error",
          message: "Gagal keluar dari akun.",
        });
      }
    }}
  />

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 pb-16 md:pb-0">
        {currentView === "home" && (
          <HomeView
            spots={spots}
            isLoading={spotsLoading}
            stats={homeStats}
            statsLoading={statsLoading}
            onNavigateToKatalog={() => navigate("katalog")}
            onNavigateToDetail={(spot, initialTab) =>
              navigate("detail", spot, initialTab)
            }
            onShowToast={showToast}
          />
        )}
        {currentView === "help-center" && <HelpCenterView />}
        {currentView === "pesanan" && user?.role === "penyewa" && (
          <PesananView
            user={user}
            onExplore={() => navigate("katalog")}
            onShowToast={showToast}
          />
        )}
        {currentView === "detail-pesanan" && user?.role === "penyewa" && orderId && (
          <DetailPesananView
            key={orderId}
            bookingId={orderId}
            useSupabase={!!supabaseProfile}
            onBack={() => navigate("katalog")}
          />
        )}
        {currentView === "detail-pesanan" && !user && (
          <div className="mx-auto max-w-md px-4 py-10 text-sm">
            {sessionLoaded ? (
              <Link className="font-semibold text-[#003466] underline"
                href={returningOrder ? `/masuk?pesanan=${returningOrder}` : "/masuk"}>Masuk untuk melihat pesanan</Link>
            ) : <p role="status">Memuat pesanan…</p>}
          </div>
        )}
        {currentView === "edit-profile" && user && (
          <EditProfileView
            user={user}
            onBack={() => navigate("home")}
            onShowToast={showToast}
            onProfileUpdated={handleProfileUpdated}
          />
        )}
        {currentView === "settings" && user && (
          <SettingsView
            user={user}
            onBack={() => navigate("home")}
            onShowToast={showToast}
          />
        )}
        {currentView === "katalog" && (
          <KatalogView
            demoMode={!!demoUser && !supabaseProfile}
            onNavigateToDetail={(spot) => navigate("detail", spot, "detail")}
            onShowToast={showToast}
          />
        )}
        {currentView === "detail" && (
          <DetailSpotView
            key={`${selectedSpot.id}-${user?.id ?? "guest"}-${detailInitialTab}`}
            spot={selectedSpot || MOCK_SPOTS[0]}
            user={user}
            initialTab={detailInitialTab}
            onBack={() => navigate("katalog")}
            onLogin={() => navigate("masuk")}
            onOrderDetail={(id) => {
              setOrderId(id);
              const params = new URLSearchParams(searchParams.toString());
              params.set("view", "detail-pesanan");
              params.set("pesanan", id);
              router.push(`/?${params.toString()}`, { scroll: false });
              setCurrentView("detail-pesanan");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Global Footer untuk Seluruh Halaman */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileNav
        currentView={currentView}
        onNavigate={navigate}
        role={user?.role}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[200] flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
}

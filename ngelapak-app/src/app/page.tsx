"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import HomeView from "../components/views/HomeView";
import KatalogView from "../components/views/KatalogView";
import DetailSpotView from "../components/views/DetailSpotView";
import DasborView from "../components/views/DasborView";
import VerifikasiView from "../components/views/VerifikasiView";
import Navbar from "../components/layout/Navbar";
import MobileNav from "../components/layout/MobileNav";
import Footer from "../components/ui-custom/Footer";
import Toast from "../components/ui-custom/Toast";
import MasukView from "../components/views/MasukView";
import PesananView from "../components/views/PesananView";
import EditProfileView from "../components/views/EditProfileView";
import DetailPesananView from "../components/views/DetailPesananView";
import { useDemo, demoLogin, demoLogout } from "../lib/demo-store";
import { canAccess } from "../lib/types";
import { MOCK_SPOTS, type Spot } from "../lib/mock-data";
import type { PageView, ToastMessage } from "../lib/types";
import DaftarView from "../components/views/DaftarView";
import {
  getCurrentSupabaseProfile,
  signOutSupabase,
  type SupabaseProfile,
} from "../lib/supabase/auth";
import HelpCenterView from "../components/views/HelpCenterView";

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
  const [supabaseProfile, setSupabaseProfile] =
    useState<SupabaseProfile | null>(null);

  function handleProfileUpdated(updatedProfile: SupabaseProfile) {
    setSupabaseProfile(updatedProfile);
  }
  const { user: demoUser } = useDemo();
  const user = demoUser ?? supabaseProfile;
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
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);
  // Default tampilan awal saat aplikasi dibuka: "home" (Halaman Home / Beranda)
  const [currentView, setCurrentView] = useState<PageView>("home");
  const [selectedSpot, setSelectedSpot] = useState<Spot>(MOCK_SPOTS[0]);
  const [detailInitialTab, setDetailInitialTab] = useState<"detail" | "operasional" | "fasilitas" | "ulasan">("detail");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const navigate = useCallback((view: PageView, spot?: Spot, initialTab?: "detail" | "operasional" | "fasilitas" | "ulasan") => {
    if (!canAccess(view, user?.role)) {
      setCurrentView(user ? "katalog" : "masuk");
      return;
    }
    setCurrentView(view);
    if (spot) setSelectedSpot(spot);
    setDetailInitialTab(initialTab ?? "detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [user]);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#faf8ff]">
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
            onNavigateToKatalog={() => navigate("katalog")}
            onNavigateToDetail={(spot, initialTab) => navigate("detail", spot, initialTab)}
            onShowToast={showToast}
          />
        )}
        {currentView === "help-center" && <HelpCenterView />}
        {currentView === "masuk" && (
          <MasukView
            onLoginDemo={async (id) => {
            try {
              await signOutSupabase();
              setSupabaseProfile(null);
              demoLogin(id);
              setCurrentView("katalog");
            } catch (error) {
              console.error("Gagal beralih ke akun demo:", error);
              showToast({
                type: "error",
                message: "Gagal masuk menggunakan akun demo.",
              });
            }   
          }}
          onLoginSupabase={(profile) => {
            demoLogout();
            setSupabaseProfile(profile);
            setCurrentView("katalog");
          }}
          onNavigateToRegister={() => navigate("daftar")}
        />
      )}

        {currentView === "daftar" && (
          <DaftarView
          onNavigateToLogin={() => navigate("masuk")}
        />
      )}

        {currentView === "pesanan" && user?.role === "penyewa" && (
          <PesananView
            user={user}
            onExplore={() => navigate("katalog")}
            onShowToast={showToast}
          />
        )}
        {currentView === "detail-pesanan" && user?.role === "penyewa" && orderId && (
          <DetailPesananView
            bookingId={orderId}
            onBack={() => navigate("katalog")}
          />
        )}
        {currentView === "edit-profile" && user && (
          <EditProfileView
            user={user}
            onBack={() => navigate("home")}
            onShowToast={showToast}
            onProfileUpdated={handleProfileUpdated}
          />
        )}
        {currentView === "katalog" && (
          <KatalogView
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
              navigate("detail-pesanan");
            }}
            onShowToast={showToast}
          />
        )}
        {currentView === "dasbor" && user?.role === "admin" && (
          <DasborView onShowToast={showToast} />
        )}
        {currentView === "verifikasi" && user?.role === "admin" && (
          <VerifikasiView onShowToast={showToast} />
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

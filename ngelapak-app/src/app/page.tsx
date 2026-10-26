"use client";

import { Suspense, useState, useCallback } from "react";
import KatalogView from "../components/views/KatalogView";
import DetailSpotView from "../components/views/DetailSpotView";
import DasborView from "../components/views/DasborView";
import VerifikasiView from "../components/views/VerifikasiView";
import Navbar from "../components/layout/Navbar";
import MobileNav from "../components/layout/MobileNav";
import Toast from "../components/ui-custom/Toast";
import MasukView from "../components/views/MasukView";
import PesananView from "../components/views/PesananView";
import { useDemo, demoLogin, demoLogout } from "../lib/demo-store";
import { canAccess } from "../lib/types";
import { MOCK_SPOTS, type Spot } from "../lib/mock-data";
import type { PageView, ToastMessage } from "../lib/types";

export type { PageView, ToastMessage };

export default function Home() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#003466]" role="status">Memuat Ngelapak...</div>}><DemoHome /></Suspense>;
}

function DemoHome() {
  const { user } = useDemo();
  const [currentView, setCurrentView] = useState<PageView>("katalog");
  const [selectedSpot, setSelectedSpot] = useState<Spot>(MOCK_SPOTS[0]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const navigate = useCallback((view: PageView, spot?: Spot) => {
    if (!canAccess(view, user?.role)) {
      setCurrentView(user ? "katalog" : "masuk");
      return;
    }
    setCurrentView(view);
    if (spot) setSelectedSpot(spot);
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
      <Navbar currentView={currentView} onNavigate={navigate} user={user} onLogout={() => { demoLogout(); setCurrentView("katalog"); setToasts([]); }} />

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 pb-16 md:pb-0">
        {currentView === "masuk" && <MasukView onLogin={(id) => { demoLogin(id); setCurrentView("katalog"); }} />}
        {currentView === "pesanan" && user?.role === "penyewa" && <PesananView onExplore={() => navigate("katalog")} />}
        {currentView === "katalog" && (
          <KatalogView onNavigateToDetail={(spot) => navigate("detail", spot)} onShowToast={showToast} />
        )}
        {currentView === "detail" && (
          <DetailSpotView
            key={`${selectedSpot.id}-${user?.id ?? "guest"}`}
            spot={selectedSpot || MOCK_SPOTS[0]}
            onBack={() => navigate("katalog")}
            onLogin={() => navigate("masuk")}
            onOrders={() => navigate("pesanan")}
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

      {/* Mobile Bottom Navigation */}
      <MobileNav currentView={currentView} onNavigate={navigate} role={user?.role} />

      {/* Toast Notifications */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[200] flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
}

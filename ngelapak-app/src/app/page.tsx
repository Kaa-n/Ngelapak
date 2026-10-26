"use client";

import { useState, useCallback } from "react";
import KatalogView from "../components/views/KatalogView";
import DetailSpotView from "../components/views/DetailSpotView";
import DasborView from "../components/views/DasborView";
import VerifikasiView from "../components/views/VerifikasiView";
import Navbar from "../components/layout/Navbar";
import MobileNav from "../components/layout/MobileNav";
import Toast from "../components/ui-custom/Toast";
import { MOCK_SPOTS, type Spot } from "../lib/mock-data";
import type { PageView, ToastMessage } from "../lib/types";

export type { PageView, ToastMessage };

export default function Home() {
  const [currentView, setCurrentView] = useState<PageView>("katalog");
  const [selectedSpot, setSelectedSpot] = useState<Spot>(MOCK_SPOTS[0]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useCallback((view: PageView, spot?: Spot) => {
    setIsLoading(true);
    setTimeout(() => {
      setCurrentView(view);
      if (spot) {
        setSelectedSpot(spot);
      }
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 300);
  }, []);

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
      <Navbar currentView={currentView} onNavigate={navigate} />

      {/* Page Loading Bar */}
      {isLoading && (
        <div className="fixed top-16 left-0 right-0 z-50 h-0.5 bg-[#eaedff] overflow-hidden">
          <div className="h-full bg-[#003466] animate-[loading_0.3s_ease_forwards]" style={{ width: "70%" }} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full pt-16">
        {currentView === "katalog" && (
          <KatalogView onNavigateToDetail={(spot) => navigate("detail", spot)} onShowToast={showToast} />
        )}
        {currentView === "detail" && (
          <DetailSpotView
            spot={selectedSpot || MOCK_SPOTS[0]}
            onBack={() => navigate("katalog")}
            onShowToast={showToast}
          />
        )}
        {currentView === "dasbor" && (
          <DasborView onShowToast={showToast} />
        )}
        {currentView === "verifikasi" && (
          <VerifikasiView onShowToast={showToast} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentView={currentView} onNavigate={navigate} />

      {/* Toast Notifications */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[200] flex flex-col gap-2 items-end">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
}

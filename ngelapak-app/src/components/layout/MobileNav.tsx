"use client";

import type { PageView } from "@/lib/types";

interface MobileNavProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
}

const NAV_ITEMS = [
  { id: "katalog" as PageView, label: "Katalog", icon: "storefront" },
  { id: "dasbor" as PageView, label: "Kelola", icon: "dashboard" },
  { id: "verifikasi" as PageView, label: "Admin", icon: "verified_user" },
];

export default function MobileNav({ currentView, onNavigate }: MobileNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e2e7ff] shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id || (item.id === "katalog" && currentView === "detail");
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
                isActive
                  ? "text-[#003466] bg-[#f2f3ff]"
                  : "text-[#737781] hover:text-[#131b2e] hover:bg-[#f9fafb]"
              }`}
            >
              <div className="relative">
                <span className={`material-symbols-outlined text-[22px] transition-all ${isActive ? "text-[#003466]" : ""}`}>
                  {item.icon}
                </span>
                {item.id === "verifikasi" && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#fea619]" />
                )}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#003466]" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#003466]" style={{ width: `${100 / NAV_ITEMS.length}%`, marginLeft: `${(NAV_ITEMS.findIndex(n => n.id === item.id) / NAV_ITEMS.length) * 100}%` }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import { useState } from "react";
import type { PageView } from "@/lib/types";

interface NavbarProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
}

const NAV_ITEMS = [
  { id: "katalog" as PageView, label: "Jelajah Lapak", icon: "storefront" },
  { id: "detail" as PageView, label: "Detail Sewa", icon: "receipt_long" },
  { id: "dasbor" as PageView, label: "Kelola Lapak", icon: "dashboard" },
  { id: "verifikasi" as PageView, label: "Verifikasi & Admin", icon: "verified_user" },
];

export default function Navbar({ currentView, onNavigate }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate("katalog");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-6 shrink-0">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onNavigate("katalog"); }}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-[#003466] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-[18px]">storefront</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#003466] font-bold text-[15px] leading-tight tracking-tight">
                Ngelapak
              </span>
              <span className="text-[11px] text-[#424750] leading-none font-medium">
                Universitas Udayana
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentView === item.id;
              return (
                <a
                  key={item.id}
                  href="#"
                  onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
                  className={`
                    px-3 py-2 rounded-lg text-[13px] font-semibold leading-5 transition-all duration-200
                    ${isActive
                      ? "bg-[#1a4b84] text-white"
                      : "text-[#424750] hover:text-[#131b2e] hover:bg-[#eaedff]"
                    }
                  `}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden md:block">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3 text-[#737781] text-[18px] pointer-events-none select-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 bg-[#f2f3ff] text-[#131b2e] placeholder:text-[#737781] text-[13px] rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all border border-transparent focus:border-[#003466]/20"
              placeholder="Cari zona lapak, fakultas, gedung..."
              type="text"
            />
            <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] bg-[#e2e7ff] text-[#424750] rounded font-mono pointer-events-none">
              ⌘K
            </kbd>
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Help */}
          <button
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-[#424750] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors"
            title="Pusat Bantuan"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-[#424750] hover:text-[#131b2e] hover:bg-[#eaedff] transition-colors"
              title="Notifikasi"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#fea619] ring-2 ring-white" />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#e2e7ff] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e2e7ff] flex items-center justify-between">
                  <span className="font-semibold text-[14px] text-[#131b2e]">Notifikasi</span>
                  <span className="text-[11px] text-[#003466] font-semibold cursor-pointer hover:underline">
                    Tandai semua dibaca
                  </span>
                </div>
                {[
                  { icon: "check_circle", color: "#4edea3", bg: "#6ffbbe20", msg: "Pembayaran TXN-2025-003 telah diverifikasi", time: "5 menit lalu" },
                  { icon: "schedule", color: "#fea619", bg: "#fea61920", msg: "4 transaksi menunggu verifikasi admin", time: "1 jam lalu" },
                  { icon: "storefront", color: "#003466", bg: "#003466/10", msg: "Spot B-08 memiliki 3 booking minggu ini", time: "2 jam lalu" },
                ].map((notif, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-[#f2f3ff] cursor-pointer transition-colors border-b border-[#e2e7ff]/50 last:border-0"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: notif.bg }}
                    >
                      <span className="material-symbols-outlined text-[16px]" style={{ color: notif.color }}>
                        {notif.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] text-[#131b2e] leading-5">{notif.msg}</p>
                      <span className="text-[11px] text-[#737781]">{notif.time}</span>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 text-center">
                  <span className="text-[12px] text-[#003466] font-semibold cursor-pointer hover:underline">
                    Lihat semua notifikasi
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-[#e2e7ff] mx-0.5 hidden sm:block" />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-1 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-[#eaedff] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#1a4b84] flex items-center justify-center ring-2 ring-[#003466]/20">
                <span className="material-symbols-outlined text-white text-[18px]">person</span>
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[13px] text-[#131b2e] font-semibold leading-none">I Made Ariawan</span>
                <span className="text-[11px] text-[#855300] font-medium mt-0.5 leading-none">Pengelola Lapak</span>
              </div>
              <span className="material-symbols-outlined text-[#737781] text-[16px]">expand_more</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#e2e7ff] z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-[#e2e7ff]">
                  <p className="font-semibold text-[13px] text-[#131b2e]">I Made Ariawan</p>
                  <p className="text-[11px] text-[#424750]">ariawan@unud.ac.id</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ffddb8] text-[#2a1700] text-[11px] font-semibold mt-1">
                    <span className="material-symbols-outlined text-[12px]">verified_user</span>
                    Pengelola Lapak
                  </span>
                </div>
                {[
                  { icon: "manage_accounts", label: "Profil & Pengaturan" },
                  { icon: "dashboard", label: "Dashboard Saya", action: () => { onNavigate("dasbor"); setProfileOpen(false); } },
                  { icon: "help_outline", label: "Pusat Bantuan" },
                  { icon: "logout", label: "Keluar", danger: true },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={item.action}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors hover:bg-[#f2f3ff] ${
                      item.danger ? "text-[#ba1a1a]" : "text-[#131b2e]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside overlay */}
      {(profileOpen || notifOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setProfileOpen(false); setNotifOpen(false); }}
        />
      )}
    </header>
  );
}

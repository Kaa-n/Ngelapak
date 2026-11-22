"use client";

import { useState, useEffect } from "react";
import { navigationFor, type DemoUser, type PageView } from "@/lib/types";
import type { SupabaseProfile } from "@/lib/supabase/auth";

interface NavbarProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  user: DemoUser | SupabaseProfile | null;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  user,
  onLogout,
}: NavbarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<"auto" | "light" | "dark">("auto");

  useEffect(() => {
    const saved = localStorage.getItem("ngelapak_theme") as "auto" | "light" | "dark" | null;
    if (saved) setThemeMode(saved);
  }, []);

  useEffect(() => {
    function applyTheme() {
      if (themeMode === "dark") {
        document.documentElement.classList.add("dark");
      } else if (themeMode === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (isDark) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
    }

    applyTheme();
    localStorage.setItem("ngelapak_theme", themeMode);

    if (themeMode === "auto") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [themeMode]);

  // Auto‑close dropdown on outside click or scroll
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleClose = () => setProfileMenuOpen(false);
    document.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, { passive: true });
    return () => {
      document.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose);
    };
  }, [profileMenuOpen]);

  function handleProfileNavigate() {
    setProfileMenuOpen(false);
    onNavigate("edit-profile");
  }

  function handleLogout() {
    setProfileMenuOpen(false);
    onLogout();
  }
  
  function handleHelpCenterNavigate() {
  setProfileMenuOpen(false);
  onNavigate("help-center");
  }

  return (
    <header suppressHydrationWarning className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-[#0f1117]/95 backdrop-blur-md border-b border-[#e2e7ff] dark:border-[#232942]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 text-[#003466] dark:text-[#a6c8ff] font-bold cursor-pointer"
        >
          <img
            src="/logo%20ngelapak.png"
            alt="Ngelapak"
            className="w-10 h-10 rounded-lg object-contain"
          />
          <span>
            Ngelapak
            <span className="hidden sm:block text-[10px] text-[#424750] dark:text-[#bec3d0] font-medium">
              Universitas Udayana
            </span>
          </span>
        </button>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex gap-1"
        >
          {navigationFor(user?.role).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={
                currentView === item.id ? "page" : undefined
              }
              className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                currentView === item.id
                  ? "bg-[#003466] text-white"
                  : "text-[#131b2e] dark:text-[#e8ecf8] hover:bg-[#eaedff] dark:hover:bg-[#1c2235]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setProfileMenuOpen((open) => !open); }}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#f4f6ff] dark:hover:bg-[#1c2235] cursor-pointer"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs sm:text-sm font-semibold max-w-36 truncate text-[#131b2e] dark:text-[#e8ecf8]">
                    {user.nama}
                  </p>
                  <p className="text-xs text-[#855300] dark:text-[#ffb95f]">
                    {user.role === "admin" ? "Admin" : "Penyewa"} ·{" "}
                    {"nim" in user ? "Pengguna" : "Akun Demo"}
                  </p>
                </div>

                <span className="material-symbols-outlined text-[#003466] dark:text-[#a6c8ff]">
                  account_circle
                </span>

                <span className="material-symbols-outlined text-[#737781] dark:text-[#bec3d0] text-lg">
                  {profileMenuOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#161b27] border border-[#e2e7ff] dark:border-[#232942] rounded-xl shadow-lg p-2 z-50"
                >
                  <div className="px-3 py-2 border-b border-[#e2e7ff] dark:border-[#232942] mb-1">
                    <p className="text-sm font-semibold text-[#172033] dark:text-[#e8ecf8] truncate">
                      {user.nama}
                    </p>
                    <p className="text-xs text-[#737781] dark:text-[#bec3d0] truncate">
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProfileNavigate}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#172033] dark:text-[#e8ecf8] hover:bg-[#f4f6ff] dark:hover:bg-[#1c2235] text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-[#003466] dark:text-[#a6c8ff]">
                      edit
                    </span>
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { setProfileMenuOpen(false); onNavigate("settings"); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#172033] dark:text-[#e8ecf8] hover:bg-[#f4f6ff] dark:hover:bg-[#1c2235] text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-[#003466] dark:text-[#a6c8ff]">
                      settings
                    </span>
                    Pengaturan
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleHelpCenterNavigate}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#172033] dark:text-[#e8ecf8] hover:bg-[#f4f6ff] dark:hover:bg-[#1c2235] text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-[#003466] dark:text-[#a6c8ff]">
                      help
                    </span>
                    Pusat Bantuan & FAQ
                  </button>

                  {/* Mode Tampilan (Dark Mode Toggle) */}
                  <div className="pt-2 pb-1 px-3 border-t border-[#e2e7ff] dark:border-[#232942] my-1">
                    <div className="flex items-center justify-between text-xs text-[#737781] dark:text-[#bec3d0] font-semibold mb-1.5">
                      <span>Mode Tampilan</span>
                      <span className="text-[11px] font-bold text-[#003466] dark:text-[#a6c8ff]">
                        {themeMode === "auto" ? "Otomatis" : themeMode === "dark" ? "Gelap" : "Terang"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-[#eaedff] dark:bg-[#232942] p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setThemeMode("auto")}
                        className={`py-1 rounded font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          themeMode === "auto"
                            ? "bg-white dark:bg-[#161b27] text-[#003466] dark:text-[#a6c8ff] shadow-xs font-semibold"
                            : "text-[#424750] dark:text-[#bec3d0] hover:text-[#131b2e] dark:hover:text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">brightness_auto</span>
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("light")}
                        className={`py-1 rounded font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          themeMode === "light"
                            ? "bg-white dark:bg-[#161b27] text-[#003466] dark:text-[#a6c8ff] shadow-xs font-semibold"
                            : "text-[#424750] dark:text-[#bec3d0] hover:text-[#131b2e] dark:hover:text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">light_mode</span>
                        Terang
                      </button>
                      <button
                        type="button"
                        onClick={() => setThemeMode("dark")}
                        className={`py-1 rounded font-medium flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          themeMode === "dark"
                            ? "bg-white dark:bg-[#161b27] text-[#003466] dark:text-[#a6c8ff] shadow-xs font-semibold"
                            : "text-[#424750] dark:text-[#bec3d0] hover:text-[#131b2e] dark:hover:text-white"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">dark_mode</span>
                        Gelap
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[#e2e7ff] dark:border-[#232942] pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-left cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">
                        logout
                      </span>
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate("masuk")}
              className="bg-[#003466] text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
            >
              Masuk demo
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

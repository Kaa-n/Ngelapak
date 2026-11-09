"use client";

import { useState } from "react";
import { navigationFor, type DemoUser, type PageView } from "@/lib/types";

interface NavbarProps {
  currentView: PageView;
  onNavigate: (view: PageView) => void;
  user: DemoUser | null;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  user,
  onLogout,
}: NavbarProps) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  function handleProfileNavigate() {
    setProfileMenuOpen(false);
    onNavigate("edit-profile");
  }

  function handleLogout() {
    setProfileMenuOpen(false);
    onLogout();
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e2e7ff]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 text-[#003466] font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined bg-[#003466] text-white rounded-lg p-1.5">
            storefront
          </span>
          <span>
            Ngelapak
            <span className="hidden sm:block text-[10px] text-[#424750] font-medium">
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
              onClick={() => onNavigate(item.id)}
              aria-current={
                currentView === item.id ? "page" : undefined
              }
              className={`px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                currentView === item.id
                  ? "bg-[#003466] text-white"
                  : "hover:bg-[#eaedff]"
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
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#f4f6ff] cursor-pointer"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs sm:text-sm font-semibold max-w-36 truncate">
                    {user.nama}
                  </p>
                  <p className="text-xs text-[#855300]">
                    {user.role === "admin" ? "Admin" : "Penyewa"} · Demo
                  </p>
                </div>

                <span className="material-symbols-outlined text-[#003466]">
                  account_circle
                </span>

                <span className="material-symbols-outlined text-[#737781] text-lg">
                  {profileMenuOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e2e7ff] rounded-xl shadow-lg p-2"
                >
                  <div className="px-3 py-2 border-b border-[#e2e7ff] mb-1">
                    <p className="text-sm font-semibold text-[#172033] truncate">
                      {user.nama}
                    </p>
                    <p className="text-xs text-[#737781] truncate">
                      {user.email}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleProfileNavigate}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#172033] hover:bg-[#f4f6ff] text-left"
                  >
                    <span className="material-symbols-outlined text-lg text-[#003466]">
                      edit
                    </span>
                    Edit Profile
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 text-left"
                  >
                    <span className="material-symbols-outlined text-lg">
                      logout
                    </span>
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
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

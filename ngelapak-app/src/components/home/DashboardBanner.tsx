"use client";

import React from "react";

export interface DashboardBannerProps {
  /**
   * Callback yang dipicu saat pengguna mengklik tombol aksi 'Sewa Lapak Sekarang'.
   * Mengarahkan alur aplikasi ke KatalogView untuk melihat seluruh spot lapak.
   */
  onNavigateToKatalog: () => void;

  /**
   * Kelas styling tambahan opsional untuk penyesuaian tata letak
   */
  className?: string;
}

/**
 * Komponen Banner CTA Utama (DashboardBanner)
 */
export default function DashboardBanner({
  onNavigateToKatalog,
  className = "",
}: DashboardBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-[#003466] via-[#1a4b84] to-[#002113] text-white shadow-xl shadow-[#003466]/15 p-6 sm:p-8 md:p-12 border border-white/10 ${className}`}
    >
      {/* ========================================================
          DECORATIVE BACKGROUND
          ======================================================== */}
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#fea619] opacity-20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute right-1/4 -bottom-24 w-72 h-72 rounded-full bg-[#4edea3] opacity-20 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -left-12 top-1/2 w-60 h-60 rounded-full bg-[#93bcfc] opacity-15 blur-2xl pointer-events-none"
      />

      {/* ========================================================
          KONTEN UTAMA BANNER
          ======================================================== */}
      <div className="relative z-10 max-w-3xl">
        {/* Badge Identitas Resmi */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#d5e3ff] text-xs font-semibold shadow-sm mb-5">
          <span className="material-symbols-outlined text-[16px] text-[#fea619]">
            verified
          </span>
          <span>Universitas Udayana · Platform Resmi Sewa Lapak Kampus</span>
        </div>

        {/* Teks Headline Utama Sesuai Ketentuan */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight md:leading-[1.15] mb-4 text-white">
          Ingin memesan lapak?
        </h1>

        {/* Deskripsi Singkat */}
        <p className="text-base sm:text-lg text-[#e2e7ff] leading-relaxed mb-8 max-w-2xl font-normal">
          Temukan dan ajukan sewa spot usaha temporer legal di lingkungan kampus
          Universitas Udayana (Lapangan Rektorat, Boulevard, Student Center, dan
          Agrokompleks). Proses cepat, transparan, dan terverifikasi resmi oleh Biro
          Pengelolaan Aset.
        </p>

        {/* Baris Tombol Aksi (CTA) */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Tombol Utama: Sewa Lapak Sekarang */}
          <button
            type="button"
            onClick={onNavigateToKatalog}
            className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#fea619] hover:bg-[#ffb95f] active:bg-[#e09214] text-[#2a1700] text-sm md:text-base font-bold shadow-lg shadow-[#fea619]/25 hover:shadow-[#fea619]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:scale-110">
              storefront
            </span>
            <span>Sewa Lapak Sekarang</span>
            <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>

          {/* Tombol Sekunder */}
          <button
            type="button"
            onClick={onNavigateToKatalog}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/5 border border-white/20 text-white text-sm md:text-base font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#93bcfc]">
              explore
            </span>
            <span>Jelajahi Semua Zona</span>
          </button>
        </div>

        {/* ========================================================
            HIGHLIGHT FITUR
            ======================================================== */}
        <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs md:text-sm text-[#d5e3ff]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">
              check_circle
            </span>
            <span>Izin Resmi Biro Aset</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fea619] text-[18px]">
              bolt
            </span>
            <span>Listrik 450W – 900W</span>
          </div>
          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <span className="material-symbols-outlined text-[#93bcfc] text-[18px]">
              schedule
            </span>
            <span>Verifikasi 1×24 Jam</span>
          </div>
        </div>
      </div>
    </div>
  );
}


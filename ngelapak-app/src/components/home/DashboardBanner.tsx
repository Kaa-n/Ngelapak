"use client";

import React from "react";

export interface DashboardBannerProps {
  /**
   * Callback yang dipicu saat pengguna mengklik tombol aksi 'Sewa Lapak Sekarang'.
   * Mengarahkan alur aplikasi ke KatalogView untuk melihat seluruh spot lapak.
   */
  onNavigateToKatalog: () => void;

  /**
   * Callback opsional saat tombol 'Jelajah Lapak Beroperasi' diklik.
   * Jika tidak diberikan, default scroll ke #active-stalls-section.
   */
  onNavigateToActiveStalls?: () => void;

  /**
   * Callback opsional saat tombol 'Cara Sewa Lapak' diklik.
   * Jika tidak diberikan, default scroll ke #cara-sewa-section.
   */
  onNavigateToCaraSewa?: () => void;

  /**
   * Callback opsional saat tombol 'Jelajahi Peta Spasial' diklik.
   * Jika tidak diberikan, default scroll ke #peta-spasial.
   */
  onNavigateToPeta?: () => void;

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
  onNavigateToActiveStalls,
  onNavigateToCaraSewa,
  onNavigateToPeta,
  className = "",
}: DashboardBannerProps) {
  const handleScrollToMap = () => {
    if (onNavigateToPeta) {
      onNavigateToPeta();
      return;
    }
    const el = document.getElementById("peta-spasial");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleScrollToActiveStalls = () => {
    if (onNavigateToActiveStalls) {
      onNavigateToActiveStalls();
      return;
    }
    const el =
      document.getElementById("active-stalls-section") ||
      document.getElementById("active-stalls-heading");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      onNavigateToKatalog();
    }
  };

  const handleScrollToCaraSewa = () => {
    if (onNavigateToCaraSewa) {
      onNavigateToCaraSewa();
      return;
    }
    const el =
      document.getElementById("cara-sewa-section") ||
      document.getElementById("how-it-works-heading");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
          TOMBOL PINTASAN DESKTOP: JELAJAHI PETA SPASIAL
          (Tampil di pojok kanan atas pada layar md ke atas)
          ======================================================== */}
      <button
        type="button"
        onClick={handleScrollToMap}
        className="hidden md:flex absolute top-8 md:top-10 right-6 md:right-10 z-20 w-64 md:w-72 flex-col overflow-hidden rounded-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer text-left backdrop-blur-md"
        aria-label="Jelajahi Peta Spasial"
      >
        <div className="relative w-full overflow-hidden bg-black/20" style={{ paddingBottom: "25%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image.png"
            alt="Peta Kampus Udayana"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-75 saturate-[0.7]"
            draggable={false}
          />
          <div className="absolute inset-0 bg-[#003466]/40 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[28px] drop-shadow-md group-hover:scale-110 transition-transform duration-200">
              explore
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white text-[#003466] gap-1">
          <span className="text-[12px] font-bold leading-tight">
            Jelajahi Peta Spasial
          </span>
          <span className="material-symbols-outlined text-[15px] opacity-75 group-hover:translate-y-0.5 transition-transform duration-200">
            arrow_downward
          </span>
        </div>
      </button>

      {/* ========================================================
          KONTEN UTAMA BANNER
          ======================================================== */}
      <div className="relative z-10 max-w-xl lg:max-w-2xl">
        {/* Header Baris Atas: Badge + Teks Link Mobile */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          {/* Badge Identitas Resmi */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#d5e3ff] text-xs font-semibold shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-[#fea619]">
              verified
            </span>
            <span>Universitas Udayana · Platform Resmi Sewa Lapak Kampus</span>
          </div>

          {/* Teks Link Mobile: Jelajahi Peta Spasial */}
          <button
            type="button"
            onClick={handleScrollToMap}
            className="md:hidden inline-flex items-center gap-1 text-xs font-semibold text-[#93bcfc] hover:text-white transition-colors cursor-pointer py-1"
          >
            <span className="material-symbols-outlined text-[16px] text-[#fea619]">
              explore
            </span>
            <span className="underline underline-offset-4 decoration-[#93bcfc]/50">
              Jelajahi Peta Spasial
            </span>
            <span className="material-symbols-outlined text-[14px]">
              arrow_downward
            </span>
          </button>
        </div>

        {/* Teks Headline Utama */}
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
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Tombol Utama: Sewa Lapak Sekarang */}
          <button
            type="button"
            onClick={onNavigateToKatalog}
            className="group inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-[#fea619] hover:bg-[#ffb95f] active:bg-[#e09214] text-[#2a1700] text-sm md:text-base font-bold shadow-lg shadow-[#fea619]/25 hover:shadow-[#fea619]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform duration-200 group-hover:scale-110">
              storefront
            </span>
            <span>Sewa Lapak Sekarang</span>
            <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </button>

          {/* Tombol Sekunder: Jelajah Lapak Beroperasi */}
          <button
            type="button"
            onClick={handleScrollToActiveStalls}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/5 border border-white/20 text-white text-sm md:text-base font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#4edea3]">
              store
            </span>
            <span>Jelajah Lapak Beroperasi</span>
          </button>

          {/* Tombol Tersier: Cara Sewa Lapak */}
          <button
            type="button"
            onClick={handleScrollToCaraSewa}
            className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-transparent border border-white/15 text-[#e2e7ff] hover:text-white text-sm md:text-base font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-[#fea619]">
              help
            </span>
            <span>Cara Sewa Lapak</span>
            <span className="material-symbols-outlined text-[15px] opacity-75">
              arrow_downward
            </span>
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

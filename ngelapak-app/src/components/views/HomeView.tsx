"use client";

import React, { Suspense } from "react";
import DashboardBanner from "@/components/home/DashboardBanner";
import ActiveStallsSection from "@/components/home/ActiveStallsSection";
import PublicValidationGateway from "@/components/home/PublicValidationGateway";
import type { Spot } from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";

export interface HomeStats {
  totalSpots: number;
  successfulPayments: number;
  availableFacilities: string;
}

export interface HomeViewProps {
  /**
   * Callback untuk menavigasi ke KatalogView ketika tombol CTA
   * 'Sewa Lapak Sekarang' atau tautan jelajah lainnya diklik.
   */
  onNavigateToKatalog: () => void;

  /**
   * Callback untuk membuka detail suatu spot tertentu saat kartu lapak diklik.
   */
  onNavigateToDetail?: (spot: Spot, initialTab?: "detail" | "operasional" | "fasilitas" | "ulasan") => void;

  /**
   * Callback untuk menampilkan notifikasi toast (opsional).
   */
  onShowToast?: (toast: Omit<ToastMessage, "id">) => void;

  /**
   * Data spot lapak aktif (opsional, jika kosong akan menggunakan data mock internal).
   */
  spots?: Spot[];
  isLoading?: boolean;

  stats: HomeStats;
  statsLoading?: boolean;
}


export default function HomeView({
  onNavigateToKatalog,
  onNavigateToDetail,
  onShowToast,
  spots,
  isLoading = false,
  stats,
  statsLoading = false,
}: HomeViewProps) {
  return (
    <div className="w-full min-h-screen bg-[#faf8ff] text-[#131b2e] pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-10 md:space-y-12">
        {/* ========================================================
            1. BANNER CTA UTAMA (DashboardBanner)
            ======================================================== */}
        <section aria-label="Banner Utama">
          <DashboardBanner onNavigateToKatalog={onNavigateToKatalog} />
        </section>

        {/* ========================================================
            2. RINGKASAN FITUR & STATISTIK KAMPUS
            ======================================================== */}
        <section
          aria-label="Statistik Layanan Kampus"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
        >
          {[
            {
              icon: "storefront",
              label: "Total Spot Terdaftar",
              val: `${stats.totalSpots} Spot`,
              desc: "Seluruh Zona Kampus",
              color: "text-[#003466]",
              bg: "bg-[#eef2f9]",
              loading: statsLoading,
            },
            {
              icon: "receipt_long",
              label: "Transaksi Berhasil",
              val: `${stats.successfulPayments}`,
              desc: "Bulan Berjalan",
              color: "text-[#855300]",
              bg: "bg-[#fff6ea]",
              loading: statsLoading,
            },
            {
              icon: "verified_user",
              label: "Status Legalitas",
              val: "100% Resmi",
              desc: "Izin Biro Aset Unud",
              color: "text-[#003c27]",
              bg: "bg-[#e2fced]",
              loading: false,
            },
            {
              icon: "bolt",
              label: "Fasilitas Standar",
              val: stats.availableFacilities,
              desc: "Fasilitas Tersedia",
              color: "text-[#003466]",
              bg: "bg-[#eef2f9]",
              loading: statsLoading,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-[20px] p-6 min-h-[166px] border border-[#e1e7ff] shadow-sm flex flex-col justify-between transition-shadow duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#737781] uppercase tracking-wide">
                  {item.label}
                </span>

                <div
                  className={`w-10 h-10 shrink-0 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {item.icon}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {item.loading ? (
                  <div className="h-9 w-28 rounded-md bg-gray-100 animate-pulse" />
                ) : (
                  <p className="text-[30px] font-bold text-[#131b2e] leading-tight tracking-tight">
                    {item.val}
                  </p>
                )}

                <p className="text-sm text-[#737781] mt-1">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* ========================================================
            3. SEKSI "LAPAK SEDANG BEROPERASI" (ActiveStallsSection)
            ======================================================== */}
        <Suspense fallback={null}>
          <ActiveStallsSection
            spots={spots}
            isLoading={isLoading}
            onViewDetail={onNavigateToDetail}
            onNavigateToKatalog={onNavigateToKatalog}
          />
        </Suspense>

        {/* ========================================================
            4. PANDUAN CARA SEWA CEPAT 
            ======================================================== */}
        <section
          id="cara-sewa-section"
          aria-labelledby="how-it-works-heading"
          className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-[#e2e7ff] shadow-sm"
        >
          <div className="max-w-2xl mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#855300] bg-[#fff6ea] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[15px]">
                lightbulb
              </span>
              Alur Mudah &amp; Cepat
            </span>
            <h3
              id="how-it-works-heading"
              className="text-xl sm:text-2xl font-bold text-[#131b2e] tracking-tight"
            >
              Cara Menyewa Lapak Kampus di Ngelapak
            </h3>
            <p className="text-sm text-[#424750] mt-1">
              4 langkah sederhana menyewa spot usaha temporer untuk kegiatan bazar,
              wirausaha mahasiswa, atau stan sponsorship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                icon: "search",
                title: "Pilih Spot & Zona",
                desc: "Jelajahi spot strategis di Lapangan Rektorat, Boulevard, SC, atau Agrokompleks.",
              },
              {
                step: "02",
                icon: "event",
                title: "Tentukan Durasi",
                desc: "Pilih tanggal mulai dan lama sewa (harian/mingguan) sesuai jadwal acaramu.",
              },
              {
                step: "03",
                icon: "payments",
                title: "Pembayaran Mudah",
                desc: "Bayar lewat Midtrans dalam satu jam sejak pesanan dibuat.",
              },
              {
                step: "04",
                icon: "verified",
                title: "Verifikasi Admin",
                desc: "Pembayaran terkonfirmasi otomatis. Unduh MOU dan cek batas pengajuan batal di Detail Pesanan.",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className="relative p-5 rounded-2xl bg-[#faf8ff] border border-[#eaedff] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#003466]/20">
                      {step.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#e2e7ff] text-[#003466] flex items-center justify-center shadow-xs">
                      <span className="material-symbols-outlined text-[20px]">
                        {step.icon}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-[#131b2e] mb-1.5">
                    {step.title}
                  </h4>
                  <p className="text-xs text-[#424750] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[#e2e7ff] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-[#737781]">
              Punya pertanyaan seputar tarif khusus Ormawa atau kegiatan sosial?
            </p>
            <div className="flex items-center gap-3">
              {onShowToast && (
                <button
                  type="button"
                  onClick={() =>
                    onShowToast({
                      type: "info",
                      message: "Tautan Panduan Disalin",
                      description: "Silakan kirimkan tautan informasi ke rekan atau panitia bazar Anda.",
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e2e7ff] hover:bg-[#eaedff] text-xs font-semibold text-[#424750] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">share</span>
                  <span>Bagikan Panduan</span>
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateToKatalog}
                className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#003466] hover:underline cursor-pointer"
              >
                <span>Mulai Reservasi Spot Sekarang</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            5. GERBANG VALIDASI TIKET / KONTRAK LAPANGAN TANPA LOGIN
            ======================================================== */}
        <PublicValidationGateway />
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState, useRef, useMemo, useSyncExternalStore } from "react";
import type { JadwalOperasionalItem, Review, Spot } from "@/lib/mock-data";
import dynamic from "next/dynamic";
import { formatRupiah, formatDate } from "@/lib/mock-data";
import TermsModal from "@/components/ui-custom/TermsModal";
import type { ToastMessage, DemoUser } from "@/lib/types";
import type { SupabaseProfile } from "@/lib/supabase/auth";
import BookingDateFields from "@/components/booking/BookingDateFields";
import { createSupabaseBooking } from "@/lib/supabase/bookings";
import { createClient } from "@/lib/supabase/client";
import { createDemoBooking, getAllDemoBookings, getDemoReviews, today } from "@/lib/demo-store";
import { getSupabaseReviewsBySpot } from "@/lib/supabase/reviews";
import {
  CANCELLATION_WINDOW_MS,
  CLEANING_DAYS,
  PAYMENT_WINDOW_MS,
  formatRentalTime,
  isDateBlocked,
  minimumRentalStartDate,
  nextAvailableDate,
  rentalStart,
  shiftRentalDate,
} from "@/lib/rental-policy";

type ScheduleRow = JadwalOperasionalItem & {
  statusVerifikasi?: string;
  isCleaning?: boolean;
};

const emptySubscribe = () => () => { };

// Dynamic import InteractiveMap buatan rekan tim (mencegah error window is not defined)
const InteractiveMap = dynamic(
  () => import("@/components/ui-custom/InteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full animate-pulse rounded-xl bg-[#eaedff] flex items-center justify-center text-xs text-[#737781]">
        Memuat Peta Lokasi...
      </div>
    ),
  }
);

interface DetailSpotViewProps {
  spot?: Spot;
  user: DemoUser | SupabaseProfile | null;
  initialTab?: "detail" | "operasional" | "fasilitas" | "ulasan";
  onBack: () => void;
  onLogin: () => void;
  onOrderDetail: (bookingId: string) => void;
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
}

export default function DetailSpotView({
  spot,
  user,
  initialTab = "detail",
  onBack,
  onLogin,
  onOrderDetail,
  onShowToast,
}: DetailSpotViewProps) {
  // State Form Booking & Pendaftaran Penjual (Jobdesk FE 3)
  const [startDate, setStartDate] = useState(minimumRentalStartDate);
  const [endDateStr, setEndDateStr] = useState(minimumRentalStartDate);
  const [kategoriPenjual, setKategoriPenjual] = useState<"Mahasiswa Wirausaha" | "UMKM Umum">("Mahasiswa Wirausaha");
  const [namaUsaha, setNamaUsaha] = useState("");
  const [jenisUsaha, setJenisUsaha] = useState("");
  const [catatanTambahan, setCatatanTambahan] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsMinimized, setTermsMinimized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reservedDates, setReservedDates] = useState<{ startDate: string; endDate: string }[]>([]);
  const [paidSchedule, setPaidSchedule] = useState<ScheduleRow[]>([]);
  const [dateMessage, setDateMessage] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const demoAccount = user?.id === "ayu" || user?.id === "bayu";
  const spotId = spot?.id;

  async function handleShareSpot() {
    if (!spot) return;
    const url = `${window.location.origin}/?view=detail&spot=${encodeURIComponent(spot.kode)}`;
    const shareData = {
      title: `${spot.nama} (${spot.kode}) – Ngelapak`,
      text: `Sewa spot lapak ${spot.nama} (${spot.kode}) di ${spot.lokasi} melalui Ngelapak UNUD.`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // dibatalkan pengguna
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      onShowToast({
        type: "success",
        message: "Tautan Lapak Disalin!",
        description: `Tautan untuk spot ${spot.nama} telah disalin ke clipboard.`,
      });
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      onShowToast({
        type: "info",
        message: "Bagikan Lapak",
        description: `Salin tautan: ${url}`,
      });
    }
  }

  useEffect(() => {
    if (!spotId || demoAccount || !/^[\da-f-]{36}$/i.test(spotId)) return;
    let active = true;
    async function loadAvailability() {
      if (!spotId) return;
      const client = createClient();
      const [reserved, schedule] = await Promise.all([
        client.rpc("get_reserved_lapak_dates", { p_spot_id: spotId }),
        client.rpc("get_spot_operating_schedule", { p_spot_id: spotId }),
      ]);
      if (!active) return;
      const day = today();
      const normalize = (value: string) => value.slice(0, 10);
      const reservedRanges = (reserved.data ?? []).map((row) => ({
        startDate: normalize(row.tanggal_mulai),
        endDate: normalize(row.tanggal_selesai),
      }));
      const scheduleRows = (schedule.data ?? []).map((row) => ({
        id: `booking-${row.booking_id}`,
        penjual: row.penjual,
        kategori: (row.kategori === "Mahasiswa Wirausaha" ? "Mahasiswa Wirausaha" : "UMKM Umum") as ScheduleRow["kategori"],
        startDate: normalize(row.tanggal_mulai),
        endDate: normalize(row.tanggal_selesai),
        status: normalize(row.tanggal_mulai) <= day ? "Active" as const : "Upcoming" as const,
        statusVerifikasi: "disetujui",
        isCleaning: normalize(row.tanggal_selesai) < day,
      }));
      // Gabungkan reserved + jadwal operasional lunas agar tanggal pasti terblokir.
      const merged = new Map<string, { startDate: string; endDate: string }>();
      for (const range of [...reservedRanges, ...scheduleRows.map((row) => ({
        startDate: row.startDate,
        endDate: row.endDate,
      }))]) {
        merged.set(`${range.startDate}:${range.endDate}`, range);
      }
      const ranges = [...merged.values()];
      setReservedDates(ranges);
      setPaidSchedule(scheduleRows);
      const occupied = ranges.map((range) => ({ start: range.startDate, end: range.endDate }));
      const openStart = nextAvailableDate(day, occupied);
      setStartDate((current) => {
        const nextStart = isDateBlocked(current, occupied) ? openStart : current;
        setEndDateStr((currentEnd) => (
          currentEnd < nextStart || isDateBlocked(currentEnd, occupied) ? nextStart : currentEnd
        ));
        return nextStart;
      });
    }
    void loadAvailability().catch(() => undefined);
    return () => { active = false; };
  }, [spotId, demoAccount]);

  // State Alur Pembayaran Interaktif
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [checkoutOpenedAt, setCheckoutOpenedAt] = useState(0);
  const [reservationId, setReservationId] = useState("");

  const [activeTab, setActiveTab] = useState<"detail" | "operasional" | "fasilitas" | "ulasan">(initialTab);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }
  const [imgError, setImgError] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const spotImages = useMemo(() => {
    if (spot?.gambarList && spot.gambarList.length > 0) return spot.gambarList;
    if (spot?.gambar) return [spot.gambar];
    return [];
  }, [spot]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40 && spotImages.length > 1) {
      if (diff > 0) {
        // Swipe left -> Next
        setActiveImageIdx((prev) => (prev + 1) % spotImages.length);
      } else {
        // Swipe right -> Prev
        setActiveImageIdx((prev) => (prev - 1 + spotImages.length) % spotImages.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Client-side rendering flag untuk InteractiveMap Leaflet
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // GUARD CLAUSE: Mencegah error jika spot belum dikirim dari parent component
  if (!spot) {
    return (
      <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-6">
        <div className="text-center bg-white p-8 rounded-2xl border border-[#e2e7ff] shadow-sm max-w-sm w-full">
          <div className="w-8 h-8 border-4 border-[#003466] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-[#131b2e] mb-1">Memuat Data Spot...</p>
          <p className="text-xs text-[#737781] mb-6">Mohon tunggu sebentar</p>
          <button
            onClick={onBack}
            className="w-full h-10 rounded-xl bg-[#eaedff] text-[#003466] text-xs font-semibold hover:bg-[#dae2fd] transition-colors"
          >
            ← Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  // Jadwal operasional: booking yang sudah berhasil bayar / tervalidasi
  const currentDay = today();
  const bookings = isMounted && demoAccount ? getAllDemoBookings() : [];
  const fixtureJadwalList = spot.jadwalOperasional || [];
  const demoSpotBookings = bookings.filter((booking) =>
    booking.spotId === spot.id &&
    booking.status !== "dibatalkan" &&
    booking.statusVerifikasi !== "ditolak" &&
    shiftRentalDate(booking.tanggalSelesai, CLEANING_DAYS) >= currentDay
  );
  const bookingScheduleList: ScheduleRow[] = demoAccount
    ? demoSpotBookings
      .filter((booking) => booking.statusVerifikasi === "disetujui" && booking.status !== "menunggu")
      .map((booking) => ({
        id: `booking-${booking.id}`,
        penjual: booking.penyewa.nama,
        kategori: "UMKM Umum" as const,
        startDate: booking.tanggalMulai,
        endDate: booking.tanggalSelesai,
        status: booking.tanggalMulai <= currentDay ? "Active" as const : "Upcoming" as const,
        statusVerifikasi: booking.statusVerifikasi,
        isCleaning: booking.tanggalSelesai < currentDay,
      }))
    : paidSchedule;
  const jadwalGabungan = [...fixtureJadwalList, ...bookingScheduleList];

  const jadwalList = jadwalGabungan.filter(
    (item, index, self) =>
      index === self.findIndex(
        (other) =>
          other.penjual === item.penjual &&
          other.startDate === item.startDate &&
          other.endDate === item.endDate
      )
  );
  const unavailableRanges = demoAccount
    ? demoSpotBookings.map((booking) => ({
      startDate: booking.tanggalMulai,
      endDate: booking.tanggalSelesai,
    }))
    : reservedDates;
  const occupiedForPicker = unavailableRanges.map((range) => ({
    start: range.startDate,
    end: range.endDate,
  }));

  // Perhitungan Tarif & Durasi
  const tarif = spot.tarifPerHari;
  const selectedDays = (Date.parse(endDateStr) - Date.parse(startDate)) / CANCELLATION_WINDOW_MS + 1;
  const totalBayar = tarif * selectedDays;
  const cleaningEnd = shiftRentalDate(endDateStr, CLEANING_DAYS);
  const isConflicted = unavailableRanges.some(({ startDate: occupiedStart, endDate: occupiedEnd }) =>
    startDate <= shiftRentalDate(occupiedEnd, CLEANING_DAYS) && cleaningEnd >= occupiedStart,
  );
  const isSelectedPeriodAvailable = spot.status !== "pemeliharaan" && !isConflicted;


  const ULASAN_MOCK = [
    { nama: "Ayu Maharani", fakultas: "FT", rating: 5, komentar: "Lokasi sangat strategis, banyak mahasiswa lewat. Fasilitas lengkap!", tanggal: "15 Okt 2026" },
    { nama: "Bayu Pratama", fakultas: "FEB", rating: 4, komentar: "Spotnya bersih dan nyaman. Kanopi cukup untuk melindungi dari hujan.", tanggal: "10 Okt 2026" },
    { nama: "Deva Mahendra", fakultas: "FH", rating: 5, komentar: "Proses booking mudah, admin responsif. Pasti akan sewa lagi!", tanggal: "5 Okt 2026" },
  ];

  const [spotReviews, setSpotReviews] = useState<Review[]>([]);
  const isDemo = user?.id === "ayu" || user?.id === "bayu";

  useEffect(() => {
    if (!spot) return;
    let active = true;
    async function loadReviews() {
      if (isDemo) {
        const revs = getDemoReviews(spot!.id);
        if (active) setSpotReviews(revs);
        return;
      }
      try {
        const revs = await getSupabaseReviewsBySpot(spot!.id);
        if (active) {
          if (revs.length > 0) {
            setSpotReviews(revs);
          } else {
            setSpotReviews(getDemoReviews(spot!.id));
          }
        }
      } catch {
        if (active) setSpotReviews(getDemoReviews(spot!.id));
      }
    }
    loadReviews();
    return () => {
      active = false;
    };
  }, [spot?.id, isDemo]);

  const displayedReviews = useMemo(() => {
    if (spotReviews.length > 0) return spotReviews;
    const spotId = spot?.id || "default";
    return ULASAN_MOCK.map((m, idx) => ({
      id: `mock-${idx}`,
      bookingId: `mock-bkg-${idx}`,
      spotId,
      nama: m.nama,
      fakultas: m.fakultas,
      rating: m.rating,
      komentar: m.komentar,
      tanggal: m.tanggal,
      createdAt: new Date().toISOString(),
    }));
  }, [spotReviews, spot?.id]);

  // LANGKAH 1: Validasi Form & Buka Modal Pembayaran (Barcode QRIS & Token)
  const handleOpenPayment = () => {
    if (!user) { onLogin(); return; }
    if (user.role !== "penyewa") {
      onShowToast({ type: "error", message: "Pemesanan hanya tersedia untuk penyewa" });
      return;
    }
    if (!namaUsaha.trim()) {
      onShowToast({ type: "error", message: "Nama Usaha / Brand harus diisi", description: "Lengkapi data pendaftaran penjual" });
      return;
    }
    if (!jenisUsaha.trim()) {
      onShowToast({ type: "error", message: "Jenis usaha harus diisi", description: "Lengkapi semua field yang diperlukan" });
      return;
    }
    if (!Number.isInteger(selectedDays) || selectedDays < 1 || selectedDays > 30) {
      onShowToast({ type: "error", message: "Pilih tanggal sewa antara 1 dan 30 hari." });
      return;
    }
    if (startDate < minimumRentalStartDate()) {
      onShowToast({ type: "error", message: "Tanggal mulai sewa paling cepat dua hari dari hari ini." });
      return;
    }
    if (isConflicted) {
      onShowToast({ type: "error", message: "Tanggal tidak tersedia", description: "Pilih tanggal sewa lain." });
      return;
    }
    if (!agreeTerms) {
      onShowToast({ type: "warning", message: "Setujui syarat & ketentuan", description: "Centang persetujuan untuk melanjutkan" });
      return;
    }

    const now = Date.now();
    if (now + PAYMENT_WINDOW_MS > rentalStart(startDate)) {
      onShowToast({ type: "error", message: "Pemesanan ditutup satu jam sebelum sewa mulai (08.00 WITA)." });
      return;
    }

    // Keep the same checkout ID when the request is retried.
    if (!reservationId) setReservationId("MT-" + crypto.randomUUID().replaceAll("-", ""));
    setCheckoutOpenedAt(now);
    setShowPaymentStep(true);
  };

  const handleConfirmPayment = async () => {
    if (!user || user.role !== "penyewa" || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (demoAccount) {
        const id = createDemoBooking({
          spotId: spot.id, tanggalMulai: startDate, jumlahHari: selectedDays,
          jenisUsaha, namaUsaha, kategoriPenjual, catatan: catatanTambahan, metodePembayaran: "midtrans",
        });
        onOrderDetail(id);
        return;
      }
      const checkout = await createSupabaseBooking({
        id: reservationId, spotKode: spot.kode, tanggalMulai: startDate, jumlahHari: selectedDays,
        totalBayar, jenisUsaha, namaUsaha, kategoriPenjual, catatan: catatanTambahan, setuju: agreeTerms,
      });
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      onShowToast({
        type: "error", message: "Pembayaran gagal dibuka",
        description: error instanceof Error ? error.message : "Coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showPaymentStep) {
    const cutoff = rentalStart(startDate) - CANCELLATION_WINDOW_MS;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <h3 id="checkout-title" className="text-xl font-bold text-[#131b2e]">{demoAccount ? "Pembayaran demo" : "Bayar lewat Midtrans"}</h3>
          <p className="text-sm text-[#424750]">{spot.nama} · {formatDate(startDate)} – {formatDate(endDateStr)}</p>
          <p className="text-xl font-bold text-[#003466]">{formatRupiah(totalBayar)}</p>
          <p className="text-sm text-[#424750]">Bayar dalam 1 jam sejak pesanan dibuat. Jadwal ditahan selama menunggu pembayaran.</p>
          <p className="rounded-lg bg-[#f2f3ff] p-3 text-sm text-[#003466]">{checkoutOpenedAt >= cutoff
            ? "Batas pengajuan batal untuk jadwal ini sudah lewat. Pastikan tanggal sewa sebelum membayar."
            : `Pengajuan batal tersedia maksimal 24 jam setelah lunas, paling lambat ${formatRentalTime(cutoff)}.`}</p>
          {demoAccount && <p className="text-sm text-[#424750]">Simulasikan pembayaran dari Detail Pesanan.</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" disabled={isSubmitting} onClick={() => { setShowPaymentStep(false); setReservationId(""); }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#003466]">Kembali</button>
            <button type="button" disabled={isSubmitting} onClick={handleConfirmPayment}
              className="rounded-lg bg-[#003466] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? "Menyiapkan…" : demoAccount ? "Buat pesanan demo" : "Lanjut ke Midtrans"}
            </button>
          </div>
        </section>
      </div>
    );
  }


  // TAMPILAN UTAMA (KATALOG DETAIL SPOT & FORM PEMESANAN)
  return (
    <div className="bg-[#faf8ff] min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Breadcrumb Navigasi & Tombol Bagikan */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 text-[13px]">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="text-[#003466] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Kembali ke Katalog
            </button>
            <span className="text-[#737781]">/</span>
            <span className="text-[#424750]">{spot.zona ? spot.zona.charAt(0).toUpperCase() + spot.zona.slice(1) : "Bazar"}</span>
            <span className="text-[#737781]">/</span>
            <span className="text-[#131b2e] font-semibold">{spot.nama}</span>
          </div>

          <button
            type="button"
            onClick={handleShareSpot}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#e2e7ff] hover:bg-[#eaedff] text-[#003466] font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            title="Bagikan tautan lapak ini"
            aria-label="Bagikan lapak"
          >
            <span className="material-symbols-outlined text-[16px]">
              {shareCopied ? "check_circle" : "share"}
            </span>
            <span>{shareCopied ? "Tautan Disalin!" : "Bagikan Lapak"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KIRI: Detail Spot & Peta Interaktif Leaflet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gambar Hero Spot (Interactive Swipe Carousel) */}
            <div
              className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-[#eaedff] shadow-sm select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {spotImages.length > 0 && !imgError ? (
                <img
                  src={spotImages[activeImageIdx] || spotImages[0]}
                  alt={`${spot.nama} - Foto ${activeImageIdx + 1}`}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={() => setImgError(true)}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#003466]/30 to-[#1a4b84]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/30 text-[80px]">storefront</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wide shadow-sm ${isSelectedPeriodAvailable
                  ? "bg-[#6ffbbe] text-[#002113]"
                  : spot.status === "pemeliharaan"
                    ? "bg-[#e2e7ff] text-[#424750]"
                    : "bg-[#ffddb8] text-[#2a1700]"
                  }`}>
                  {isSelectedPeriodAvailable
                    ? "Tersedia untuk periode pilihan"
                    : spot.status === "pemeliharaan"
                      ? "Pemeliharaan"
                      : "Tidak tersedia pada periode pilihan"}
                </span>
              </div>

              {/* Photo Counter Badge (jika ada lebih dari 1 foto) */}
              {spotImages.length > 1 && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                  <span>{activeImageIdx + 1} / {spotImages.length}</span>
                </div>
              )}

              {/* Tombol Navigasi Carousel Kiri & Kanan */}
              {spotImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev - 1 + spotImages.length) % spotImages.length);
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer shadow-md"
                    aria-label="Foto sebelumnya"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev + 1) % spotImages.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer shadow-md"
                    aria-label="Foto berikutnya"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>

                  {/* Indikator Titik (Dots) di Bawah Carousel */}
                  <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5">
                    {spotImages.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setActiveImageIdx(dotIdx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${dotIdx === activeImageIdx
                          ? "w-6 bg-white shadow-sm"
                          : "w-2 bg-white/50 hover:bg-white/80"
                          }`}
                        aria-label={`Lihat foto ${dotIdx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Rating & Total Sewa */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[#fea619] text-[14px]">star</span>
                  <span className="text-white text-[13px] font-semibold">{spot.rating}</span>
                </div>
                <span className="text-white/90 text-[12px] drop-shadow-sm">{spot.totalSewa || 0} kali disewa</span>
              </div>
            </div>

            {/* Nama & Zona Spot */}
            <div>
              <div className="flex items-center gap-2 text-[#855300] text-[13px] font-semibold mb-1.5">
                <span className="material-symbols-outlined text-[14px]">domain</span>
                {spot.zonaLabel || spot.zona}
              </div>
              <h1 className="text-[26px] md:text-[30px] font-bold text-[#131b2e] mb-2 leading-tight">
                {spot.nama}
              </h1>
              <div className="flex items-center gap-2 text-[#424750] text-[13px]">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {spot.lokasi}
              </div>
            </div>

            {/* Navigasi Tabs */}
            <div className="border-b border-[#e2e7ff]">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: "detail", label: "Detail & Spesifikasi" },
                  { id: "operasional", label: "Jadwal Operasional" },
                  { id: "fasilitas", label: "Fasilitas" },
                  { id: "ulasan", label: `Ulasan (${displayedReviews.length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as "detail" | "operasional" | "fasilitas" | "ulasan")}
                    className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all capitalize shrink-0 ${activeTab === tab.id
                      ? "border-[#003466] text-[#003466]"
                      : "border-transparent text-[#424750] hover:text-[#131b2e]"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content 1: Detail & Spesifikasi + InteractiveMap */}
            {activeTab === "detail" && (
              <div className="space-y-5">
                <p className="text-[14px] text-[#424750] leading-relaxed">{spot.deskripsi}</p>

                {/* Integrasi Peta Interaktif Leaflet Rekan Tim */}
                <div className="space-y-3">
                  <p className="text-[12px] text-[#737781] font-semibold uppercase tracking-wide">
                    Lokasi Spot & Peta Interaktif
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[#e2e7ff]">
                    {isMounted ? (
                      <InteractiveMap
                        spots={[spot]}
                        context="detail"
                        showFilters={false}
                        showLegend={false}
                      />
                    ) : (
                      <div className="h-48 w-full animate-pulse rounded-xl bg-[#eaedff] flex items-center justify-center text-xs text-[#737781]">
                        Memuat Peta...
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: "aspect_ratio", label: "Ukuran", value: spot.ukuranLabel || spot.ukuran },
                    { icon: "bolt", label: "Daya Listrik", value: `${spot.daya || 1300} Watt` },
                    { icon: "payments", label: "Tarif/Hari", value: formatRupiah(tarif) },
                    { icon: "event_available", label: "Total Sewa", value: `${spot.totalSewa || 0}× disewa` },
                  ].map((spec) => (
                    <div key={spec.label} className="bg-[#f2f3ff] rounded-xl p-3.5 flex flex-col gap-1">
                      <span className="material-symbols-outlined text-[#003466] text-[20px]">{spec.icon}</span>
                      <span className="text-[11px] text-[#737781] font-medium uppercase tracking-wide">{spec.label}</span>
                      <span className="text-[14px] font-bold text-[#131b2e]">{spec.value}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {spot.tags && (
                  <div>
                    <p className="text-[12px] text-[#737781] font-semibold uppercase tracking-wide mb-2">Karakteristik Spot</p>
                    <div className="flex flex-wrap gap-2">
                      {spot.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-[#eaedff] text-[#003466] text-[12px] font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 2: Jadwal Operasional Unik per Spot */}
            {activeTab === "operasional" && (
              <div className="space-y-4">
                <h3 className="text-[14px] font-bold text-[#131b2e] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#855300] text-[18px]">local_fire_department</span>
                  Operasional Sedang Berlangsung (Active)
                </h3>
                {jadwalList.filter((s) => s.status === "Active").length > 0 ? (
                  jadwalList
                    .filter((s) => s.status === "Active")
                    .map((item) => (
                      <div key={item.id} className="bg-[#ffddb8]/30 p-3.5 rounded-xl border border-[#ffddb8] flex justify-between items-center">
                        <div>
                          <span className="text-[11px] font-bold text-[#855300] bg-[#ffddb8] px-2 py-0.5 rounded inline-block mb-1">
                            {item.kategori}
                          </span>
                          <p className="font-bold text-[#131b2e] text-[13px]">{item.penjual}</p>
                          <p className="text-[11px] text-[#737781]">
                            Tanggal Selesai: <strong>{formatDate(item.endDate)}</strong>
                          </p>
                          <p className="text-[11px] text-[#855300]">
                            Cleaning area sampai {formatDate(shiftRentalDate(item.endDate, CLEANING_DAYS))}
                          </p>
                          <a href={`/?produk=${encodeURIComponent(spot.kode)}`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#003466] underline">

                            Lihat deskripsi produk
                          </a>
                        </div>
                        <span className="bg-[#855300] text-white text-[11px] px-2.5 py-1 rounded-full font-bold">
                          {"statusVerifikasi" in item && item.statusVerifikasi === "menunggu"
                            ? "Menunggu Verifikasi"
                            : "isCleaning" in item && item.isCleaning
                              ? "Masa Cleaning"
                              : "Sedang Beroperasi"}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-[#737781] italic">Tidak ada operasional aktif di spot ini saat ini.</p>
                )}

                <h3 className="text-[14px] font-bold text-[#131b2e] mt-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#003466] text-[18px]">event_upcoming</span>
                  Jadwal Operasional Mendatang (Tervalidasi)
                </h3>
                {jadwalList.filter((s) => s.status === "Upcoming").length > 0 ? (
                  jadwalList
                    .filter((s) => s.status === "Upcoming")
                    .map((item) => (
                      <div key={item.id} className="bg-[#f2f3ff] p-3.5 rounded-xl border border-[#e2e7ff] flex justify-between items-center">
                        <div>
                          <span className="text-[11px] font-semibold text-[#003466] bg-[#eaedff] px-2 py-0.5 rounded inline-block mb-1">
                            {item.kategori}
                          </span>
                          <p className="font-semibold text-[#131b2e] text-[13px]">{item.penjual}</p>
                          <p className="text-[11px] text-[#737781]">
                            {formatDate(item.startDate)} s/d {formatDate(item.endDate)}
                          </p>
                          <p className="text-[11px] text-[#855300]">
                            Cleaning area sampai {formatDate(shiftRentalDate(item.endDate, CLEANING_DAYS))}
                          </p>
                          <a href={`/?produk=${encodeURIComponent(spot.kode)}`} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#003466] underline">

                            Lihat deskripsi produk
                          </a>
                        </div>
                        <span className="bg-[#eaedff] text-[#003466] text-[11px] px-2.5 py-1 rounded-full border border-[#003466]/20">
                          {"statusVerifikasi" in item && item.statusVerifikasi === "menunggu" ? "Menunggu Verifikasi" : "Tervalidasi"}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-[#737781] italic">Belum ada jadwal operasional mendatang untuk spot ini.</p>
                )}
              </div>
            )}

            {/* Tab Content 3: Fasilitas */}
            {activeTab === "fasilitas" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ...(spot.fasilitas ? spot.fasilitas.map((f) => ({ label: f, included: true })) : []),
                  { label: "Jalur Air Bersih", included: spot.fasilitas?.some(f => f.toLowerCase().includes("air")) ?? false },
                  { label: "WiFi Kampus", included: spot.fasilitas?.some(f => f.toLowerCase().includes("wifi")) ?? false },
                  { label: "Meja & Kursi", included: spot.fasilitas?.some(f => f.toLowerCase().includes("meja")) ?? false },
                  { label: "CCTV Keamanan", included: true },
                ].filter((item, index, arr) => arr.findIndex(i => i.label === item.label) === index)
                  .map((facility) => (
                    <div key={facility.label} className="flex items-center gap-3 p-3.5 rounded-xl border bg-white border-[#e2e7ff]">
                      <span className="material-symbols-outlined text-[#003466] text-[18px]">check_circle</span>
                      <span className="text-[13px] font-medium text-[#131b2e]">{facility.label}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Tab Content 4: Ulasan */}
            {activeTab === "ulasan" && (
              <div className="space-y-4">
                {displayedReviews.map((ulasan, i) => (
                  <div key={ulasan.id || i} className="bg-white rounded-xl p-4 border border-[#e2e7ff] shadow-xs">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a4b84] flex items-center justify-center text-white font-bold text-xs uppercase">
                          {ulasan.nama ? ulasan.nama[0] : "U"}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[#131b2e]">{ulasan.nama}</p>
                          <p className="text-[11px] text-[#737781]">
                            {ulasan.fakultas ? `${ulasan.fakultas} • ` : ""}{ulasan.tanggal || "Penyewa Lapak"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`material-symbols-outlined text-[14px] ${star <= ulasan.rating ? "text-amber-400 fill-1" : "text-[#d1d7e8]"
                              }`}
                            style={{ fontVariationSettings: star <= ulasan.rating ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        ))}
                        <span className="text-[11px] font-bold text-amber-800 ml-1">
                          {ulasan.rating}
                        </span>
                      </div>
                    </div>
                    <p className="text-[13px] text-[#424750] leading-relaxed mt-2">{ulasan.komentar}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* KANAN: Form Pemesanan & Formulir Pendaftaran Penjual */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-5 border border-[#e2e7ff] sticky top-20">
              {/* Header Tarif */}
              <div className="flex items-end justify-between mb-5 pb-4 border-b border-[#e2e7ff]">
                <div>
                  <span className="text-[11px] text-[#737781] font-medium uppercase tracking-wide block mb-1">
                    Tarif Sewa
                  </span>
                  <div className="text-[26px] font-bold text-[#131b2e] leading-none">
                    {formatRupiah(tarif)}
                    <span className="text-[13px] text-[#737781] font-normal"> / hari</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[12px] font-bold ${isSelectedPeriodAvailable ? "bg-[#6ffbbe] text-[#002113]" : "bg-[#ffddb8] text-[#2a1700]"
                  }`}>
                  {isSelectedPeriodAvailable ? "✓ Tersedia" : spot.status === "pemeliharaan" ? "Pemeliharaan" : "Dipesan"}
                </div>
              </div>

              {!user || user.role === "admin" ? (
                <div className="rounded-xl bg-[#f2f3ff] p-5 text-sm space-y-3">
                  <p>{user ? "Anda masuk sebagai admin. Gunakan menu Verifikasi untuk memeriksa pengajuan penyewa." : "Masuk sebagai penyewa untuk memilih jadwal dan mengajukan sewa lapak."}</p>
                  {!user && <button onClick={onLogin} className="w-full rounded-lg bg-[#003466] text-white py-3 font-semibold">Masuk untuk menyewa</button>}
                </div>
              ) : spot.status !== "pemeliharaan" ? (
                <div className="space-y-4">

                  {/* Jobdesk FE 3: Kategori Penjual */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Kategori Penjual *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setKategoriPenjual("Mahasiswa Wirausaha")}
                        className={`py-2 text-[11px] font-bold rounded-lg border transition-all ${kategoriPenjual === "Mahasiswa Wirausaha"
                          ? "bg-[#003466] text-white border-[#003466]"
                          : "bg-[#f2f3ff] text-[#424750] border-[#e2e7ff]"
                          }`}
                      >
                        Mahasiswa Wirausaha
                      </button>
                      <button
                        type="button"
                        onClick={() => setKategoriPenjual("UMKM Umum")}
                        className={`py-2 text-[11px] font-bold rounded-lg border transition-all ${kategoriPenjual === "UMKM Umum"
                          ? "bg-[#003466] text-white border-[#003466]"
                          : "bg-[#f2f3ff] text-[#424750] border-[#e2e7ff]"
                          }`}
                      >
                        UMKM Umum
                      </button>
                    </div>
                  </div>

                  {/* Jobdesk FE 3: Nama Usaha / Brand */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Nama Usaha / Brand *
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Es Teh Kampus / Snack Udayana"
                      value={namaUsaha}
                      onChange={(e) => setNamaUsaha(e.target.value)}
                      className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all"
                    />
                  </div>

                  <BookingDateFields
                    occupied={occupiedForPicker}
                    startDate={startDate}
                    endDate={endDateStr}
                    minDate={minimumRentalStartDate()}
                    conflicted={isConflicted}
                    onChange={({ start, end }) => {
                      setDateMessage("");
                      setStartDate(start);
                      setEndDateStr(end);
                    }}
                    onBlockedSelect={(mark) => {
                      setDateMessage(
                        mark === "rental"
                          ? "Tanggal ini sudah tervalidasi dan tidak bisa dipilih."
                          : "Tanggal ini masuk masa cleaning 3 hari dan tidak bisa dipilih.",
                      );
                    }}
                  />
                  <p className="rounded-lg bg-[#eef3ff] px-3 py-2 text-[11px] text-[#003466]">
                    Pemesanan tersedia paling cepat H+2. Status lapak di atas mengikuti periode yang Anda pilih.
                  </p>
                  <div className="text-center py-2 bg-[#f2f3ff] rounded-lg text-[14px] font-bold text-[#131b2e]">
                    Durasi sewa : {selectedDays} hari
                  </div>
                  <p className="text-[11px] text-[#737781]">
                    {formatDate(startDate)} – {formatDate(endDateStr)}
                  </p>

                  {(isConflicted || dateMessage) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-[12px] text-red-600">
                      {dateMessage || "Tanggal bertabrakan dengan jadwal sewa atau masa pembersihan. Silakan pilih tanggal lain."}
                    </div>
                  )}

                  {/* Jenis Usaha */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Jenis Usaha *
                    </label>
                    <select
                      value={jenisUsaha}
                      onChange={(e) => setJenisUsaha(e.target.value)}
                      className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[14px] rounded-lg outline-none appearance-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all"
                    >
                      <option value="">Pilih jenis usaha...</option>
                      <option value="kuliner">Kuliner & Minuman</option>
                      <option value="merchandise">Merchandise & Souvenir</option>
                      <option value="pameran">Pameran & Eksibisi</option>
                      <option value="jasa">Jasa & Konsultasi</option>
                      <option value="bazar">Bazar Umum</option>
                    </select>
                  </div>

                  {/* Catatan / Spesifikasi Produk */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Spesifikasi Produk / Catatan
                    </label>
                    <textarea
                      value={catatanTambahan}
                      onChange={(e) => setCatatanTambahan(e.target.value)}
                      rows={2}
                      placeholder="Deskripsi singkat produk atau kebutuhan khusus..."
                      className="w-full px-3 py-2 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all resize-none placeholder:text-[#737781]"
                    />
                  </div>

                  {/* Rincian Biaya */}
                  <div className="bg-[#f2f3ff] rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="text-[#424750]">{formatRupiah(tarif)} × {selectedDays} hari</span>
                      <span className="font-semibold text-[#131b2e]">{formatRupiah(totalBayar)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] mb-2">
                      <span className="text-[#424750]">Biaya layanan platform</span>
                      <span className="text-[#4edea3] font-semibold">Gratis</span>
                    </div>
                    <div className="pt-2 border-t border-[#e2e7ff] flex items-center justify-between">
                      <span className="font-bold text-[#131b2e] text-[14px]">Total</span>
                      <span className="font-bold text-[#003466] text-[18px]">{formatRupiah(totalBayar)}</span>
                    </div>
                  </div>

                  {/* Syarat & Ketentuan Minimized Scrollable Box */}
                  <div className="space-y-2">
                    <div className="rounded-xl border border-[#c5cbe0] bg-white shadow-xs overflow-hidden">
                      {/* Header dengan logo maximize di pojok kiri atas */}
                      <div className="bg-[#f4f6ff] px-3.5 py-2.5 border-b border-[#e2e7ff] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setShowTerms(true); setTermsMinimized(false); }}
                            className="w-7 h-7 rounded-lg bg-[#003466] hover:bg-[#1a4b84] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                            title="Perbesar / Maximize Syarat & Ketentuan"
                            aria-label="Perbesar Syarat & Ketentuan"
                          >
                            <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                          </button>
                          <span className="text-[12px] font-bold text-[#003466]">
                            Syarat &amp; Ketentuan
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#855300] bg-[#fff4e5] border border-[#ffd8a8] px-2 py-0.5 rounded-full">
                          Scroll untuk membaca
                        </span>
                      </div>

                      {/* Isi ringkas SnK yang bisa discroll langsung */}
                      <div className="h-40 overflow-y-auto p-3 text-[11px] text-[#424750] leading-relaxed space-y-2 bg-[#fdfdff] border-b border-[#f0f2fa] select-text">
                        <div className="p-2 rounded-lg bg-[#e8f0fe] border border-[#c2d7fe] text-[#003466] font-medium">
                          <strong>Ketentuan Pemesanan:</strong> Pemesanan lapak hanya dapat dilakukan mulai <strong>minimal H+2 (dua hari kalender)</strong> sebelum tanggal mulai sewa untuk verifikasi dan persiapan lokasi.
                        </div>
                        <p><strong>Pasal 1 - Ketentuan Umum:</strong> Ngelapak memfasilitasi proses pencarian informasi dan pengajuan sewa lapak di lingkungan Universitas Udayana.</p>
                        <p><strong>Pasal 2 - Akurasi Informasi:</strong> Pengguna wajib memberikan informasi identitas diri dan usaha secara benar, lengkap, dan bertanggung jawab.</p>
                        <p><strong>Pasal 3 - Pengajuan &amp; Jadwal:</strong> Tanggal mulai sewa ditetapkan paling cepat H+2 setelah pengajuan. Durasi sewa 1–30 hari. Penggunaan lapak harus sesuai peruntukan.</p>
                        <p><strong>Pasal 4 - Tarif &amp; Pembayaran:</strong> Biaya sewa dibayar lunas melalui metode pembayaran yang disediakan dalam batas waktu 1 jam setelah pesanan dibuat.</p>
                        <p><strong>Pasal 5 - Tata Tertib &amp; Kebersihan:</strong> Penyewa wajib menyediakan tempat sampah mandiri, membersihkan area dalam radius 3 meter setiap hari, dilarang membuang limbah minyak/cairan sembarangan, serta batas listrik maksimal 450 Watt.</p>
                        <p><strong>Pasal 6 - Pembatalan:</strong> Pengajuan pembatalan maksimal 24 jam setelah lunas dan paling lambat 24 jam sebelum sewa mulai (08.00 WITA).</p>
                        <p><strong>Pasal 7 - Larangan:</strong> Dilarang menjual miras, narkotika, zat terlarang, atau memperjualbelikan izin lapak ke pihak ketiga.</p>
                        <p><strong>Pasal 8 &amp; 9 - Penutup:</strong> Klik ikon perbesar di pojok kiri atas untuk membaca naskah Syarat &amp; Ketentuan lengkap.</p>
                      </div>

                      {/* Checkbox persetujuan */}
                      <div className="p-2.5 bg-[#faf8ff] flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded accent-[#003466] cursor-pointer shrink-0"
                        />
                        <label htmlFor="terms" className="text-[12px] text-[#424750] leading-snug cursor-pointer">
                          Saya telah membaca dan menyetujui seluruh <strong>Syarat &amp; Ketentuan</strong> di atas.
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Modal Syarat & Ketentuan — minimizable */}
                  <TermsModal
                    open={showTerms}
                    minimized={termsMinimized}
                    onClose={() => { setShowTerms(false); setTermsMinimized(false); }}
                    onMinimize={() => setTermsMinimized(true)}
                    onRestore={() => setTermsMinimized(false)}
                  />
                  {/* Tombol Membuka Modal Pembayaran (QRIS / Token) */}
                  <button
                    onClick={handleOpenPayment}
                    disabled={isConflicted}
                    className={`w-full h-12 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${isConflicted
                      ? "bg-[#eaedff] text-[#737781] cursor-not-allowed"
                      : "bg-[#003466] text-white hover:bg-[#1a4b84] shadow-md hover:shadow-lg"
                      }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    <span>Lanjut ke Pembayaran →</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[48px] text-[#737781] mb-3">build</span>
                  <p className="text-[14px] font-semibold text-[#131b2e] mb-2">Sedang Dalam Pemeliharaan</p>
                  <p className="text-[12px] text-[#737781]">
                    Spot ini sementara tidak dapat disewa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

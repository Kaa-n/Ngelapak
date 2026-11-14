"use client";

import React, { useState, useSyncExternalStore } from "react";
import type { Spot } from "@/lib/mock-data";
import dynamic from "next/dynamic";
import { formatRupiah, formatDate } from "@/lib/mock-data";
import type { ToastMessage, DemoUser } from "@/lib/types";
import type { SupabaseProfile } from "@/lib/supabase/auth";
import { createSupabaseBooking } from "@/lib/supabase/bookings";
import { createDemoBooking, today } from "@/lib/demo-store";

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
  const [selectedDays, setSelectedDays] = useState(1);
  const [startDate, setStartDate] = useState(() => today());
  const [kategoriPenjual, setKategoriPenjual] = useState<"Mahasiswa Wirausaha" | "UMKM Umum">("Mahasiswa Wirausaha");
  const [namaUsaha, setNamaUsaha] = useState("");
  const [jenisUsaha, setJenisUsaha] = useState("");
  const [catatanTambahan, setCatatanTambahan] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("qris");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);

  // State Alur Pembayaran Interaktif
  const [showPaymentStep, setShowPaymentStep] = useState(false); // Modal Barcode QRIS & Token
  const [bookingSuccess, setBookingSuccess] = useState(false);   // Ringkasan Halaman Sukses
  const [reservationId, setReservationId] = useState("");

  const [activeTab, setActiveTab] = useState<"detail" | "operasional" | "fasilitas" | "ulasan">(initialTab);
  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (prevInitialTab !== initialTab) {
    setPrevInitialTab(initialTab);
    setActiveTab(initialTab);
  }
  const [imgError, setImgError] = useState(false);

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

  // BACA DATA JADWAL OPERASIONAL UNIK PER SPOT (Dinamis dari mock-data.ts)
  const jadwalList = spot.jadwalOperasional || [];

  // Perhitungan Tarif & Durasi
  const tarif = spot.tarifPerHari;
  const totalBayar = tarif * selectedDays;

  const endDate = new Date((startDate || today()) + "T00:00:00Z");
  endDate.setUTCDate(endDate.getUTCDate() + selectedDays - 1);
  const endDateStr = Number.isFinite(endDate.getTime()) ? endDate.toISOString().split("T")[0] : today();

  // Logika Validasi Tanggal Bentrok dengan Jadwal Operasional
  const checkOverlap = (startInput: string, days: number) => {
    try {
      const sTime = new Date(startInput).getTime();
      const eTime = sTime + (days - 1) * 86400000;
      return jadwalList.find((sched) => {
        const start = new Date(sched.startDate).getTime();
        const end = new Date(sched.endDate).getTime();
        return sTime <= end && eTime >= start;
      });
    } catch {
      return null;
    }
  };

  const conflictingSchedule = checkOverlap(startDate, selectedDays);
  const isConflicted = !!conflictingSchedule;

  const ULASAN_MOCK = [
    { nama: "Ayu Maharani", fakultas: "FT", rating: 5, komentar: "Lokasi sangat strategis, banyak mahasiswa lewat. Fasilitas lengkap!", tanggal: "15 Okt 2026" },
    { nama: "Bayu Pratama", fakultas: "FEB", rating: 4, komentar: "Spotnya bersih dan nyaman. Kanopi cukup untuk melindungi dari hujan.", tanggal: "10 Okt 2026" },
    { nama: "Deva Mahendra", fakultas: "FH", rating: 5, komentar: "Proses booking mudah, admin responsif. Pasti akan sewa lagi!", tanggal: "5 Okt 2026" },
  ];

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
    if (isConflicted) {
      onShowToast({ type: "error", message: "Tanggal tidak tersedia", description: `Bertabrakan dengan jadwal '${conflictingSchedule?.penjual}'` });
      return;
    }
    if (!agreeTerms) {
      onShowToast({ type: "warning", message: "Setujui syarat & ketentuan", description: "Centang persetujuan untuk melanjutkan" });
      return;
    }

    // Generate Token / ID Transaksi Unik
    const generatedToken = `TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}-2026`;
    setReservationId(generatedToken);
    setShowPaymentStep(true); // Buka modal pembayaran
  };

  // LANGKAH 2: Konfirmasi Pembayaran Selesai -> Diteruskan ke Halaman Ringkasan Sukses
  
  const handleConfirmPayment = async () => {
    if (!user || user.role !== "penyewa") {
      onShowToast({
        type: "error",
        message: "Akun tidak memiliki akses untuk melakukan pemesanan.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let id: string;

      // Akun demo tetap menggunakan penyimpanan localStorage.
      if (user.id === "ayu" || user.id === "bayu") {
        id = createDemoBooking({
          spotId: spot.id,
          tanggalMulai: startDate,
          jumlahHari: selectedDays,
          jenisUsaha,
          catatan: catatanTambahan,
          metodePembayaran,
          ...({ namaUsaha, kategoriPenjual } as Record<string, unknown>),
        });
      } else {
        if (!paymentProof) throw new Error("Unggah bukti transfer terlebih dahulu.");
        id = await createSupabaseBooking({
          spotKode: spot.kode,
          tanggalMulai: startDate,
          jumlahHari: selectedDays,
          totalBayar,
          metodePembayaran,
          jenisUsaha,
          namaUsaha,
          kategoriPenjual,
          catatan: catatanTambahan,
          buktiBayar: paymentProof,
        });
      }

      setReservationId(id);
      setShowPaymentStep(false);
      setBookingSuccess(true);

      onShowToast({
        type: "success",
        message: "Pengajuan pemesanan berhasil",
        description:
          "Pesanan berhasil dicatat dan sedang menunggu verifikasi admin.",
      });
    } catch (error) {
      console.error("Gagal menyimpan pemesanan:", error);

      onShowToast({
        type: "error",
        message: "Pengajuan gagal disimpan",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan pemesanan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  // TAHAP 1: MODAL PEMBAYARAN INTERAKTIF (BARCODE & TOKEN TRANSAKSI)
  if (showPaymentStep) {
    return (
      <div className="min-h-screen bg-black/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e7ff] relative animate-in fade-in zoom-in duration-200">
          <button
            onClick={() => setShowPaymentStep(false)}
            className="absolute top-4 right-4 text-[#737781] hover:text-black text-sm font-bold"
          >
            ✕ Batal
          </button>

          <div className="text-center mb-5">
            <span className="material-symbols-outlined text-[#003466] text-[40px] mb-1">qr_code_2</span>
            <h3 className="text-[20px] font-bold text-[#131b2e]">Instruksi Pembayaran</h3>
            <p className="text-[12px] text-[#737781]">Selesaikan pembayaran untuk memvalidasi sewa lapak</p>
          </div>

          {/* Token Transaksi */}
          <div className="bg-[#f2f3ff] rounded-xl p-3 text-center mb-5 border border-[#e2e7ff]">
            <span className="text-[11px] text-[#737781] uppercase font-semibold block mb-0.5">Token / ID Transaksi</span>
            <span className="text-[16px] font-mono font-bold text-[#003466] tracking-wider">{reservationId}</span>
          </div>

          {/* Barcode QRIS / Virtual Account */}
          {user?.id !== "ayu" && user?.id !== "bayu" ? (
            <p className="mb-5 rounded-lg bg-[#f2f3ff] p-3 text-sm">
              Gunakan instruksi pembayaran dari pengelola kampus, lalu unggah bukti transfer untuk diperiksa admin.
            </p>
          ) : metodePembayaran === "qris" ? (
            <div className="flex flex-col items-center justify-center bg-[#faf8ff] p-4 rounded-xl border border-[#e2e7ff] mb-5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${reservationId}`}
                alt="Barcode Pembayaran QRIS"
                className="w-44 h-44 border-4 border-white shadow-md rounded-lg mb-2"
              />
              <p className="text-[12px] font-semibold text-[#131b2e]">Pindai QRIS Menggunakan e-Wallet / Mobile Banking</p>
            </div>
          ) : (
            <div className="bg-[#eaedff] p-4 rounded-xl mb-5 text-center border border-[#003466]/20 space-y-1.5">
              <span className="text-[12px] font-bold text-[#003466] uppercase block">{metodePembayaran.replace("-", " ")}</span>
              <p className="text-[11px] text-[#737781]">Nomor Virtual Account Bank:</p>
              <div className="text-[20px] font-mono font-bold text-[#131b2e] tracking-wide">8821 0812 3456 7890</div>
            </div>
          )}

          {/* Rincian Biaya */}
          <div className="border-t border-[#e2e7ff] pt-3 mb-5 space-y-1.5 text-[13px]">
            <div className="flex justify-between text-[#424750]">
              <span>Spot Lapak</span>
              <span className="font-semibold text-[#131b2e]">{spot.nama}</span>
            </div>
            <div className="flex justify-between text-[#424750]">
              <span>Durasi Sewa</span>
              <span className="font-semibold text-[#131b2e]">{selectedDays} Hari</span>
            </div>
            <div className="flex justify-between text-[#424750]">
              <span>Total Tagihan</span>
              <span className="font-bold text-[#003466]">{formatRupiah(totalBayar)}</span>
            </div>
          </div>

          {user?.id !== "ayu" && user?.id !== "bayu" && (
            <label className="mb-4 grid gap-1 text-sm font-semibold">
              Bukti transfer (JPG, PNG, PDF, maks. 6 MB)
              <input type="file" accept="image/jpeg,image/png,application/pdf" className="w-full text-sm"
                disabled={isSubmitting} onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)} />
            </label>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowPaymentStep(false)}
              className="flex-1 h-11 rounded-xl bg-[#eaedff] text-[#131b2e] text-[13px] font-semibold hover:bg-[#dae2fd] transition-colors"
            >
              Ubah Opsi
            </button>
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting || (user?.id !== "ayu" && user?.id !== "bayu" && !paymentProof)}
              className="flex-1 h-11 rounded-xl bg-[#003466] text-white text-[13px] font-bold hover:bg-[#1a4b84] transition-colors flex items-center justify-center gap-1 shadow-md"
            >
              {isSubmitting ? "Memverifikasi..." : "Saya Sudah Bayar ✓"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TAHAP 2: RINGKASAN SETELAH VERIFIKASI PEMBAYARAN SUKSES
  if (bookingSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#6ffbbe]/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[#003c27] text-[48px]">check_circle</span>
        </div>
        <h2 className="text-[24px] font-bold text-[#131b2e] mb-3">Pengajuan Terkirim</h2>
        <p className="text-[14px] text-[#424750] mb-2 leading-relaxed max-w-sm">
          Pembayaran sewa Spot <strong>{spot.nama}</strong> untuk <strong>{namaUsaha}</strong> ({kategoriPenjual}) selama <strong>{selectedDays} hari</strong> sudah tercatat.
        </p>
        <p className="text-[13px] text-[#737781] mb-8">
          Total: <strong className="text-[#003466]">{formatRupiah(totalBayar)}</strong>. Admin belum memverifikasi. Pembatalan tersedia 1x24 jam di detail pesanan.
        </p>

        <div className="w-full bg-[#f2f3ff] rounded-xl p-4 mb-6 text-left space-y-2.5">
          {[
            { icon: "confirmation_number", label: "ID RESERVASI", value: reservationId },
            { icon: "storefront", label: "NAMA USAHA", value: `${namaUsaha} (${kategoriPenjual})` },
            { icon: "calendar_today", label: "PERIODE", value: `${formatDate(startDate)} – ${formatDate(endDateStr)}` },
            { icon: "payments", label: "TOTAL BAYAR", value: formatRupiah(totalBayar) },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[16px] text-[#003466] mt-0.5">{item.icon}</span>
              <div>
                <span className="text-[11px] text-[#737781] uppercase font-medium tracking-wide block">{item.label}</span>
                <span className="text-[13px] font-semibold text-[#131b2e]">{item.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onBack}
            className="flex-1 h-11 rounded-xl bg-[#eaedff] text-[#131b2e] text-[14px] font-semibold hover:bg-[#dae2fd] transition-colors"
          >
            Kembali ke Katalog
          </button>
          <button
            onClick={() => onOrderDetail(reservationId)}
            className="flex-1 h-11 rounded-xl bg-[#003466] text-white text-[14px] font-semibold hover:bg-[#1a4b84] transition-colors"
          >
            Detail Pesanan
          </button>
        </div>
      </div>
    );
  }

  // TAMPILAN UTAMA (KATALOG DETAIL SPOT & FORM PEMESANAN)
  return (
    <div className="bg-[#faf8ff] min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Breadcrumb Navigasi */}
        <div className="flex items-center gap-2 mb-6 text-[13px]">
          <button
            onClick={onBack}
            className="text-[#003466] hover:underline flex items-center gap-1 font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Katalog
          </button>
          <span className="text-[#737781]">/</span>
          <span className="text-[#424750]">{spot.zona ? spot.zona.charAt(0).toUpperCase() + spot.zona.slice(1) : "Bazar"}</span>
          <span className="text-[#737781]">/</span>
          <span className="text-[#131b2e] font-semibold">{spot.nama}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* KIRI: Detail Spot & Peta Interaktif Leaflet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gambar Hero Spot */}
            <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-[#eaedff] shadow-sm">
              {!imgError ? (
                <img
                  src={spot.gambar}
                  alt={spot.nama}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#003466]/30 to-[#1a4b84]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/30 text-[80px]">storefront</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wide shadow-sm ${spot.status === "tersedia"
                    ? "bg-[#6ffbbe] text-[#002113]"
                    : spot.status === "dipesan"
                      ? "bg-[#ffddb8] text-[#2a1700]"
                      : "bg-[#e2e7ff] text-[#424750]"
                  }`}>
                  {spot.status === "tersedia" ? "Tersedia" : spot.status === "dipesan" ? "Sedang Dipesan" : "Pemeliharaan"}
                </span>
              </div>

              {/* Rating & Total Sewa */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[#fea619] text-[14px]">star</span>
                  <span className="text-white text-[13px] font-semibold">{spot.rating}</span>
                </div>
                <span className="text-white/80 text-[12px]">{spot.totalSewa || 0} kali disewa</span>
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
                  { id: "ulasan", label: `Ulasan (${ULASAN_MOCK.length})` },
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
                        </div>
                        <span className="bg-[#855300] text-white text-[11px] px-2.5 py-1 rounded-full font-bold">
                          Sedang Beroperasi
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
                        </div>
                        <span className="bg-[#eaedff] text-[#003466] text-[11px] px-2.5 py-1 rounded-full border border-[#003466]/20">
                          Tervalidasi
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
                {ULASAN_MOCK.map((ulasan, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-[#e2e7ff] shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#1a4b84] flex items-center justify-center text-white font-bold text-xs">
                        {ulasan.nama[0]}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#131b2e]">{ulasan.nama}</p>
                        <p className="text-[11px] text-[#737781]">{ulasan.fakultas} • {ulasan.tanggal}</p>
                      </div>
                    </div>
                    <p className="text-[13px] text-[#424750]">{ulasan.komentar}</p>
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
                <div className={`px-3 py-1 rounded-full text-[12px] font-bold ${spot.status === "tersedia" ? "bg-[#6ffbbe] text-[#002113]" : "bg-[#ffddb8] text-[#2a1700]"
                  }`}>
                  {spot.status === "tersedia" ? "✓ Tersedia" : "Dipesan"}
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

                  {/* Tanggal Terisi Khusus Spot Ini */}
                  {jadwalList.length > 0 && (
                    <div className="rounded-xl bg-[#ffddb8]/30 p-3 border border-[#ffddb8] text-[11px] text-[#855300]">
                      <span className="font-bold block mb-1">Tanggal Terisi (Jadwal Operasional Spot Ini):</span>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {jadwalList.map((s) => (
                          <li key={s.id}>
                            {formatDate(s.startDate)} - {formatDate(s.endDate)} ({s.penjual})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tanggal Mulai */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Tanggal Mulai *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={today()}
                      className={`w-full h-10 px-3 text-[14px] rounded-lg outline-none transition-all ${isConflicted
                          ? "bg-red-50 text-red-900 border border-red-500"
                          : "bg-[#f2f3ff] text-[#131b2e] focus:bg-white focus:ring-2 focus:ring-[#003466]/20"
                        }`}
                    />
                  </div>

                  {/* Durasi Sewa */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Durasi Sewa
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDays((d) => Math.max(d - 1, 1))}
                        className="w-9 h-9 rounded-lg bg-[#eaedff] text-[#131b2e] flex items-center justify-center font-bold hover:bg-[#dae2fd] transition-colors"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center py-2 bg-[#f2f3ff] rounded-lg text-[14px] font-bold text-[#131b2e]">
                        {selectedDays} hari
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedDays((d) => Math.min(d + 1, 30))}
                        className="w-9 h-9 rounded-lg bg-[#eaedff] text-[#131b2e] flex items-center justify-center font-bold hover:bg-[#dae2fd] transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-[11px] text-[#737781] mt-1.5">
                      {formatDate(startDate)} – {formatDate(endDateStr)}
                    </p>
                  </div>

                  {/* Peringatan Tanggal Bentrok */}
                  {isConflicted && (
                    <div className="rounded-lg bg-red-50 p-2.5 text-[12px] text-red-600 border border-red-200">
                      Tanggal ini sudah terisi oleh <strong>{conflictingSchedule?.penjual}</strong>. Silakan pilih tanggal lain.
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

                  {/* Metode Pembayaran */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "qris", label: "QRIS Barcode" },
                        { id: "transfer-bni", label: "BNI Transfer" },
                        { id: "transfer-bri", label: "BRI Transfer" },
                        { id: "transfer-bca", label: "BCA Transfer" },
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setMetodePembayaran(method.id)}
                          className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all border ${metodePembayaran === method.id
                              ? "bg-[#003466] text-white border-[#003466]"
                              : "bg-[#f2f3ff] text-[#424750] border-[#e2e7ff] hover:bg-[#eaedff]"
                            }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
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

                  {/* Terms */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-[#003466] cursor-pointer shrink-0"
                      />

                      <div className="text-[12px] text-[#424750] leading-relaxed">
                        <label htmlFor="terms">
                          Saya telah membaca dan menyetujui{" "}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-[#003466] font-semibold hover:underline"
                        >
                          Syarat & Ketentuan
                        </button>
                        {" "}penggunaan lapak di lingkungan Universitas Udayana.
                      </div>
                    </div>
                  </div>

                  {/* Modal Syarat & Ketentuan */}
                  {showTerms && (
                    <div
                      className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
                      onClick={() => setShowTerms(false)}
                    >
                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="terms-title"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-xl max-h-[78vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                      >
                        {/* Header Modal */}
                        <div className="px-5 sm:px-6 py-4 border-b border-[#e2e7ff] flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="material-symbols-outlined text-[#003466]">
                                description
                              </span>
                              <span className="text-[11px] font-bold tracking-wider uppercase text-[#855300]">
                                Ketentuan Layanan Ngelapak
                              </span>
                            </div>

                            <h2
                              id="terms-title"
                              className="text-xl sm:text-2xl font-bold text-[#003466]"
                            >
                              Syarat & Ketentuan
                            </h2>

                            <p className="text-xs text-[#737781] mt-1">
                              Ketentuan penggunaan dan penyewaan lapak di lingkungan
                              Universitas Udayana.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowTerms(false)}
                            aria-label="Tutup syarat dan ketentuan"
                            className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#737781] hover:bg-[#f2f3ff] hover:text-[#003466] transition-colors"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>

                        {/* Isi Modal */}
                        <div className="px-5 sm:px-6 py-4 overflow-y-auto text-[12px] sm:text-[13px] text-[#424750] leading-relaxed space-y-5">

                          <div className="bg-[#f2f3ff] border border-[#e2e7ff] rounded-xl p-4">
                            <p className="font-semibold text-[#003466] mb-1">
                              Pendahuluan
                            </p>
                            <p>
                              Syarat dan Ketentuan ini mengatur penggunaan platform Ngelapak
                              sebagai sarana pengajuan dan pengelolaan penyewaan lapak usaha
                              di lingkungan Universitas Udayana. Dengan menggunakan layanan
                              dan mengajukan pemesanan melalui Ngelapak, pengguna dianggap
                              telah membaca, memahami, dan bersedia mematuhi ketentuan yang
                              berlaku.
                            </p>
                          </div>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 1 - Ketentuan Umum
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Ngelapak merupakan platform yang memfasilitasi proses
                                pencarian informasi, pengajuan pemesanan, dan pengelolaan
                                penggunaan lapak usaha di lingkungan Universitas Udayana.
                              </p>
                              <p>
                                2. Pengguna adalah setiap individu atau pihak yang mengakses
                                dan menggunakan layanan Ngelapak, termasuk calon penyewa
                                dan pengelola lapak.
                              </p>
                              <p>
                                3. Penyewa adalah pengguna yang mengajukan permohonan
                                penggunaan lapak untuk kegiatan usaha atau kegiatan lain
                                yang diperbolehkan.
                              </p>
                              <p>
                                4. Pengelola adalah pihak yang memiliki kewenangan untuk
                                mengelola ketersediaan lapak, memeriksa pengajuan, dan
                                melakukan verifikasi sesuai ketentuan yang berlaku.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 2 - Pendaftaran dan Keakuratan Informasi
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Pengguna wajib menggunakan akun yang terdaftar dan
                                memberikan informasi identitas serta informasi usaha
                                secara benar, lengkap, dan dapat dipertanggungjawabkan.
                              </p>
                              <p>
                                2. Informasi mengenai nama usaha, kategori penjual, jenis
                                usaha, dan kebutuhan penggunaan lapak harus sesuai dengan
                                kegiatan yang akan dilaksanakan.
                              </p>
                              <p>
                                3. Pengguna bertanggung jawab atas keakuratan dan
                                keabsahan informasi maupun dokumen yang disampaikan
                                melalui platform.
                              </p>
                              <p>
                                4. Pengelola berhak meminta klarifikasi apabila terdapat
                                informasi yang tidak lengkap, tidak sesuai, atau
                                memerlukan pemeriksaan lebih lanjut.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 3 - Pengajuan dan Penggunaan Lapak
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Pengajuan pemesanan dilakukan dengan memilih lapak,
                                menentukan tanggal dan durasi penggunaan, serta
                                melengkapi informasi yang dipersyaratkan dalam formulir
                                pemesanan.
                              </p>
                              <p>
                                2. Pengajuan pemesanan belum merupakan persetujuan final
                                atas penggunaan lapak dan tetap mengikuti proses
                                pemeriksaan serta verifikasi oleh pengelola.
                              </p>
                              <p>
                                3. Penyewa hanya diperkenankan menggunakan lapak sesuai
                                lokasi, periode, jenis kegiatan, dan informasi usaha
                                yang diajukan serta disetujui.
                              </p>
                              <p>
                                4. Perubahan jadwal, jenis kegiatan, atau informasi
                                pemesanan harus dikomunikasikan kepada pengelola dan
                                memperoleh persetujuan apabila diperlukan.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 4 - Tarif dan Pembayaran
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Tarif penggunaan lapak mengikuti informasi harga
                                yang ditampilkan pada halaman detail lapak ketika
                                pengajuan pemesanan dilakukan.
                              </p>
                              <p>
                                2. Total biaya dihitung berdasarkan tarif penggunaan
                                dan durasi sewa yang dipilih oleh penyewa, dengan
                                memperhatikan biaya tambahan apabila ditetapkan
                                oleh pengelola.
                              </p>
                              <p>
                                3. Penyewa wajib melakukan pembayaran melalui metode
                                pembayaran yang disediakan pada platform dan
                                memastikan informasi transaksi yang digunakan benar.
                              </p>
                              <p>
                                4. Bukti atau informasi pembayaran dapat digunakan
                                sebagai dasar pemeriksaan oleh pengelola. Status
                                pemesanan mengikuti hasil verifikasi pembayaran
                                dan pengajuan.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 5 - Hak dan Kewajiban Penyewa
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Penyewa berhak menggunakan lapak sesuai periode
                                dan peruntukan yang telah memperoleh persetujuan.
                              </p>
                              <p>
                                2. Penyewa wajib menjaga kebersihan, ketertiban,
                                keamanan, serta kondisi fasilitas selama masa
                                penggunaan lapak.
                              </p>
                              <p>
                                3. Penyewa wajib mematuhi peraturan kampus, ketentuan
                                keselamatan, serta arahan pengelola yang berkaitan
                                dengan kegiatan di lokasi.
                              </p>
                              <p>
                                4. Penyewa dilarang mengalihkan penggunaan lapak
                                kepada pihak lain tanpa persetujuan pengelola.
                              </p>
                              <p>
                                5. Penyewa bertanggung jawab atas kerusakan atau
                                kerugian yang timbul akibat kelalaian maupun
                                tindakan penyewa dan pihak yang berada di bawah
                                tanggung jawabnya.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 6 - Pembatalan dan Perubahan Pemesanan
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Permohonan pembatalan atau perubahan pemesanan
                                disampaikan melalui mekanisme yang tersedia pada
                                platform atau melalui pengelola.
                              </p>
                              <p>
                                2. Setiap permohonan akan ditinjau berdasarkan
                                status pemesanan, waktu pengajuan, dan ketentuan
                                operasional yang berlaku.
                              </p>
                              <p>
                                3. Pengembalian dana, apabila memenuhi persyaratan,
                                dilaksanakan berdasarkan kebijakan pembatalan
                                dan pengembalian dana yang ditetapkan oleh pengelola.
                              </p>
                              <p>
                                4. Penyewa wajib memastikan kembali tanggal, durasi,
                                dan informasi pemesanan sebelum menyelesaikan
                                pengajuan.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 7 - Larangan dan Penegakan Ketentuan
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Penyewa dilarang menggunakan lapak untuk kegiatan
                                yang bertentangan dengan hukum, peraturan kampus,
                                norma kesusilaan, atau ketertiban lingkungan.
                              </p>
                              <p>
                                2. Penyewa dilarang memberikan informasi palsu,
                                menyalahgunakan akun, atau melakukan tindakan yang
                                mengganggu operasional platform maupun kegiatan
                                di lingkungan kampus.
                              </p>
                              <p>
                                3. Pengelola dapat melakukan pemeriksaan dan
                                mengambil tindakan sesuai kewenangannya apabila
                                ditemukan dugaan pelanggaran terhadap ketentuan
                                penggunaan lapak.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 8 - Data dan Informasi Pengguna
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Informasi yang diberikan pengguna digunakan
                                untuk mendukung proses pendaftaran, pemesanan,
                                verifikasi, dan pengelolaan layanan Ngelapak.
                              </p>
                              <p>
                                2. Pengguna bertanggung jawab untuk menjaga
                                kerahasiaan informasi akun dan tidak membagikan
                                kredensial maupun informasi transaksi kepada
                                pihak yang tidak berwenang.
                              </p>
                              <p>
                                3. Pengelolaan data pengguna dilaksanakan dengan
                                memperhatikan ketentuan perlindungan data pribadi
                                dan kebijakan yang berlaku.
                              </p>
                            </div>
                          </section>

                          <section>
                            <h3 className="font-bold text-[#131b2e] text-sm mb-2">
                              Pasal 9 - Penutup
                            </h3>
                            <div className="space-y-2">
                              <p>
                                1. Dengan mencentang pernyataan persetujuan pada
                                halaman pemesanan, pengguna menyatakan telah membaca,
                                memahami, dan menyetujui Syarat & Ketentuan ini.
                              </p>
                              <p>
                                2. Hal-hal yang belum diatur dalam dokumen ini
                                akan mengikuti kebijakan dan ketentuan resmi
                                Universitas Udayana serta keputusan pengelola
                                yang berwenang.
                              </p>
                              <p>
                                3. Apabila terdapat perubahan ketentuan, pengguna
                                diharapkan membaca versi terbaru sebelum melakukan
                                pengajuan pemesanan berikutnya.
                              </p>
                            </div>
                          </section>

                          <div className="bg-[#f2f3ff] rounded-xl p-4 border border-[#e2e7ff]">
                            <p className="text-xs text-[#424750]">
                              <strong className="text-[#003466]">Pernyataan Persetujuan</strong>
                              <br />
                              Dengan melanjutkan proses pemesanan dan mencentang
                              persetujuan, penyewa menyatakan telah memahami serta
                              bersedia mematuhi ketentuan penggunaan lapak yang
                              berlaku di lingkungan Universitas Udayana.
                            </p>
                          </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="px-5 sm:px-6 py-3 border-t border-[#e2e7ff] bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                          <p className="text-[11px] text-[#737781]">
                            Mohon baca seluruh ketentuan sebelum menyetujui.
                          </p>

                          <button
                            type="button"
                            onClick={() => setShowTerms(false)}
                            className="w-full sm:w-auto px-7 h-11 rounded-xl bg-[#003466] text-white text-[13px] font-bold hover:bg-[#1a4b84] transition-colors shadow-sm"
                          >
                            Saya Mengerti
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Tombol Membuka Modal Pembayaran (QRIS / Token) */}
                  <button
                    onClick={handleOpenPayment}
                    disabled={spot.status === "dipesan" || isConflicted}
                    className={`w-full h-12 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${spot.status === "dipesan" || isConflicted
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

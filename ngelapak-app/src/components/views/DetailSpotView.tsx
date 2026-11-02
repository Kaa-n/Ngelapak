"use client";

import { useState } from "react";
import type { Spot } from "@/lib/mock-data";
import dynamic from "next/dynamic";
const MapComponent = dynamic(
  () => import("@/components/home/MapComponent"),
  {
    ssr: false,
  }
);
import { formatRupiah, formatDate } from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";
import { useDemo, createDemoBooking, today } from "@/lib/demo-store";

interface DetailSpotViewProps {
  spot: Spot;
  onBack: () => void;
  onLogin: () => void;
  onOrders: () => void;
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
}

export default function DetailSpotView({ spot, onBack, onLogin, onOrders, onShowToast }: DetailSpotViewProps) {
  const { user } = useDemo();
  const [selectedDays, setSelectedDays] = useState(1);
  const [startDate, setStartDate] = useState(today);
  const [jenisUsaha, setJenisUsaha] = useState("");
  const [catatanTambahan, setCatatanTambahan] = useState("");
  const [metodePembayaran, setMetodePembayaran] = useState("transfer-bni");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [reservationId, setReservationId] = useState("");
  const [activeTab, setActiveTab] = useState<"detail" | "fasilitas" | "ulasan">("detail");
  const [imgError, setImgError] = useState(false);

  const totalBayar = spot.tarifPerHari * selectedDays;

  const endDate = new Date((startDate || today()) + "T00:00:00Z");
  endDate.setUTCDate(endDate.getUTCDate() + selectedDays - 1);
  const endDateStr = Number.isFinite(endDate.getTime()) ? endDate.toISOString().split("T")[0] : today();

  const ULASAN_MOCK = [
    { nama: "Ayu Maharani", fakultas: "FT", rating: 5, komentar: "Lokasi sangat strategis, banyak mahasiswa lewat. Fasilitas lengkap!", tanggal: "15 Okt 2025" },
    { nama: "Bayu Pratama", fakultas: "FEB", rating: 4, komentar: "Spotnya bersih dan nyaman. Kanopi cukup untuk melindungi dari hujan.", tanggal: "10 Okt 2025" },
    { nama: "Deva Mahendra", fakultas: "FH", rating: 5, komentar: "Proses booking mudah, admin responsif. Pasti akan sewa lagi!", tanggal: "5 Okt 2025" },
  ];

  const handleBooking = () => {
    if (!user) { onLogin(); return; }
    if (user.role !== "penyewa") {
      onShowToast({ type: "error", message: "Pemesanan hanya tersedia untuk penyewa" });
      return;
    }
    if (!jenisUsaha.trim()) {
      onShowToast({ type: "error", message: "Jenis usaha harus diisi", description: "Lengkapi semua field yang diperlukan" });
      return;
    }
    if (!agreeTerms) {
      onShowToast({ type: "warning", message: "Setujui syarat & ketentuan", description: "Centang persetujuan untuk melanjutkan" });
      return;
    }
    setIsSubmitting(true);
    try {
      const id = createDemoBooking({ spotId: spot.id, tanggalMulai: startDate, jumlahHari: selectedDays, jenisUsaha, catatan: catatanTambahan, metodePembayaran });
      setReservationId(id);
      setBookingSuccess(true);
      onShowToast({
        type: "success",
        message: "Pengajuan booking berhasil!",
        description: `Spot ${spot.kode} – Menunggu verifikasi pembayaran admin`,
      });
    } catch (error) {
      onShowToast({ type: "error", message: error instanceof Error ? error.message : "Pengajuan gagal disimpan" });
    } finally { setIsSubmitting(false); }
  };

  if (bookingSuccess) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#6ffbbe]/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-[#003c27] text-[48px]">check_circle</span>
        </div>
        <h2 className="text-[24px] font-bold text-[#131b2e] mb-3">Booking Berhasil Diajukan!</h2>
        <p className="text-[14px] text-[#424750] mb-2 leading-relaxed max-w-sm">
          Pengajuan sewa Spot <strong>{spot.nama}</strong> selama <strong>{selectedDays} hari</strong> telah dikirim.
        </p>
        <p className="text-[13px] text-[#737781] mb-8">
          Total: <strong className="text-[#003466]">{formatRupiah(totalBayar)}</strong> · Pengajuan menunggu pemeriksaan admin dalam demo.
        </p>

        <div className="w-full bg-[#f2f3ff] rounded-xl p-4 mb-6 text-left space-y-2.5">
          {[
            { icon: "confirmation_number", label: "ID Reservasi", value: reservationId || "TXN-2025-8821" },
            { icon: "storefront", label: "Spot", value: `${spot.nama} (${spot.kode})` },
            { icon: "calendar_today", label: "Periode", value: `${formatDate(startDate)} – ${formatDate(endDateStr)}` },
            { icon: "payments", label: "Total Bayar", value: formatRupiah(totalBayar) },
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
            onClick={onOrders}
            className="flex-1 h-11 rounded-xl bg-[#003466] text-white text-[14px] font-semibold hover:bg-[#1a4b84] transition-colors"
          >
            Lihat Pesanan Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf8ff] min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-[13px]">
          <button
            onClick={onBack}
            className="text-[#003466] hover:underline flex items-center gap-1 font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Katalog
          </button>
          <span className="text-[#737781]">/</span>
          <span className="text-[#424750]">{spot.zona.charAt(0).toUpperCase() + spot.zona.slice(1)}</span>
          <span className="text-[#737781]">/</span>
          <span className="text-[#131b2e] font-semibold">{spot.nama}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Detail Spot */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Hero */}
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

              {/* Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wide shadow-sm ${
                  spot.status === "tersedia"
                    ? "bg-[#6ffbbe] text-[#002113]"
                    : spot.status === "dipesan"
                    ? "bg-[#ffddb8] text-[#2a1700]"
                    : "bg-[#e2e7ff] text-[#424750]"
                }`}>
                  {spot.status === "tersedia" ? "Tersedia" : spot.status === "dipesan" ? "Sedang Dipesan" : "Pemeliharaan"}
                </span>
              </div>

              {/* Rating */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[#fea619] text-[14px]">star</span>
                  <span className="text-white text-[13px] font-semibold">{spot.rating}</span>
                </div>
                <span className="text-white/80 text-[12px]">{spot.totalSewa} kali disewa</span>
              </div>
            </div>

            {/* Name & Zone */}
            <div>
              <div className="flex items-center gap-2 text-[#855300] text-[13px] font-semibold mb-1.5">
                <span className="material-symbols-outlined text-[14px]">domain</span>
                {spot.zonaLabel}
              </div>
              <h1 className="text-[26px] md:text-[30px] font-bold text-[#131b2e] mb-2 leading-tight">
                {spot.nama}
              </h1>
              <div className="flex items-center gap-2 text-[#424750] text-[13px]">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                {spot.lokasi}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#e2e7ff]">
              <div className="flex gap-1">
                {(["detail", "fasilitas", "ulasan"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all capitalize ${
                      activeTab === tab
                        ? "border-[#003466] text-[#003466]"
                        : "border-transparent text-[#424750] hover:text-[#131b2e]"
                    }`}
                  >
                    {tab === "detail" ? "Detail & Spesifikasi" : tab === "fasilitas" ? "Fasilitas" : `Ulasan (${ULASAN_MOCK.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "detail" && (
              <div className="space-y-5">
                <p className="text-[14px] text-[#424750] leading-relaxed">{spot.deskripsi}</p>
                
                {/* Lokasi Spot */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[12px] text-[#737781] font-semibold uppercase tracking-wide">
                      Lokasi Spot
                    </p>
                    <p className="text-[14px] text-[#424750] mt-1">
                      {spot.lokasi}
                    </p>
                  </div>

                  <MapComponent spots={[spot]} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: "aspect_ratio", label: "Ukuran", value: spot.ukuranLabel },
                    { icon: "bolt", label: "Daya Listrik", value: `${spot.daya} Watt` },
                    { icon: "payments", label: "Tarif/Hari", value: formatRupiah(spot.tarifPerHari) },
                    { icon: "event_available", label: "Total Sewa", value: `${spot.totalSewa}× disewa` },
                  ].map((spec) => (
                    <div key={spec.label} className="bg-[#f2f3ff] rounded-xl p-3.5 flex flex-col gap-1">
                      <span className="material-symbols-outlined text-[#003466] text-[20px]">{spec.icon}</span>
                      <span className="text-[11px] text-[#737781] font-medium uppercase tracking-wide">{spec.label}</span>
                      <span className="text-[14px] font-bold text-[#131b2e]">{spec.value}</span>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div>
                  <p className="text-[12px] text-[#737781] font-semibold uppercase tracking-wide mb-2">Karakteristik Spot</p>
                  <div className="flex flex-wrap gap-2">
                    {spot.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-[#eaedff] text-[#003466] text-[12px] font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Peraturan */}
                <div className="bg-[#ffddb8]/30 rounded-xl p-4 border border-[#ffddb8]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[#855300] text-[18px]">policy</span>
                    <span className="text-[14px] font-bold text-[#855300]">Peraturan Penggunaan Spot</span>
                  </div>
                  <ul className="space-y-1.5 text-[13px] text-[#424750]">
                    {[
                      "Dilarang memasak makanan yang menghasilkan asap berlebih tanpa izin khusus",
                      "Lapak harus dalam kondisi bersih setiap hari setelah operasional",
                      "Jam operasional: 07.00 – 20.00 WITA",
                      "Wajib memiliki Surat Izin Usaha Mahasiswa (SIUM) dari Kemahasiswaan",
                      "Pembayaran dilakukan di muka sebelum penggunaan spot",
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#855300] text-[14px] mt-0.5 shrink-0">chevron_right</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === "fasilitas" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ...spot.fasilitas.map((f) => ({ label: f, included: true })),
                  { label: "Jalur Air Bersih", included: spot.fasilitas.some(f => f.toLowerCase().includes("air")) },
                  { label: "WiFi Kampus", included: spot.fasilitas.some(f => f.toLowerCase().includes("wifi")) },
                  { label: "Meja & Kursi", included: spot.fasilitas.some(f => f.toLowerCase().includes("meja")) },
                  { label: "CCTV Keamanan", included: true },
                  { label: "Toilet Umum < 100m", included: true },
                  { label: "Area Parkir Terdekat", included: spot.zona === "rektorat" },
                ].filter((item, index, arr) => arr.findIndex(i => i.label === item.label) === index)
                  .map((facility) => (
                  <div
                    key={facility.label}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border ${
                      facility.included
                        ? "bg-[#002113]/5 border-[#4edea3]/30"
                        : "bg-[#f2f3ff] border-[#e2e7ff] opacity-60"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        facility.included ? "bg-[#6ffbbe]" : "bg-[#e2e7ff]"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[16px] ${
                        facility.included ? "text-[#002113]" : "text-[#737781]"
                      }`}>
                        {facility.included ? "check_circle" : "cancel"}
                      </span>
                    </div>
                    <span className={`text-[13px] font-medium ${
                      facility.included ? "text-[#131b2e]" : "text-[#737781] line-through"
                    }`}>
                      {facility.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "ulasan" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-[48px] font-bold text-[#131b2e] leading-none">{spot.rating}</div>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`material-symbols-outlined text-[16px] ${
                            i < Math.floor(spot.rating) ? "text-[#fea619]" : "text-[#e2e7ff]"
                          }`}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <div className="text-[11px] text-[#737781] mt-0.5">{spot.totalSewa} ulasan</div>
                  </div>
                </div>

                {ULASAN_MOCK.map((ulasan, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-[#e2e7ff] shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[#1a4b84] flex items-center justify-center">
                        <span className="text-white text-[14px] font-bold">{ulasan.nama[0]}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#131b2e]">{ulasan.nama}</p>
                        <p className="text-[11px] text-[#737781]">{ulasan.fakultas} • {ulasan.tanggal}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-0.5">
                        {[...Array(ulasan.rating)].map((_, j) => (
                          <span key={j} className="material-symbols-outlined text-[#fea619] text-[14px]">star</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[13px] text-[#424750] leading-relaxed">{ulasan.komentar}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Booking Form (Sticky) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-5 border border-[#e2e7ff] sticky top-20">
              {/* Price */}
              <div className="flex items-end justify-between mb-5 pb-4 border-b border-[#e2e7ff]">
                <div>
                  <span className="text-[11px] text-[#737781] font-medium uppercase tracking-wide block mb-1">
                    Tarif Sewa
                  </span>
                  <div className="text-[26px] font-bold text-[#131b2e] leading-none">
                    {formatRupiah(spot.tarifPerHari)}
                    <span className="text-[13px] text-[#737781] font-normal"> / hari</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                  spot.status === "tersedia" ? "bg-[#6ffbbe] text-[#002113]" : "bg-[#ffddb8] text-[#2a1700]"
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
                  {/* Tanggal Mulai */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={today()}
                      className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[14px] rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all"
                    />
                  </div>

                  {/* Durasi */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Durasi Sewa
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedDays((d) => Math.max(d - 1, 1))}
                        className="w-9 h-9 rounded-lg bg-[#eaedff] text-[#131b2e] flex items-center justify-center font-bold hover:bg-[#dae2fd] transition-colors"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center py-2 bg-[#f2f3ff] rounded-lg text-[14px] font-bold text-[#131b2e]">
                        {selectedDays} hari
                      </div>
                      <button
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
                        { id: "transfer-bni", label: "BNI Transfer" },
                        { id: "transfer-bri", label: "BRI Transfer" },
                        { id: "transfer-bca", label: "BCA Transfer" },
                        { id: "qris", label: "QRIS" },
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setMetodePembayaran(method.id)}
                          className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all border ${
                            metodePembayaran === method.id
                              ? "bg-[#003466] text-white border-[#003466]"
                              : "bg-[#f2f3ff] text-[#424750] border-[#e2e7ff] hover:bg-[#eaedff]"
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Catatan */}
                  <div>
                    <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">
                      Catatan Tambahan
                    </label>
                    <textarea
                      value={catatanTambahan}
                      onChange={(e) => setCatatanTambahan(e.target.value)}
                      rows={2}
                      placeholder="Deskripsi singkat usaha atau kebutuhan khusus..."
                      className="w-full px-3 py-2 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all resize-none placeholder:text-[#737781]"
                    />
                  </div>

                  {/* Total */}
                  <div className="bg-[#f2f3ff] rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <span className="text-[#424750]">{formatRupiah(spot.tarifPerHari)} × {selectedDays} hari</span>
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
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#003466] cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[12px] text-[#424750] cursor-pointer leading-relaxed">
                      Saya menyetujui{" "}
                      <a href="#" className="text-[#003466] font-semibold hover:underline">
                        Syarat & Ketentuan
                      </a>{" "}
                      penggunaan lapak kampus Udayana
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleBooking}
                    disabled={isSubmitting || spot.status === "dipesan"}
                    className={`w-full h-12 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center gap-2 ${
                      spot.status === "dipesan"
                        ? "bg-[#eaedff] text-[#424750] cursor-not-allowed"
                        : "bg-[#003466] text-white hover:bg-[#1a4b84] shadow-md hover:shadow-lg disabled:opacity-70"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        <span>Memproses Booking...</span>
                      </>
                    ) : spot.status === "dipesan" ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                        <span>Cek Jadwal Tersedia</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        <span>Ajukan Booking</span>
                      </>
                    )}
                  </button>

                  {spot.status === "dipesan" && (
                    <p className="text-[12px] text-[#855300] text-center">
                      Spot ini sedang dipesan. Hubungi admin untuk info jadwal kosong.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-[48px] text-[#737781] mb-3">build</span>
                  <p className="text-[14px] font-semibold text-[#131b2e] mb-2">Sedang Dalam Pemeliharaan</p>
                  <p className="text-[12px] text-[#737781]">
                    Spot ini sementara tidak dapat disewa. Silakan cek kembali nanti.
                  </p>
                </div>
              )}

              {/* Contact Admin */}
              <div className="mt-4 pt-4 border-t border-[#e2e7ff] flex items-center gap-2 text-[12px] text-[#424750]">
                <span className="material-symbols-outlined text-[16px] text-[#003466]">support_agent</span>
                <span>
                  Butuh bantuan?{" "}
                  <a href="#" className="text-[#003466] font-semibold hover:underline">
                    Hubungi Admin
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

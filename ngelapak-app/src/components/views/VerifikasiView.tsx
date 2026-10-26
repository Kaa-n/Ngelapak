"use client";

import { useState, useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/mock-data";
import { useDemo, verifyDemoBooking } from "@/lib/demo-store";
import type { Booking, TransactionStatus } from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";

interface VerifikasiViewProps {
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
}

type AdminTab = "pembayaran" | "pengajuan" | "riwayat";
type FilterPeriode = "7hari" | "hari-ini" | "bulan-ini";
type FilterStatus = "semua" | "menunggu" | "disetujui" | "ditolak";

interface BookingState extends Booking {
  localStatus: TransactionStatus;
}

export default function VerifikasiView({ onShowToast }: VerifikasiViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("pembayaran");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriode, setFilterPeriode] = useState<FilterPeriode>("7hari");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("menunggu");
  const [selectedBooking, setSelectedBooking] = useState<BookingState | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { user, bookings: storedBookings } = useDemo();
  const bookings = useMemo(() => storedBookings.map(b => ({ ...b, localStatus: b.statusVerifikasi })), [storedBookings]);

  const menungguCount = bookings.filter(b => b.localStatus === "menunggu").length;

  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.penyewa.nama.toLowerCase().includes(q) ||
          b.penyewa.nim.includes(q) ||
          b.id.toLowerCase().includes(q) ||
          b.spotNama.toLowerCase().includes(q)
      );
    }

    if (filterStatus !== "semua") {
      result = result.filter((b) => b.localStatus === filterStatus);
    }

    return result;
  }, [bookings, searchQuery, filterStatus]);

  const handleApprove = (bookingId: string) => {
    try { verifyDemoBooking(bookingId, "disetujui"); }
    catch (error) { onShowToast({ type: "error", message: error instanceof Error ? error.message : "Verifikasi gagal" }); return; }
    setShowDetailModal(false);
    setSelectedBooking(null);
    onShowToast({
      type: "success",
      message: "Pembayaran diverifikasi",
      description: `Booking ${bookingId} telah disetujui. Penyewa dapat menggunakan spot.`,
    });
  };

  const handleReject = (bookingId: string) => {
    try { verifyDemoBooking(bookingId, "ditolak"); }
    catch (error) { onShowToast({ type: "error", message: error instanceof Error ? error.message : "Verifikasi gagal" }); return; }
    setShowDetailModal(false);
    setSelectedBooking(null);
    onShowToast({
      type: "error",
      message: "Booking ditolak",
      description: `Booking ${bookingId} telah ditolak. Penyewa akan diberitahu.`,
    });
  };

  const openDetail = (booking: BookingState) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="bg-[#faf8ff] min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero Header */}
        <div className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e2e7ff] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 overflow-hidden mb-6">
          <div className="relative z-10 flex flex-col gap-1.5 max-w-xl">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#eaedff] text-[#003466] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Biro Pengelolaan Aset
              </span>
              {menungguCount > 0 && (
                <span className="px-2.5 py-1 rounded-full text-[12px] font-bold bg-[#ffddb8] text-[#2a1700] flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-[#855300]" />
                  {menungguCount} Perlu Review
                </span>
              )}
            </div>
            <h1 className="text-[26px] md:text-[28px] font-bold text-[#131b2e] tracking-tight">
              Verifikasi & Transaksi
            </h1>
            <p className="text-[14px] text-[#424750]">
              Validasi pembayaran dan perizinan sewa lapak aktif kampus.
            </p>
          </div>

          {/* KPI Box */}
          <div className="relative z-10 shrink-0">
            <div className="flex items-center gap-4 bg-[#f2f3ff] px-5 py-3.5 rounded-xl border border-[#e2e7ff]">
              <div className="w-11 h-11 rounded-lg bg-[#6ffbbe]/30 text-[#003c27] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#737781] uppercase font-semibold tracking-wider">Kas Masuk Hari Ini</span>
                <span className="text-[22px] font-bold text-[#131b2e] leading-tight">Rp 3.450.000</span>
              </div>
            </div>
          </div>

          {/* Decorative gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#003466]/5 to-transparent pointer-events-none" />
        </div>

        {/* Tab Nav + Gateway Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-6 pt-3 rounded-xl shadow-sm border border-[#e2e7ff] mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-3 -mb-px scrollbar-none">
            {([
              { id: "pembayaran", icon: "receipt_long", label: "Verifikasi Pembayaran", count: menungguCount },
              { id: "pengajuan", icon: "storefront", label: "Pengajuan Lapak", count: 2 },
              { id: "riwayat", icon: "history", label: "Riwayat & Audit", count: 0 },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#003466] text-[#003466]"
                    : "border-transparent text-[#424750] hover:text-[#131b2e]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fea619] text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="pb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
            <span className="text-[11px] text-[#424750]">Simulasi verifikasi · Data browser</span>
          </div>
        </div>

        {/* Search + Filters Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e7ff] mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-[#737781] text-[18px] pointer-events-none">search</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-[#f2f3ff] text-[#131b2e] placeholder:text-[#737781] text-[13px] rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all"
              placeholder="Cari nama penyewa, NIM, atau ID reservasi..."
              type="text"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#f2f3ff] rounded-lg px-3 h-10">
              <span className="material-symbols-outlined text-[16px] text-[#737781]">calendar_today</span>
              <select
                value={filterPeriode}
                onChange={(e) => setFilterPeriode(e.target.value as FilterPeriode)}
                className="bg-transparent text-[13px] text-[#131b2e] outline-none cursor-pointer"
              >
                <option value="7hari">7 Hari Terakhir</option>
                <option value="hari-ini">Hari Ini</option>
                <option value="bulan-ini">Bulan Ini</option>
              </select>
            </div>
            <div className="flex items-center gap-2 bg-[#f2f3ff] rounded-lg px-3 h-10">
              <span className="material-symbols-outlined text-[16px] text-[#737781]">filter_list</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="bg-transparent text-[13px] text-[#131b2e] outline-none cursor-pointer"
              >
                <option value="semua">Semua Status</option>
                <option value="menunggu">Menunggu Review</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>
          </div>
        </div>

        {/* === TAB: Verifikasi Pembayaran === */}
        {activeTab === "pembayaran" && (
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#eaedff] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px] text-[#424750]">done_all</span>
                </div>
                <h3 className="text-[16px] font-bold text-[#131b2e] mb-1">Semua Sudah Ditangani!</h3>
                <p className="text-[13px] text-[#424750]">Tidak ada transaksi dengan filter saat ini.</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl p-5 border border-[#e2e7ff] shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Penyewa Info */}
                    <div className="flex items-start gap-3 lg:w-56">
                      <div className="w-10 h-10 rounded-full bg-[#1a4b84] flex items-center justify-center shrink-0">
                        <span className="text-white text-[15px] font-bold">{booking.penyewa.nama[0]}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#131b2e] leading-tight">{booking.penyewa.nama}</p>
                        <p className="text-[11px] text-[#737781]">{booking.penyewa.nim}</p>
                        <p className="text-[11px] text-[#424750]">{booking.penyewa.fakultas}</p>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">ID Reservasi</span>
                        <span className="text-[12px] font-bold text-[#003466]">{booking.id}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">Spot & Zona</span>
                        <span className="text-[12px] font-semibold text-[#131b2e]">{booking.spotNama}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">Periode</span>
                        <span className="text-[12px] font-semibold text-[#131b2e]">
                          {formatDate(booking.tanggalMulai).split(" ").slice(0, 2).join(" ")} – {formatDate(booking.tanggalSelesai).split(" ").slice(0, 2).join(" ")} ({booking.jumlahHari}h)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">Total Bayar</span>
                        <span className="text-[14px] font-bold text-[#003466]">{formatRupiah(booking.totalBayar)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">Metode</span>
                        <span className="text-[12px] font-medium text-[#424750]">{booking.metodePembayaran}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">Jenis Usaha</span>
                        <span className="text-[12px] font-medium text-[#424750]">{booking.jenisUsaha}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">Diajukan</span>
                        <span className="text-[12px] font-medium text-[#424750]">
                          {new Date(booking.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })},{" "}
                          {new Date(booking.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">Status</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          booking.localStatus === "disetujui"
                            ? "bg-[#6ffbbe] text-[#002113]"
                            : booking.localStatus === "ditolak"
                            ? "bg-[#ffdad6] text-[#93000a]"
                            : "bg-[#ffddb8] text-[#2a1700]"
                        }`}>
                          {booking.localStatus === "disetujui" ? "✓ Terverifikasi" : booking.localStatus === "ditolak" ? "✗ Ditolak" : "⏳ Menunggu"}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col items-center gap-2 shrink-0 lg:justify-center">
                      <button
                        onClick={() => openDetail(booking)}
                        className="h-8 px-3 rounded-lg bg-[#eaedff] text-[#003466] text-[12px] font-semibold hover:bg-[#dae2fd] transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                        Detail
                      </button>
                      {booking.localStatus === "menunggu" && (
                        <>
                          <button
                            onClick={() => handleApprove(booking.id)}
                            className="h-8 px-3 rounded-lg bg-[#6ffbbe] text-[#002113] text-[12px] font-bold hover:bg-[#4edea3] transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleReject(booking.id)}
                            className="h-8 px-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-[12px] font-bold hover:bg-[#ffb4ab] transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Catatan */}
                  {booking.catatan && (
                    <div className="mt-3 pt-3 border-t border-[#e2e7ff] flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#855300] text-[14px] mt-0.5">comment</span>
                      <p className="text-[12px] text-[#424750] italic">{booking.catatan}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* === TAB: Pengajuan Lapak === */}
        {activeTab === "pengajuan" && (
          <div className="space-y-4">
            <div className="bg-[#ffddb8]/20 border border-[#ffddb8] rounded-xl p-4 flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-[#855300] text-[22px]">info</span>
              <p className="text-[13px] text-[#424750]">
                Pengajuan lapak memerlukan dokumen SIUM (Surat Izin Usaha Mahasiswa) yang diterbitkan oleh Kemahasiswaan.
              </p>
            </div>

            {[
              {
                id: "ADJ-001",
                pemohon: "BEM Fakultas Teknik",
                nim: "ORG-FT-2025",
                zona: "Zona A – Lapangan Rektorat",
                ukuran: "4×4m",
                tujuan: "Bazar Dies Natalis ke-63 Universitas Udayana",
                tanggal: "01 – 03 Nov 2025",
                dokumen: "SIUM-FT-2025-091.pdf",
                status: "menunggu",
              },
              {
                id: "ADJ-002",
                pemohon: "HMPS Teknik Informatika",
                nim: "ORG-TI-2025",
                zona: "Zona B – Boulevard Utama",
                ukuran: "2×2m",
                tujuan: "Penjualan Merchandise IT Fair 2025",
                tanggal: "10 – 12 Nov 2025",
                dokumen: "SIUM-TI-2025-044.pdf",
                status: "menunggu",
              },
            ].map((adj) => (
              <div key={adj.id} className="bg-white rounded-xl p-5 border border-[#e2e7ff] shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[#003466]">{adj.id}</span>
                      <span className="w-1 h-1 rounded-full bg-[#737781]" />
                      <span className="text-[11px] text-[#737781]">Diajukan 25 Okt 2025</span>
                    </div>
                    <h3 className="text-[15px] font-bold text-[#131b2e]">{adj.pemohon}</h3>
                    <p className="text-[13px] text-[#424750]">{adj.tujuan}</p>
                    <div className="flex flex-wrap gap-3 text-[12px] text-[#424750]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#003466]">location_on</span>
                        {adj.zona}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#003466]">aspect_ratio</span>
                        {adj.ukuran}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-[#003466]">calendar_today</span>
                        {adj.tanggal}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[#f2f3ff] px-3 py-1.5 rounded-lg w-fit">
                      <span className="material-symbols-outlined text-[14px] text-[#855300]">description</span>
                      <span className="text-[12px] text-[#003466] font-medium">{adj.dokumen}</span>
                      <button
                        onClick={() => onShowToast({ type: "info", message: "Dokumen SIUM dibuka", description: adj.dokumen })}
                        className="text-[11px] text-[#855300] font-semibold hover:underline"
                      >
                        Lihat
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onShowToast({ type: "success", message: `Pengajuan ${adj.id} disetujui`, description: `${adj.pemohon} dapat menggunakan spot` })}
                      className="h-10 px-4 rounded-lg bg-[#6ffbbe] text-[#002113] text-[13px] font-bold hover:bg-[#4edea3] transition-colors"
                    >
                      Setujui
                    </button>
                    <button
                      onClick={() => onShowToast({ type: "error", message: `Pengajuan ${adj.id} ditolak` })}
                      className="h-10 px-4 rounded-lg bg-[#ffdad6] text-[#93000a] text-[13px] font-bold hover:bg-[#ffb4ab] transition-colors"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === TAB: Riwayat & Audit === */}
        {activeTab === "riwayat" && (
          <div>
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Transaksi", value: bookings.length.toString(), icon: "receipt_long", color: "#003466" },
                { label: "Disetujui", value: bookings.filter(b => b.localStatus === "disetujui").length.toString(), icon: "check_circle", color: "#003c27" },
                { label: "Ditolak", value: bookings.filter(b => b.localStatus === "ditolak").length.toString(), icon: "cancel", color: "#93000a" },
                { label: "Total Nilai", value: "Rp 14,8jt", icon: "payments", color: "#855300" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-xl p-4 border border-[#e2e7ff] shadow-sm">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: stat.color + "20" }}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ color: stat.color }}>
                        {stat.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#737781] font-medium">{stat.label}</p>
                      <p className="text-[18px] font-bold text-[#131b2e]">{stat.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Audit Log */}
            <div className="bg-white rounded-xl border border-[#e2e7ff] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#e2e7ff] flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-[#131b2e]">Log Aktivitas Audit</h3>
                <button
                  onClick={() => onShowToast({ type: "info", message: "Laporan diunduh", description: "audit_log_okt_2025.pdf" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f2f3ff] text-[#003466] text-[12px] font-semibold hover:bg-[#eaedff] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Ekspor PDF
                </button>
              </div>
              <div className="divide-y divide-[#e2e7ff]">
                {[
                  { time: "25 Okt 2025, 16:45", action: "Booking TXN-2025-007 diajukan", by: "I Made Reza Saputra", icon: "add_circle", color: "#003466" },
                  { time: "24 Okt 2025, 11:30", action: "Booking TXN-2025-003 disetujui", by: "I Made Ariawan (Admin)", icon: "check_circle", color: "#003c27" },
                  { time: "24 Okt 2025, 09:15", action: "Booking TXN-2025-001 diajukan", by: "Ni Kadek Ayu Maharani", icon: "add_circle", color: "#003466" },
                  { time: "22 Okt 2025, 10:00", action: "Spot A-04 diperbarui statusnya", by: "I Made Ariawan (Admin)", icon: "edit", color: "#855300" },
                  { time: "19 Okt 2025, 08:00", action: "Booking TXN-2025-004 disetujui", by: "I Made Ariawan (Admin)", icon: "check_circle", color: "#003c27" },
                  { time: "14 Okt 2025, 12:00", action: "Booking TXN-2025-008 ditolak", by: "I Made Ariawan (Admin)", icon: "cancel", color: "#93000a" },
                ].map((log, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#f9fafb] transition-colors">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: log.color + "15" }}
                    >
                      <span className="material-symbols-outlined text-[14px]" style={{ color: log.color }}>
                        {log.icon}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-[#131b2e] font-medium">{log.action}</p>
                      <p className="text-[11px] text-[#737781]">oleh {log.by}</p>
                    </div>
                    <span className="text-[11px] text-[#737781] shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Detail Booking */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[17px] font-bold text-[#131b2e]">Detail Booking</h2>
                <span className="text-[12px] text-[#003466] font-semibold">{selectedBooking.id}</span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-[#f2f3ff] flex items-center justify-center hover:bg-[#eaedff] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-[#424750]">close</span>
              </button>
            </div>

            {/* Penyewa */}
            <div className="flex items-center gap-3 mb-5 p-3.5 bg-[#f2f3ff] rounded-xl">
              <div className="w-11 h-11 rounded-full bg-[#1a4b84] flex items-center justify-center">
                <span className="text-white text-[16px] font-bold">{selectedBooking.penyewa.nama[0]}</span>
              </div>
              <div>
                <p className="text-[14px] font-bold text-[#131b2e]">{selectedBooking.penyewa.nama}</p>
                <p className="text-[12px] text-[#424750]">{selectedBooking.penyewa.nim} · {selectedBooking.penyewa.fakultas}</p>
                <p className="text-[12px] text-[#737781]">{selectedBooking.penyewa.email}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "Spot", value: selectedBooking.spotNama },
                { label: "Jenis Usaha", value: selectedBooking.jenisUsaha },
                { label: "Tanggal Mulai", value: formatDate(selectedBooking.tanggalMulai) },
                { label: "Tanggal Selesai", value: formatDate(selectedBooking.tanggalSelesai) },
                { label: "Durasi", value: `${selectedBooking.jumlahHari} hari` },
                { label: "Metode Bayar", value: selectedBooking.metodePembayaran },
                { label: "Total Bayar", value: formatRupiah(selectedBooking.totalBayar) },
                { label: "Status", value: selectedBooking.localStatus === "menunggu" ? "⏳ Menunggu Review" : selectedBooking.localStatus === "disetujui" ? "✓ Disetujui" : "✗ Ditolak" },
              ].map((item) => (
                <div key={item.label} className="bg-[#f2f3ff] rounded-lg p-3">
                  <span className="text-[10px] text-[#737781] font-semibold uppercase tracking-wide block mb-0.5">
                    {item.label}
                  </span>
                  <span className="text-[13px] font-semibold text-[#131b2e]">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Catatan */}
            {selectedBooking.catatan && (
              <div className="mb-5 p-3.5 bg-[#ffddb8]/20 border border-[#ffddb8] rounded-xl">
                <span className="text-[11px] text-[#855300] font-semibold uppercase tracking-wide block mb-1">Catatan Penyewa</span>
                <p className="text-[13px] text-[#424750]">{selectedBooking.catatan}</p>
              </div>
            )}

            {/* Bukti Pembayaran Mockup */}
            <div className="mb-5">
              <span className="text-[11px] text-[#737781] font-semibold uppercase tracking-wide block mb-2">Bukti Pembayaran</span>
              <div
                className="h-24 bg-[#f2f3ff] rounded-xl border-2 border-dashed border-[#e2e7ff] flex items-center justify-center cursor-pointer hover:bg-[#eaedff] transition-colors"
                onClick={() => onShowToast({ type: "info", message: "Bukti pembayaran dibuka", description: "transfer_receipt.jpg" })}
              >
                <div className="text-center">
                  <span className="material-symbols-outlined text-[28px] text-[#424750]">image</span>
                  <p className="text-[12px] text-[#424750] font-medium mt-1">transfer_receipt.jpg</p>
                  <p className="text-[10px] text-[#737781]">Klik untuk melihat</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedBooking.localStatus === "menunggu" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleReject(selectedBooking.id)}
                  className="flex-1 h-11 rounded-xl bg-[#ffdad6] text-[#93000a] text-[14px] font-bold hover:bg-[#ffb4ab] transition-colors"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(selectedBooking.id)}
                  className="flex-1 h-11 rounded-xl bg-[#003466] text-white text-[14px] font-bold hover:bg-[#1a4b84] transition-colors"
                >
                  ✓ Verifikasi & Setujui
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

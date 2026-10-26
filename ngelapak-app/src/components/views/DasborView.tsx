"use client";

import { useState } from "react";
import {
  MOCK_SPOT_MANAGEMENT,
  MOCK_DASHBOARD_STATS,
  MOCK_BOOKINGS,
  formatRupiah,
  formatDate,
} from "@/lib/mock-data";
import type { SpotManagement } from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";

interface DasborViewProps {
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
}

type DasborTab = "overview" | "kelola-spot" | "booking-aktif";

export default function DasborView({ onShowToast }: DasborViewProps) {
  const [activeTab, setActiveTab] = useState<DasborTab>("overview");
  const [showAddSpotModal, setShowAddSpotModal] = useState(false);
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [editingSpot, setEditingSpot] = useState<SpotManagement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addSpotForm, setAddSpotForm] = useState({
    nama: "",
    kode: "",
    zona: "rektorat",
    ukuran: "2x2",
    tarif: "",
    daya: "450",
  });
  const [isSubmittingSpot, setIsSubmittingSpot] = useState(false);

  const stats = MOCK_DASHBOARD_STATS;

  const filteredSpots = MOCK_SPOT_MANAGEMENT.filter((s) =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.zonaLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentBookings = MOCK_BOOKINGS.slice(0, 5);

  const handleAddSpot = () => {
    if (!addSpotForm.nama || !addSpotForm.kode || !addSpotForm.tarif) {
      onShowToast({ type: "error", message: "Lengkapi semua field yang diperlukan" });
      return;
    }
    setIsSubmittingSpot(true);
    setTimeout(() => {
      setIsSubmittingSpot(false);
      setShowAddSpotModal(false);
      setAddSpotForm({ nama: "", kode: "", zona: "rektorat", ukuran: "2x2", tarif: "", daya: "450" });
      onShowToast({ type: "success", message: "Spot baru berhasil ditambahkan!", description: `${addSpotForm.nama} (${addSpotForm.kode}) tersimpan` });
    }, 1200);
  };

  const handleStatusChange = (spot: SpotManagement, newStatus: string) => {
    onShowToast({ type: "info", message: `Status ${spot.kode} diperbarui`, description: `Spot sekarang: ${newStatus}` });
  };

  const handleDeleteSpot = (spot: SpotManagement) => {
    onShowToast({ type: "warning", message: `Spot ${spot.kode} ditandai untuk penghapusan`, description: "Perubahan akan berlaku setelah konfirmasi admin" });
  };

  const progressPercent = Math.round((stats.totalPendapatanBulanIni / stats.targetPendapatan) * 100);

  return (
    <div className="bg-[#faf8ff] min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#eaedff] text-[#003466] text-[11px] font-bold uppercase tracking-wider">
                Aset & Zonasi Bisnis
              </span>
              <span className="text-[#737781] text-[11px]">·</span>
              <span className="text-[#737781] text-[11px]">Periode Gasal 2025/2026</span>
            </div>
            <h1 className="text-[26px] md:text-[28px] font-bold text-[#131b2e] tracking-tight">
              Dasbor Pengelola Lapak & Aset Kampus
            </h1>
            <p className="text-[14px] text-[#424750] max-w-2xl">
              Kelola ketersediaan stan, pantau pendapatan sewa, dan atur jadwal penggunaan lokasi usaha temporer.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowTarifModal(true)}
              className="h-10 px-4 rounded-lg bg-[#f2f3ff] text-[#131b2e] hover:bg-[#eaedff] transition-colors text-[13px] font-semibold flex items-center gap-2 shadow-sm border border-[#e2e7ff]"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Atur Tarif
            </button>
            <button
              onClick={() => setShowAddSpotModal(true)}
              className="h-10 px-5 rounded-lg bg-[#1a4b84] text-white font-bold shadow-md hover:bg-[#003466] transition-all flex items-center gap-2 text-[13px]"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Tambah Lapak Baru
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Kapasitas */}
          <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-[#e2e7ff] flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] text-[#737781] font-semibold uppercase tracking-wider">Kapasitas Lapak</span>
                <h2 className="text-[32px] font-bold text-[#131b2e] mt-1">{stats.totalSpot} Spot</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#d5e3ff]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#003466] text-[26px]">storefront</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[13px] text-[#424750]">
                {stats.spotTerverifikasi} Terverifikasi, {stats.spotPemeliharaan} Dalam Pemeliharaan
              </p>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#003c27] text-[12px] font-semibold">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                +2 spot baru bulan ini
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#eaedff]/30 rounded-full pointer-events-none" />
          </div>

          {/* Pemesanan */}
          <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-[#e2e7ff] flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] text-[#737781] font-semibold uppercase tracking-wider">Pemesanan Berjalan</span>
                <h2 className="text-[32px] font-bold text-[#131b2e] mt-1">{stats.pemesananBerjalan} Booking</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#ffddb8]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#855300] text-[26px]">event_available</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px] text-[#424750]">
                <span>Tingkat Keterisian</span>
                <span className="font-bold text-[#131b2e]">{stats.tingkatKeterisian}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#eaedff] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${stats.tingkatKeterisian}%`, background: "linear-gradient(90deg, #fea619, #855300)" }}
                />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffddb8]/50 text-[#2a1700] text-[12px] font-semibold">
                <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                Tinggi jelang Dies Natalis
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#ffddb8]/10 rounded-full pointer-events-none" />
          </div>

          {/* Pendapatan */}
          <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-[#e2e7ff] flex flex-col justify-between">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] text-[#737781] font-semibold uppercase tracking-wider">Total Pendapatan Sewa</span>
                <h2 className="text-[26px] font-bold text-[#003466] mt-1">{formatRupiah(stats.totalPendapatanBulanIni)}</h2>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#6ffbbe]/25 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#003c27] text-[26px]">account_balance_wallet</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[13px] text-[#424750]">
                <span>Target ({formatRupiah(stats.targetPendapatan)})</span>
                <span className="font-bold text-[#131b2e]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#eaedff] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%`, background: "linear-gradient(90deg, #4edea3, #003c27)" }}
                />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f2f3ff] text-[#003c27] text-[12px] font-semibold">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                +{stats.pertumbuhanVsBulanLalu}% vs bulan lalu
              </span>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#6ffbbe]/10 rounded-full pointer-events-none" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e2e7ff] mb-6">
          <div className="flex border-b border-[#e2e7ff] overflow-x-auto scrollbar-none">
            {([
              { id: "overview", icon: "dashboard", label: "Ringkasan" },
              { id: "kelola-spot", icon: "storefront", label: "Kelola Spot" },
              { id: "booking-aktif", icon: "event_available", label: "Booking Aktif" },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[#003466] text-[#003466]"
                    : "border-transparent text-[#424750] hover:text-[#131b2e]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {activeTab === "overview" && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Chart */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-bold text-[#131b2e]">Pendapatan Mingguan (Okt 2025)</h3>
                    <select className="h-8 px-2 text-[12px] bg-[#f2f3ff] rounded-lg outline-none text-[#424750] border border-[#e2e7ff]">
                      <option>Bulan Ini</option>
                      <option>3 Bulan</option>
                    </select>
                  </div>
                  <div className="h-40 flex items-end gap-3">
                    {stats.pendapatanPerMinggu.map((week, i) => {
                      const maxVal = Math.max(...stats.pendapatanPerMinggu.map(w => w.pendapatan));
                      const barHeight = (week.pendapatan / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-[10px] text-[#424750] font-medium">
                            {formatRupiah(week.pendapatan).replace("Rp", "").trim()}
                          </span>
                          <div
                            className="w-full rounded-t-lg transition-all duration-700 cursor-pointer hover:opacity-80"
                            style={{
                              height: `${barHeight}%`,
                              background: i === stats.pendapatanPerMinggu.length - 1
                                ? "linear-gradient(180deg, #003466, #1a4b84)"
                                : "linear-gradient(180deg, #a6c8ff, #d5e3ff)",
                            }}
                            title={`${week.minggu}: ${formatRupiah(week.pendapatan)}`}
                          />
                          <span className="text-[11px] text-[#737781]">{week.minggu}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Zone Distribution */}
                <div>
                  <h3 className="text-[15px] font-bold text-[#131b2e] mb-4">Persebaran per Zona</h3>
                  <div className="space-y-3">
                    {stats.persebaranZona.map((zona, i) => {
                      const colors = ["#003466", "#855300", "#003c27", "#424750"];
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                            <span className="text-[13px] text-[#131b2e] font-medium">{zona.zona}</span>
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            <span className="text-[12px] text-[#737781]">{zona.bookingAktif} aktif</span>
                            <span className="text-[12px] font-semibold text-[#003466]">
                              {formatRupiah(zona.pendapatan)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-bold text-[#131b2e]">Transaksi Terkini</h3>
                  <button
                    onClick={() => setActiveTab("booking-aktif")}
                    className="text-[#003466] text-[13px] font-semibold hover:underline"
                  >
                    Lihat semua
                  </button>
                </div>
                <div className="space-y-2">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#1a4b84] flex items-center justify-center shrink-0">
                        <span className="text-white text-[14px] font-bold">{booking.penyewa.nama[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#131b2e] truncate">{booking.penyewa.nama}</p>
                        <p className="text-[11px] text-[#737781]">{booking.spotNama} • {booking.jumlahHari} hari</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-[#003466]">{formatRupiah(booking.totalBayar)}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          booking.statusVerifikasi === "disetujui"
                            ? "bg-[#6ffbbe] text-[#002113]"
                            : booking.statusVerifikasi === "ditolak"
                            ? "bg-[#ffdad6] text-[#93000a]"
                            : "bg-[#ffddb8] text-[#2a1700]"
                        }`}>
                          {booking.statusVerifikasi === "disetujui" ? "✓ Terverifikasi" : booking.statusVerifikasi === "ditolak" ? "✗ Ditolak" : "⏳ Menunggu"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Kelola Spot */}
          {activeTab === "kelola-spot" && (
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#737781] text-[18px]">search</span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama spot, kode, atau zona..."
                  className="w-full h-10 pl-10 pr-4 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-[#003466]/20 transition-all"
                />
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-[#e2e7ff]">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-[#f2f3ff]">
                    <tr>
                      {["Kode", "Nama Spot", "Zona", "Tarif/Hari", "Status", "Pendapatan", "Aksi"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#424750] uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpots.map((spot, i) => (
                      <tr
                        key={spot.id}
                        className={`border-t border-[#e2e7ff] hover:bg-[#f9fafb] transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-[#fafbff]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="font-bold text-[#003466] text-[13px]">{spot.kode}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-medium text-[#131b2e]">{spot.nama}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[12px] text-[#424750]">{spot.zonaLabel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-semibold text-[#131b2e]">
                            {formatRupiah(spot.tarifPerHari)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            defaultValue={spot.status}
                            onChange={(e) => handleStatusChange(spot, e.target.value)}
                            className={`px-2 py-1 rounded-full text-[11px] font-bold outline-none cursor-pointer ${
                              spot.status === "tersedia"
                                ? "bg-[#6ffbbe] text-[#002113]"
                                : spot.status === "dipesan"
                                ? "bg-[#ffddb8] text-[#2a1700]"
                                : "bg-[#e2e7ff] text-[#424750]"
                            }`}
                          >
                            <option value="tersedia">Tersedia</option>
                            <option value="dipesan">Dipesan</option>
                            <option value="pemeliharaan">Pemeliharaan</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[13px] font-semibold text-[#003466]">
                            {formatRupiah(spot.pendapatan)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingSpot(spot)}
                              className="w-7 h-7 rounded-lg bg-[#eaedff] hover:bg-[#dae2fd] flex items-center justify-center transition-colors"
                              title="Edit"
                            >
                              <span className="material-symbols-outlined text-[14px] text-[#003466]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSpot(spot)}
                              className="w-7 h-7 rounded-lg bg-[#ffdad6] hover:bg-[#ffb4ab] flex items-center justify-center transition-colors"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[14px] text-[#93000a]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Booking Aktif */}
          {activeTab === "booking-aktif" && (
            <div className="p-6">
              <div className="space-y-3">
                {MOCK_BOOKINGS.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-xl p-4 border border-[#e2e7ff] shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1a4b84] flex items-center justify-center shrink-0">
                          <span className="text-white text-[15px] font-bold">{booking.penyewa.nama[0]}</span>
                        </div>
                        <div>
                          <p className="text-[14px] font-bold text-[#131b2e]">{booking.penyewa.nama}</p>
                          <p className="text-[11px] text-[#737781]">
                            {booking.penyewa.nim} · {booking.penyewa.fakultas}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                        <div>
                          <span className="text-[#737781] font-medium block">Spot</span>
                          <span className="font-semibold text-[#131b2e]">{booking.spotKode}</span>
                        </div>
                        <div>
                          <span className="text-[#737781] font-medium block">Periode</span>
                          <span className="font-semibold text-[#131b2e]">
                            {formatDate(booking.tanggalMulai).split(" ").slice(0, 2).join(" ")} – {formatDate(booking.tanggalSelesai).split(" ").slice(0, 2).join(" ")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#737781] font-medium block">Total</span>
                          <span className="font-bold text-[#003466]">{formatRupiah(booking.totalBayar)}</span>
                        </div>
                        <div>
                          <span className="text-[#737781] font-medium block">Status</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            booking.statusVerifikasi === "disetujui"
                              ? "bg-[#6ffbbe] text-[#002113]"
                              : booking.statusVerifikasi === "ditolak"
                              ? "bg-[#ffdad6] text-[#93000a]"
                              : "bg-[#ffddb8] text-[#2a1700]"
                          }`}>
                            {booking.statusVerifikasi === "disetujui" ? "Terverifikasi" : booking.statusVerifikasi === "ditolak" ? "Ditolak" : "Menunggu Review"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onShowToast({ type: "success", message: `Booking ${booking.id} disetujui`, description: `${booking.penyewa.nama} dapat menggunakan spot` })}
                          className="h-8 px-3 rounded-lg bg-[#6ffbbe] text-[#002113] text-[12px] font-bold hover:bg-[#4edea3] transition-colors"
                          disabled={booking.statusVerifikasi !== "menunggu"}
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => onShowToast({ type: "error", message: `Booking ${booking.id} ditolak` })}
                          className="h-8 px-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-[12px] font-bold hover:bg-[#ffb4ab] transition-colors"
                          disabled={booking.statusVerifikasi !== "menunggu"}
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Tambah Spot */}
      {showAddSpotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddSpotModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#131b2e]">Tambah Lapak Baru</h2>
              <button onClick={() => setShowAddSpotModal(false)} className="w-8 h-8 rounded-full bg-[#f2f3ff] flex items-center justify-center hover:bg-[#eaedff] transition-colors">
                <span className="material-symbols-outlined text-[16px] text-[#424750]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Nama Spot *</label>
                  <input
                    value={addSpotForm.nama}
                    onChange={(e) => setAddSpotForm({ ...addSpotForm, nama: e.target.value })}
                    placeholder="cth. Spot Rektorat A-20"
                    className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:ring-2 focus:ring-[#003466]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Kode Spot *</label>
                  <input
                    value={addSpotForm.kode}
                    onChange={(e) => setAddSpotForm({ ...addSpotForm, kode: e.target.value })}
                    placeholder="cth. A-20"
                    className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:ring-2 focus:ring-[#003466]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Zona</label>
                  <select
                    value={addSpotForm.zona}
                    onChange={(e) => setAddSpotForm({ ...addSpotForm, zona: e.target.value })}
                    className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none appearance-none"
                  >
                    <option value="rektorat">Zona A – Rektorat</option>
                    <option value="boulevard">Zona B – Boulevard</option>
                    <option value="sc">Zona C – Student Center</option>
                    <option value="agrokompleks">Zona D – Agrokompleks</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Ukuran</label>
                  <select
                    value={addSpotForm.ukuran}
                    onChange={(e) => setAddSpotForm({ ...addSpotForm, ukuran: e.target.value })}
                    className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none appearance-none"
                  >
                    <option value="2x2">Standar 2×2m</option>
                    <option value="3x3">Medium 3×3m</option>
                    <option value="4x4">Gazebo 4×4m</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Tarif/Hari (Rp) *</label>
                  <input
                    type="number"
                    value={addSpotForm.tarif}
                    onChange={(e) => setAddSpotForm({ ...addSpotForm, tarif: e.target.value })}
                    placeholder="75000"
                    className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:ring-2 focus:ring-[#003466]/20"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Daya Listrik (W)</label>
                  <select
                    value={addSpotForm.daya}
                    onChange={(e) => setAddSpotForm({ ...addSpotForm, daya: e.target.value })}
                    className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none appearance-none"
                  >
                    <option value="450">450 Watt</option>
                    <option value="900">900 Watt</option>
                    <option value="1300">1300 Watt</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddSpotModal(false)}
                  className="flex-1 h-11 rounded-xl bg-[#f2f3ff] text-[#424750] text-[14px] font-semibold hover:bg-[#eaedff] transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddSpot}
                  disabled={isSubmittingSpot}
                  className="flex-1 h-11 rounded-xl bg-[#003466] text-white text-[14px] font-bold hover:bg-[#1a4b84] transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmittingSpot ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Spot"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Atur Tarif */}
      {showTarifModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTarifModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#131b2e]">Atur Tarif Sewa</h2>
              <button onClick={() => setShowTarifModal(false)} className="w-8 h-8 rounded-full bg-[#f2f3ff] flex items-center justify-center hover:bg-[#eaedff] transition-colors">
                <span className="material-symbols-outlined text-[16px] text-[#424750]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Standar (2×2m)", current: "75.000", icon: "aspect_ratio" },
                { label: "Medium (3×3m)", current: "110.000", icon: "crop_landscape" },
                { label: "Gazebo Besar (4×4m)", current: "165.000", icon: "crop_free" },
              ].map((tier) => (
                <div key={tier.label} className="flex items-center gap-4 p-3.5 bg-[#f2f3ff] rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-[#eaedff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#003466] text-[18px]">{tier.icon}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[13px] font-semibold text-[#131b2e]">{tier.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] text-[#424750]">Rp</span>
                    <input
                      defaultValue={tier.current}
                      className="w-24 h-8 px-2 bg-white text-[#131b2e] text-[13px] font-semibold rounded-lg outline-none focus:ring-2 focus:ring-[#003466]/20 text-right"
                    />
                    <span className="text-[11px] text-[#737781]">/hari</span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  setShowTarifModal(false);
                  onShowToast({ type: "success", message: "Tarif berhasil diperbarui!", description: "Perubahan berlaku mulai besok" });
                }}
                className="w-full h-11 rounded-xl bg-[#003466] text-white text-[14px] font-bold hover:bg-[#1a4b84] transition-colors"
              >
                Simpan Perubahan Tarif
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Spot */}
      {editingSpot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingSpot(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#131b2e]">Edit Spot {editingSpot.kode}</h2>
              <button onClick={() => setEditingSpot(null)} className="w-8 h-8 rounded-full bg-[#f2f3ff] flex items-center justify-center hover:bg-[#eaedff] transition-colors">
                <span className="material-symbols-outlined text-[16px] text-[#424750]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Nama Spot</label>
                <input
                  defaultValue={editingSpot.nama}
                  className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:ring-2 focus:ring-[#003466]/20"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#424750] mb-1.5 uppercase tracking-wide">Tarif/Hari (Rp)</label>
                <input
                  type="number"
                  defaultValue={editingSpot.tarifPerHari}
                  className="w-full h-10 px-3 bg-[#f2f3ff] text-[#131b2e] text-[13px] rounded-lg outline-none focus:ring-2 focus:ring-[#003466]/20"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingSpot(null)}
                  className="flex-1 h-11 rounded-xl bg-[#f2f3ff] text-[#424750] text-[14px] font-semibold hover:bg-[#eaedff] transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setEditingSpot(null);
                    onShowToast({ type: "success", message: `Spot ${editingSpot.kode} berhasil diperbarui` });
                  }}
                  className="flex-1 h-11 rounded-xl bg-[#003466] text-white text-[14px] font-bold hover:bg-[#1a4b84] transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

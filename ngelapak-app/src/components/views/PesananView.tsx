"use client";

import { useState } from "react";
import { cancelDemoBooking, useDemo } from "@/lib/demo-store";
import { formatDate, formatRupiah } from "@/lib/mock-data";
import type { Booking } from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";

export default function PesananView({
  onExplore,
  onShowToast,
}: {
  onExplore: () => void;
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const { user, bookings } = useDemo();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const canCancel = (booking: Booking) =>
    booking.status !== "dibatalkan" &&
    booking.status !== "selesai" &&
    booking.tanggalMulai >= new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Makassar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const confirmCancellation = () => {
    if (!cancelTarget) return;
    try {
      cancelDemoBooking(cancelTarget.id);
      setSelectedBooking(null);
      onShowToast({
        type: "success",
        message: "Pesanan berhasil dibatalkan",
        description: `Pesanan ${cancelTarget.id} tidak lagi memblokir jadwal lapak.`,
      });
    } catch (error) {
      onShowToast({
        type: "error",
        message: error instanceof Error ? error.message : "Pembatalan pesanan gagal",
      });
    } finally {
      setCancelTarget(null);
    }
  };

  if (user?.role !== "penyewa") return null;

  const getVerificationStyle = (status: Booking["statusVerifikasi"]) => {
    switch (status) {
      case "menunggu":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "disetujui":
        return "bg-green-50 text-green-800 border-green-200";
      case "ditolak":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getVerificationLabel = (status: Booking["statusVerifikasi"]) => {
    switch (status) {
      case "menunggu":
        return "Menunggu verifikasi";
      case "disetujui":
        return "Disetujui";
      case "ditolak":
        return "Ditolak";
      default:
        return status;
    }
  };

  const getBookingStatusLabel = (status: Booking["status"]) => {
    switch (status) {
      case "menunggu":
        return "Menunggu";
      case "aktif":
        return "Aktif";
      case "selesai":
        return "Selesai";
      case "dibatalkan":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  const getBookingStatusStyle = (status: Booking["status"]) => {
    switch (status) {
      case "aktif":
        return "bg-blue-50 text-blue-800";
      case "selesai":
        return "bg-gray-100 text-gray-700";
      case "dibatalkan":
        return "bg-red-50 text-red-800";
      case "menunggu":
        return "bg-amber-50 text-amber-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatCreatedAt = (date: string) => {
    return new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Makassar",
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
      {/* HEADER */}
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-[#003466] font-semibold">
            Ruang Penyewa
          </p>

          <h1 className="text-3xl font-bold mt-1">
            Pesanan Saya
          </h1>

          <p className="text-[#424750] mt-2">
            Pantau pengajuan dan riwayat sewa milik {user.nama}.
          </p>
        </div>

        <button
          onClick={onExplore}
          className="self-center bg-[#003466] hover:bg-[#004785] text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          Cari lapak
        </button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-[#e2e7ff] rounded-xl p-4">
          <p className="text-xs text-[#737781]">Total Pesanan</p>
          <p className="text-2xl font-bold text-[#003466] mt-1">
            {bookings.length}
          </p>
        </div>

        <div className="bg-white border border-[#e2e7ff] rounded-xl p-4">
          <p className="text-xs text-[#737781]">Menunggu</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {bookings.filter((b) => b.statusVerifikasi === "menunggu").length}
          </p>
        </div>

        <div className="bg-white border border-[#e2e7ff] rounded-xl p-4">
          <p className="text-xs text-[#737781]">Disetujui</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {bookings.filter((b) => b.statusVerifikasi === "disetujui").length}
          </p>
        </div>

        <div className="bg-white border border-[#e2e7ff] rounded-xl p-4">
          <p className="text-xs text-[#737781]">Ditolak</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {bookings.filter((b) => b.statusVerifikasi === "ditolak").length}
          </p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {!bookings.length && (
        <div className="p-10 text-center bg-white rounded-2xl border border-[#e2e7ff]">
          <div className="text-4xl mb-3">📋</div>

          <h2 className="font-bold text-lg">
            Belum ada pesanan
          </h2>

          <p className="text-sm text-[#737781] mt-2">
            Temukan lapak dan ajukan sewa pertama Anda.
          </p>

          <button
            onClick={onExplore}
            className="mt-5 bg-[#003466] hover:bg-[#004785] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            Jelajahi lapak
          </button>
        </div>
      )}

      {/* BOOKING LIST */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <article
            key={booking.id}
            className="bg-white rounded-2xl border border-[#e2e7ff] p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs text-[#737781]">
                  Kode pesanan
                </p>

                <p className="font-semibold text-sm mt-1 break-all">
                  {booking.id}
                </p>
              </div>

              <span
                className={`h-fit text-xs rounded-full px-3 py-1.5 font-semibold border ${getVerificationStyle(
                  booking.status === "dibatalkan" ? "ditolak" : booking.statusVerifikasi,
                )}`}
              >
                {booking.status === "dibatalkan" ? "Dibatalkan" : getVerificationLabel(booking.statusVerifikasi)}
              </span>
            </div>

            <div className="border-t border-[#eef0f5] my-4" />

            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="font-bold text-lg">
                  {booking.spotNama}
                </h2>

                <p className="text-sm text-[#737781] mt-1">
                  Kode lapak: {booking.spotKode}
                </p>

                <p className="text-sm mt-3">
                  {formatDate(booking.tanggalMulai)} –{" "}
                  {formatDate(booking.tanggalSelesai)}
                </p>

                <p className="text-sm text-[#424750] mt-1">
                  {booking.jumlahHari} hari · {booking.jenisUsaha}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-[#737781]">
                  Total pembayaran
                </p>

                <p className="font-bold text-xl text-[#003466] mt-1">
                  {formatRupiah(booking.totalBayar)}
                </p>

                <p className="text-xs text-[#737781] mt-1">
                  {booking.metodePembayaran}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 mt-5 pt-4 border-t border-[#eef0f5]">
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getBookingStatusStyle(
                  booking.status,
                )}`}
              >
                Status: {getBookingStatusLabel(booking.status)}
              </span>

              <div className="flex items-center gap-4">
                {canCancel(booking) && (
                  <button
                    onClick={() => setCancelTarget(booking)}
                    className="text-sm font-semibold text-red-700 hover:text-red-900 transition-colors"
                  >
                    Batalkan pesanan
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="text-sm font-semibold text-[#003466] hover:text-[#0061a8] transition-colors"
                >
                  Lihat detail →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* RECEIPT DETAIL MODAL */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="receipt-title"
            className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="bg-[#003466] text-white p-5 rounded-t-2xl flex justify-between items-start gap-3">
              <div>
                <p className="text-xs text-blue-200 font-medium">
                  NGELAPAK · BUKTI PESANAN
                </p>

                <h2
                  id="receipt-title"
                  className="text-xl font-bold mt-1"
                >
                  Detail Pesanan
                </h2>

                <p className="text-xs text-blue-100 mt-2 break-all">
                  {selectedBooking.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                aria-label="Tutup detail pesanan"
                className="text-white hover:bg-white/15 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* VERIFICATION STATUS */}
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-sm font-semibold">
                  Status verifikasi
                </span>

                <span
                  className={`text-xs rounded-full px-3 py-1.5 font-semibold border ${getVerificationStyle(
                    selectedBooking.status === "dibatalkan" ? "ditolak" : selectedBooking.statusVerifikasi,
                  )}`}
                >
                  {selectedBooking.status === "dibatalkan"
                    ? "Dibatalkan"
                    : getVerificationLabel(selectedBooking.statusVerifikasi)}
                </span>
              </div>

              {/* TENANT INFORMATION */}
              <section>
                <h3 className="font-bold text-sm mb-3">
                  Informasi Penyewa
                </h3>

                <div className="bg-[#f7f9fc] rounded-xl p-4 space-y-2 text-sm">
                  <DetailRow
                    label="Nama"
                    value={selectedBooking.penyewa.nama}
                  />

                  <DetailRow
                    label="NIM"
                    value={selectedBooking.penyewa.nim || "-"}
                  />

                  <DetailRow
                    label="Fakultas"
                    value={selectedBooking.penyewa.fakultas || "-"}
                  />

                  <DetailRow
                    label="Email"
                    value={selectedBooking.penyewa.email}
                  />

                  <DetailRow
                    label="Telepon"
                    value={selectedBooking.penyewa.telepon || "-"}
                  />
                </div>
              </section>

              {/* SPOT INFORMATION */}
              <section>
                <h3 className="font-bold text-sm mb-3">
                  Informasi Lapak
                </h3>

                <div className="bg-[#f7f9fc] rounded-xl p-4 space-y-2 text-sm">
                  <DetailRow
                    label="Nama lapak"
                    value={selectedBooking.spotNama}
                  />

                  <DetailRow
                    label="Kode lapak"
                    value={selectedBooking.spotKode}
                  />

                  <DetailRow
                    label="Jenis usaha"
                    value={selectedBooking.jenisUsaha}
                  />
                </div>
              </section>

              {/* RENTAL PERIOD */}
              <section>
                <h3 className="font-bold text-sm mb-3">
                  Periode Penyewaan
                </h3>

                <div className="bg-[#f7f9fc] rounded-xl p-4 space-y-2 text-sm">
                  <DetailRow
                    label="Tanggal mulai"
                    value={formatDate(selectedBooking.tanggalMulai)}
                  />

                  <DetailRow
                    label="Tanggal selesai"
                    value={formatDate(selectedBooking.tanggalSelesai)}
                  />

                  <DetailRow
                    label="Durasi"
                    value={`${selectedBooking.jumlahHari} hari`}
                  />
                </div>
              </section>

              {/* PAYMENT INFORMATION */}
              <section>
                <h3 className="font-bold text-sm mb-3">
                  Informasi Pembayaran
                </h3>

                <div className="bg-[#f7f9fc] rounded-xl p-4 space-y-2 text-sm">
                  <DetailRow
                    label="Metode pembayaran"
                    value={selectedBooking.metodePembayaran}
                  />

                  <DetailRow
                    label="Total pembayaran"
                    value={formatRupiah(selectedBooking.totalBayar)}
                  />

                  <DetailRow
                    label="Tanggal pemesanan"
                    value={formatCreatedAt(selectedBooking.createdAt)}
                  />
                </div>
              </section>

              {/* NOTES */}
              {selectedBooking.catatan && (
                <section>
                  <h3 className="font-bold text-sm mb-2">
                    Catatan Penyewa
                  </h3>

                  <p className="text-sm text-[#424750] bg-[#f7f9fc] rounded-xl p-4">
                    {selectedBooking.catatan}
                  </p>
                </section>
              )}

              {/* FOOTER STATUS */}
              <div className="border-t border-dashed border-[#d5dbea] pt-4">
                <p className="text-xs text-[#737781] text-center">
                  Dokumen ini merupakan detail transaksi dari sistem
                  demonstrasi Ngelapak.
                </p>
              </div>

              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full bg-[#003466] hover:bg-[#004785] text-white rounded-xl py-3 font-semibold text-sm transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div
          className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4"
          onClick={() => setCancelTarget(null)}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
            className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="cancel-booking-title" className="text-lg font-bold">
              Batalkan pesanan?
            </h2>
            <p className="text-sm text-[#424750] mt-2">
              Pesanan untuk <strong>{cancelTarget.spotNama}</strong> pada {formatDate(cancelTarget.tanggalMulai)} akan dibatalkan. Lapak dapat dipesan kembali untuk tanggal tersebut.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#d5dbea] text-sm font-semibold"
              >
                Kembali
              </button>
              <button
                onClick={confirmCancellation}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-sm font-semibold"
              >
                Ya, batalkan
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ============================================================
// REUSABLE DETAIL ROW
// ============================================================

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[#737781] shrink-0">
        {label}
      </span>

      <span className="text-right font-medium break-all">
        {value}
      </span>
    </div>
  );
}

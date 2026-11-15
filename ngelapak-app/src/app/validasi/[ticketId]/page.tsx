"use client";

import { use, useEffect, useState } from "react";
import { MOCK_BOOKINGS } from "@/lib/mock-data";
import Link from "next/link";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start py-8 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}

function BackLink() {
  return (
    <div className="mt-6 text-center">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#003466] hover:underline"
      >
        ← Kembali ke Ngelapak
      </Link>
    </div>
  );
}

// ─── Error: ticket not found ─────────────────────────────────────────────────

function TicketNotFound({ ticketId }: { ticketId: string }) {
  return (
    <PageShell>
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Tiket Tidak Valid
        </h1>
        <p className="text-gray-600 text-sm mb-4">
          Tiket dengan ID berikut tidak ditemukan dalam sistem Ngelapak.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 font-mono text-sm text-red-700 break-all">
          {ticketId}
        </div>
        <p className="text-xs text-gray-400">
          Pastikan kode tiket yang dimasukkan sudah benar, atau hubungi Biro
          Pengelolaan Aset Universitas Udayana untuk konfirmasi.
        </p>
      </div>
      <BackLink />
    </PageShell>
  );
}

// ─── Warning: permit not active ──────────────────────────────────────────────

function PermitNotActive({
  ticketId,
  reason,
}: {
  ticketId: string;
  reason: string;
}) {
  return (
    <PageShell>
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-amber-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.108-12.37c.86-1.496 3.035-1.496 3.895 0l7.108 12.37ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-amber-600 mb-2">
          Izin Tidak Aktif
        </h1>
        <p className="text-gray-600 text-sm mb-4">{reason}</p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 font-mono text-sm text-amber-700 break-all">
          {ticketId}
        </div>
        <p className="text-xs text-gray-400">
          Untuk informasi lebih lanjut, hubungi Biro Pengelolaan Aset
          Universitas Udayana.
        </p>
      </div>
      <BackLink />
    </PageShell>
  );
}

// ─── Helper component ────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap flex-shrink-0">
        {label}
      </span>
      <span
        className={`text-sm text-[#003466] text-right leading-snug ${mono ? "font-mono font-bold" : "font-medium"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main page (Client Component to support dynamic time inspection) ──────────

export default function ValidasiTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = use(params);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  // 1. Lookup booking
  const booking = MOCK_BOOKINGS.find((b) => b.id === ticketId);

  // 2. Not found
  if (!booking) {
    return <TicketNotFound ticketId={ticketId} />;
  }

  // 3. Cancelled or not approved
  if (
    booking.status === "dibatalkan" ||
    booking.statusVerifikasi !== "disetujui"
  ) {
    const reason =
      booking.status === "dibatalkan"
        ? "Izin lapak ini telah dibatalkan dan tidak berlaku lagi."
        : booking.statusVerifikasi === "ditolak"
        ? "Permohonan izin lapak ini telah ditolak oleh admin."
        : "Izin lapak ini masih menunggu persetujuan admin dan belum aktif.";
    return <PermitNotActive ticketId={ticketId} reason={reason} />;
  }

  // 4. Valid – compute activity status (based on client date when mounted)
  const currentDate = now ?? new Date(booking.tanggalMulai);
  const todayStr = currentDate.toISOString().slice(0, 10);
  const isActive =
    booking.tanggalMulai <= todayStr && todayStr <= booking.tanggalSelesai;
  const isUpcoming = booking.tanggalMulai > todayStr;

  let statusBadge: React.ReactNode;
  if (isActive) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
        AKTIF
      </span>
    );
  } else if (isUpcoming) {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
        IZIN BERLAKU
      </span>
    );
  } else {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-300">
        PERIODE BERAKHIR
      </span>
    );
  }

  const checkedAt = now ? formatDateTime(now) : "Memuat waktu pemeriksaan...";

  return (
    <PageShell>
      {/* ── Verification card ── */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Top accent bar */}
        <div className="h-2 bg-gradient-to-r from-[#003466] via-[#4edea3] to-[#003466]" />

        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-5">
            {/* Big checkmark */}
            <div className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-400 flex items-center justify-center mb-4 shadow-sm">
              <svg
                className="w-10 h-10 text-emerald-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>

            <h1 className="text-xl font-extrabold text-[#003466] tracking-wide mb-1">
              IZIN LAPAK TERVERIFIKASI
            </h1>
            <p className="text-xs text-gray-500 leading-snug max-w-xs">
              Dikeluarkan oleh Biro Pengelolaan Aset Universitas Udayana
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200 mb-5" />

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-3">
            <InfoRow label="Nama Penyewa" value={booking.penyewa.nama} />
            <InfoRow label="NIM" value={booking.penyewa.nim} />
            <InfoRow label="Jenis Usaha" value={booking.jenisUsaha} />
            <InfoRow label="Kode Lapak" value={booking.spotKode} mono />
            <InfoRow label="Nama Spot" value={booking.spotNama} />
            <InfoRow
              label="Periode"
              value={`${formatDate(booking.tanggalMulai)} – ${formatDate(booking.tanggalSelesai)}`}
            />
            <div className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 last:border-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                Status
              </span>
              <div className="text-right">{statusBadge}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200 mt-5 mb-4" />

          {/* Verification ID */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-gray-400 mb-1">ID Verifikasi</p>
            <p className="font-mono text-sm font-bold text-[#003466] break-all">
              {booking.id}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#003466] px-6 py-4 text-center">
          <p className="text-xs text-[#4edea3] font-semibold mb-1">
            Diperiksa: {checkedAt}
          </p>
          <p className="text-xs text-blue-200 opacity-80">
            Halaman ini bersifat publik dan dapat diakses tanpa login
          </p>
        </div>
      </div>

      {/* Back link */}
      <BackLink />
    </PageShell>
  );
}

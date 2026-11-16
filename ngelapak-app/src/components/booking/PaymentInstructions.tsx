"use client";

import { formatRupiah } from "@/lib/mock-data";

function isQris(metode: string) {
  return /qris/i.test(metode);
}

function metodeLabel(metode: string) {
  return metode.replace(/-/g, " ").toUpperCase();
}

/** Nomor VA demonstrasi yang konsisten per ID pesanan. */
function virtualAccountNumber(bookingId: string) {
  let hash = 0;
  for (let i = 0; i < bookingId.length; i += 1) {
    hash = (hash * 31 + bookingId.charCodeAt(i)) >>> 0;
  }
  const body = String(hash).padStart(10, "0").slice(0, 10);
  return `8821 ${body.slice(0, 4)} ${body.slice(4, 8)} ${body.slice(8)}`;
}

export default function PaymentInstructions({
  bookingId,
  metodePembayaran,
  totalBayar,
  compact = false,
}: {
  bookingId: string;
  metodePembayaran: string;
  totalBayar?: number;
  compact?: boolean;
}) {
  const qris = isQris(metodePembayaran);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${compact ? 140 : 180}x${compact ? 140 : 180}&data=${encodeURIComponent(bookingId)}`;

  return (
    <div
      className={`rounded-xl border border-[#e2e7ff] bg-[#faf8ff] ${compact ? "p-3 space-y-3" : "p-4 space-y-4"}`}
    >
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#737781]">
          Token / ID Transaksi
        </p>
        <p
          className={`mt-1 font-mono font-bold tracking-wider text-[#003466] break-all ${compact ? "text-sm" : "text-base"}`}
        >
          {bookingId}
        </p>
      </div>

      {typeof totalBayar === "number" && (
        <div className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs border border-[#e2e7ff]">
          <span className="text-[#737781]">Total tagihan</span>
          <span className="font-bold text-[#003466]">{formatRupiah(totalBayar)}</span>
        </div>
      )}

      {qris ? (
        <div className="flex flex-col items-center text-center">
          <img
            src={qrUrl}
            alt="Barcode pembayaran QRIS"
            className={`${compact ? "w-36 h-36" : "w-44 h-44"} border-4 border-white shadow-md rounded-lg bg-white`}
          />
          <p className={`mt-2 font-semibold text-[#131b2e] ${compact ? "text-[11px]" : "text-xs"}`}>
            Pindai QRIS dengan e-Wallet / Mobile Banking
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[#eaedff] border border-[#003466]/15 px-3 py-3 text-center space-y-1">
          <p className="text-[11px] font-bold uppercase text-[#003466]">
            {metodeLabel(metodePembayaran)}
          </p>
          <p className="text-[11px] text-[#737781]">Nomor Virtual Account</p>
          <p className={`font-mono font-bold text-[#131b2e] tracking-wide ${compact ? "text-base" : "text-xl"}`}>
            {virtualAccountNumber(bookingId)}
          </p>
          <p className="text-[10px] text-[#737781]">
            Cantumkan ID pesanan pada berita transfer.
          </p>
        </div>
      )}
    </div>
  );
}

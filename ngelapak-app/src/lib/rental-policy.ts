export const PAYMENT_WINDOW_MS = 60 * 60 * 1000;
export const CANCELLATION_WINDOW_MS = 24 * PAYMENT_WINDOW_MS;

export function rentalStart(tanggalMulai: string) {
  return Date.parse(`${tanggalMulai}T08:00:00+08:00`);
}

export function cancellationDeadline(tanggalMulai: string, paidAt: string) {
  return Math.min(
    Date.parse(paidAt) + CANCELLATION_WINDOW_MS,
    rentalStart(tanggalMulai) - CANCELLATION_WINDOW_MS,
  );
}

export function formatRentalTime(timestamp: number) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Makassar",
  }).format(timestamp) + " WITA";
}

export function paymentLabel(status: string, providerStatus?: string | null) {
  if (providerStatus === "perlu_ditinjau") return "Perlu ditinjau";
  if (providerStatus === "expire") return "Kedaluwarsa";
  if (status === "disetujui" || status === "lunas") return "Lunas";
  if (status === "ditolak" || status === "gagal") return "Gagal";
  return "Menunggu pembayaran";
}

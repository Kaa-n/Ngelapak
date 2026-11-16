export const PAYMENT_WINDOW_MS = 60 * 60 * 1000;
export const CANCELLATION_WINDOW_MS = 24 * PAYMENT_WINDOW_MS;
export const CLEANING_DAYS = 3;

/** Date in WITA, formatted for native date inputs. */
export function rentalDateInMakassar(daysFromToday = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const date = new Date(Date.UTC(value("year"), value("month") - 1, value("day") + daysFromToday));
  return date.toISOString().slice(0, 10);
}

/** A rental must be booked at least two calendar days in advance. */
export function minimumRentalStartDate() {
  return rentalDateInMakassar(2);
}

export function shiftRentalDate(date: string, days: number) {
  const timestamp = Date.parse(date);
  return Number.isFinite(timestamp)
    ? new Date(timestamp + days * CANCELLATION_WINDOW_MS).toISOString().slice(0, 10)
    : "";
}

export function rentalPeriodsConflict(start: string, end: string, occupiedStart: string, occupiedEnd: string) {
  return start <= shiftRentalDate(occupiedEnd, CLEANING_DAYS) &&
    shiftRentalDate(end, CLEANING_DAYS) >= occupiedStart;
}

export type OccupiedDateMark = "rental" | "cleaning";

/** Tanda tanggal: tervalidasi (jadwal operasional) atau masa cleaning. */
export function getOccupiedDateMark(
  date: string,
  occupied: { start: string; end: string }[],
): OccupiedDateMark | null {
  for (const range of occupied) {
    if (date >= range.start && date <= range.end) return "rental";
    if (date > range.end && date <= shiftRentalDate(range.end, CLEANING_DAYS)) {
      return "cleaning";
    }
  }
  return null;
}

/** Tanggal bentrok dengan masa sewa tervalidasi + 3 hari cleaning. */
export function isDateBlocked(
  date: string,
  occupied: { start: string; end: string }[],
) {
  return getOccupiedDateMark(date, occupied) !== null;
}

export function nextAvailableDate(
  from: string,
  occupied: { start: string; end: string }[],
  limitDays = 120,
) {
  let cursor = from;
  for (let i = 0; i < limitDays; i += 1) {
    if (!isDateBlocked(cursor, occupied)) return cursor;
    cursor = shiftRentalDate(cursor, 1);
  }
  return from;
}

/** Daftar tanggal bertanda untuk ditampilkan di form pemesanan. */
export function markedBookingDates(
  occupied: { start: string; end: string }[],
) {
  const marks: { date: string; mark: OccupiedDateMark }[] = [];
  const seen = new Set<string>();
  for (const range of occupied) {
    let cursor = range.start;
    while (cursor <= range.end) {
      if (!seen.has(cursor)) {
        seen.add(cursor);
        marks.push({ date: cursor, mark: "rental" });
      }
      cursor = shiftRentalDate(cursor, 1);
    }
    for (let i = 1; i <= CLEANING_DAYS; i += 1) {
      const cleaningDate = shiftRentalDate(range.end, i);
      if (!seen.has(cleaningDate)) {
        seen.add(cleaningDate);
        marks.push({ date: cleaningDate, mark: "cleaning" });
      }
    }
  }
  return marks.sort((a, b) => a.date.localeCompare(b.date));
}

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

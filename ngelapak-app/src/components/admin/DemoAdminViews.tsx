"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import AdminDashboard, { type RentalMetrics } from "@/components/admin/AdminDashboard";
import { AdminHeading, StatusPill } from "@/components/admin/AdminPresentation";
import { actionLinkClass, panelClass, primaryLinkClass } from "@/components/admin/styles";
import { useDemo, reviewDemoCancellation } from "@/lib/demo-store";
import PaymentHistory from "@/components/admin/PaymentHistory";
import { MOCK_SPOTS, type Booking } from "@/lib/mock-data";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("en", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Makassar" });
const weeklyRevenue = [240000, 415000, 375000, 540000, 620000, 460000, 780000, 150000];
const refunds = [
  { id: "DEMO-R01", nama: "Ni Kadek Ayu Maharani", lapak: "Spot Rektorat A-01", jumlah: 150000, status: "menunggu", bank: "Bank Mandiri · •••• 2048", alasan: "Jadwal kegiatan kampus berubah." },
  { id: "DEMO-R02", nama: "I Wayan Bayu Pratama", lapak: "Spot Kuliner Corner B-02", jumlah: 85000, status: "disetujui", bank: "Bank BNI · •••• 3910", alasan: "Jadwal tim usaha bentrok dengan perkuliahan." },
];

function getDemoMetrics(bookings: Booking[]): RentalMetrics {
  const parts = Object.fromEntries(dateFormat.formatToParts().map(({ type, value }) => [type, value]));
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const monday = new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  const totalVerified = bookings.reduce((total, item) =>
    item.statusVerifikasi === "disetujui" ? total + item.totalBayar : total, 0);
  const trend = weeklyRevenue.map((amount, index) => {
    const date = new Date(monday);
    date.setUTCDate(date.getUTCDate() - 7 * (weeklyRevenue.length - index - 1));
    return { week_start: date.toISOString().slice(0, 10), amount: amount + (index === weeklyRevenue.length - 1 ? totalVerified : 0) };
  });
  return {
    today,
    total_revenue: trend.reduce((total, week) => total + week.amount, 0),
    trend,
    occupancy: [...new Set(MOCK_SPOTS.map((spot) => spot.zona))].map((zona) => {
      const spots = MOCK_SPOTS.filter((spot) => spot.zona === zona);
      return {
        zona,
        occupied: spots.filter((spot) => spot.status === "dipesan").length,
        capacity: spots.filter((spot) => spot.status !== "pemeliharaan").length,
      };
    }),
  };
}

function pendingPayments(bookings: Booking[]) {
  return bookings.filter((booking) => booking.status === "menunggu" && booking.statusVerifikasi === "menunggu");
}

function DemoRecord({ title, subtitle, status, children }: {
  title: string;
  subtitle: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-[#e2e7ff] px-3 sm:px-4">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1 basis-44">
          <strong className="block break-words text-[#131b2e]">{title}</strong>
          <span className="mt-0.5 block break-words text-xs text-[#424750]">{subtitle}</span>
        </span>
        <span className="flex items-center gap-2">
          <StatusPill status={status} />
          <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-[#003466] group-open:rotate-180" />
        </span>
      </summary>
      <div className="space-y-3 border-t border-[#e2e7ff] py-3 text-sm text-[#424750]">{children}</div>
    </details>
  );
}

export function DemoDashboard() {
  const { user, bookings } = useDemo();
  return <AdminDashboard
    metrics={user?.role === "admin" ? getDemoMetrics(bookings) : null}
    paymentCount={pendingPayments(bookings).length}
    refundCount={refunds.filter((item) => item.status === "menunggu").length + bookings.filter((item) => item.pembatalan?.status === "menunggu").length}
    basePath="/demo/admin"
  />;
}

export function DemoSpots() {
  return (
    <>
      <AdminHeading title="Kelola Lapak" description="Lihat contoh tarif, daya listrik, dan status lapak kampus." />
      <section className={`${panelClass} space-y-2`}>
        <h2 className="mb-4 font-bold text-[#131b2e]">Inventaris lapak ({MOCK_SPOTS.length})</h2>
        {MOCK_SPOTS.map((spot) => (
          <DemoRecord key={spot.id} title={spot.nama} status={spot.status}
            subtitle={`${spot.kode} · ${spot.zonaLabel} · ${currency.format(spot.tarifPerHari)} / hari`}>
            <p>{spot.lokasi}</p>
            <p>{spot.ukuranLabel} · {spot.daya} W · {spot.fasilitas.join(", ")}</p>
          </DemoRecord>
        ))}
      </section>
    </>
  );
}

export function DemoPayments() {
  const { bookings } = useDemo();
  return <PaymentHistory total={bookings.length} rows={bookings.map((booking) => ({
    id: booking.id, spot: booking.spotNama, tenant: booking.penyewa.nama,
    amount: booking.totalBayar, status: booking.statusVerifikasi, providerStatus: booking.paymentStatus,
    method: "midtrans", paidAt: booking.paidAt,
    refundState: booking.pembatalan?.status === "disetujui"
      ? (booking.pembatalan.refundCompleted ? "completed" : "processing")
      : undefined,
  }))} />;
}

export function DemoRefunds() {
  const { bookings } = useDemo();
  const requests = bookings.filter((item) => item.pembatalan?.status);
  const [feedback, setFeedback] = useState("");

  function review(id: string, decision: "disetujui" | "ditolak" | "refund") {
    try {
      reviewDemoCancellation(id, decision);
      setFeedback(decision === "disetujui" ? "Pembatalan disetujui. Jadwal tersedia kembali." :
        decision === "refund" ? "Refund selesai." : "Pengajuan ditolak.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Pengajuan belum bisa diproses.");
    }
  }
  return (
    <>
      <AdminHeading title="Kelola Pembatalan & Refund" description="Lihat contoh alasan pembatalan, rekening tujuan, dan status refund." />
      <section className={`${panelClass} space-y-2`}>
        <h2 className="mb-4 font-bold text-[#131b2e]">Pengajuan pembatalan ({refunds.length + requests.length})</h2>
        {feedback && <p role="status" className="py-2 text-sm">{feedback}</p>}
        {requests.map((booking) => {
          const request = booking.pembatalan!;
          return (
            <DemoRecord key={booking.id} title={booking.penyewa.nama + " · " + booking.spotNama}
              status={request.status ?? "menunggu"} subtitle={booking.id + " · " + currency.format(booking.totalBayar)}>
              <p>Alasan: {request.alasan}</p>
              <p>Rekening tujuan: {request.bank} · {request.nomorRekening}</p>
              {request.status === "menunggu" && <div className="flex flex-wrap gap-2">
                <button type="button" className={primaryLinkClass} onClick={() => review(booking.id, "disetujui")}>Setujui pembatalan</button>
                <button type="button" className={actionLinkClass} onClick={() => review(booking.id, "ditolak")}>Tolak pembatalan</button>
              </div>}
              {request.status === "disetujui" && (request.refundCompleted ? <p>Refund selesai.</p> : (
                <button type="button" className={actionLinkClass} onClick={() => review(booking.id, "refund")}>Catat refund selesai</button>
              ))}
            </DemoRecord>
          );
        })}
        {refunds.map((request) => (
          <DemoRecord key={request.id} title={`${request.nama} · ${request.lapak}`} status={request.status}
            subtitle={`${request.id} · ${currency.format(request.jumlah)}`}>
            <p>Alasan: {request.alasan}</p>
            <p>Rekening tujuan: {request.bank}</p>
            {request.status === "disetujui" && <p>Bukti refund: transfer simulasi tercatat.</p>}
          </DemoRecord>
        ))}
      </section>
    </>
  );
}

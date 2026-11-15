"use client";

import { useState, useEffect } from "react";
import { canCancelBooking, useDemo } from "@/lib/demo-store";
import { paymentLabel } from "@/lib/rental-policy";
import { formatDate, formatRupiah } from "@/lib/mock-data";
import type { Booking } from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";
import type { SupabaseProfile } from "@/lib/supabase/auth";
import { getSupabaseBookings } from "@/lib/supabase/bookings";
import DetailPesananView from "./DetailPesananView";

// ============================================================
// TYPES & HELPERS
// ============================================================

type FilterTab = "semua" | "menunggu" | "disetujui" | "ditolak" | "dibatalkan";

function getEffectiveStatus(booking: Booking): FilterTab {
  if (booking.statusVerifikasi === "ditolak") return "ditolak";
  if (booking.status === "dibatalkan") return "dibatalkan";
  if (booking.statusVerifikasi === "disetujui") return "disetujui";
  return "menunggu";
}

function getStatusBadge(booking: Booking): {
  label: string;
  cls: string;
  icon: string;
} {
  if (booking.status === "dibatalkan" && booking.statusVerifikasi !== "ditolak")
    return {
      label: "Dibatalkan",
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: "cancel",
    };
  if (booking.statusVerifikasi === "disetujui")
    return {
      label: booking.status === "selesai" ? "Selesai"
        : booking.metodePembayaran === "midtrans" ? "Lunas" : "Disetujui",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "check_circle",
    };
  if (booking.statusVerifikasi === "ditolak")
    return {
      label: booking.metodePembayaran === "midtrans" ? paymentLabel(booking.statusVerifikasi, booking.paymentStatus) : "Ditolak",
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: "do_not_disturb_on",
    };
  return {
    label: booking.metodePembayaran === "midtrans" ? paymentLabel(booking.statusVerifikasi, booking.paymentStatus) : "Menunggu",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "schedule",
  };
}

// ============================================================
// STEPPER TIMELINE
// ============================================================

const STEPS = [
  { label: "Pesanan Dibuat", icon: "receipt_long" },
  { label: "Menunggu Verifikasi", icon: "pending_actions" },
  { label: "Disetujui / Ditolak", icon: "fact_check" },
  { label: "Sewa Aktif / Selesai", icon: "store" },
];

function getStepIndex(booking: Booking): number {
  if (booking.status === "selesai") return 4;
  if (booking.status === "aktif") return 3;
  if (
    booking.statusVerifikasi === "disetujui" ||
    booking.statusVerifikasi === "ditolak" ||
    booking.status === "dibatalkan"
  )
    return 2;
  if (booking.statusVerifikasi === "menunggu" && booking.status === "menunggu")
    return 1;
  return 0;
}

function StatusStepper({ booking }: { booking: Booking }) {
  const current = getStepIndex(booking);
  const steps = booking.metodePembayaran === "midtrans" ? [
    STEPS[0], { label: "Menunggu pembayaran", icon: "pending_actions" },
    { label: "Konfirmasi pembayaran", icon: "fact_check" }, STEPS[3],
  ] : STEPS;
  const isRejected =
    booking.statusVerifikasi === "ditolak" ||
    booking.status === "dibatalkan";

  return (
    <div className="flex items-start gap-0 w-full mt-4">
      {steps.map((step, idx) => {
        const done = idx < current;
        const active = idx === current;
        const rejected = isRejected && idx === 2;

        let dotCls = "bg-[#e2e7ff] border-[#c5cbe0]";
        let lineCls = "bg-[#e2e7ff]";
        let textCls = "text-[#9ba4b5]";

        if (done) {
          dotCls = "bg-[#4edea3] border-[#4edea3]";
          lineCls = "bg-[#4edea3]";
          textCls = "text-[#003466]";
        } else if (active && rejected) {
          dotCls = "bg-red-500 border-red-500";
          textCls = "text-red-700";
        } else if (active) {
          dotCls = "bg-[#003466] border-[#003466]";
          textCls = "text-[#003466] font-semibold";
        }

        return (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              {/* Left connector */}
              {idx > 0 && (
                <div
                  className={`flex-1 h-0.5 ${idx <= current ? lineCls : "bg-[#e2e7ff]"}`}
                />
              )}
              {/* Dot */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${dotCls}`}
              >
                {done ? (
                  <span className="material-symbols-outlined text-white text-[14px]">
                    check
                  </span>
                ) : (
                  <span
                    className={`material-symbols-outlined text-[14px] ${active && !rejected ? "text-white" : active && rejected ? "text-white" : "text-[#c5cbe0]"}`}
                  >
                    {step.icon}
                  </span>
                )}
              </div>
              {/* Right connector */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${idx < current ? lineCls : "bg-[#e2e7ff]"}`}
                />
              )}
            </div>
            <p className={`text-[10px] mt-1 text-center leading-tight ${textCls}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// BOOKING CARD
// ============================================================

function BookingCard({
  booking,
  onViewDetail,
}: {
  booking: Booking;
  onViewDetail: (id: string) => void;
}) {
  const badge = getStatusBadge(booking);
  const eligible = canCancelBooking(booking);

  return (
    <article className="bg-white rounded-2xl border border-[#e2e7ff] hover:shadow-md transition-shadow flex flex-col">
      {/* Card Header */}
      <div className="p-4 pb-0 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-bold text-base text-[#131b2e] leading-tight truncate">
            {booking.spotNama}
          </h2>
          <p className="text-xs text-[#737781] mt-0.5">{booking.spotKode}</p>
        </div>
        <span
          className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cls}`}
        >
          <span className="material-symbols-outlined text-[13px]">
            {badge.icon}
          </span>
          {badge.label}
        </span>
      </div>

      {/* Stepper */}
      <div className="px-4 pt-1">
        <StatusStepper booking={booking} />
      </div>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-[#f0f2fa]" />

      {/* Meta grid */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-[#737781]">
        <div>
          <p className="font-medium text-[#424750]">Periode</p>
          <p>{formatDate(booking.tanggalMulai)}</p>
          <p>s.d. {formatDate(booking.tanggalSelesai)}</p>
        </div>
        <div>
          <p className="font-medium text-[#424750]">Durasi</p>
          <p>{booking.jumlahHari} hari</p>
        </div>
        <div>
          <p className="font-medium text-[#424750]">Jenis Usaha</p>
          <p className="truncate">{booking.jenisUsaha}</p>
        </div>
        <div>
          <p className="font-medium text-[#424750]">Pembayaran</p>
          <p className="truncate">{booking.metodePembayaran}</p>
        </div>
      </div>

      {/* Total */}
      <div className="px-4 pb-3">
        <div className="bg-[#f4f6ff] rounded-xl px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-[#737781]">Total bayar</span>
          <span className="font-bold text-sm text-[#003466]">
            {formatRupiah(booking.totalBayar)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 mt-auto">
        <button
          onClick={() => onViewDetail(booking.id)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-[#003466] hover:bg-[#004785] text-white text-xs font-semibold py-2.5 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]">
            open_in_new
          </span>
          Lihat Detail
        </button>
        {eligible && (
          <button
            onClick={() => onViewDetail(booking.id)}
            className="flex items-center gap-1 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold px-3 py-2.5 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">
              cancel
            </span>
            Batalkan
          </button>
        )}
      </div>
    </article>
  );
}

// ============================================================
// FILTER TABS
// ============================================================

const TABS: { key: FilterTab; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "menunggu", label: "Menunggu" },
  { key: "disetujui", label: "Disetujui" },
  { key: "ditolak", label: "Ditolak" },
  { key: "dibatalkan", label: "Dibatalkan" },
];

// ============================================================
// MAIN VIEW
// ============================================================

  export default function PesananView({
    user,
    onExplore,
    onShowToast,
  }: {
    user: ReturnType<typeof useDemo>["user"] | SupabaseProfile | null;
    onExplore: () => void;
    onShowToast: (toast: Omit<ToastMessage, "id">) => void;
  }) {
    const { bookings: demoBookings } = useDemo();

    const [supabaseBookings, setSupabaseBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const isDemoUser = user?.id === "ayu" || user?.id === "bayu";

    const [reloadVersion, setReloadVersion] = useState(0);
    useEffect(() => {
      if (!user || user.role !== "penyewa" || isDemoUser) return;

      let mounted = true;

      async function loadBookings() {
        setLoading(true);
        setLoadError("");

        try {
          const data = await getSupabaseBookings();

          if (mounted) {
            setSupabaseBookings(data);
          }
        } catch (error) {
          if (mounted) {
            setLoadError(
              error instanceof Error
                ? error.message
                : "Gagal mengambil data pesanan."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }

      loadBookings();

      return () => {
        mounted = false;
      };
    }, [user, isDemoUser, reloadVersion]);

    const bookings = isDemoUser ? demoBookings : supabaseBookings;

    const [activeTab, setActiveTab] = useState<FilterTab>("semua");
    const [detailId, setDetailId] = useState<string | null>(null);

    if (user?.role !== "penyewa") return null;

  // If viewing detail, render DetailPesananView
  if (detailId) {
    return (
      <DetailPesananView
        key={detailId}
        bookingId={detailId}
        useSupabase={!isDemoUser}
        onBack={() => {
          setDetailId(null);
          setReloadVersion((value) => value + 1);
        }}
        onShowToast={onShowToast}
      />
    );
  }

  // Filter bookings
  const filtered =
    activeTab === "semua"
      ? bookings
      : bookings.filter((b) => getEffectiveStatus(b) === activeTab);

  // Counts for badges
  const counts: Record<FilterTab, number> = {
    semua: bookings.length,
    menunggu: bookings.filter((b) => getEffectiveStatus(b) === "menunggu").length,
    disetujui: bookings.filter((b) => getEffectiveStatus(b) === "disetujui").length,
    ditolak: bookings.filter((b) => getEffectiveStatus(b) === "ditolak").length,
    dibatalkan: bookings.filter((b) => getEffectiveStatus(b) === "dibatalkan").length,
  };

  return (
    <div
      className="max-w-6xl mx-auto px-4 py-8 pb-28"
      style={{ background: "#faf8ff", minHeight: "100vh" }}
    >
      {/* ── HEADER ── */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <p className="text-xs font-semibold text-[#855300] uppercase tracking-widest mb-1">
            Ruang Penyewa
          </p>
          <h1 className="text-3xl font-bold text-[#131b2e]">Pesanan Saya</h1>
          <p className="text-sm text-[#424750] mt-1">
            Pantau pengajuan dan riwayat sewa milik {user.nama}.
          </p>
        </div>
        <button
          onClick={onExplore}
          className="self-center flex items-center gap-2 bg-[#003466] hover:bg-[#004785] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          Cari Lapak
        </button>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          label="Total Pesanan"
          value={bookings.length}
          icon="receipt_long"
          color="text-[#003466]"
        />
        <SummaryCard
          label="Menunggu"
          value={counts.menunggu}
          icon="schedule"
          color="text-amber-600"
        />
        <SummaryCard
          label="Disetujui"
          value={counts.disetujui}
          icon="check_circle"
          color="text-emerald-600"
        />
        <SummaryCard
          label="Ditolak"
          value={counts.ditolak + counts.dibatalkan}
          icon="cancel"
          color="text-red-500"
        />
      </div>

      {/* ── FILTER TABS ── */}
      {bookings.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-6">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                  active
                    ? "bg-[#003466] text-white border-[#003466] shadow-sm"
                    : "bg-white text-[#424750] border-[#e2e7ff] hover:border-[#003466] hover:text-[#003466]"
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-[#eef0ff] text-[#003466]"
                    }`}
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {!isDemoUser && loading && <p role="status" className="mb-4 text-sm">Memuat pesanan…</p>}
      {!isDemoUser && loadError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          {loadError}
          <button type="button" className="ml-2 underline" onClick={() => setReloadVersion((value) => value + 1)}>
            Coba lagi
          </button>
        </div>
      )}
      {bookings.length === 0 && (isDemoUser || (!loading && !loadError)) && (
        <div className="bg-white rounded-2xl border border-[#e2e7ff] p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#eef0ff] flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-[#003466]">
              receipt_long
            </span>
          </div>
          <h2 className="font-bold text-lg text-[#131b2e]">Belum ada pesanan</h2>
          <p className="text-sm text-[#737781] mt-2 max-w-xs mx-auto">
            Temukan lapak yang sesuai dan ajukan sewa pertama kamu di Ngelapak.
          </p>
          <button
            onClick={onExplore}
            className="mt-6 inline-flex items-center gap-2 bg-[#003466] hover:bg-[#004785] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">explore</span>
            Jelajahi Lapak
          </button>
        </div>
      )}

      {/* ── FILTERED EMPTY ── */}
      {bookings.length > 0 && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-[#c5cbe0] p-10 text-center">
          <span className="material-symbols-outlined text-3xl text-[#c5cbe0]">
            filter_list_off
          </span>
          <p className="text-sm text-[#737781] mt-2">
            Tidak ada pesanan dengan status ini.
          </p>
        </div>
      )}

      {/* ── BOOKING GRID ── */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onViewDetail={setDetailId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-[#e2e7ff] rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#f0f2ff] flex items-center justify-center shrink-0">
        <span className={`material-symbols-outlined text-[20px] ${color}`}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-xs text-[#737781] leading-tight">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
      </div>
    </div>
  );
}

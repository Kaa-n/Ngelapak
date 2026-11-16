"use client";

import { useEffect, useState, type FormEvent } from "react";
import { canCancelBooking, cancelDemoBooking, completeDemoPayment, useDemo } from "@/lib/demo-store";
import {
  formatDate,
  formatRupiah,
  isPendingCancellationRefund,
  MOCK_SPOTS,
  type Booking,
  type Spot,
} from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";
import { printKuitansi } from "@/lib/pdf/generateKuitansi";
import { printSPPLA } from "@/lib/pdf/generateSPPLA";
import { getSupabaseBookingDetail, refreshPayment, requestSupabaseCancellation, resumePayment } from "@/lib/supabase/bookings";
import { createClient } from "@/lib/supabase/client";
import { cancellationDeadline, formatRentalTime, paymentLabel } from "@/lib/rental-policy";
import ProductCaptionEditor from "@/components/booking/ProductCaptionEditor";
import MapComponent from "@/components/home/MapComponent";

// ============================================================
// TYPES
// ============================================================

type CancelForm = {
  nama: string;
  nim: string;
  telepon: string;
  bank: string;
  nomorRekening: string;
  namaRekening: string;
  alasan: string;
};

// ============================================================
// HELPERS
// ============================================================

function getStatusInfo(booking: Booking): {
  label: string;
  cls: string;
  icon: string;
} {
  if (isPendingCancellationRefund(booking)) {
    return {
      label: "Menunggu Pengembalian Dana",
      cls: "bg-orange-50 text-orange-800 border-orange-200",
      icon: "hourglass_top",
    };
  }
  if (booking.status === "dibatalkan" && booking.statusVerifikasi !== "ditolak")
    return {
      label: "Dibatalkan",
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: "cancel",
    };
  if (booking.statusVerifikasi === "disetujui")
    return {
      label: booking.status === "selesai" ? "Selesai" : "Aktif",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "check_circle",
    };
  if (booking.statusVerifikasi === "ditolak")
    return {
      label: "Ditolak",
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: "do_not_disturb_on",
    };
  return {
    label: "Menunggu Verifikasi",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    icon: "schedule",
  };
}

function formatDateTime(isoStr: string) {
  return new Date(isoStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

// ============================================================
// STEPPER TIMELINE
// ============================================================

const STEPS = [
  { label: "Pesanan Dibuat", icon: "receipt_long" },
  { label: "Menunggu Verifikasi Admin", icon: "pending_actions" },
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
  if (booking.statusVerifikasi === "menunggu") return 1;
  return 0;
}

function StatusStepper({ booking }: { booking: Booking }) {
  const current = getStepIndex(booking);
  const steps = booking.metodePembayaran === "midtrans" ? [
    STEPS[0], { label: "Menunggu pembayaran", icon: "pending_actions" },
    { label: "Konfirmasi pembayaran", icon: "fact_check" }, STEPS[3],
  ] : STEPS;
  const isRejected =
    booking.statusVerifikasi === "ditolak" || booking.status === "dibatalkan";

  return (
    <div className="bg-white rounded-2xl border border-[#e2e7ff] p-5 mb-4">
      <h3 className="text-xs font-semibold text-[#737781] uppercase tracking-widest mb-4">
        Status Pesanan
      </h3>
      <div className="flex items-start">
        {steps.map((step, idx) => {
          const done = idx < current;
          const active = idx === current;
          const rejected = isRejected && idx === 2;

          let dotCls = "bg-[#eef0ff] border-[#c5cbe0] text-[#c5cbe0]";
          let lineCls = "bg-[#e2e7ff]";
          let labelCls = "text-[#9ba4b5]";

          if (done) {
            dotCls = "bg-[#4edea3] border-[#4edea3] text-white";
            lineCls = "bg-[#4edea3]";
            labelCls = "text-[#003466] font-medium";
          } else if (active && rejected) {
            dotCls = "bg-red-500 border-red-500 text-white";
            labelCls = "text-red-700 font-semibold";
          } else if (active) {
            dotCls = "bg-[#003466] border-[#003466] text-white";
            labelCls = "text-[#003466] font-semibold";
          }

          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="flex items-center w-full">
                {idx > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${idx <= current ? lineCls : "bg-[#e2e7ff]"}`}
                  />
                )}
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${dotCls}`}
                >
                  {done ? (
                    <span className="material-symbols-outlined text-[15px]">
                      check
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[15px]">
                      {step.icon}
                    </span>
                  )}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${idx < current ? lineCls : "bg-[#e2e7ff]"}`}
                  />
                )}
              </div>
              <p
                className={`text-[10px] mt-1.5 text-center leading-tight px-0.5 ${labelCls}`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// DETAIL ROW HELPER
// ============================================================

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-[#f0f2fa] last:border-0">
      <span className="text-xs text-[#737781] shrink-0">{label}</span>
      <span
        className={`text-xs text-right font-semibold text-[#131b2e] break-all ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e2e7ff] p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-[18px] text-[#003466]">
          {icon}
        </span>
        <h3 className="font-bold text-sm text-[#131b2e]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function getSpotLatLng(spot: Spot): [number, number] {
  const y = spot.koordinat?.y ?? 50;
  const x = spot.koordinat?.x ?? 50;
  return [-8.796 + (y - 50) * 0.0002, 115.176 + (x - 50) * 0.0002];
}

// ============================================================
// CANCELLATION FORM
// ============================================================

function CancellationForm({
  booking,
  submitCancellation,
  onSuccess,
  onCancel,
}: {
  booking: Booking;
  submitCancellation: (input: CancelForm) => Promise<string>;
  onSuccess: (msg: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CancelForm>({
    nama: booking.penyewa.nama,
    nim: booking.penyewa.nim,
    telepon: booking.penyewa.telepon,
    bank: "",
    nomorRekening: "",
    namaRekening: booking.penyewa.nama,
    alasan: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: keyof CancelForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      onSuccess(await submitCancellation(form));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pembatalan gagal disimpan.");
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof CancelForm; label: string; placeholder?: string }[] = [
    { key: "nama", label: "Nama Lengkap" },
    { key: "nim", label: "NIM" },
    { key: "telepon", label: "Nomor Telepon", placeholder: "08xxxxxxxxxx" },
    { key: "bank", label: "Bank", placeholder: "Contoh: BRI, BCA, Mandiri" },
    { key: "nomorRekening", label: "Nomor Rekening" },
    { key: "namaRekening", label: "Nama Pemilik Rekening" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-red-200 p-5 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-[20px] text-red-600">
          warning
        </span>
        <h3 className="font-bold text-sm text-red-800">Form Pembatalan Pesanan</h3>
      </div>
      <p className="text-xs text-[#737781] mb-4 pl-7">
        {booking.metodePembayaran === "midtrans"
          ? "Admin akan meninjau pengajuan. Jadwal tetap ditahan sampai pembatalan disetujui."
          : "Untuk transfer lama, pembatalan hanya tersedia dalam 1×24 jam selama admin belum memverifikasi."}
        {" "}Isi data rekening untuk proses refund.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          {fields.map(({ key, label, placeholder }) => (
            <label key={key} className="block text-xs">
              <span className="font-semibold text-[#424750] block mb-1">
                {label}
              </span>
              <input
                value={form[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                required
                className="w-full border border-[#dce1eb] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#003466] focus:ring-1 focus:ring-[#003466] transition"
              />
            </label>
          ))}
        </div>

        <label className="block text-xs">
          <span className="font-semibold text-[#424750] block mb-1">
            Alasan Pembatalan
          </span>
          <textarea
            value={form.alasan}
            onChange={(e) => update("alasan", e.target.value)}
            required
            rows={3}
            placeholder="Jelaskan alasan membatalkan pesanan..."
            className="w-full border border-[#dce1eb] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#003466] focus:ring-1 focus:ring-[#003466] resize-y transition"
          />
        </label>

        {error && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-[#dce1eb] text-sm font-semibold text-[#424750] hover:bg-[#f4f6ff] transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-700 hover:bg-red-800 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? "Memproses..." : "Ajukan Pembatalan"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DetailPesananView({
  bookingId,
  useSupabase = false,
  onBack,
  onShowToast,
}: {
  bookingId: string;
  useSupabase?: boolean;
  onBack: () => void;
  onShowToast?: (toast: Omit<ToastMessage, "id">) => void;
}) {
  const { bookings } = useDemo();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getSupabaseBookingDetail>>>();
  const [loadError, setLoadError] = useState("");
  const [version, setVersion] = useState(0);
  const [proofError, setProofError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const booking = useSupabase ? detail?.booking : bookings.find((b) => b.id === bookingId);
  const cancellation = useSupabase ? detail?.cancellation : null;
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [supabaseSpot, setSupabaseSpot] = useState<Spot | null>(null);

  useEffect(() => {
    if (!useSupabase || !booking?.spotId) return;
    let active = true;
    async function loadSpot() {
      const { data, error } = await createClient()
        .from("spots")
        .select("*")
        .eq("id", booking!.spotId)
        .maybeSingle();
      if (active && data && !error) {
        setSupabaseSpot({
          id: data.id,
          nama: data.nama,
          kode: data.kode,
          lokasi: data.lokasi ?? "Kampus Bukit Jimbaran, Universitas Udayana",
          zona: (data.zona as Spot["zona"]) || "rektorat",
          zonaLabel: data.zona_label || "Zona Kampus",
          ukuran: (data.ukuran as Spot["ukuran"]) || "2x2",
          ukuranLabel: data.ukuran_label || "Standar (2x2m)",
          daya: data.daya ?? 450,
          tarifPerHari: Number(data.tarif_per_hari ?? 75000),
          status: "tersedia",
          fasilitas: data.fasilitas ?? [],
          tags: data.tags ?? [],
          koordinat: {
            x: Number(data.koordinat_x ?? 50),
            y: Number(data.koordinat_y ?? 50),
          },
          gambar: data.gambar ?? "/images/spots/rektorat-a1.jpg",
          rating: Number(data.rating ?? 4.8),
          totalSewa: Number(data.total_sewa ?? 0),
          deskripsi: data.deskripsi ?? "",
        });
      }
    }
    void loadSpot();
    return () => {
      active = false;
    };
  }, [useSupabase, booking?.spotId]);

  useEffect(() => {
    if (!useSupabase) return;
    let active = true;
    getSupabaseBookingDetail(bookingId).then((result) => {
      if (active) setDetail(result);
    }).catch((error: Error) => {
      if (active) setLoadError(error.message);
    });
    return () => { active = false; };
  }, [bookingId, useSupabase, version]);

  useEffect(() => {
    if (!useSupabase || !/^MT-[a-f0-9]{32}$/.test(bookingId)) return;
    let active = true;
    void refreshPayment(bookingId).then(() => {
      if (active) setVersion((value) => value + 1);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [bookingId, useSupabase]);

  const waitingForPayment = booking?.metodePembayaran === "midtrans" && booking.status === "menunggu"
    && booking.paymentStatus !== "perlu_ditinjau";
  const expiresAt = booking?.paymentExpiresAt;
  useEffect(() => {
    if (!waitingForPayment) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setVersion((value) => value + 1);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [waitingForPayment]);

  useEffect(() => {
    if (!waitingForPayment || !useSupabase || !expiresAt) return;
    const delay = Math.max(0, Date.parse(expiresAt) + 120000 - Date.now());
    const timer = window.setTimeout(() => {
      void refreshPayment(bookingId).then(() => setVersion((value) => value + 1)).catch(() => undefined);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [bookingId, expiresAt, useSupabase, waitingForPayment]);

  if (useSupabase && loadError) return (
    <div className="mx-auto max-w-lg p-6">
      <p role="alert" className="text-red-700">{loadError}</p>
      <button onClick={() => { setLoadError(""); setVersion((value) => value + 1); }} className="mt-3 underline">
        Coba lagi
      </button>
    </div>
  );
  if (useSupabase && detail === undefined) return <p role="status" className="p-6">Memuat pesanan…</p>;

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#f0f2ff] flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-3xl text-[#9ba4b5]">
            receipt_long
          </span>
        </div>
        <h1 className="text-xl font-bold text-[#131b2e]">
          Pesanan tidak ditemukan
        </h1>
        <p className="text-sm text-[#737781] mt-2">
          Pesanan dengan ID <span className="font-mono">{bookingId}</span> tidak
          tersedia.
        </p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-[#003466] text-white text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Kembali
        </button>
      </div>
    );
  }

  const currentBooking = booking;
  const currentSpot: Spot =
    supabaseSpot ||
    (currentBooking
      ? MOCK_SPOTS.find(
        (s) => s.id === currentBooking.spotId || s.kode === currentBooking.spotKode
      ) || {
        id: currentBooking.spotId || "spot-custom",
        nama: currentBooking.spotNama || "Spot Lapak Kampus",
        kode: currentBooking.spotKode || "A-01",
        lokasi: "Kampus Bukit Jimbaran, Universitas Udayana",
        zona: "rektorat",
        zonaLabel: "Lapangan Kampus",
        ukuran: "2x2",
        ukuranLabel: "Standar (2x2m)",
        daya: 450,
        tarifPerHari: currentBooking.totalBayar / Math.max(1, currentBooking.jumlahHari),
        status: "dipesan",
        fasilitas: ["Listrik 450W", "Paving Bersih", "Keamanan 24 Jam"],
        tags: ["Kuliner", "Strategis"],
        koordinat: { x: 50, y: 50 },
        gambar: "/images/spots/rektorat-a1.jpg",
        rating: 4.8,
        totalSewa: 1,
        deskripsi: "Titik stan resmi terdaftar Universitas Udayana.",
      }
      : MOCK_SPOTS[0]);

  const [spotLat, spotLng] = getSpotLatLng(currentSpot);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${spotLat.toFixed(6)},${spotLng.toFixed(6)}`;


  const statusInfo = getStatusInfo(currentBooking);
  const isMidtrans = booking.metodePembayaran === "midtrans";
  const cancellationStatus = cancellation?.status ?? booking.pembatalan?.status;
  const bolehBatal = canCancelBooking(currentBooking, now) && (!cancellation || (!isMidtrans && cancellation.status === "ditolak"));
  const isApproved = currentBooking.statusVerifikasi === "disetujui" && currentBooking.status !== "dibatalkan";
  const isPaid = isApproved && (isMidtrans ? currentBooking.paymentStatus === "settlement" : Boolean(currentBooking.paidAt));
  const canDownloadAgreement = isApproved && cancellationStatus !== "menunggu" && cancellationStatus !== "disetujui";
  const canContinuePayment = useSupabase && Date.parse(expiresAt ?? "") > now;

  async function checkPayment() {
    setPaymentError("");
    setChecking(true);
    try {
      if (useSupabase) await refreshPayment(bookingId);
      else completeDemoPayment(bookingId);
      setVersion((value) => value + 1);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Pembayaran belum dapat diperiksa.");
    } finally {
      setChecking(false);
    }
  }

  async function continuePayment() {
    setPaymentError("");
    setChecking(true);
    try {
      window.location.assign(await resumePayment(bookingId));
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Tautan pembayaran belum tersedia.");
    } finally {
      setChecking(false);
    }
  }

  async function downloadDemoAgreement() {
    setPaymentError("");
    try {
      const { rentalAgreementPdf } = await import("@/lib/pdf/rentalAgreement");
      const pdf = await rentalAgreementPdf({
        id: currentBooking.id,
        tenant: currentBooking.penyewa.nama,
        nim: currentBooking.penyewa.nim || undefined,
        fakultas: currentBooking.penyewa.fakultas || undefined,
        telepon: currentBooking.penyewa.telepon || undefined,
        email: currentBooking.penyewa.email || undefined,
        namaUsaha: currentBooking.namaUsaha || undefined,
        jenisUsaha: currentBooking.jenisUsaha || undefined,
        spot: `${currentBooking.spotNama} (${currentBooking.spotKode})`,
        spotKode: currentBooking.spotKode,
        lokasi: currentSpot.lokasi,
        zonaLabel: currentSpot.zonaLabel,
        ukuran: currentSpot.ukuran,
        daya: currentSpot.daya,
        start: currentBooking.tanggalMulai,
        end: currentBooking.tanggalSelesai,
        jumlahHari: currentBooking.jumlahHari,
        amount: currentBooking.totalBayar,
        metodePembayaran:
          currentBooking.metodePembayaran || "Midtrans / Transfer Bank",
        paidAt:
          currentBooking.paidAt ||
          currentBooking.createdAt ||
          new Date().toISOString(),
        googleMapsUrl,
        lat: spotLat,
        lng: spotLng,
      });
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(pdf)], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `MOU-${currentBooking.id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
      setPaymentError("PDF MOU gagal dibuat. Coba lagi.");
    }
  }
  async function submitCancellation(form: CancelForm) {
    if (!useSupabase) {
      cancelDemoBooking(bookingId, form);
      return isMidtrans ? "Pengajuan pembatalan menunggu keputusan admin." : "Pesanan telah dibatalkan.";
    }
    await requestSupabaseCancellation({
      p_booking_id: bookingId, p_nama: form.nama, p_nim: form.nim, p_telepon: form.telepon,
      p_bank: form.bank, p_nomor_rekening: form.nomorRekening,
      p_nama_rekening: form.namaRekening, p_alasan: form.alasan,
    });
    setDetail(undefined);
    setVersion((value) => value + 1);
    return "Pengajuan pembatalan menunggu keputusan admin.";
  }

  async function showRefundProof(path: string) {
    setProofError("");
    const { data } = await createClient().storage.from("refund-proofs").createSignedUrl(path, 120);
    if (!data) {
      setProofError("Bukti refund gagal dimuat. Coba lagi.");
      return;
    }
    window.location.assign(data.signedUrl);
  }

  function handleCancelSuccess(msg: string) {
    setShowCancelForm(false);
    setCancelNote(msg);
    onShowToast?.({
      type: "success",
      message: useSupabase || isMidtrans ? "Pembatalan diajukan" : "Pesanan dibatalkan",
      description: msg,
    });
  }

  function handlePrintKuitansi() {
    try {
      printKuitansi(currentBooking);
    } catch {
      onShowToast?.({
        type: "error",
        message: "Gagal membuka kuitansi",
      });
    }
  }

  function handlePrintSPPLA() {
    try {
      printSPPLA(currentBooking);
    } catch {
      onShowToast?.({
        type: "error",
        message: "Gagal membuka kontrak SPPLA",
      });
    }
  }

  return (
    <div
      className="max-w-3xl mx-auto px-4 py-8 pb-28"
      style={{ background: "#faf8ff", minHeight: "100vh" }}
    >
      {/* ── Back button ── */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#003466] mb-6 hover:text-[#004785] transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        Kembali ke Daftar Pesanan
      </button>

      {/* ── Page heading ── */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#855300] uppercase tracking-widest mb-1">
          {booking.namaUsaha ? "Pesanan Usaha Mahasiswa" : "Pesanan"}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#003466]">
            {booking.namaUsaha ? booking.namaUsaha : "Detail Pesanan"}
          </h1>
          <span
            className={`flex items - center gap - 1.5 text - xs font - semibold px - 3 py - 1.5 rounded - full border ${statusInfo.cls} `}
          >
            <span className="material-symbols-outlined text-[14px]">
              {statusInfo.icon}
            </span>
            {isPendingCancellationRefund(booking)
              ? statusInfo.label
              : isMidtrans && booking.status !== "dibatalkan"
                ? paymentLabel(booking.statusVerifikasi, booking.paymentStatus)
                : statusInfo.label}
          </span>
        </div>
        <p className="text-xs text-[#424750] font-medium mt-1">
          {booking.spotNama}{" "}
          <span className="font-mono text-[#737781]">({booking.spotKode})</span>
        </p>
        <p className="text-xs text-[#737781] font-mono mt-0.5">ID: {booking.id}</p>
      </div>

      {/* ── Stepper timeline ── */}
      <StatusStepper booking={booking} />

      {/* ── Informasi Penyewa ── */}
      <SectionCard title="Informasi Penyewa" icon="person">
        <DetailRow label="Nama" value={booking.penyewa.nama} />
        <DetailRow label="NIM" value={booking.penyewa.nim || "—"} mono />
        <DetailRow label="Fakultas" value={booking.penyewa.fakultas || "—"} />
        <DetailRow label="Email" value={booking.penyewa.email} />
        <DetailRow label="Telepon" value={booking.penyewa.telepon || "—"} />
      </SectionCard>

      {/* ── Detail Lapak & Periode ── */}
      <SectionCard title="Detail Lapak & Periode" icon="storefront">
        <DetailRow label="Nama Lapak" value={booking.spotNama} />
        <DetailRow label="Kode Lapak" value={booking.spotKode} mono />
        <DetailRow label="Nama Usaha" value={booking.namaUsaha || "—"} />
        {booking.kategoriPenjual && (
          <DetailRow label="Kategori Pengelola" value={booking.kategoriPenjual} />
        )}
        <DetailRow label="Jenis Usaha" value={booking.jenisUsaha} />
        <DetailRow
          label="Tanggal Mulai"
          value={formatDate(booking.tanggalMulai)}
        />
        <DetailRow
          label="Tanggal Selesai"
          value={formatDate(booking.tanggalSelesai)}
        />
        <DetailRow label="Durasi" value={`${booking.jumlahHari} hari`} />
        {booking.catatan && (
          <div className="mt-3 pt-3 border-t border-[#f0f2fa]">
            <p className="text-xs text-[#737781] mb-1">Catatan</p>
            <p className="text-xs text-[#424750] bg-[#f7f9fc] rounded-lg px-3 py-2">
              {booking.catatan}
            </p>
          </div>
        )}
      </SectionCard>

      {/* ── Peta Lokasi Lapak ── */}
      <SectionCard title="Peta Lokasi Lapak" icon="map">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#f0f2fa]">
          <div>
            <p className="text-xs font-semibold text-[#131b2e]">
              {currentSpot.nama} ({currentSpot.kode})
            </p>
            <p className="text-xs text-[#737781] mt-0.5">
              {currentSpot.lokasi} • {currentSpot.zonaLabel}
            </p>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold text-[#003466] bg-[#f0f3ff] hover:bg-[#e2e7ff] border border-[#d2dbfa] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">open_in_new</span>
            Buka di Google Maps
          </a>
        </div>
        <div className="rounded-xl overflow-hidden border border-[#e2e7ff] mt-3">
          <MapComponent spots={[currentSpot]} defaultStatus="all" />
        </div>
        <p className="text-[11px] text-[#737781] mt-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">info</span>
          Titik koordinat penempatan stan Anda telah terplot secara presisi pada peta kampus.
        </p>
      </SectionCard>

      {/* ── Informasi Pembayaran ── */}
      <SectionCard title="Informasi Pembayaran" icon="payments">
        <DetailRow
          label="Metode Pembayaran"
          value={isMidtrans ? "Midtrans" : booking.metodePembayaran}
        />
        <DetailRow
          label="Total Pembayaran"
          value={formatRupiah(booking.totalBayar)}
        />
        <DetailRow
          label="Tanggal Pemesanan"
          value={formatDateTime(booking.createdAt)}
        />
        {booking.buktiBayar && (
          <DetailRow label="Bukti Bayar" value={useSupabase ? "Tercatat" : booking.buktiBayar} />
        )}
        <div className="mt-3 pt-3 border-t border-[#f0f2fa] flex items-center justify-between">
          <span className="text-xs text-[#737781]">{isMidtrans ? "Status pembayaran" : "Status Verifikasi"}</span>
          <span
            className={`text - xs font - semibold px - 2.5 py - 1 rounded - full border ${booking.statusVerifikasi === "disetujui"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : booking.statusVerifikasi === "ditolak"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
              } `}
          >
            {isMidtrans ? paymentLabel(booking.statusVerifikasi, booking.paymentStatus) : booking.statusVerifikasi === "disetujui"
              ? "Disetujui"
              : booking.statusVerifikasi === "ditolak"
                ? "Ditolak"
                : "Menunggu"}
          </span>
        </div>
        {booking.paidAt && isMidtrans && <DetailRow label="Waktu lunas" value={formatRentalTime(Date.parse(booking.paidAt))} />}
        {waitingForPayment && booking.paymentExpiresAt && (
          <DetailRow label="Batas pembayaran" value={formatRentalTime(Date.parse(booking.paymentExpiresAt))} />
        )}
        {waitingForPayment && (
          <div className="mt-3 flex flex-wrap gap-3">
            {canContinuePayment && booking.checkoutUrl && (
              <a className="rounded-lg bg-[#003466] px-3 py-2 text-sm font-semibold text-white" href={booking.checkoutUrl}>Lanjutkan pembayaran</a>
            )}
            {canContinuePayment && !booking.checkoutUrl && (
              <button type="button" disabled={checking} onClick={continuePayment}
                className="rounded-lg bg-[#003466] px-3 py-2 text-sm font-semibold text-white">Lanjutkan pembayaran</button>
            )}
            <button type="button" disabled={checking} onClick={checkPayment} className="rounded-lg border border-[#d7def5] px-3 py-2 text-sm font-semibold text-[#003466]">
              {checking ? "Memeriksa…" : useSupabase ? "Periksa status pembayaran" : "Simulasikan pembayaran berhasil"}
            </button>
          </div>
        )}
        {paymentError && <p role="alert" className="mt-2 text-sm text-red-700">{paymentError}</p>}
      </SectionCard>

      {currentBooking.spotId && (
        isPaid ? (
          <ProductCaptionEditor
            spotId={currentBooking.spotId}
            ownerId={currentBooking.ownerId}
            useSupabase={useSupabase}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-[#e2e7ff] p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[18px] text-[#003466]">description</span>
              <h3 className="font-bold text-sm text-[#131b2e]">Deskripsi Produk</h3>
            </div>
            <p className="text-xs text-[#737781] bg-[#f8f9ff] border border-[#e2e7ff] rounded-xl p-3">
              Deskripsi produk dan menu stan dapat diisi setelah pesanan disetujui dan pembayaran terverifikasi (lunas).
            </p>
          </div>
        )
      )}

      {cancellation && (
        <SectionCard title="Pengajuan pembatalan" icon="cancel">
          <DetailRow label="Status" value={cancellation.status} />
          <DetailRow label="Alasan" value={cancellation.alasan ?? "—"} />
          {cancellation.admin_catatan && <DetailRow label="Catatan admin" value={cancellation.admin_catatan} />}
          {cancellation.status === "menunggu" && <p className="mt-3 text-sm">Jadwal tetap ditahan sampai admin memproses pengajuan.</p>}
          {cancellation.status === "disetujui" && !cancellation.bukti_refund && <DetailRow label="Refund" value="Sedang diproses" />}
          {cancellation.bukti_refund && cancellation.status === "disetujui" && (
            <button type="button" className="mt-3 text-sm font-semibold text-[#003466] underline"
              onClick={() => showRefundProof(cancellation.bukti_refund!)}>
              Buka bukti refund
            </button>
          )}
          {proofError && <p role="alert" className="mt-2 text-sm text-red-700">{proofError}</p>}
        </SectionCard>
      )}

      {/* ── Pembatalan Info (if already cancelled) ── */}
      {booking.pembatalan && (
        <SectionCard title="Detail Pembatalan" icon="cancel">
          <div className="bg-red-50 rounded-xl px-3 py-2 mb-3 text-xs text-red-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">info</span>
            {isPendingCancellationRefund(booking)
              ? "Pengajuan pembatalan Anda sedang diproses admin. Slot lapak ditahan hingga keputusan refund."
              : booking.pembatalan.status === "ditolak"
                ? "Pengajuan ditolak dan sewa masih berlaku."
                : booking.pembatalan.refundCompleted
                  ? "Pesanan dibatalkan dan refund selesai."
                  : booking.pembatalan.status === "disetujui"
                    ? "Pesanan dibatalkan. Refund sedang diproses."
                    : "Pesanan ini telah dibatalkan."}
          </div>
          <DetailRow label="Diajukan oleh" value={booking.pembatalan.nama} />
          <DetailRow label="NIM" value={booking.pembatalan.nim} mono />
          <DetailRow label="Telepon" value={booking.pembatalan.telepon} />
          <DetailRow label="Bank" value={booking.pembatalan.bank} />
          <DetailRow
            label="Nomor Rekening"
            value={booking.pembatalan.nomorRekening}
            mono
          />
          <DetailRow
            label="Atas Nama"
            value={booking.pembatalan.namaRekening}
          />
          <DetailRow label="Alasan" value={booking.pembatalan.alasan} />
          {booking.pembatalan.adminNote && <DetailRow label="Catatan admin" value={booking.pembatalan.adminNote} />}
          <DetailRow
            label="Diajukan pada"
            value={formatDateTime(booking.pembatalan.diajukanPada)}
          />
        </SectionCard>
      )}

      {/* ── Cancel success note ── */}
      {cancelNote && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-4 text-sm text-emerald-800">
          <span className="material-symbols-outlined text-[18px]">
            check_circle
          </span>
          {cancelNote}
        </div>
      )}

      {/* ── Cancellation form (inline) ── */}
      {bolehBatal && showCancelForm && (
        <CancellationForm
          booking={booking}
          submitCancellation={submitCancellation}
          onSuccess={handleCancelSuccess}
          onCancel={() => setShowCancelForm(false)}
        />
      )}

      {/* ── Action buttons ── */}
      <div className="bg-white rounded-2xl border border-[#e2e7ff] p-5">
        <h3 className="text-xs font-semibold text-[#737781] uppercase tracking-widest mb-4">
          Tindakan
        </h3>
        {isMidtrans && booking.paidAt && !cancellationStatus && booking.status === "aktif" && (
          <p className="mb-3 text-sm text-[#424750]">
            {bolehBatal ? `Batas pengajuan batal ${formatRentalTime(cancellationDeadline(booking.tanggalMulai, booking.paidAt))}.`
              : "Batas pengajuan batal sudah lewat."}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Batalkan Pesanan */}
          {bolehBatal && !showCancelForm && (
            <button
              type="button"
              onClick={() => setShowCancelForm(true)}
              className="flex items-center justify-center gap-2 border border-red-300 text-red-700 hover:bg-red-50 font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                cancel
              </span>
              Ajukan Pembatalan
            </button>
          )}

          {/* Unduh Kuitansi */}
          {isApproved && (
            <button
              type="button"
              onClick={handlePrintKuitansi}
              className="flex items-center justify-center gap-2 bg-[#003466] hover:bg-[#004785] text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                receipt
              </span>
              Unduh Kuitansi
            </button>
          )}

          {/* Unduh Kontrak SPPLA */}
          {canDownloadAgreement && !isMidtrans && !useSupabase && (
            <button
              type="button"
              onClick={handlePrintSPPLA}
              className="flex items-center justify-center gap-2 bg-[#003466] hover:bg-[#004785] text-white font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                description
              </span>
              Unduh Kontrak SPPLA
            </button>
          )}

          {/* Unduh PDF MOU Resmi */}
          {canDownloadAgreement && (
            <button
              type="button"
              onClick={downloadDemoAgreement}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003466] hover:bg-[#004785] px-4 py-3 text-center text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                description
              </span>
              Unduh PDF MOU Resmi
            </button>
          )}

          {/* No actions available */}
          {
            !isMidtrans && !bolehBatal && !isApproved && (
              <div className="flex items-center gap-2 text-sm text-[#737781]">
                <span className="material-symbols-outlined text-[18px]">
                  info
                </span>
                {booking.status === "dibatalkan"
                  ? "Pesanan ini telah dibatalkan."
                  : booking.statusVerifikasi === "ditolak"
                    ? "Pesanan ini ditolak oleh admin."
                    : "Menunggu verifikasi admin. Belum ada tindakan yang tersedia."}
              </div>
            )
          }
        </div >
      </div >

      {/* ── Footer note ── */}
      < p className="text-xs text-center text-[#9ba4b5] mt-6" >
        Dokumen ini merupakan detail transaksi dari sistem demonstrasi Ngelapak.
      </p >
    </div >
  );
}

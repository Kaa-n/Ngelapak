"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  attachDemoBookingProof,
  canCancelBooking,
  cancelDemoBooking,
} from "@/lib/demo-store";
import {
  formatDate,
  formatRupiah,
  isPendingCancellationRefund,
  type Booking,
} from "@/lib/mock-data";
import type { ToastMessage } from "@/lib/types";
import { printKuitansi } from "@/lib/pdf/generateKuitansi";
import { printSPPLA } from "@/lib/pdf/generateSPPLA";
import { createClient } from "@/lib/supabase/client";
import {
  cancelSupabaseBooking,
  uploadBookingProof,
} from "@/lib/supabase/bookings";
import PaymentInstructions from "@/components/booking/PaymentInstructions";

function isDemoBooking(booking: Booking) {
  return (
    booking.id.startsWith("TXN-") ||
    booking.ownerId === "ayu" ||
    booking.ownerId === "bayu"
  );
}

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
}

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
  if (booking.status === "dibatalkan")
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
  if (!booking.buktiBayar) {
    return {
      label: "Menunggu Pembayaran",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "payments",
    };
  }

  return {
    label: "Menunggu Konfirmasi",
    cls: "bg-blue-50 text-blue-700 border-blue-200",
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

function PaymentProof({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const isImage = /\.(jpe?g|png)$/i.test(path);

  useEffect(() => {
    let active = true;

    async function loadProof() {
      const { data, error } = await createClient()
        .storage
        .from("payment-proofs")
        .createSignedUrl(path, 60 * 10);

      if (!active) return;
      if (error || !data?.signedUrl) {
        setError("Bukti pembayaran tidak dapat dibuka.");
        return;
      }

      setUrl(data.signedUrl);
    }

    void loadProof();
    return () => {
      active = false;
    };
  }, [path]);

  if (error) {
    return <p className="text-xs text-red-700">{error}</p>;
  }

  if (!url) {
    return <p className="text-xs text-[#737781]">Memuat bukti pembayaran…</p>;
  }

  return (
    <div className="space-y-3">
      {isImage && (
        <img
          src={url}
          alt="Bukti pembayaran"
          className="max-h-80 w-full rounded-xl border border-[#e2e7ff] object-contain bg-[#f7f9fc]"
        />
      )}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-[#003466] px-3 py-2 text-xs font-semibold text-white hover:bg-[#004785]"
      >
        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
        {isImage ? "Buka gambar ukuran penuh" : "Buka bukti pembayaran"}
      </a>
    </div>
  );
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
  const isRejected =
    booking.statusVerifikasi === "ditolak" || booking.status === "dibatalkan";

  return (
    <div className="bg-white rounded-2xl border border-[#e2e7ff] p-5 mb-4">
      <h3 className="text-xs font-semibold text-[#737781] uppercase tracking-widest mb-4">
        Status Pesanan
      </h3>
      <div className="flex items-start">
        {STEPS.map((step, idx) => {
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

// ============================================================
// CANCELLATION FORM
// ============================================================

function CancellationForm({
  booking,
  onSuccess,
  onCancel,
}: {
  booking: Booking;
  onSuccess: (msg: string, pembatalan?: Booking["pembatalan"]) => void;
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
      const pembatalanPayload = {
        ...form,
        diajukanPada: new Date().toISOString(),
        status: "menunggu" as const,
      };

      if (isDemoBooking(booking)) {
        cancelDemoBooking(booking.id, form);
      } else {
        await cancelSupabaseBooking(booking.id, form);
      }
      onSuccess(
        "Pembatalan diajukan. Status: Menunggu Pengembalian Dana.",
        pembatalanPayload,
      );
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
        Pembatalan hanya tersedia dalam 1×24 jam selama admin belum memverifikasi.
        Isi data rekening untuk proses pengembalian dana jika berlaku.
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
  bookings,
  onBack,
  onShowToast,
  onPaymentConfirmed,
}: {
  bookingId: string;
  bookings: Booking[];
  onBack: () => void;
  onShowToast?: (toast: Omit<ToastMessage, "id">) => void;
  onPaymentConfirmed?: () => void;
}) {
  const bookingFromList = bookings.find((b) => b.id === bookingId) ?? null;
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelNote, setCancelNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofError, setProofError] = useState("");
  const [confirmedProof, setConfirmedProof] = useState<string | null>(null);
  const [localPembatalan, setLocalPembatalan] = useState<
    Booking["pembatalan"] | null
  >(null);

  const booking = bookingFromList
    ? {
        ...bookingFromList,
        buktiBayar: confirmedProof ?? bookingFromList.buktiBayar,
        ...(localPembatalan
          ? {
              status: "dibatalkan" as const,
              pembatalan: localPembatalan,
            }
          : {}),
      }
    : null;

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
  const statusInfo = getStatusInfo(currentBooking);
  const bolehBatal = canCancelBooking(currentBooking);
  const isApproved = currentBooking.statusVerifikasi === "disetujui";
  const menungguPembayaran =
    currentBooking.status === "menunggu" &&
    currentBooking.statusVerifikasi === "menunggu" &&
    !currentBooking.buktiBayar;

  function handleCancelSuccess(
    msg: string,
    pembatalan?: Booking["pembatalan"],
  ) {
    setShowCancelForm(false);
    setCancelNote(msg);
    if (pembatalan) setLocalPembatalan(pembatalan);
    onShowToast?.({
      type: "success",
      message: "Menunggu Pengembalian dana",
      description: msg,
    });
    onPaymentConfirmed?.();
  }

  async function handleConfirmPaid() {
    if (!proofFile) {
      setProofError("Unggah bukti pembayaran terlebih dahulu.");
      return;
    }

    setUploading(true);
    setProofError("");

    try {
      const isDemoBooking =
        currentBooking.id.startsWith("TXN-") ||
        currentBooking.ownerId === "ayu" ||
        currentBooking.ownerId === "bayu";

      if (isDemoBooking) {
        const proofRef = `demo://payment-proofs/${proofFile.name}`;
        attachDemoBookingProof(currentBooking.id, proofRef);
        setConfirmedProof(proofRef);
      } else {
        await uploadBookingProof(currentBooking.id, proofFile);
        setConfirmedProof(`uploaded://${proofFile.name}`);
      }

      setProofFile(null);
      onPaymentConfirmed?.();
      onShowToast?.({
        type: "success",
        message: "Pembayaran dikonfirmasi",
        description:
          "Bukti terkirim. Status pesanan menjadi Menunggu Konfirmasi admin.",
      });
    } catch (error) {
      setProofError(
        error instanceof Error ? error.message : "Gagal mengunggah bukti.",
      );
    } finally {
      setUploading(false);
    }
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
          Pesanan
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-[#003466]">Detail Pesanan</h1>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusInfo.cls}`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {statusInfo.icon}
            </span>
            {statusInfo.label}
          </span>
        </div>
        <p className="text-xs text-[#737781] font-mono mt-1">{booking.id}</p>
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

      {/* ── Instruksi Bayar Nanti (token / QRIS / VA) + konfirmasi ── */}
      {menungguPembayaran && (
        <SectionCard title="Instruksi Pembayaran" icon="qr_code_2">
          <div className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            <strong>Menunggu pembayaran (batas 1×24 jam).</strong>
            <p className="mt-1">
              Bayar memakai token / barcode di bawah, unggah bukti, lalu tekan{" "}
              <span className="font-semibold">Sudah Bayar</span> untuk
              mengirim konfirmasi ke admin.
            </p>
          </div>
          <PaymentInstructions
            bookingId={booking.id}
            metodePembayaran={booking.metodePembayaran}
            totalBayar={booking.totalBayar}
          />

          <div className="mt-4 space-y-3 rounded-xl border border-dashed border-[#9aaee0] bg-white p-4">
            <p className="text-xs font-semibold text-[#131b2e]">
              Unggah bukti pembayaran
            </p>
            <p className="text-[11px] text-[#737781]">
              JPG, PNG, atau PDF — maksimal 6 MB.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="block w-full text-xs"
              onChange={(e) => {
                setProofFile(e.target.files?.[0] ?? null);
                setProofError("");
              }}
            />
            {proofFile && (
              <p className="text-xs text-emerald-700">
                File dipilih: {proofFile.name}
              </p>
            )}
            {proofError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {proofError}
              </p>
            )}
            <button
              type="button"
              disabled={uploading || !proofFile}
              onClick={() => void handleConfirmPaid()}
              className="w-full h-11 rounded-xl bg-[#003466] hover:bg-[#004785] text-white text-sm font-bold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
              {uploading ? "Mengirim konfirmasi..." : "Sudah Bayar"}
            </button>
            <p className="text-[11px] text-center text-[#737781]">
              Setelah dikonfirmasi, status otomatis menjadi Menunggu Konfirmasi.
            </p>
          </div>
        </SectionCard>
      )}

      {/* ── Informasi Pembayaran ── */}
      <SectionCard title="Informasi Pembayaran" icon="payments">
        {booking.status === "menunggu" &&
          booking.statusVerifikasi === "menunggu" &&
          Boolean(booking.buktiBayar) && (
            <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-950">
              <strong>Menunggu konfirmasi admin.</strong>
              <p className="mt-1">
                Bukti pembayaran sudah dikirim. Hitung mundur pembayaran
                dihentikan; admin akan memverifikasi pesanan Anda.
              </p>
            </div>
          )}
        <DetailRow
          label="Metode Pembayaran"
          value={booking.metodePembayaran}
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
          <div className="mt-3 pt-3 border-t border-[#f0f2fa]">
            <p className="mb-2 text-xs text-[#737781]">Bukti Bayar</p>
            <PaymentProof path={booking.buktiBayar} />
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-[#f0f2fa] flex items-center justify-between">
          <span className="text-xs text-[#737781]">Status Verifikasi</span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              booking.statusVerifikasi === "disetujui"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : booking.statusVerifikasi === "ditolak"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : booking.buktiBayar
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {booking.statusVerifikasi === "disetujui"
              ? "Disetujui"
              : booking.statusVerifikasi === "ditolak"
                ? "Ditolak"
                : booking.buktiBayar
                  ? "Menunggu Konfirmasi"
                  : "Menunggu Pembayaran"}
          </span>
        </div>
      </SectionCard>

      {/* Detail pesanan -- Pembatalan */}
      {booking.pembatalan && (
        <SectionCard title="Detail Pembatalan" icon="cancel">
          {isPendingCancellationRefund(booking) ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 mb-3 text-xs text-orange-900">
              <strong>Menunggu Konfirmasi dan Pengembalian Dana.</strong>
              <p className="mt-1">
                Pengajuan pembatalan Anda sedang diproses admin. Slot lapak
                sudah dilepas; pengembalian dana menunggu verifikasi rekening.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 rounded-xl px-3 py-2 mb-3 text-xs text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Pesanan ini telah dibatalkan.
            </div>
          )}
          <DetailRow
            label="Status pengajuan"
            value={
              booking.pembatalan.status === "disetujui"
                ? "Disetujui"
                : booking.pembatalan.status === "ditolak"
                  ? "Ditolak"
                  : "Menunggu pengembalian dana"
            }
          />
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
          onSuccess={handleCancelSuccess}
          onCancel={() => setShowCancelForm(false)}
        />
      )}

      {/* ── Action buttons ── */}
      <div className="bg-white rounded-2xl border border-[#e2e7ff] p-5">
        <h3 className="text-xs font-semibold text-[#737781] uppercase tracking-widest mb-4">
          Tindakan
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Batalkan Pesanan */}
          {bolehBatal && !showCancelForm && (
            <button
              type="button"
              onClick={() => setShowCancelForm(true)}
              className="flex items-center justify-center gap-2 border border-red-300 text-red-700 hover:bg-red-50 font-semibold text-sm px-4 py-3 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                cancel
              </span>
              Batalkan Pesanan
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
          {isApproved && (
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

          {/* No actions available */}
          {!bolehBatal && !isApproved && (
            <div className="flex items-center gap-2 text-sm text-[#737781]">
              <span className="material-symbols-outlined text-[18px]">
                info
              </span>
              {isPendingCancellationRefund(booking)
                ? "Menunggu pengembalian dana oleh admin."
                : booking.status === "dibatalkan"
                  ? "Pesanan ini telah dibatalkan."
                  : booking.statusVerifikasi === "ditolak"
                    ? "Pesanan ini ditolak oleh admin."
                    : "Menunggu verifikasi admin. Belum ada tindakan yang tersedia."}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer note ── */}
      <p className="text-xs text-center text-[#9ba4b5] mt-6">
        Dokumen ini merupakan detail transaksi dari sistem demonstrasi Ngelapak.
      </p>
    </div>
  );
}

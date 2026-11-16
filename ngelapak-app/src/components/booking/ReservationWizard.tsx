"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Spot } from "@/lib/mock-data";
import { useRouter } from "next/navigation";

export default function ReservationWizard({
  spot,
  occupied,
}: {
  spot: Spot;
  occupied: { start: string; end: string }[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [brand, setBrand] = useState("");
  const [business, setBusiness] = useState("");
  const [method, setMethod] = useState("qris");
  const [bookingId, setBookingId] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [proofPath, setProofPath] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"pay_later" | "with_proof" | null>(null);

  const disabled = (date: string) =>
    occupied.some((range) => date >= range.start && date <= range.end);
  const days =
    start && end
      ? Math.max(
          1,
          Math.floor(
            (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) /
              86400000,
          ) + 1,
        )
      : 0;

  async function createBooking(payLater: boolean) {
    if (
      !start ||
      !end ||
      disabled(start) ||
      disabled(end) ||
      occupied.some((r) => start <= r.end && end >= r.start)
    ) {
      setMessage("Rentang tanggal tidak tersedia.");
      return;
    }
    if (!brand.trim() || !business.trim()) {
      setMessage("Lengkapi nama usaha dan jenis usaha.");
      return;
    }
    if (!payLater && !proof) {
      setMessage("Unggah bukti terlebih dahulu, atau pilih Bayar Nanti.");
      return;
    }

    setBusy(true);
    setMode(payLater ? "pay_later" : "with_proof");
    setMessage("");
    let uploadedPath = "";

    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Silakan masuk sebelum membuat pemesanan.");

      if (!payLater && proof) {
        let file = proof;
        if (file.type.startsWith("image/")) {
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, 1600 / bitmap.width);
          canvas.width = bitmap.width * scale;
          canvas.height = bitmap.height * scale;
          canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob(
              (value) =>
                value ? resolve(value) : reject(new Error("Gagal mengompres gambar")),
              "image/jpeg",
              0.78,
            ),
          );
          file = new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" });
        }
        uploadedPath = `${auth.user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(uploadedPath, file, { upsert: false });
        if (uploadError) throw uploadError;
        setProofPath(uploadedPath);
      }

      const { data, error } = await supabase.rpc("create_booking_with_payment", {
        p_spot_kode: spot.kode,
        p_tanggal_mulai: start,
        p_jumlah_hari: days,
        p_total_bayar: days * spot.tarifPerHari,
        p_metode_pembayaran: method,
        p_jenis_usaha: business,
        p_nama_usaha: brand,
        p_kategori_penjual: "UMKM Umum",
        p_catatan: "",
        p_bukti_bayar: payLater ? null : uploadedPath || null,
      });
      if (error) throw error;

      setBookingId(String(data));
      setStep(3);
      setMessage(
        payLater
          ? "Pesanan dibuat tanpa bukti. Unggah bukti dari Pesanan Saya dalam 1×24 jam atau pesanan dibatalkan otomatis."
          : "Bukti diterima dan pesanan menunggu konfirmasi admin.",
      );
    } catch (error) {
      if (uploadedPath || proofPath) {
        await createClient()
          .storage.from("payment-proofs")
          .remove([uploadedPath || proofPath]);
        setProofPath("");
      }
      setMessage(
        error instanceof Error ? error.message : "Gagal membuat pemesanan.",
      );
    } finally {
      setBusy(false);
      setMode(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Pesan lapak</h2>

      {step === 1 && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            Mulai sewa
            <input
              className="mt-1 block w-full rounded-lg border p-2"
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Selesai sewa
            <input
              className="mt-1 block w-full rounded-lg border p-2"
              type="date"
              min={start}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
          {start && disabled(start) && (
            <p className="text-sm text-red-600">Tanggal mulai telah terisi.</p>
          )}
          <p className="text-sm">
            {days} hari · Rp {(days * spot.tarifPerHari).toLocaleString("id-ID")}
          </p>
          <button
            className="rounded-lg bg-blue-900 px-4 py-2 text-white"
            onClick={() => setStep(2)}
          >
            Lanjut
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-lg border p-2"
            placeholder="Nama usaha / brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <input
            className="w-full rounded-lg border p-2"
            placeholder="Jenis usaha"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
          />
          <select
            className="w-full rounded-lg border p-2"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="qris">QRIS</option>
            <option value="va">Virtual Account Udayana</option>
          </select>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <strong>Batas pembayaran 1×24 jam.</strong> Bukti boleh dikirim nanti
            dari Pesanan Saya. Jika lewat tenggat tanpa bukti, pesanan dibatalkan
            otomatis.
          </div>

          <p className="text-sm">
            Total tagihan: Rp {(days * spot.tarifPerHari).toLocaleString("id-ID")}
          </p>

          <button
            disabled={busy || !brand || !business}
            className="w-full rounded-lg border-2 border-blue-900 px-4 py-2 font-semibold text-blue-900 disabled:opacity-50"
            onClick={() => void createBooking(true)}
          >
            {busy && mode === "pay_later"
              ? "Memproses…"
              : "Bayar Nanti (tanpa unggah bukti)"}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            atau unggah bukti sekarang
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <input
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            onChange={(e) => setProof(e.target.files?.[0] ?? null)}
          />
          <button
            disabled={busy || !brand || !business || !proof}
            className="w-full rounded-lg bg-blue-900 px-4 py-2 text-white disabled:opacity-50"
            onClick={() => void createBooking(false)}
          >
            {busy && mode === "with_proof"
              ? "Mengunggah & memproses…"
              : "Kirim Bukti & Buat Pesanan"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 space-y-3">
          <p>
            Nomor booking: <strong>{bookingId}</strong>
          </p>
          <p className="text-sm">
            {proof
              ? "Bukti telah terlampir. Pesanan menunggu konfirmasi admin."
              : "Batas waktu pembayaran: 1×24 jam. Unggah bukti dari Pesanan Saya sebelum tenggat."}
          </p>
          <button
            className="rounded-lg bg-blue-900 px-4 py-2 text-white"
            onClick={() => router.push("/")}
          >
            Ke beranda / Pesanan Saya
          </button>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 text-sm text-slate-600">
          {message}
        </p>
      )}
    </section>
  );
}

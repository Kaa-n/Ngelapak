"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Spot } from "@/lib/mock-data";

export default function ReservationWizard({ spot, occupied }: { spot: Spot; occupied: { start: string; end: string }[] }) {
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
  const disabled = (date: string) => occupied.some((range) => date >= range.start && date <= range.end);
  const days = start && end ? Math.max(1, Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000) + 1) : 0;

  async function uploadProofThenCreateBooking() {
    if (!start || !end || disabled(start) || disabled(end) || occupied.some((r) => start <= r.end && end >= r.start)) {
      setMessage("Rentang tanggal tidak tersedia."); return;
    }
    setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Silakan masuk sebelum membuat pemesanan.");
      if (!proof) throw new Error("Bukti pembayaran wajib diunggah.");
      let file = proof;
      if (file.type.startsWith("image/")) {
        const bitmap = await createImageBitmap(file); const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1600 / bitmap.width); canvas.width = bitmap.width * scale; canvas.height = bitmap.height * scale;
        canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Gagal mengompres gambar")), "image/jpeg", 0.78));
        file = new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" });
      }
      const path = `${auth.user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      setProofPath(path);
      const { data, error } = await supabase.rpc("create_booking_with_payment", {
        p_spot_kode: spot.kode, p_tanggal_mulai: start, p_jumlah_hari: days,
        p_total_bayar: days * spot.tarifPerHari, p_metode_pembayaran: method,
        p_jenis_usaha: business, p_nama_usaha: brand, p_kategori_penjual: "UMKM Umum", p_catatan: "", p_bukti_bayar: path,
      });
      if (error) throw error;
      setBookingId(String(data)); setStep(3); setMessage("Bukti diterima dan pesanan dibuat. Pembayaran harus diselesaikan dalam 1x24 jam.");
    } catch (error) {
      if (proofPath) { await createClient().storage.from("payment-proofs").remove([proofPath]); setProofPath(""); }
      setMessage(error instanceof Error ? error.message : "Gagal membuat pemesanan.");
    }
    finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="text-xl font-bold text-slate-900">Pesan lapak</h2>
    {step === 1 && <div className="mt-4 space-y-3"><label className="block text-sm">Mulai sewa<input className="mt-1 block w-full rounded-lg border p-2" type="date" value={start} onChange={e=>setStart(e.target.value)} /></label><label className="block text-sm">Selesai sewa<input className="mt-1 block w-full rounded-lg border p-2" type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)} /></label>{start && disabled(start) && <p className="text-sm text-red-600">Tanggal mulai telah terisi.</p>}<p className="text-sm">{days} hari · Rp {(days * spot.tarifPerHari).toLocaleString("id-ID")}</p><button className="rounded-lg bg-blue-900 px-4 py-2 text-white" onClick={()=>setStep(2)}>Lanjut</button></div>}
    {step === 2 && <div className="mt-4 space-y-3"><input className="w-full rounded-lg border p-2" placeholder="Nama usaha / brand" value={brand} onChange={e=>setBrand(e.target.value)} /><input className="w-full rounded-lg border p-2" placeholder="Jenis usaha" value={business} onChange={e=>setBusiness(e.target.value)} /><select className="w-full rounded-lg border p-2" value={method} onChange={e=>setMethod(e.target.value)}><option value="qris">QRIS</option><option value="va">Virtual Account Udayana</option></select><p className="text-sm">Bayar Rp {(days * spot.tarifPerHari).toLocaleString("id-ID")}, lalu lampirkan bukti. Pesanan hanya dibuat setelah bukti berhasil diunggah.</p><input type="file" accept="image/jpeg,image/png,application/pdf" onChange={e=>setProof(e.target.files?.[0] ?? null)} /><button disabled={busy || !brand || !business || !proof} className="rounded-lg bg-blue-900 px-4 py-2 text-white disabled:opacity-50" onClick={uploadProofThenCreateBooking}>{busy ? "Mengunggah & memproses…" : "Kirim bukti dan buat pesanan"}</button></div>}
    {step === 3 && <div className="mt-4 space-y-3"><p>Nomor booking: <strong>{bookingId}</strong></p><p className="text-sm">Batas waktu pembayaran: 1x24 jam sejak pesanan dibuat. Bukti telah terlampir pada pesanan.</p></div>}
    {message && <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>}
  </section>;
}

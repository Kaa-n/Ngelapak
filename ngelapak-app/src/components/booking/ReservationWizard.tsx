"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { formatRupiah, type Spot } from "@/lib/mock-data";
import { CANCELLATION_WINDOW_MS, CLEANING_DAYS, PAYMENT_WINDOW_MS, rentalPeriodsConflict, rentalStart, shiftRentalDate } from "@/lib/rental-policy";
import { createSupabaseBooking } from "@/lib/supabase/bookings";

type Props = { spot: Spot; occupied: { start: string; end: string }[] | null; signedIn: boolean };
const inputClass = "mt-1 block w-full rounded-lg border p-2";

export default function ReservationWizard({ spot, occupied, signedIn }: Props) {
  const [step, setStep] = useState(1);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [brand, setBrand] = useState("");
  const [business, setBusiness] = useState("");
  const [category, setCategory] = useState("UMKM Umum");
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const bookingId = useRef<string | null>(null);
  const days = start && end ? (Date.parse(end) - Date.parse(start)) / CANCELLATION_WINDOW_MS + 1 : 0;
  const total = days * spot.tarifPerHari;

  function validateDates() {
    if (!occupied) return "Jadwal belum bisa diperiksa. Muat ulang halaman untuk mencoba lagi.";
    if (!Number.isInteger(days) || days < 1 || days > 30) return "Pilih tanggal sewa antara 1 dan 30 hari.";
    if (Date.now() + PAYMENT_WINDOW_MS > rentalStart(start)) return "Pemesanan ditutup satu jam sebelum sewa mulai (08.00 WITA).";
    if (occupied.some((range) => rentalPeriodsConflict(start, end, range.start, range.end))) {
      return "Jadwal bertabrakan dengan masa sewa atau pembersihan. Pilih tanggal lain.";
    }
    return "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const error = validateDates();
    setMessage(error);
    if (error) return;
    if (step === 1) {
      setStep(2);
      return;
    }
    if (!signedIn || !brand.trim() || !business.trim() || !agreed) return;
    setBusy(true);
    try {
      const id = bookingId.current ?? ("MT-" + crypto.randomUUID().replaceAll("-", ""));
      bookingId.current = id;
      const checkout = await createSupabaseBooking({
        id, spotKode: spot.kode, tanggalMulai: start, jumlahHari: days, totalBayar: total,
        jenisUsaha: business, namaUsaha: brand, kategoriPenjual: category, catatan: "", setuju: agreed,
      });
      window.location.assign(checkout.checkoutUrl ?? ("/?pesanan=" + encodeURIComponent(checkout.id)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pembayaran gagal dibuka.");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900">Pesan lapak</h2>
      {!occupied ? <p role="status" className="mt-3 text-sm text-slate-600">Jadwal belum bisa diperiksa. Muat ulang halaman untuk mencoba lagi.</p> :
        <form className="mt-4 space-y-3" onSubmit={submit}>
          {step === 1 ? <>
            <label className="block text-sm">Mulai sewa<input required className={inputClass} type="date" value={start} onChange={(event) => {
              const value = event.target.value;
              setStart(value);
              if (!value || !end || end < value || end > shiftRentalDate(value, 29)) setEnd(value);
            }} /></label>
            <label className="block text-sm">Selesai sewa<input required className={inputClass} type="date" min={start || undefined} max={start ? shiftRentalDate(start, 29) : undefined} value={end} onChange={(event) => setEnd(event.target.value)} /></label>
            <p className="text-sm text-slate-600">Lapak ditutup selama {CLEANING_DAYS} hari untuk pembersihan setelah masa sewa.</p>
            {days > 0 && <p className="text-sm font-semibold">{days} hari · {formatRupiah(total)}</p>}
            <button className="rounded-lg bg-blue-900 px-4 py-2 text-white">Lanjut</button>
          </> : <>
            <p className="text-sm font-semibold">{days} hari · {formatRupiah(total)}</p>
            {signedIn ? <>
              <label className="block text-sm">Nama usaha<input required maxLength={200} className={inputClass} value={brand} onChange={(event) => setBrand(event.target.value)} /></label>
              <label className="block text-sm">Jenis usaha<input required maxLength={200} className={inputClass} value={business} onChange={(event) => setBusiness(event.target.value)} /></label>
              <label className="block text-sm">Kategori penjual<select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)}>
                <option>UMKM Umum</option><option>Mahasiswa Wirausaha</option>
              </select></label>
              <p className="text-sm text-slate-600">Selesaikan pembayaran lewat Midtrans dalam satu jam. Status pesanan diperbarui otomatis.</p>
              <label className="flex gap-2 text-sm"><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />Saya menyetujui aturan penyewaan dan pembatalan.</label>
            </> : <p className="text-sm"><Link href="/masuk" className="font-semibold text-blue-900 underline">Masuk</Link> untuk melanjutkan ke pembayaran.</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} className="rounded-lg border px-4 py-2" onClick={() => { setMessage(""); setStep(1); }}>Ubah tanggal</button>
              {signedIn && <button disabled={busy || !agreed} className="rounded-lg bg-blue-900 px-4 py-2 text-white disabled:opacity-50">{busy ? "Membuka pembayaran…" : "Bayar dengan Midtrans"}</button>}
            </div>
          </>}
          {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
        </form>}
    </section>
  );
}

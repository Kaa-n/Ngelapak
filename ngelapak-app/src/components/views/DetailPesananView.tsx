"use client";

import { useState, type FormEvent } from "react";
import { canCancelBooking, cancelDemoBooking, useDemo } from "@/lib/demo-store";
import { formatDate, formatRupiah, type Booking } from "@/lib/mock-data";

function statusLabel(booking: Booking) {
  if (booking.status === "dibatalkan") return "Dibatalkan";
  if (booking.statusVerifikasi === "disetujui") return "Berhasil";
  if (booking.statusVerifikasi === "ditolak") return "Ditolak";
  return "Menunggu verifikasi";
}

export default function DetailPesananView({
  bookingId,
  onBack,
}: {
  bookingId: string;
  onBack: () => void;
}) {
  const { bookings } = useDemo();
  const booking = bookings.find((item) => item.id === bookingId) ?? null;
  const [openCancel, setOpenCancel] = useState(false);
  const [note, setNote] = useState("");
  const [form, setForm] = useState({
    nama: "",
    nim: "",
    telepon: "",
    bank: "",
    nomorRekening: "",
    namaRekening: "",
    alasan: "",
  });

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-[#131b2e]">Pesanan tidak ditemukan</h1>
        <button
          onClick={onBack}
          className="mt-6 h-11 px-5 rounded-xl bg-[#003466] text-white text-sm font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  const pesanan = booking;
  const rows = [
    ["ID pesanan", pesanan.id],
    ["Lapak", `${pesanan.spotNama} (${pesanan.spotKode})`],
    ["Periode", `${formatDate(pesanan.tanggalMulai)} - ${formatDate(pesanan.tanggalSelesai)}`],
    ["Total", formatRupiah(pesanan.totalBayar)],
    ["Status", statusLabel(pesanan)],
  ];
  const bolehBatal = canCancelBooking(pesanan);

  function openForm() {
    setForm({
      nama: pesanan.penyewa.nama,
      nim: pesanan.penyewa.nim,
      telepon: pesanan.penyewa.telepon,
      bank: "",
      nomorRekening: "",
      namaRekening: pesanan.penyewa.nama,
      alasan: "",
    });
    setNote("");
    setOpenCancel(true);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submitCancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      cancelDemoBooking(pesanan.id, form);
      setOpenCancel(false);
      setNote("Pengajuan pembatalan tersimpan.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Pembatalan gagal disimpan.");
    }
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "nama", label: "Nama" },
    { key: "nim", label: "NIM" },
    { key: "telepon", label: "No. telepon" },
    { key: "bank", label: "Bank" },
    { key: "nomorRekening", label: "Nomor rekening" },
    { key: "namaRekening", label: "Nama pemilik rekening" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#003466] mb-6"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Kembali
      </button>
      <p className="text-sm font-semibold text-[#855300] mb-2">Pesanan</p>
      <h1 className="text-3xl font-bold text-[#003466] mb-6">Detail Pesanan</h1>
      <div className="bg-white border border-[#e2e7ff] rounded-2xl p-6 space-y-3 mb-6">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <span className="text-[#737781]">{label}</span>
            <span className="font-semibold text-[#131b2e] text-right break-all">{value}</span>
          </div>
        ))}
      </div>

      {bolehBatal && !openCancel && (
        <button
          type="button"
          onClick={openForm}
          className="mb-6 h-11 px-5 rounded-xl border border-[#ba1a1a] text-[#ba1a1a] text-sm font-semibold"
        >
          Batalkan pesanan
        </button>
      )}

      {bolehBatal && openCancel && (
        <form onSubmit={submitCancel} className="bg-white border border-[#e2e7ff] rounded-2xl p-6 mb-6 space-y-4">
          <div>
            <h2 className="font-bold text-[#131b2e]">Pembatalan 1x24 jam</h2>
            <p className="text-sm text-[#737781] mt-1">
              Masih bisa dibatalkan karena admin belum memverifikasi dan pesanan belum lewat 1x24 jam.
            </p>
          </div>
          {fields.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="font-semibold text-[#424750]">{field.label}</span>
              <input
                value={form[field.key]}
                onChange={(event) => update(field.key, event.target.value)}
                className="mt-1 w-full border border-[#dce1eb] rounded-xl px-3 py-2 outline-none focus:border-[#003466]"
              />
            </label>
          ))}
          <label className="block text-sm">
            <span className="font-semibold text-[#424750]">Alasan</span>
            <textarea
              value={form.alasan}
              onChange={(event) => update("alasan", event.target.value)}
              rows={3}
              className="mt-1 w-full border border-[#dce1eb] rounded-xl px-3 py-2 outline-none focus:border-[#003466] resize-y"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpenCancel(false)}
              className="h-11 px-4 rounded-xl bg-[#eaedff] text-sm font-semibold"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="h-11 px-4 rounded-xl bg-[#ba1a1a] text-white text-sm font-semibold"
            >
              Ajukan pembatalan
            </button>
          </div>
        </form>
      )}

      {pesanan.pembatalan && (
        <div className="bg-white border border-[#e2e7ff] rounded-2xl p-6 mb-6 text-sm space-y-2">
          <h2 className="font-bold text-[#131b2e]">Pengajuan pembatalan</h2>
          <p>{pesanan.pembatalan.nama} · NIM {pesanan.pembatalan.nim} · {pesanan.pembatalan.telepon}</p>
          <p>{pesanan.pembatalan.bank} · {pesanan.pembatalan.nomorRekening} · a.n. {pesanan.pembatalan.namaRekening}</p>
          <p>{pesanan.pembatalan.alasan}</p>
        </div>
      )}

      {note && <p className="text-sm text-[#424750] mb-6">{note}</p>}

      <div className="border border-dashed border-[#c5cbe0] rounded-2xl bg-[#f4f6ff] p-8 text-center">
        <span className="material-symbols-outlined text-4xl text-[#003466]">picture_as_pdf</span>
        <h2 className="mt-3 font-bold text-[#131b2e]">Berkas PDF</h2>
        <p className="mt-2 text-sm text-[#737781]">
          Panduan PDF menyusul. Isi berkas belum tersedia.
        </p>
      </div>
    </div>
  );
}

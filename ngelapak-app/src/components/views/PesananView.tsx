"use client";
import { useDemo } from "@/lib/demo-store";
import { formatDate, formatRupiah } from "@/lib/mock-data";
export default function PesananView({ onExplore }: { onExplore: () => void }) {
  const { user, bookings } = useDemo();
  if (user?.role !== "penyewa") return null;
  return <div className="max-w-5xl mx-auto px-4 py-8 pb-24">
    <div className="flex flex-wrap justify-between gap-4 mb-6"><div><p className="text-sm text-[#003466] font-semibold">Ruang Penyewa</p><h1 className="text-3xl font-bold mt-1">Pesanan Saya</h1><p className="text-[#424750] mt-2">Pantau pengajuan dan riwayat sewa milik {user.nama}.</p></div><button onClick={onExplore} className="self-center bg-[#003466] text-white px-4 py-3 rounded-xl text-sm font-semibold">Cari lapak</button></div>
    {!bookings.length && <div className="p-10 text-center bg-white rounded-2xl border border-[#e2e7ff]"><h2 className="font-bold">Belum ada pesanan</h2><p className="text-sm text-[#737781] mt-2">Temukan lapak dan ajukan sewa pertama Anda.</p></div>}
    <div className="space-y-4">{bookings.map(b => <article key={b.id} className="bg-white rounded-2xl border border-[#e2e7ff] p-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-bold text-lg">{b.spotNama}</h2><span className={`text-xs rounded-full px-3 py-1 font-semibold ${b.statusVerifikasi === "ditolak" ? "bg-red-50 text-red-800" : b.statusVerifikasi === "menunggu" ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>{b.statusVerifikasi === "menunggu" ? "Menunggu verifikasi admin" : b.statusVerifikasi === "ditolak" ? "Ditolak" : "Disetujui"}</span></div><p className="text-xs text-[#737781] mt-2 break-all">{b.id}</p><p className="text-sm mt-3">{formatDate(b.tanggalMulai)} – {formatDate(b.tanggalSelesai)} · {b.jumlahHari} hari</p><p className="text-sm text-[#424750] mt-2">{b.jenisUsaha}</p><p className="font-bold text-[#003466] mt-3">{formatRupiah(b.totalBayar)} <span className="font-normal text-xs">· {b.metodePembayaran}</span></p><p className="text-xs text-[#737781] mt-3">{b.statusVerifikasi === "menunggu" ? "Pengajuan tersimpan. Tunggu hasil pemeriksaan admin pada demo ini." : b.statusVerifikasi === "ditolak" ? "Pengajuan ditolak. Hubungi pengelola untuk informasi lebih lanjut." : "Verifikasi disetujui. Periksa periode sewa sebelum menggunakan lapak."}</p></article>)}</div>
  </div>;
}

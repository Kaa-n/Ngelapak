"use client";
import { DEMO_USERS } from "@/lib/demo-store";
export default function MasukView({ onLogin }: { onLogin: (id: string) => void }) {
  return <div className="max-w-4xl mx-auto px-4 py-10 pb-24">
    <span className="text-xs font-bold text-[#855300] bg-[#ffddb8] px-3 py-1 rounded-full">Mode demo</span><h1 className="text-3xl font-bold mt-4 mb-3">Selamat datang di Ngelapak</h1><p className="text-[#424750] max-w-2xl mb-8">Pilih akun untuk mencoba pengalaman sesuai peran. Penyewa mengajukan sewa dan melihat pesanan sendiri. Admin mengelola lapak dan memverifikasi transaksi.</p>
    <div className="grid sm:grid-cols-3 gap-4">{DEMO_USERS.map(user => <div key={user.id} className="bg-white border border-[#e2e7ff] rounded-2xl p-5 flex flex-col gap-3"><span className="material-symbols-outlined text-[#003466] text-3xl">{user.role === "admin" ? "admin_panel_settings" : "person"}</span><p className="font-bold">{user.role === "admin" ? "Admin" : "Penyewa"}</p><p className="text-sm">{user.nama}</p><p className="text-xs text-[#737781] break-all">{user.email}</p><button onClick={() => onLogin(user.id)} className="mt-auto bg-[#003466] hover:bg-[#1a4b84] text-white rounded-lg px-3 py-3 text-sm font-semibold">Masuk sebagai {user.role === "admin" ? "admin" : user.id === "ayu" ? "Ayu" : "Bayu"}</button></div>)}</div>
    <p className="mt-6 text-sm text-[#737781]">Demo tanpa kata sandi. Sesi berlaku di tab ini, transaksi disimpan di browser ini. Gunakan data contoh; autentikasi dan otorisasi server belum diaktifkan.</p>
  </div>;
}

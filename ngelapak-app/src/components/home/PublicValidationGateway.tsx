"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function PublicValidationGateway() {
  const router = useRouter();
  const [ticketInput, setTicketInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    const cleanId = ticketInput.trim();
    if (!cleanId) {
      setErrorMsg("Silakan masukkan ID Tiket atau Nomor Kontrak.");
      return;
    }
    router.push(`/validasi/${encodeURIComponent(cleanId)}`);
  }

  return (
    <section
      id="validasi-tiket-publik"
      aria-labelledby="validasi-heading"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002447] via-[#003466] to-[#001e38] text-white p-6 sm:p-8 md:p-10 shadow-lg border border-[#1a4b84]"
    >
      {/* Background Accent Gradients */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#4edea3]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#004785]/30 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Badge & Title */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2fced] px-3 py-1 text-xs font-bold text-[#003c27]">
            <span className="material-symbols-outlined text-[15px] text-[#008040]">
              verified_user
            </span>
            Validasi Lapangan Publik • Tanpa Login
          </span>
          
        </div>

        <h3
          id="validasi-heading"
          className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-3"
        >
          Pemeriksaan Keabsahan Izin Stan &amp; Kontrak Lapangan
        </h3>

        <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-3xl mb-6">
          Disediakan khusus untuk <strong>Satpam Kampus</strong>, <strong>Tim Pengawas Aset</strong>, maupun <strong>Civitas Akademika</strong> untuk memverifikasi keaslian izin operasional stan.
        </p>

        {/* Kotak Jaminan Privasi Data */}
        <div className="mb-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#4edea3]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#4edea3]">
              <span className="material-symbols-outlined text-[18px]">
                security
              </span>
            </div>
            <div className="text-xs sm:text-sm text-blue-50 leading-relaxed">
              <strong className="text-white block mb-0.5">
                Kami memahami Perlindungan Privasi &amp; Keamanan Data Pengguna
              </strong>
                Data pribadi pengguna akan <strong>sepenuhnya dijaga dan tidak ditampilkan ke publik</strong>.
            </div>
          </div>
        </div>

        {/* Input Form Gerbang Validasi */}
        <form onSubmit={handleCheck} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-[#737781]">
                confirmation_number
              </span>
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => {
                  setTicketInput(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder="Masukkan ID Tiket / Kontrak (contoh: MT-ae3cae...)"
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-white text-[#131b2e] placeholder-[#737781] text-xs sm:text-sm font-medium outline-none border border-transparent focus:border-[#4edea3] focus:ring-2 focus:ring-[#4edea3]/30 transition shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-[#4edea3] hover:bg-[#3ec48e] text-[#003466] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
              <span>Periksa Izin Stan</span>
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-1.5">
              {errorMsg}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-blue-200/70">
            <span>
              Kode tiket tertera pada berkas PDF MOU resmi atau dapat dipindai langsung melalui QR Code tiket penyewa.
            </span>

          </div>
        </form>
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { getTermsContent, type TermsContent } from "@/lib/terms-content";

/** Konten utama Syarat & Ketentuan — dapat dipakai di modal maupun halaman penuh. */
export function TermsBody({ content, compact = false }: { content: TermsContent; compact?: boolean }) {
  const textSize = compact ? "text-[12px] sm:text-[13px]" : "text-sm";
  return (
    <div className={`${textSize} text-[#424750] leading-relaxed space-y-5`}>
      <div className="bg-[#f2f3ff] border border-[#e2e7ff] rounded-xl p-4">
        <p className="font-semibold text-[#003466] mb-1">Pendahuluan</p>
        <p>{content.intro}</p>
      </div>

      {content.sections.map((section) => (
        <section key={section.title}>
          <h3 className="font-bold text-[#131b2e] text-sm mb-2">{section.title}</h3>
          <div className="space-y-2">
            {section.items.map((item, i) => (
              <p key={i}>{item}</p>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-[#f2f3ff] rounded-xl p-4 border border-[#e2e7ff]">
        <p className="text-xs text-[#424750]">
          <strong className="text-[#003466]">Pernyataan Persetujuan</strong>
          <br />
          {content.closing}
        </p>
      </div>
    </div>
  );
}

interface TermsModalProps {
  open: boolean;
  minimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
}

/** Modal Syarat & Ketentuan — minimizable, dapat dipindahkan ke komponen mana saja. */
export default function TermsModal({ open, minimized, onClose, onMinimize, onRestore }: TermsModalProps) {
  const [content, setContent] = useState<TermsContent | null>(null);

  useEffect(() => {
    setContent(getTermsContent());
    const handler = () => setContent(getTermsContent());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  if (!open || !content) return null;

  return (
    <>
      {/* Bar minimize di pojok kanan bawah */}
      {minimized && (
        <div
          className="fixed bottom-24 md:bottom-6 right-4 z-[71] flex items-center gap-2 bg-[#003466] text-white rounded-xl shadow-lg px-4 py-2.5 cursor-pointer hover:bg-[#004785] transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200"
          onClick={onRestore}
          role="button"
          aria-label="Buka kembali Syarat & Ketentuan"
        >
          <span className="material-symbols-outlined text-[18px]">open_in_full</span>
          <span className="text-sm font-semibold">Syarat &amp; Ketentuan</span>
        </div>
      )}

      {/* Modal penuh */}
      {!minimized && (
        <div
          className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={onClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-xl max-h-[78vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-[#e2e7ff] flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[#003466]">description</span>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#855300]">
                    Ketentuan Layanan Ngelapak
                  </span>
                </div>
                <h2 id="terms-title" className="text-xl sm:text-2xl font-bold text-[#003466]">
                  Syarat &amp; Ketentuan
                </h2>
                <p className="text-xs text-[#737781] mt-1">
                  Ketentuan penggunaan dan penyewaan lapak di lingkungan Universitas Udayana.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onMinimize}
                  aria-label="Perkecil syarat dan ketentuan"
                  className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#737781] hover:bg-[#f2f3ff] hover:text-[#003466] transition-colors"
                >
                  <span className="material-symbols-outlined">minimize</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup syarat dan ketentuan"
                  className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[#737781] hover:bg-[#f2f3ff] hover:text-[#003466] transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Isi */}
            <div className="px-5 sm:px-6 py-4 overflow-y-auto">
              <TermsBody content={content} compact />
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3 border-t border-[#e2e7ff] bg-white flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[11px] text-[#737781]">Mohon baca seluruh ketentuan sebelum menyetujui.</p>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-7 h-11 rounded-xl bg-[#003466] text-white text-[13px] font-bold hover:bg-[#1a4b84] transition-colors shadow-sm"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

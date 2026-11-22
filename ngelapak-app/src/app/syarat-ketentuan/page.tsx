"use client";

import { useState, useEffect } from "react";
import { getTermsContent, type TermsContent } from "@/lib/terms-content";
import { TermsBody } from "@/components/ui-custom/TermsModal";
import Link from "next/link";

export default function KebijakanPrivasiPage() {
  const [content, setContent] = useState<TermsContent | null>(null);

  useEffect(() => {
    setContent(getTermsContent());
    const handler = () => setContent(getTermsContent());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8ff]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-[#003466] hover:underline mb-5">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[#003466]">description</span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#855300]">
              Ketentuan Layanan Ngelapak
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#003466]">Syarat &amp; Ketentuan</h1>
          <p className="text-sm text-[#737781] mt-1">
            Ketentuan penggunaan dan penyewaan lapak di lingkungan Universitas Udayana.
          </p>
        </div>

        {/* Konten */}
        {content ? (
          <TermsBody content={content} />
        ) : (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-[#e2e7ff] rounded w-full" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

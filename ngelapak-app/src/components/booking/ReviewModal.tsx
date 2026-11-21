"use client";

import { useState, useEffect } from "react";
import type { Booking, Review } from "@/lib/mock-data";
import { saveDemoReview } from "@/lib/demo-store";
import { saveSupabaseReview } from "@/lib/supabase/reviews";

interface ReviewModalProps {
  isOpen: boolean;
  booking: Booking | null;
  existingReview?: Review | null;
  onClose: () => void;
  onSubmitSuccess: (review: Review) => void;
  useSupabase?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: "Sangat Buruk",
  2: "Kurang Memuaskan",
  3: "Cukup Baik",
  4: "Sangat Baik",
  5: "Luar Biasa / Sangat Puas",
};

export default function ReviewModal({
  isOpen,
  booking,
  existingReview,
  onClose,
  onSubmitSuccess,
  useSupabase = false,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [komentar, setKomentar] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 5);
      setKomentar(existingReview.komentar || "");
    } else {
      setRating(5);
      setKomentar("");
    }
    setErrorMessage("");
    setHoverRating(0);
  }, [existingReview, isOpen]);

  if (!isOpen || !booking) return null;

  const currentDisplayRating = hoverRating || rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;

    if (rating < 1 || rating > 5) {
      setErrorMessage("Silakan pilih rating bintang 1 hingga 5.");
      return;
    }

    if (!komentar.trim()) {
      setErrorMessage("Tuliskan ulasan atau pengalaman Anda selama menyewa lapak.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const reviewPayload = {
        bookingId: booking.id,
        spotId: booking.spotId,
        ownerId: booking.ownerId,
        nama: booking.penyewa?.nama || "Penyewa Lapak",
        fakultas: booking.penyewa?.fakultas || undefined,
        rating,
        komentar: komentar.trim(),
      };

      let saved: Review;
      if (useSupabase) {
        saved = await saveSupabaseReview(reviewPayload);
      } else {
        saved = saveDemoReview(reviewPayload);
      }

      onSubmitSuccess(saved);
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Gagal menyimpan ulasan. Silakan coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#e2e7ff] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#f8faff] border-b border-[#e2e7ff] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">rate_review</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#131b2e] leading-snug">
                {existingReview ? "Ubah Ulasan Lapak" : "Beri Ulasan Spot Lapak"}
              </h2>
              <p className="text-xs text-[#737781] mt-0.5">
                {booking.spotNama} <span className="font-mono">({booking.spotKode})</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737781] hover:text-[#131b2e] p-1.5 rounded-lg hover:bg-[#e2e7ff] transition-colors"
            aria-label="Tutup modal ulasan"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Star Rating Section */}
          <div className="text-center py-2 bg-[#f4f7ff] rounded-xl border border-[#e2e7ff]">
            <p className="text-xs font-semibold text-[#424750] uppercase tracking-wider mb-2">
              Beri Penilaian Anda
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= currentDisplayRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 rounded-md transition-transform hover:scale-115 focus:outline-none cursor-pointer"
                    aria-label={`Beri nilai ${star} dari 5 bintang`}
                  >
                    <span
                      className={`material-symbols-outlined text-[32px] sm:text-[36px] transition-colors ${
                        filled ? "text-amber-400 fill-1" : "text-[#d1d7e8]"
                      }`}
                      style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs font-semibold text-amber-700 h-5">
              {RATING_LABELS[currentDisplayRating] || ""}
            </p>
          </div>

          {/* Review Textarea */}
          <div>
            <label className="block text-xs font-bold text-[#131b2e] mb-1.5">
              Pengalaman Sewa & Kondisi Spot <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              placeholder="Ceritakan pengalaman Anda, bagaimana kondisi lapak, kelancaran listrik/air, kemudahan akses pengunjung, dsb..."
              maxLength={600}
              className="w-full text-xs sm:text-sm p-3.5 bg-white border border-[#c5cbe0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003466]/20 focus:border-[#003466] transition-all placeholder:text-[#9ba4b5]"
            />
            <div className="flex justify-between items-center text-[11px] text-[#737781] mt-1">
              <span>Ulasan Anda akan tampil di halaman detail katalog lapak.</span>
              <span>{komentar.length}/600</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-[#c5cbe0] text-[#424750] text-xs font-semibold hover:bg-[#f0f2fa] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#003466] hover:bg-[#004785] text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{existingReview ? "Simpan Perubahan" : "Kirim Ulasan"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

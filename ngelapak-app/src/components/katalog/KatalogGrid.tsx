"use client";

import React from "react";
import SpotCard from "@/components/ui-custom/SpotCard";
import type { Spot } from "@/lib/mock-data";

export interface KatalogGridProps {
  spots: Spot[];
  totalFilteredCount: number;
  isFiltering: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onNavigateToDetail: (spot: Spot) => void;
  onReset: () => void;
}

export default function KatalogGrid({
  spots,
  totalFilteredCount,
  isFiltering,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onNavigateToDetail,
  onReset,
}: KatalogGridProps) {
  if (isFiltering) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden border border-[#e2e7ff]">
            <div className="h-44 skeleton" />
            <div className="p-4 space-y-3">
              <div className="h-3 w-2/3 skeleton" />
              <div className="h-5 w-full skeleton" />
              <div className="h-10 skeleton rounded-lg" />
              <div className="flex gap-2">
                <div className="h-5 w-16 skeleton rounded" />
                <div className="h-5 w-20 skeleton rounded" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-24 skeleton" />
                <div className="h-9 w-24 skeleton rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#eaedff] flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[40px] text-[#424750]">search_off</span>
        </div>
        <h3 className="text-[18px] font-bold text-[#131b2e] mb-2">Tidak ada spot ditemukan</h3>
        <p className="text-[14px] text-[#424750] max-w-xs leading-relaxed mb-6">
          Coba ubah filter pencarian atau pilih zona yang berbeda.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="h-10 px-5 rounded-lg bg-[#003466] text-white text-[13px] font-semibold hover:bg-[#1a4b84] transition-all"
        >
          Reset Filter
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Spot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {spots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} onViewDetail={onNavigateToDetail} />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-8">
          <span className="text-[13px] text-[#424750]">
            Menampilkan{" "}
            <strong>
              {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, totalFilteredCount)}
            </strong>{" "}
            dari <strong>{totalFilteredCount}</strong> titik lapak
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#eaedff] text-[#424750] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#dae2fd] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPageChange(i + 1)}
                className={`h-9 w-9 flex items-center justify-center rounded-lg text-[13px] font-semibold transition-colors ${currentPage === i + 1
                    ? "bg-[#003466] text-white shadow-sm"
                    : "bg-white text-[#424750] hover:bg-[#eaedff] border border-[#e2e7ff]"
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-9 px-3 flex items-center justify-center gap-1 rounded-lg bg-white text-[#131b2e] text-[13px] font-semibold hover:bg-[#eaedff] transition-colors border border-[#e2e7ff] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Berikutny</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}


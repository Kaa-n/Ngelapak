"use client";

import React, { useState, useRef, useEffect } from "react";

export interface LokasiItem {
  id: string;
  label: string;
  zona?: string;
  [key: string]: unknown;
}

export interface LokasiDropdownProps {
  selectedLokasi: string | null;
  onSelect: (item: LokasiItem | null) => void;
  options: LokasiItem[];
  defaultLabel?: string;
  title?: string;
}

export default function LokasiDropdown({
  selectedLokasi,
  onSelect,
  options,
  defaultLabel = "Lokasi Lainnya",
  title = "Pilih Lokasi Lain",
}: LokasiDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={`px-4 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5 ${
          selectedLokasi !== null
            ? "bg-[#1a4b84] text-white"
            : "bg-white text-[#424750] hover:bg-[#eaedff] hover:text-[#131b2e] border border-[#e2e7ff]"
        }`}
      >
        <span className="material-symbols-outlined !text-[13px]">
          {selectedLokasi !== null ? "location_on" : "add_location_alt"}
        </span>
        <span>{selectedLokasi ?? defaultLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-10 z-[9999] w-60 bg-white rounded-xl shadow-xl border border-[#e2e7ff] p-3">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#f2f3ff]">
            <span className="text-[11px] font-bold text-[#131b2e] uppercase tracking-wider">{title}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#737781] hover:text-[#131b2e] transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {options.map((lok) => {
              const isSelected = selectedLokasi === lok.label;
              return (
                <button
                  key={lok.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onSelect(null);
                    } else {
                      onSelect(lok);
                    }
                    setIsOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-2 ${
                    isSelected ? "bg-[#003466] text-white" : "text-[#131b2e] hover:bg-[#eaedff]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isSelected ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  {lok.label}
                </button>
              );
            })}
          </div>
          {selectedLokasi !== null && (
            <div className="mt-2 pt-2 border-t border-[#f2f3ff]">
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full text-center text-[10px] text-[#737781] hover:text-[#003466] font-semibold transition-colors"
              >
                Hapus pilihan lokasi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";

export interface FasilitasItem {
  id: string;
  label: string;
  icon?: string;
}

export const DEFAULT_FASILITAS_LIST: FasilitasItem[] = [
  { id: "listrik", label: "Listrik 450W+", icon: "bolt" },
  { id: "air", label: "Air Bersih", icon: "water_drop" },
  { id: "kanopi", label: "Tenda Kanopi", icon: "format_color_fill" },
  { id: "meja", label: "Meja & Kursi", icon: "chair" },
  { id: "wifi", label: "WiFi Hotspot", icon: "wifi" },
  { id: "parkir", label: "Area Parkir Dekat", icon: "local_parking" },
  { id: "toilet", label: "Toilet Terdekat (<50m)", icon: "wc" },
  { id: "genset", label: "Genset Darurat", icon: "power" },
  { id: "cctv", label: "CCTV Keamanan", icon: "videocam" },
  { id: "sampah", label: "Tempat Sampah", icon: "delete" },
  { id: "atm", label: "ATM/M-Banking Dekat", icon: "atm" },
  { id: "ventilasi", label: "Ventilasi Udara", icon: "air" },
];

export interface FasilitasDropdownProps {
  activeChips: Set<string>;
  onToggleChip: (id: string) => void;
  onReset?: () => void;
  items?: FasilitasItem[];
  title?: string;
  buttonLabel?: string;
}

export default function FasilitasDropdown({
  activeChips,
  onToggleChip,
  onReset,
  items = DEFAULT_FASILITAS_LIST,
  title = "Semua Fasilitas",
  buttonLabel = "Lainnya",
}: FasilitasDropdownProps) {
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
        className={`px-3 py-1.5 rounded-full text-[10px] font-semibold shadow-sm transition-all flex items-center gap-1 ${
          isOpen
            ? "bg-[#eaedff] text-[#003466] border border-[#003466]/30"
            : "bg-[#f2f3ff] text-[#424750] hover:bg-[#eaedff]"
        }`}
      >
        <span className="material-symbols-outlined !text-[11px]">add</span>
        {buttonLabel}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-9 z-50 w-64 bg-white rounded-xl shadow-xl border border-[#e2e7ff] p-3">
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
          <div className="flex flex-col gap-0.5 max-h-56 overflow-y-auto pr-1">
            {items.map((f) => {
              const isChecked = activeChips.has(f.id);
              return (
                <label
                  key={f.id}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                    isChecked ? "bg-[#eaedff]" : "hover:bg-[#f2f3ff]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleChip(f.id)}
                    className="w-3.5 h-3.5 accent-[#003466] cursor-pointer flex-shrink-0"
                  />
                  {f.icon && (
                    <span className="material-symbols-outlined text-[14px] text-[#003466]">{f.icon}</span>
                  )}
                  <span className="text-[12px] text-[#131b2e] font-medium">{f.label}</span>
                </label>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-[#f2f3ff] flex justify-between items-center">
            <span className="text-[10px] text-[#737781]">{activeChips.size} dipilih</span>
            {onReset && (
              <button
                type="button"
                onClick={() => {
                  onReset();
                  setIsOpen(false);
                }}
                className="text-[10px] text-[#003466] font-semibold hover:underline"
              >
                Reset semua
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


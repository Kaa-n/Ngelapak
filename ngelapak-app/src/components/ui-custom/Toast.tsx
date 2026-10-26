"use client";

import { useEffect, useState } from "react";
import type { ToastMessage } from "@/lib/types";

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const TOAST_CONFIG = {
  success: {
    icon: "check_circle",
    bg: "bg-[#002113]",
    iconColor: "text-[#4edea3]",
    border: "border-[#4edea3]/30",
  },
  error: {
    icon: "error",
    bg: "bg-[#93000a]",
    iconColor: "text-white",
    border: "border-white/20",
  },
  warning: {
    icon: "warning",
    bg: "bg-[#2a1700]",
    iconColor: "text-[#fea619]",
    border: "border-[#fea619]/30",
  },
  info: {
    icon: "info",
    bg: "bg-[#001c3b]",
    iconColor: "text-[#a6c8ff]",
    border: "border-[#a6c8ff]/30",
  },
};

export default function Toast({ toast, onRemove }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const config = TOAST_CONFIG[toast.type];

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border max-w-sm w-full
        transition-all duration-300 cursor-pointer
        ${config.bg} ${config.border}
        ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}
      `}
      onClick={() => onRemove(toast.id)}
    >
      <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${config.iconColor}`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-semibold leading-5">{toast.message}</p>
        {toast.description && (
          <p className="text-white/70 text-[11px] mt-0.5 leading-4">{toast.description}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(toast.id); }}
        className="text-white/50 hover:text-white transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

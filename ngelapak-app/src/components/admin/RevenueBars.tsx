"use client";

import { useState } from "react";

export default function RevenueBars({ weeks }: {
  weeks: { date: string; label: string; value: string; amount: number }[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const maximum = Math.max(1, ...weeks.map((week) => week.amount));

  return (
    <ul aria-label="Pendapatan per minggu" className="grid min-w-0 grid-cols-8 gap-1.5 sm:gap-3">
      {weeks.map((week, index) => (
        <li key={week.date} className="relative min-w-0">
          <button
            type="button"
            aria-label={`Minggu mulai ${week.label}, ${week.value}`}
            onPointerEnter={(event) => { if (event.pointerType === "mouse") setActive(week.date); }}
            onPointerMove={(event) => { if (event.pointerType === "mouse") setActive(week.date); }}
            onPointerLeave={(event) => { if (event.pointerType === "mouse") setActive(null); }}
            onFocus={() => setActive(week.date)}
            onBlur={() => setActive((current) => current === week.date ? null : current)}
            onClick={() => setActive(week.date)}
            onKeyDown={(event) => { if (event.key === "Escape") setActive(null); }}
            className="flex h-36 w-full items-end justify-center rounded-t-lg border-b border-[#d7def5] bg-[linear-gradient(to_top,#eaedff_1px,transparent_1px)] bg-size-[100%_25%] focus-visible:outline-2 focus-visible:outline-[#003466] sm:h-44"
          >
            <span aria-hidden="true" className={`relative block min-h-0.5 w-full max-w-13 rounded-t-lg transition-colors ${active === week.date ? "bg-[#003466]" : "bg-[#8eb4e8]"}`}
              style={{ height: `${100 * week.amount / maximum}%` }}>
              {active === week.date && (
                <span className={`pointer-events-none absolute bottom-full z-10 mb-2 rounded-lg bg-[#003466] px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-sm ${
                  index < 2 ? "left-0" : index >= weeks.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2"
                }`}>
                  {week.label} · {week.value}
                </span>
              )}
            </span>
          </button>
          <p aria-hidden="true" className="mt-2 text-center text-[10px] leading-tight text-[#424750] sm:text-xs">{week.label}</p>
        </li>
      ))}
    </ul>
  );
}

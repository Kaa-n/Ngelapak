"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/mock-data";
import {
  getOccupiedDateMark,
  shiftRentalDate,
  type OccupiedDateMark,
} from "@/lib/rental-policy";

type Props = {
  occupied: { start: string; end: string }[];
  startDate: string;
  endDate: string;
  minDate: string;
  onChange: (next: { start: string; end: string }) => void;
  onBlockedSelect?: (mark: OccupiedDateMark) => void;
  conflicted?: boolean;
};

const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function monthTitle(year: number, month: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

function MonthCalendar({
  value,
  minDate,
  maxDate,
  occupied,
  onPick,
  onBlockedSelect,
}: {
  value: string;
  minDate: string;
  maxDate?: string;
  occupied: { start: string; end: string }[];
  onPick: (date: string) => void;
  onBlockedSelect?: (mark: OccupiedDateMark) => void;
}) {
  const seed = Date.parse(`${value || minDate}T00:00:00Z`);
  const initial = Number.isFinite(seed) ? new Date(seed) : new Date();
  const [cursor, setCursor] = useState({
    year: initial.getUTCFullYear(),
    month: initial.getUTCMonth(),
  });

  useEffect(() => {
    const next = Date.parse(`${value || minDate}T00:00:00Z`);
    if (!Number.isFinite(next)) return;
    const date = new Date(next);
    setCursor({ year: date.getUTCFullYear(), month: date.getUTCMonth() });
  }, [value, minDate]);

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const offset = first.getUTCDay();
    const total = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
    const items: { key: string; day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < offset; i += 1) items.push({ key: `pad-${i}`, day: 0, inMonth: false });
    for (let day = 1; day <= total; day += 1) {
      items.push({
        key: toKey(new Date(Date.UTC(cursor.year, cursor.month, day))),
        day,
        inMonth: true,
      });
    }
    return items;
  }, [cursor.month, cursor.year]);

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(Date.UTC(current.year, current.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  }

  return (
    <div className="rounded-xl border border-[#dce1eb] bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Bulan sebelumnya" className="h-8 w-8 rounded-lg border text-sm font-semibold text-[#003466]" onClick={() => shiftMonth(-1)}>‹</button>
        <p className="text-sm font-bold text-[#131b2e]">{monthTitle(cursor.year, cursor.month)}</p>
        <button type="button" aria-label="Bulan berikutnya" className="h-8 w-8 rounded-lg border text-sm font-semibold text-[#003466]" onClick={() => shiftMonth(1)}>›</button>
      </div>
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-[#737781]">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          if (!cell.inMonth) return <span key={cell.key} className="h-9" />;
          const mark = getOccupiedDateMark(cell.key, occupied);
          const selected = cell.key === value;
          const outOfBound = cell.key < minDate || (maxDate ? cell.key > maxDate : false);
          const locked = Boolean(mark) || outOfBound;

          let tone = "bg-[#f7f9fc] text-[#131b2e] hover:bg-[#e8eefc]";
          if (mark === "rental") tone = "cursor-not-allowed bg-[#dbeafe] text-[#1e3a8a]";
          else if (mark === "cleaning") tone = "cursor-not-allowed bg-[#ffedd5] text-[#9a3412]";
          else if (selected) tone = "bg-[#003466] text-white";
          else if (outOfBound) tone = "cursor-not-allowed text-[#c5cbe0]";

          return (
            <button
              key={cell.key}
              type="button"
              disabled={locked}
              onClick={() => {
                if (mark) {
                  onBlockedSelect?.(mark);
                  return;
                }
                onPick(cell.key);
              }}
              className={`relative h-9 rounded-lg text-xs font-semibold ${tone}`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingDateFields({
  occupied,
  startDate,
  endDate,
  minDate,
  onChange,
  onBlockedSelect,
  conflicted = false,
}: Props) {
  const [open, setOpen] = useState<"start" | "end" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const fieldClass = `w-full h-10 px-3 text-[14px] rounded-lg outline-none text-left ${
    conflicted
      ? "bg-red-50 text-red-900 border border-red-500"
      : "bg-[#f2f3ff] text-[#131b2e] border border-transparent focus:bg-white focus:ring-2 focus:ring-[#003466]/20"
  }`;

  return (
    <div ref={rootRef} className="space-y-3">
      <div>
        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#424750]">
          Tanggal Mulai *
        </label>
        <button
          type="button"
          className={fieldClass}
          onClick={() => setOpen((current) => (current === "start" ? null : "start"))}
        >
          {startDate ? formatDate(startDate) : "Pilih tanggal"}
        </button>
        {open === "start" && (
          <div className="mt-2">
            <MonthCalendar
              value={startDate}
              minDate={minDate}
              occupied={occupied}
              onBlockedSelect={onBlockedSelect}
              onPick={(date) => {
                const limit = shiftRentalDate(date, 29);
                let nextEnd = endDate < date ? date : endDate;
                if (nextEnd > limit) nextEnd = limit;
                if (getOccupiedDateMark(nextEnd, occupied)) nextEnd = date;
                onChange({ start: date, end: nextEnd });
                setOpen(null);
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-[#424750]">
          Tanggal Selesai *
        </label>
        <button
          type="button"
          className={fieldClass}
          onClick={() => setOpen((current) => (current === "end" ? null : "end"))}
        >
          {endDate ? formatDate(endDate) : "Pilih tanggal"}
        </button>
        {open === "end" && (
          <div className="mt-2">
            <MonthCalendar
              value={endDate}
              minDate={startDate || minDate}
              maxDate={startDate ? shiftRentalDate(startDate, 29) : undefined}
              occupied={occupied}
              onBlockedSelect={onBlockedSelect}
              onPick={(date) => {
                // Pastikan rentang mulai→selesai tidak menembus tanggal terblokir.
                let cursor = startDate || date;
                while (cursor <= date) {
                  const blocked = getOccupiedDateMark(cursor, occupied);
                  if (blocked) {
                    onBlockedSelect?.(blocked);
                    return;
                  }
                  cursor = shiftRentalDate(cursor, 1);
                }
                onChange({ start: startDate || date, end: date });
                setOpen(null);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

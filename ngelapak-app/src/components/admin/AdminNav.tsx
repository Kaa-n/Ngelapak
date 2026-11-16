"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { LayoutDashboard, Menu, ReceiptText, Store, Undo2 } from "lucide-react";

const pages = [
  { segment: null, label: "Dasbor", icon: LayoutDashboard },
  { segment: "spots", label: "Kelola Lapak", icon: Store },
  { segment: "pembayaran", label: "Riwayat Pembayaran", icon: ReceiptText },
  { segment: "refund", label: "Pembatalan & Refund", icon: Undo2 },
];

export default function AdminNav({ basePath, mobile = false }: { basePath: string; mobile?: boolean }) {
  const segment = useSelectedLayoutSegment();
  const links = pages.map(({ segment: pageSegment, label, icon: Icon }) => {
    const href = pageSegment ? `${basePath}/${pageSegment}` : basePath;
    const active = pageSegment === segment || (pageSegment === "pembayaran" && segment === "verifikasi");
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-[#1a4b84] ${
          active ? "bg-[#003466] text-white" : "text-[#424750] hover:bg-[#f2f3ff] hover:text-[#003466]"
        }`}
      >
        <Icon aria-hidden="true" className="size-[18px] shrink-0" />
        {label}
      </Link>
    );
  });

  if (!mobile) return <nav aria-label="Panel admin" className="grid gap-1">{links}</nav>;

  return (
    <details className="relative ml-auto lg:hidden" onKeyDown={(event) => {
      if (event.key !== "Escape" || !event.currentTarget.open) return;
      event.currentTarget.open = false;
      event.currentTarget.querySelector("summary")?.focus();
    }}>
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg bg-[#f2f3ff] px-2.5 py-2 text-sm font-semibold text-[#003466] [&::-webkit-details-marker]:hidden">
        <Menu aria-hidden="true" className="size-5 shrink-0" />
        Menu <span className="sr-only">admin</span>
      </summary>
      <nav aria-label="Panel admin" className="absolute top-full right-0 mt-2 grid min-w-max gap-1 rounded-xl border border-[#e2e7ff] bg-white p-2 shadow-lg">
        {links}
      </nav>
    </details>
  );
}

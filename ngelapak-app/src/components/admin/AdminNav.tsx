"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

const pages = [
  { segment: null, href: "/admin", label: "Dasbor", icon: "dashboard" },
  { segment: "spots", href: "/admin/spots", label: "Kelola Lapak", icon: "storefront" },
  { segment: "verifikasi", href: "/admin/verifikasi", label: "Verifikasi Pembayaran", icon: "receipt_long" },
  { segment: "refund", href: "/admin/refund", label: "Pembatalan & Refund", icon: "assignment_return" },
];

export default function AdminNav() {
  const segment = useSelectedLayoutSegment();
  return (
    <nav aria-label="Panel admin" className="grid grid-cols-2 gap-x-1 pt-1 sm:gap-x-2 md:flex">
      {pages.map(({ segment: pageSegment, href, label, icon }) => {
        const active = pageSegment === segment;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 items-center gap-2 border-b-2 px-2 py-2.5 text-xs leading-tight font-semibold transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1a4b84] sm:px-3 sm:text-sm md:shrink-0 md:whitespace-nowrap md:px-4 md:py-3 ${
              active
                ? "border-[#003466] bg-[#f2f3ff] text-[#003466]"
                : "border-transparent text-[#424750] hover:bg-[#f2f3ff] hover:text-[#003466]"
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-[19px]">{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

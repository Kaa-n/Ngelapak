"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

const sections = [
  {
    title: "Zonasi Kampus",
    items: [
      { label: "Kampus Bukit Jimbaran", href: "/?view=katalog&zona=rektorat#katalog-konten" },
      { label: "Kampus Sudirman Denpasar", href: "/?view=katalog&zona=agrokompleks#katalog-konten" },
      { label: "Plaza Fakultas Teknik", href: "/?view=katalog&zona=sc#katalog-konten" },
      { label: "Kantin & Selasar FEB", href: "/?view=katalog&zona=boulevard#katalog-konten" },
    ],
  },
  {
    title: "Layanan & Panduan",
    items: [
      { label: "Prosedur Izin Usaha Mahasiswa", href: "/?view=help-center#prosedur-izin" },
      { label: "Ketentuan Tarif & Kebersihan", href: "/?view=help-center#tarif-kebersihan" },
      { label: "Verifikasi Rekening & Bukti Bayar", href: "/?view=help-center#verifikasi-pembayaran" },
      { label: "Peta Spasial & Titik Lokasi", href: "/?view=katalog#katalog-konten" },
    ],
  },
  {
    title: "Pusat Bantuan",
    items: [
      { label: "Biro Umum & Pengelolaan Aset", href: "/?view=help-center#kontak-bantuan" },
      { label: "aset.lapak@unud.ac.id", href: "mailto:aset.lapak@unud.ac.id" },
      { label: "(0361) 701954 ext. 202", href: "tel:+62361701954" },
      { label: "Senin–Jumat, 08.00–16.00 WITA", href: "/?view=help-center#kontak-bantuan" },
    ],
  },
] as const;

const legalLinks = [
  { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
  { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
  { label: "Sitemap", href: "/sitemap" },
] as const;

const linkClass = "text-[13px] text-[#424750] transition-colors hover:text-[#003466] dark:hover:text-[#a6c8ff]";

function scrollToTarget(href: string) {
  const url = new URL(href, window.location.origin);
  const id = url.hash.replace(/^#/, "");
  window.setTimeout(() => {
    if (id) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 80);
}

function AppLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("/kebijakan") || href.startsWith("/syarat") || href === "/sitemap") {
      return;
    }
    event.preventDefault();
    router.push(href);
    scrollToTarget(href);
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}

export default function Footer({ compact = false }: { compact?: boolean } = {}) {
  if (compact) {
    return (
      <footer className="w-full shrink-0 border-t border-[#e2e7ff] bg-white dark:border-[#232942] dark:bg-[#0f1117]">
        <p className="mx-auto max-w-7xl px-4 py-2.5 text-center text-xs text-[#424750] sm:px-6 sm:text-left dark:text-[#bec3d0]">
          © 2026 Ngelapak · Universitas Udayana
        </p>
      </footer>
    );
  }

  return (
    <footer className="mt-auto w-full border-t border-[#e2e7ff] bg-white pb-16 shadow-[0_-1px_8px_rgba(0,0,0,0.04)] md:pb-0 dark:border-[#232942] dark:bg-[#0f1117]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#003466]">
                <span className="material-symbols-outlined text-[16px] text-white">storefront</span>
              </div>
              <span className="text-[15px] font-bold text-[#003466] dark:text-[#a6c8ff]">Ngelapak</span>
            </div>
            <p className="mb-4 text-[13px] leading-relaxed text-[#424750] dark:text-[#bec3d0]">
              Platform marketplace tata kelola sewa titik dan lapak usaha temporer civitas akademika Universitas Udayana.
            </p>
            <div className="flex items-center gap-2 text-[#424750] dark:text-[#bec3d0]">
              <span className="material-symbols-outlined text-[16px] text-[#4edea3]">verified</span>
              <span className="text-[11px]">Sistem Resmi Kampus Udayana</span>
            </div>
          </div>
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-3 text-[14px] font-bold text-[#131b2e] dark:text-[#e8ecf8]">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    {item.href.startsWith("mailto:") || item.href.startsWith("tel:") ? (
                      <a href={item.href} className={linkClass}>
                        {item.label}
                      </a>
                    ) : (
                      <AppLink href={item.href} className={linkClass}>
                        {item.label}
                      </AppLink>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e2e7ff] pt-6 sm:flex-row dark:border-[#232942]">
          <p className="text-[12px] text-[#737781] dark:text-[#bec3d0]">
            © 2026 Ngelapak – Universitas Udayana. Hak cipta dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-4 text-[12px] text-[#737781] dark:text-[#bec3d0]">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-[#003466] dark:hover:text-[#a6c8ff]">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

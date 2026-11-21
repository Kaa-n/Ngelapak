import React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";


const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ngelapak-ayorvup1k-kan04.vercel.app"),
  title: {
    default: "Ngelapak – Marketplace Lapak Kampus Universitas Udayana",
    template: "%s | Ngelapak",
  },
  description:
    "Platform resmi sewa spot usaha temporer di lingkungan Universitas Udayana. Temukan lapak strategis di Lapangan Rektorat, Boulevard, Student Center, dan Agrokompleks.",
  keywords: ["lapak kampus", "sewa spot", "universitas udayana", "bazar kampus", "ngelapak", "wirausaha mahasiswa"],
  authors: [{ name: "Ngelapak – Biro Pengelolaan Aset UNUD" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://ngelapak-ayorvup1k-kan04.vercel.app",
    siteName: "Ngelapak",
    title: "Ngelapak – Sewa Lapak Kampus Universitas Udayana",
    description:
      "Sewa spot usaha temporer di Universitas Udayana. Lapangan Rektorat, Boulevard, Student Center, dan Agrokompleks.",
    images: [
      {
        url: "/logo ngelapak.png",
        width: 1200,
        height: 630,
        alt: "Ngelapak – Marketplace Lapak Kampus",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ngelapak – Sewa Lapak Kampus Universitas Udayana",
    description: "Platform resmi sewa spot usaha temporer Universitas Udayana.",
    images: ["/logo ngelapak.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://ngelapak-ayorvup1k-kan04.vercel.app" },
};

// Inline script injected before first paint – safely adds "dark" class
// without any hydration mismatch (runs before React hydrates).
const darkModeScript = `(function(){try{var t=localStorage.getItem('ngelapak_theme');if(t==='dark'||((!t||t==='auto')&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Dark-mode detection: runs synchronously before paint, no flash */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf8ff] dark:bg-[#0b0f19] text-[#131b2e] dark:text-[#f1f5f9] transition-colors duration-150" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

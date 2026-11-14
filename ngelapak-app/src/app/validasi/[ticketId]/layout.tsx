import type { ReactNode } from "react";

export const metadata = {
  title: "Validasi Tiket – Ngelapak",
  description: "Halaman publik verifikasi izin lapak Universitas Udayana",
};

export default function ValidasiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {children}
    </div>
  );
}

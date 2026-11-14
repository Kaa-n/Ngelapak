import { Suspense, type ReactNode } from "react";

export const metadata = {
  title: "Validasi Tiket – Ngelapak",
  description: "Halaman publik verifikasi izin lapak Universitas Udayana",
};

export default function ValidasiLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-md p-8 text-center max-w-sm w-full">
              <div className="w-10 h-10 border-4 border-[#003466] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-[#003466]">Memverifikasi tiket...</p>
            </div>
          </div>
        }
      >
        {children}
      </Suspense>
    </div>
  );
}

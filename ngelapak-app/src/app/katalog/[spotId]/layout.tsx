import { Suspense, type ReactNode } from "react";

export default function SpotDetailLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8ff] flex items-center justify-center p-4">
          <p className="text-sm font-semibold text-[#003466]">Memuat detail lapak…</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

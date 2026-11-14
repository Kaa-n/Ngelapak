import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { requireAdmin } from "@/lib/supabase/admin";
import { logoutAdmin } from "./session";

const navigation = [
  ["/admin", "Dasbor"],
  ["/admin/spots", "Kelola Lapak"],
  ["/admin/verifikasi", "Verifikasi Pembayaran"],
  ["/admin/refund", "Pembatalan & Refund"],
] as const;

async function AdminShell({ children }: { children: ReactNode }) {
  const { name } = await requireAdmin();
  return (
    <>
      <header className="border-b border-[#e2e7ff] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link href="/" className="text-base font-bold text-[#003466]">Ngelapak</Link>
            <div className="flex items-center gap-4">
              <span>{name}</span>
              <form action={logoutAdmin}>
                <button className="rounded-lg border px-3 py-2 font-semibold">Keluar</button>
              </form>
            </div>
          </div>
          <nav aria-label="Panel admin" className="flex flex-wrap gap-2">
            {navigation.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg bg-[#f2f3ff] px-3 py-2 text-sm font-semibold text-[#003466] hover:bg-[#e2e7ff]">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="p-6 text-sm" role="status">Memuat panel admin…</p>}>
    <AdminShell>{children}</AdminShell>
  </Suspense>;
}

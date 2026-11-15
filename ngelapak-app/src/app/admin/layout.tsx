import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";
import Footer from "@/components/ui-custom/Footer";
import { requireAdmin } from "@/lib/supabase/admin";
import { logoutAdmin } from "./session";

async function AdminShell({ children }: { children: ReactNode }) {
  const { name } = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff]">
      <header className="border-b border-[#e2e7ff] bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#eef0fa] py-2 text-sm">
            <Link href="/" className="flex items-center gap-2 font-bold text-[#003466]">
              <span aria-hidden="true" className="material-symbols-outlined grid size-9 place-items-center rounded-lg bg-[#003466] text-[22px] text-white">storefront</span>
              <span className="leading-tight">
                Ngelapak
                <span className="block text-[10px] font-medium text-[#424750]">Universitas Udayana</span>
              </span>
            </Link>
            <div className="flex min-w-0 items-center gap-3">
              <span className="max-w-36 truncate font-semibold text-[#283044] sm:max-w-60" title={name}>{name}</span>
              <form action={logoutAdmin}>
                <button className="rounded-lg border border-[#d7def5] px-3 py-2 font-semibold text-[#003466] hover:bg-[#f2f3ff]">Keluar</button>
              </form>
            </div>
          </div>
          <AdminNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 space-y-6 px-4 py-7 sm:px-6 sm:py-9">{children}</main>
      <Footer />
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="p-6 text-sm" role="status">Memuat panel admin…</p>}>
    <AdminShell>{children}</AdminShell>
  </Suspense>;
}

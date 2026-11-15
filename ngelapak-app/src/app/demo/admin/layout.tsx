"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import AdminShell, { adminLogoutClass } from "@/components/admin/AdminShell";
import { primaryLinkClass } from "@/components/admin/styles";
import { demoLogout, useDemo } from "@/lib/demo-store";

export default function DemoAdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useDemo();
  const hasDemoAccess = user?.role === "admin";

  return (
    <>
      {!hasDemoAccess && (
        <main className="mx-auto max-w-md space-y-4 px-5 py-12">
          <h1 className="text-xl font-bold text-[#131b2e]">Panel admin demo</h1>
          <p className="text-sm text-[#424750]">Pilih Masuk sebagai Admin di bagian Akun Demo.</p>
          <Link href="/masuk" className={primaryLinkClass}>Buka halaman masuk</Link>
        </main>
      )}
      <div hidden={!hasDemoAccess}>
        <AdminShell name={user?.nama ?? ""} basePath="/demo/admin" accountAction={
          <button type="button" className={adminLogoutClass} onClick={() => {
            demoLogout();
            router.replace("/masuk");
          }}>Keluar</button>
        }>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#e2e7ff] bg-white px-4 py-2 text-sm text-[#424750]">
            <span className="rounded-full bg-[#e7efff] px-2 py-0.5 text-xs font-bold text-[#003466]">Mode demo</span>
            Data contoh, terpisah dari Supabase.
          </p>
          {children}
        </AdminShell>
      </div>
    </>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { Store } from "lucide-react";
import AdminNav from "@/components/admin/AdminNav";
import Footer from "@/components/ui-custom/Footer";

export const adminLogoutClass = "rounded-lg border border-[#d7def5] px-3 py-2 text-sm font-semibold text-[#003466] hover:bg-[#f2f3ff]";

export default function AdminShell({ name, basePath, accountAction, children }: {
  name: string;
  basePath: "/admin" | "/demo/admin";
  accountAction: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff]">
      <header className="sticky top-0 z-30 border-b border-[#e2e7ff] bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Link href={basePath} aria-label="Ngelapak, Dasbor Admin" className="flex shrink-0 items-center gap-2 text-sm font-bold text-[#003466]">
            <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg bg-[#003466] text-white">
              <Store className="size-[22px]" />
            </span>
            <span className="leading-tight">
              Ngelapak
              <span className="hidden text-[10px] font-medium text-[#424750] sm:block">Universitas Udayana</span>
            </span>
          </Link>
          <AdminNav basePath={basePath} mobile />
          <div className="flex shrink-0 items-center gap-2 lg:ml-auto">
            <span className="hidden max-w-20 truncate text-sm font-semibold text-[#283044] lg:block xl:max-w-40" title={name}>{name}</span>
            {accountAction}
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 lg:px-6">
        <aside className="hidden w-56 shrink-0 border-r border-[#e2e7ff] bg-white lg:block">
          <div className="sticky top-16 p-3 pt-7">
            <AdminNav basePath={basePath} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-6 px-4 py-7 sm:px-6 sm:py-9 lg:pr-0">{children}</main>
      </div>
      <Footer />
    </div>
  );
}

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
    <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden overscroll-none bg-[#faf8ff]">
      <header className="relative z-30 shrink-0 border-b border-[#e2e7ff] bg-white shadow-sm">
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
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 lg:px-6">
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-[#e2e7ff] bg-white p-3 pt-7 lg:block">
          <AdminNav basePath={basePath} />
        </aside>
        <main aria-label="Konten admin" tabIndex={0}
          className="min-w-0 flex-1 space-y-6 overflow-y-auto overscroll-y-none px-4 py-7 focus-visible:-outline-offset-2 focus-visible:outline-[#003466] sm:px-6 sm:py-9 lg:pr-3">
          {children}
        </main>
      </div>
      <Footer compact />
    </div>
  );
}

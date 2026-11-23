import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import AdminNav from "@/components/admin/AdminNav";
import Footer from "@/components/ui-custom/Footer";

export default function AdminShell({ basePath, accountAction, children }: {
  name?: string;
  basePath: "/admin" | "/demo/admin";
  accountAction: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden overscroll-none bg-[#faf8ff] transition-colors dark:bg-[#0b0f19]">
      <header className="relative z-30 shrink-0 border-b border-[#e2e7ff] bg-white shadow-sm dark:border-[#232942] dark:bg-[#0f1117]">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <Link href={basePath} aria-label="Ngelapak, Dasbor Admin" className="flex shrink-0 items-center gap-2 text-sm font-bold text-[#003466] dark:text-[#a6c8ff]">
            <Image src="/logo%20ngelapak.png" alt="" width={40} height={40} className="size-10 rounded-lg object-contain" />
            <span className="leading-tight">
              Ngelapak
              <span className="hidden text-[10px] font-medium text-[#424750] sm:block dark:text-[#bec3d0]">Universitas Udayana</span>
            </span>
          </Link>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <AdminNav basePath={basePath} mobile />
            {accountAction}
          </div>
        </div>
      </header>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 lg:px-6">
        <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-[#e2e7ff] bg-white p-3 pt-7 lg:block dark:border-[#232942] dark:bg-[#0f1117]">
          <AdminNav basePath={basePath} />
        </aside>
        <main aria-label="Konten admin" tabIndex={0}
          className="min-w-0 flex-1 space-y-6 overflow-y-auto overscroll-y-none px-4 py-7 text-[#131b2e] focus-visible:-outline-offset-2 focus-visible:outline-[#003466] sm:px-6 sm:py-9 lg:pr-3 dark:text-[#e8ecf8]">
          {children}
        </main>
      </div>
      <Footer compact />
    </div>
  );
}

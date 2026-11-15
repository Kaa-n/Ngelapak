import { Suspense, type ReactNode } from "react";
import AdminShell, { adminLogoutClass } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin";
import { logoutAdmin } from "./session";

async function ProtectedAdminShell({ children }: { children: ReactNode }) {
  const { name } = await requireAdmin();
  return (
    <AdminShell name={name} basePath="/admin" accountAction={
      <form action={logoutAdmin}>
        <button className={adminLogoutClass}>Keluar</button>
      </form>
    }>
      {children}
    </AdminShell>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p className="p-6 text-sm" role="status">Memuat panel admin…</p>}>
    <ProtectedAdminShell>{children}</ProtectedAdminShell>
  </Suspense>;
}

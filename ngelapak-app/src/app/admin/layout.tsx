import { Suspense, type ReactNode } from "react";
import AdminAccountMenu from "@/components/admin/AdminAccountMenu";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/supabase/admin";
import { logoutAdmin } from "./session";

async function ProtectedAdminShell({ children }: { children: ReactNode }) {
  const { name, email } = await requireAdmin();
  return (
    <AdminShell name={name} basePath="/admin" accountAction={
      <AdminAccountMenu name={name} email={email} onLogout={logoutAdmin} />
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

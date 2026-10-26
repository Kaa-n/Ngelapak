// Shared types for Ngelapak prototype
// Separated from page.tsx to avoid circular imports

export type PageView = "katalog" | "detail" | "dasbor" | "verifikasi" | "pesanan" | "masuk";

export type Role = "admin" | "penyewa";
export interface DemoUser { id: string; nama: string; email: string; role: Role }

export function canAccess(view: PageView, role?: Role) {
  if (view === "dasbor" || view === "verifikasi") return role === "admin";
  if (view === "pesanan") return role === "penyewa";
  return true;
}

export function navigationFor(role?: Role): { id: PageView; label: string; icon: string }[] {
  return [
    { id: "katalog" as const, label: "Jelajah Lapak", icon: "storefront" },
    ...(role === "admin" ? [
      { id: "dasbor" as const, label: "Kelola Lapak", icon: "dashboard" },
      { id: "verifikasi" as const, label: "Verifikasi", icon: "verified_user" },
    ] : role === "penyewa" ? [
      { id: "pesanan" as const, label: "Pesanan Saya", icon: "receipt_long" },
    ] : [{ id: "masuk" as const, label: "Masuk", icon: "login" }]),
  ];
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  description?: string;
}

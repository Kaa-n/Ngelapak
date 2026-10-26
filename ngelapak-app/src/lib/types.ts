// Shared types for Ngelapak prototype
// Separated from page.tsx to avoid circular imports

export type PageView = "katalog" | "detail" | "dasbor" | "verifikasi";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  description?: string;
}

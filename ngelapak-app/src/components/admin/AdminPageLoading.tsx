import { panelClass } from "@/components/admin/styles";

export default function AdminPageLoading() {
  return (
    <div className="space-y-6" role="status">
      <p className="text-sm font-semibold text-[#003466]">Memuat halaman admin…</p>
      <div aria-hidden="true" className={`${panelClass} space-y-4 motion-safe:animate-pulse`}>
        <div className="h-5 w-40 rounded bg-[#e2e7ff]" />
        <div className="h-12 rounded-lg bg-[#f2f3ff]" />
        <div className="h-12 rounded-lg bg-[#f2f3ff]" />
      </div>
    </div>
  );
}

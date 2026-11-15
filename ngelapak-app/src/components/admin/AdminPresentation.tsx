import type { ReactNode } from "react";

export function AdminHeading({ title, description, actions }: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#131b2e] sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm leading-6 text-[#424750]">{description}</p>
      </div>
      {actions}
    </div>
  );
}

export function AdminEmptyState({ icon, title, detail }: {
  icon: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="grid min-h-40 place-content-center justify-items-center gap-2 rounded-xl border border-dashed border-[#d7def5] bg-[#fafbff] px-5 py-7 text-center">
      <span aria-hidden="true" className="material-symbols-outlined grid size-10 place-items-center rounded-xl bg-[#eaedff] text-[22px] text-[#003466]">{icon}</span>
      <p className="text-sm font-semibold text-[#283044]">{title}</p>
      {detail && <p className="max-w-sm text-sm text-[#424750]">{detail}</p>}
    </div>
  );
}

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const colors: Record<string, string> = {
    tersedia: "bg-[#e2faef] text-[#005639]",
    dipesan: "bg-[#e7efff] text-[#003466]",
    menunggu: "bg-[#fff0dd] text-[#6b4300]",
    disetujui: "bg-[#e2faef] text-[#005639]",
    ditolak: "bg-[#ffeaec] text-[#93000a]",
    pemeliharaan: "bg-[#edf0f5] text-[#424750]",
  };
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${colors[status] ?? "bg-[#edf0f5] text-[#424750]"}`}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label ?? status}
    </span>
  );
}

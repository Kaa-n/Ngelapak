import { Suspense } from "react";
import AdminPageLoading from "@/components/admin/AdminPageLoading";
import SpotForm from "@/components/admin/SpotForm";
import { AdminEmptyState, AdminHeading, StatusPill } from "@/components/admin/AdminPresentation";
import { panelClass, primaryLinkClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/supabase/admin";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

type SpotsPageProps = { searchParams: Promise<{ tambah?: string }> };

export default function SpotsPage(props: SpotsPageProps) {
  return <Suspense fallback={<AdminPageLoading />}><SpotsData {...props} /></Suspense>;
}

async function SpotsData({ searchParams }: SpotsPageProps) {
  const { supabase } = await requireAdmin();
  const { tambah } = await searchParams;
  const { data: spots, error } = await supabase.from("spots").select().order("zona").order("kode");
  if (error) throw new Error("Daftar lapak tidak dapat dimuat.");

  return (
    <>
      <AdminHeading title="Kelola Lapak" description="Atur tarif, daya listrik, foto, dan status lapak kampus." />
      <details id="tambah-lapak" open={tambah === "1" || undefined} className={`${panelClass} scroll-mt-20`}>
        <summary className={`${primaryLinkClass} w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
          <span aria-hidden="true" className="material-symbols-outlined text-xl">add</span>
          Tambah lapak
        </summary>
        <SpotForm />
      </details>
      <section className={panelClass}>
        <h2 className="mb-4 font-bold text-[#131b2e]">Inventaris lapak ({spots.length})</h2>
        {!spots.length ? <AdminEmptyState icon="storefront" title="Belum ada lapak dalam inventaris" /> : (
          <div className="space-y-2">
            {spots.map((spot) => (
              <details key={spot.id} className="group rounded-xl border border-[#e2e7ff] px-3 sm:px-4">
                <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-3 text-sm [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className="material-symbols-outlined grid size-9 shrink-0 place-items-center rounded-lg bg-[#f2f3ff] text-[20px] text-[#003466]">storefront</span>
                    <span className="min-w-0">
                      <strong className="block break-words text-[#131b2e]">{spot.nama}</strong>
                      <span className="block break-words text-xs leading-5 text-[#424750]">{spot.kode} · {spot.zona_label ?? spot.zona} · {currency.format(spot.tarif_per_hari)} / hari</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-1 sm:gap-3">
                    <StatusPill status={spot.status} />
                    <span aria-hidden="true" className="material-symbols-outlined text-xl text-[#003466] group-open:rotate-180">expand_more</span>
                  </span>
                </summary>
                <div className="border-t border-[#e2e7ff] pb-4"><SpotForm spot={spot} /></div>
              </details>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

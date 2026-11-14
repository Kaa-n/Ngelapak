import SpotForm from "@/components/admin/SpotForm";
import { panelClass } from "@/components/admin/styles";
import { requireAdmin } from "@/lib/supabase/admin";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default async function SpotsPage() {
  const { supabase } = await requireAdmin();
  const { data: spots, error } = await supabase.from("spots").select().order("zona").order("kode");
  if (error) throw new Error("Daftar lapak tidak dapat dimuat.");

  return (
    <>
      <h1 className="text-2xl font-bold text-[#003466]">Kelola Lapak</h1>
      <details className={panelClass}>
        <summary className="cursor-pointer font-semibold text-[#003466]">Tambah lapak</summary>
        <SpotForm />
      </details>
      {!spots.length && <p className={panelClass}>Belum ada lapak dalam inventaris.</p>}
      {spots.map((spot) => (
        <details key={spot.id} className={panelClass}>
          <summary className="cursor-pointer text-sm">
            <strong>{spot.nama}</strong>
            <span className="ml-2 text-[#424750]">{spot.kode} · {spot.zona_label ?? spot.zona} · {currency.format(spot.tarif_per_hari)} / hari · {spot.status}</span>
          </summary>
          <SpotForm spot={spot} />
        </details>
      ))}
    </>
  );
}

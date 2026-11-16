/* eslint-disable @next/next/no-img-element -- Supabase provides a short-lived signed URL. */
import { panelClass } from "./styles";

export default function ProofPreview({ proof, title }: {
  proof: { url: string; type: "pdf" | "image" | "link" } | null;
  title: string;
}) {
  return (
    <section className={`${panelClass} min-w-0 space-y-3`}>
      <h2 className="font-semibold">{title}</h2>
      {proof ? (
        <>
          {proof.type === "image" && <img src={proof.url} alt={title} className="max-h-96 w-full rounded-lg object-contain" />}
          {proof.type === "pdf" && <iframe title={title} src={proof.url} sandbox="" className="h-80 w-full rounded-lg border" />}
          <a href={proof.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#003466] underline">
            Buka bukti di tab baru
          </a>
        </>
      ) : <p className="text-sm text-[#424750]">Bukti belum tersedia atau gagal dimuat.</p>}
    </section>
  );
}

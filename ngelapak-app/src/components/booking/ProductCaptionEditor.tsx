"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { readProductCaption, saveProductCaption } from "@/lib/demo-store";

type Props = {
  spotId: string;
  ownerId?: string;
  useSupabase: boolean;
  onSaved?: () => void;
};

/** Editor used from the tenant's own paid order. Database RLS remains authoritative. */
export default function ProductCaptionEditor({ spotId, ownerId, useSupabase, onSaved }: Props) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(useSupabase);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!useSupabase) {
        const saved = readProductCaption(spotId);
        if (mounted) {
          setText(saved);
          setDraft(saved);
          setLoading(false);
        }
        return;
      }

      if (!ownerId) {
        if (mounted) setLoading(false);
        return;
      }
      const { data, error } = await createClient()
        .from("product_captions")
        .select("konten")
        .eq("spot_id", spotId)
        .eq("owner_id", ownerId)
        .maybeSingle();
      if (!mounted) return;
      if (error) setNotice(error.message);
      const saved = data?.konten ?? "";
      setText(saved);
      setDraft(saved);
      setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, [ownerId, spotId, useSupabase]);

  async function save() {
    const konten = draft.trim();
    setNotice("");
    setSaving(true);
    try {
      if (useSupabase) {
        if (!ownerId) throw new Error("Sesi pengguna tidak ditemukan.");
        const { error } = await createClient().from("product_captions").upsert(
          { spot_id: spotId, owner_id: ownerId, konten },
          { onConflict: "spot_id,owner_id" },
        );
        if (error) throw error;
      } else {
        saveProductCaption(spotId, konten);
      }
      setText(konten);
      setDraft(konten);
      setEditing(false);
      setNotice("Deskripsi produk tersimpan.");
      onSaved?.();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Deskripsi produk gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-[#e2e7ff] p-5 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-[#131b2e]">Deskripsi Produk</h3>
          <p className="mt-1 text-xs text-[#737781]">Deskripsi ini akan tampil pada informasi lapak.</p>
        </div>
        {!loading && !editing && (
          <button type="button" onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#003466] px-3 py-2 text-sm font-semibold text-[#003466] hover:bg-[#eef3ff]">
            <span className="material-symbols-outlined text-[17px]">edit</span>
            Edit
          </button>
        )}
      </div>
      {loading ? <p role="status" className="mt-3 text-sm text-[#737781]">Memuat deskripsi…</p>
        : editing ? (
          <div className="mt-3 space-y-3">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={8}
              maxLength={3000} placeholder="Tulis deskripsi produk di sini."
              className="w-full resize-y rounded-xl border border-[#d7def5] bg-[#f8f9ff] px-3 py-2 text-sm text-[#131b2e] outline-none focus:ring-2 focus:ring-[#003466]/20" />
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={save} className="rounded-lg bg-[#003466] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Menyimpan…" : "Simpan"}
              </button>
              <button type="button" disabled={saving} onClick={() => { setDraft(text); setEditing(false); }} className="rounded-lg border border-[#d7def5] px-4 py-2 text-sm font-semibold text-[#424750]">Batal</button>
            </div>
          </div>
        ) : <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#f8f9ff] px-3 py-3 text-sm text-[#424750]">{text || "Belum ada deskripsi produk."}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-[#424750]">{notice}</p>}
    </section>
  );
}

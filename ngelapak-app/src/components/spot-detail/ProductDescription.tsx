"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProductDescription({ spotId, initialText, currentUserId, activeBooking }: { spotId: string; initialText: string; currentUserId: string | null; activeBooking: { userId: string; active: boolean } | null }) {
  const [text, setText] = useState(initialText);
  const [draft, setDraft] = useState(initialText);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const canEdit = Boolean(currentUserId && activeBooking?.active && currentUserId === activeBooking.userId);
  async function save() {
    if (!canEdit || !currentUserId) return;
    const supabase = createClient();
    const { error } = await supabase.from("product_captions").upsert({ spot_id: spotId, owner_id: currentUserId, konten: draft }, { onConflict: "spot_id,owner_id" });
    if (error) { setNotice(error.message); return; }
    setText(draft); setEditing(false); setNotice("Deskripsi tersimpan.");
  }
  return <section className="rounded-2xl border border-slate-200 bg-white p-5">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold">Deskripsi produk penyewa</h2>
      {canEdit && !editing &&
        <button className="text-sm font-semibold text-blue-900"
          onClick={() => setEditing(true)}>Edit
        </button>}
    </div>
    {editing && canEdit ?
      <div className="mt-3 space-y-2">
        <textarea className="min-h-32 w-full rounded-lg border p-3" value={draft} onChange={e => setDraft(e.target.value)}
        />
        <div className="flex gap-2">
          <button className="rounded-lg bg-blue-900 px-4 py-2 text-white"
            onClick={save}>Simpan
          </button>
          <button className="rounded-lg border px-4 py-2"
            onClick={() => { setEditing(false); setDraft(text) }}>Batal
          </button>
        </div>
      </div>
      :
      <p className="mt-3 whitespace-pre-wrap text-slate-700">
        {text || "Belum ada deskripsi produk."}
      </p>}
    {notice &&
      <p role="status" className="mt-2 text-sm">{notice}
      </p>}
  </section>;
}

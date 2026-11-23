"use client";

import { useState } from "react";
import { useTermsContent, saveTermsContent, resetTermsContent, type TermsContent } from "@/lib/terms-content";

export default function KetentuanAdminPage() {
  const storedContent = useTermsContent();
  const [draft, setDraft] = useState<TermsContent | null>(null);
  const content = draft ?? storedContent;
  const [saved, setSaved] = useState(false);

  function setContent(update: (current: TermsContent) => TermsContent) {
    setSaved(false);
    setDraft((current) => update(current ?? storedContent));
  }

  function handleSave() {
    saveTermsContent(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (!confirm("Reset ke konten default? Semua perubahan akan hilang.")) return;
    resetTermsContent();
    setDraft(null);
    setSaved(false);
  }

  function updateIntro(value: string) {
    setContent((c) => ({ ...c, intro: value }));
  }

  function updateClosing(value: string) {
    setContent((c) => ({ ...c, closing: value }));
  }

  function updateSectionTitle(idx: number, value: string) {
    setContent((c) => {
      const sections = [...c.sections];
      sections[idx] = { ...sections[idx], title: value };
      return { ...c, sections };
    });
  }

  function updateSectionItem(sectionIdx: number, itemIdx: number, value: string) {
    setContent((c) => {
      const sections = [...c.sections];
      const items = [...sections[sectionIdx].items];
      items[itemIdx] = value;
      sections[sectionIdx] = { ...sections[sectionIdx], items };
      return { ...c, sections };
    });
  }

  function addSectionItem(sectionIdx: number) {
    setContent((c) => {
      const sections = [...c.sections];
      sections[sectionIdx] = {
        ...sections[sectionIdx],
        items: [...sections[sectionIdx].items, ""],
      };
      return { ...c, sections };
    });
  }

  function removeSectionItem(sectionIdx: number, itemIdx: number) {
    setContent((c) => {
      const sections = [...c.sections];
      const items = sections[sectionIdx].items.filter((_, i) => i !== itemIdx);
      sections[sectionIdx] = { ...sections[sectionIdx], items };
      return { ...c, sections };
    });
  }

  function removeSection(sectionIdx: number) {
    const title = content.sections[sectionIdx].title.trim() || `Pasal ${sectionIdx + 1}`;
    if (!window.confirm(`Hapus “${title}” beserta seluruh isinya dari draf?`)) return;
    setContent((c) => ({ ...c, sections: c.sections.filter((_, index) => index !== sectionIdx) }));
  }

  function addSection() {
    setContent((c) => {
      const lastNumber = c.sections.reduce((highest, section) => {
        const number = Number(section.title.match(/^\s*Pasal\s+(\d+)\b/i)?.[1]);
        return Number.isSafeInteger(number) ? Math.max(highest, number) : highest;
      }, c.sections.length);
      return {
        ...c,
        sections: [...c.sections, { title: `Pasal ${lastNumber + 1}`, items: [""] }],
      };
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#131b2e]">Syarat &amp; Ketentuan</h1>
          <p className="text-sm text-[#424750] mt-0.5">
            Perubahan disimpan di browser ini dan ditampilkan pada Syarat &amp; Ketentuan pemesanan.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 h-9 rounded-lg border border-[#e2e7ff] text-sm text-[#424750] hover:bg-[#f2f3ff] transition-colors"
          >
            Reset Default
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 h-9 rounded-lg bg-[#003466] text-white text-sm font-semibold hover:bg-[#1a4b84] transition-colors"
          >
            {saved ? "✓ Tersimpan" : "Simpan"}
          </button>
        </div>
      </div>

      {/* Pendahuluan */}
      <section className="rounded-xl border border-[#e2e7ff] bg-white p-5 space-y-2">
        <label className="block text-sm font-semibold text-[#131b2e]">Pendahuluan</label>
        <textarea
          className="w-full rounded-lg border border-[#e2e7ff] bg-[#faf8ff] p-3 text-sm text-[#131b2e] leading-relaxed resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#003466]/20"
          value={content.intro}
          onChange={(e) => updateIntro(e.target.value)}
        />
      </section>

      {/* Pasal-pasal */}
      {content.sections.map((section, si) => (
        <section key={si} className="rounded-xl border border-[#e2e7ff] bg-white p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              aria-label={`Judul pasal ${si + 1}`}
              className="min-w-0 flex-1 rounded-lg border border-[#e2e7ff] bg-[#f2f3ff] px-3 py-2 text-sm font-semibold text-[#003466] focus:outline-none focus:ring-2 focus:ring-[#003466]/20"
              value={section.title}
              onChange={(e) => updateSectionTitle(si, e.target.value)}
            />
            <button
              type="button"
              aria-label={`Hapus pasal: ${section.title.trim() || si + 1}`}
              onClick={() => removeSection(si)}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Hapus pasal
            </button>
          </div>
          <div className="space-y-2">
            {section.items.map((item, ii) => (
              <div key={ii} className="flex gap-2 items-start">
                <textarea
                  className="flex-1 rounded-lg border border-[#e2e7ff] bg-[#faf8ff] p-2.5 text-sm text-[#424750] leading-relaxed resize-y min-h-[52px] focus:outline-none focus:ring-2 focus:ring-[#003466]/20"
                  value={item}
                  onChange={(e) => updateSectionItem(si, ii, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeSectionItem(si, ii)}
                  className="mt-1 w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[#737781] hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Hapus baris"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addSectionItem(si)}
            className="text-xs font-semibold text-[#003466] hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">add</span>
            Tambah baris
          </button>
        </section>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="flex items-center gap-1 rounded-lg border border-[#e2e7ff] bg-white px-4 py-2 text-sm font-semibold text-[#003466] hover:bg-[#f2f3ff]"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-base">add</span>
        Tambah pasal
      </button>

      {/* Penutup / Pernyataan Persetujuan */}
      <section className="rounded-xl border border-[#e2e7ff] bg-white p-5 space-y-2">
        <label className="block text-sm font-semibold text-[#131b2e]">Pernyataan Persetujuan</label>
        <textarea
          className="w-full rounded-lg border border-[#e2e7ff] bg-[#faf8ff] p-3 text-sm text-[#131b2e] leading-relaxed resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#003466]/20"
          value={content.closing}
          onChange={(e) => updateClosing(e.target.value)}
        />
      </section>

      {/* Simpan bawah */}
      <div className="flex justify-end gap-2 pb-6">
        <button
          type="button"
          onClick={handleReset}
          className="px-4 h-9 rounded-lg border border-[#e2e7ff] text-sm text-[#424750] hover:bg-[#f2f3ff] transition-colors"
        >
          Reset Default
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-5 h-9 rounded-lg bg-[#003466] text-white text-sm font-semibold hover:bg-[#1a4b84] transition-colors"
        >
          {saved ? "✓ Tersimpan" : "Simpan"}
        </button>
      </div>
    </div>
  );
}

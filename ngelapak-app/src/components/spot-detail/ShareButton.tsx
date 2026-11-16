"use client";
import { useState } from "react";

export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const fullUrl = `${window.location.origin}${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: fullUrl });
        return;
      } catch {
        /* user cancelled native share */
      }
    }
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e7ff] bg-white px-3 py-2 text-sm font-semibold text-[#003466] hover:bg-[#eef2ff] transition-colors"
    >
      <span className="material-symbols-outlined text-[16px]">
        {copied ? "check_circle" : "share"}
      </span>
      {copied ? "Tautan disalin!" : "Bagikan"}
    </button>
  );
}

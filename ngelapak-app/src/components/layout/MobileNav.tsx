"use client";
import { navigationFor, type PageView, type Role } from "@/lib/types";
export default function MobileNav({ currentView, onNavigate, role }: { currentView: PageView; onNavigate: (view: PageView) => void; role?: Role }) {
  return <nav aria-label="Navigasi seluler" className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#e2e7ff] pb-[env(safe-area-inset-bottom)]"><div className="flex h-16">{navigationFor(role).map(item => {
    const active = currentView === item.id || (item.id === "katalog" && currentView === "detail");
    return <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={active ? "page" : undefined} className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? "text-[#003466] bg-[#f2f3ff]" : "text-[#737781]"}`}><span className="material-symbols-outlined">{item.icon}</span>{item.label}</button>;
  })}</div></nav>;
}

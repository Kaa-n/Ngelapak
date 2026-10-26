"use client";
import { navigationFor, type DemoUser, type PageView } from "@/lib/types";

export default function Navbar({ currentView, onNavigate, user, onLogout }: { currentView: PageView; onNavigate: (view: PageView) => void; user: DemoUser | null; onLogout: () => void }) {
  return <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e2e7ff]">
    <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
      <button onClick={() => onNavigate("katalog")} className="flex items-center gap-2 text-[#003466] font-bold"><span className="material-symbols-outlined bg-[#003466] text-white rounded-lg p-1.5">storefront</span><span>Ngelapak<span className="hidden sm:block text-[10px] text-[#424750] font-medium">Universitas Udayana</span></span></button>
      <nav aria-label="Navigasi utama" className="hidden md:flex gap-1">{navigationFor(user?.role).map(item => <button key={item.id} onClick={() => onNavigate(item.id)} aria-current={currentView === item.id ? "page" : undefined} className={`px-3 py-2 rounded-lg text-sm font-semibold ${currentView === item.id ? "bg-[#003466] text-white" : "hover:bg-[#eaedff]"}`}>{item.label}</button>)}</nav>
      <div className="flex items-center gap-3">{user ? <><div className="text-right"><p className="text-xs sm:text-sm font-semibold max-w-36 truncate">{user.nama}</p><p className="text-xs text-[#855300]">{user.role === "admin" ? "Admin" : "Penyewa"} · Demo</p></div><button onClick={onLogout} className="text-sm px-3 py-2 rounded-lg border border-[#e2e7ff] hover:bg-[#eaedff]">Keluar</button></> : <button onClick={() => onNavigate("masuk")} className="bg-[#003466] text-white px-4 py-2 rounded-lg text-sm font-semibold">Masuk demo</button>}</div>
    </div>
  </header>;
}

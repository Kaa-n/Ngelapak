"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

type ThemeMode = "auto" | "light" | "dark";

export default function AdminAccountMenu({
  name,
  email,
  onLogout,
}: {
  name: string;
  email?: string;
  onLogout: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("auto");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("ngelapak_theme") as ThemeMode | null;
    if (saved === "auto" || saved === "light" || saved === "dark") setThemeMode(saved);
  }, []);

  useEffect(() => {
    function applyTheme() {
      if (themeMode === "dark") {
        document.documentElement.classList.add("dark");
      } else if (themeMode === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", isDark);
      }
    }

    applyTheme();
    localStorage.setItem("ngelapak_theme", themeMode);

    if (themeMode !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", event.matches);
    };
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [themeMode]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("scroll", close);
    };
  }, [open]);

  const itemClass =
    "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[#172033] hover:bg-[#f4f6ff] dark:text-[#e8ecf8] dark:hover:bg-[#1c2235]";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[#f4f6ff] dark:hover:bg-[#1c2235]"
      >
        <div className="hidden text-right sm:block">
          <p className="max-w-36 truncate text-sm font-semibold text-[#131b2e] dark:text-[#e8ecf8]" title={name}>
            {name}
          </p>
          <p className="text-xs text-[#855300] dark:text-[#ffb95f]">Admin</p>
        </div>
        <span aria-hidden="true" className="material-symbols-outlined text-[#003466] dark:text-[#a6c8ff]">
          account_circle
        </span>
        <span aria-hidden="true" className="material-symbols-outlined text-lg text-[#737781] dark:text-[#bec3d0]">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          onClick={(event) => event.stopPropagation()}
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[#e2e7ff] bg-white p-2 shadow-lg dark:border-[#232942] dark:bg-[#161b27]"
        >
          <div className="mb-1 border-b border-[#e2e7ff] px-3 py-2 dark:border-[#232942]">
            <p className="truncate text-sm font-semibold text-[#172033] dark:text-[#e8ecf8]">{name}</p>
            {email && <p className="truncate text-xs text-[#737781] dark:text-[#bec3d0]">{email}</p>}
          </div>

          <Link href="/?view=edit-profile" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <span aria-hidden="true" className="material-symbols-outlined text-lg text-[#003466] dark:text-[#a6c8ff]">
              edit
            </span>
            Edit Profile
          </Link>
          <Link href="/?view=settings" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <span aria-hidden="true" className="material-symbols-outlined text-lg text-[#003466] dark:text-[#a6c8ff]">
              settings
            </span>
            Pengaturan
          </Link>

          <div className="my-1 border-t border-[#e2e7ff] px-3 pt-2 pb-1 dark:border-[#232942]">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#737781] dark:text-[#bec3d0]">
              <span>Mode Tampilan</span>
              <span className="text-[11px] font-bold text-[#003466] dark:text-[#a6c8ff]">
                {themeMode === "auto" ? "Otomatis" : themeMode === "dark" ? "Gelap" : "Terang"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#eaedff] p-0.5 text-[11px] dark:bg-[#232942]">
              {([
                ["auto", "brightness_auto", "Auto"],
                ["light", "light_mode", "Terang"],
                ["dark", "dark_mode", "Gelap"],
              ] as const).map(([mode, icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setThemeMode(mode)}
                  className={`flex cursor-pointer items-center justify-center gap-1 rounded py-1 font-medium transition-all ${
                    themeMode === mode
                      ? "bg-white font-semibold text-[#003466] shadow-xs dark:bg-[#161b27] dark:text-[#a6c8ff]"
                      : "text-[#424750] hover:text-[#131b2e] dark:text-[#bec3d0] dark:hover:text-white"
                  }`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[13px]">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#e2e7ff] pt-1 dark:border-[#232942]">
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                startTransition(() => {
                  void Promise.resolve(onLogout());
                });
              }}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/30"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-lg">logout</span>
              {pending ? "Keluar…" : "Keluar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

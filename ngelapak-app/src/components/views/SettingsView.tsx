"use client";

import { useState, type FormEvent } from "react";
import type { DemoUser, ToastMessage } from "@/lib/types";
import type { SupabaseProfile } from "@/lib/supabase/auth";
import { updateEmail, updatePassword } from "@/lib/supabase/auth";

interface SettingsViewProps {
  user: DemoUser | SupabaseProfile;
  onBack: () => void;
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
}

type Tab = "email" | "password";

export default function SettingsView({ user, onBack, onShowToast }: SettingsViewProps) {
  const [tab, setTab] = useState<Tab>("email");
  const isDemoUser = !("nim" in user) || user.id === "ayu" || user.id === "bayu" || user.id === "admin";

  // Email tab state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isDemoUser) {
      onShowToast({ type: "info", message: "Akun demo", description: "Perubahan email tidak tersedia untuk akun demo." });
      return;
    }
    setEmailLoading(true);
    try {
      await updateEmail(newEmail);
      onShowToast({ type: "success", message: "Email diperbarui", description: "Cek inbox email baru Anda untuk konfirmasi perubahan." });
      setNewEmail("");
    } catch (err) {
      onShowToast({ type: "error", message: "Gagal mengubah email", description: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isDemoUser) {
      onShowToast({ type: "info", message: "Akun demo", description: "Perubahan password tidak tersedia untuk akun demo." });
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowToast({ type: "error", message: "Password tidak cocok", description: "Password baru dan konfirmasi harus sama." });
      return;
    }
    if (newPassword.length < 8) {
      onShowToast({ type: "error", message: "Password terlalu pendek", description: "Password baru minimal 8 karakter." });
      return;
    }
    setPasswordLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      onShowToast({ type: "success", message: "Password diperbarui", description: "Password Anda berhasil diubah." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      onShowToast({ type: "error", message: "Gagal mengubah password", description: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setPasswordLoading(false);
    }
  }

  const inputClass = "w-full border border-[#d8deeb] dark:border-[#3a3f52] rounded-xl px-4 py-3 outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10 bg-white dark:bg-[#1c2235] text-[#131b2e] dark:text-[#e8ecf8] text-sm";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 pb-24">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#003466] hover:underline mb-6"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Kembali
      </button>

      <div className="mb-8">
        <p className="text-sm font-semibold text-[#855300] mb-2">Pengaturan Akun</p>
        <h1 className="text-3xl font-bold text-[#003466]">Pengaturan</h1>
        <p className="text-[#737781] dark:text-[#bec3d0] mt-2">
          Kelola kredensial akun Ngelapak Anda.
        </p>
      </div>

      {/* Current account info */}
      <div className="bg-[#f4f6ff] dark:bg-[#1c2235] border border-[#e2e7ff] dark:border-[#3a3f52] rounded-2xl p-4 flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-[#003466] text-white flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-xl">person</span>
        </div>
        <div>
          <p className="font-semibold text-sm text-[#131b2e] dark:text-[#e8ecf8]">{user.nama}</p>
          <p className="text-xs text-[#737781] dark:text-[#bec3d0]">{user.email}</p>
        </div>
        {isDemoUser && (
          <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            Akun Demo
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#eaedff] dark:bg-[#232942] rounded-xl mb-6">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "email" ? "bg-white dark:bg-[#1c2235] text-[#003466] shadow-sm" : "text-[#737781] dark:text-[#bec3d0] hover:text-[#131b2e]"}`}
        >
          Ubah Email
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "password" ? "bg-white dark:bg-[#1c2235] text-[#003466] shadow-sm" : "text-[#737781] dark:text-[#bec3d0] hover:text-[#131b2e]"}`}
        >
          Ubah Password
        </button>
      </div>

      <div className="bg-white dark:bg-[#1c2235] border border-[#e2e7ff] dark:border-[#3a3f52] rounded-2xl p-6 sm:p-8 shadow-sm">
        {tab === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-5">
            <div>
              <label htmlFor="current-email" className="block text-sm font-semibold text-[#172033] dark:text-[#e8ecf8] mb-2">
                Email Saat Ini
              </label>
              <input
                id="current-email"
                type="email"
                value={user.email}
                readOnly
                className={`${inputClass} bg-[#f4f6ff] dark:bg-[#232942] text-[#737781] cursor-not-allowed`}
              />
            </div>
            <div>
              <label htmlFor="new-email" className="block text-sm font-semibold text-[#172033] dark:text-[#e8ecf8] mb-2">
                Email Baru
              </label>
              <input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                placeholder="Masukkan email baru"
                className={inputClass}
                disabled={isDemoUser}
              />
            </div>
            {isDemoUser && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                Perubahan email hanya tersedia untuk akun terdaftar (Supabase).
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={emailLoading || isDemoUser}
                className="px-5 py-3 rounded-xl bg-[#003466] text-white font-semibold hover:bg-[#1a4b84] disabled:opacity-50 transition-colors"
              >
                {emailLoading ? "Memproses..." : "Simpan Email Baru"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label htmlFor="current-password" className="block text-sm font-semibold text-[#172033] dark:text-[#e8ecf8] mb-2">
                Password Saat Ini
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Masukkan password saat ini"
                  className={`${inputClass} pr-12`}
                  disabled={isDemoUser}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737781] hover:text-[#003466]"
                  aria-label={showCurrent ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <span className="material-symbols-outlined text-xl">{showCurrent ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-semibold text-[#172033] dark:text-[#e8ecf8] mb-2">
                Password Baru
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  className={`${inputClass} pr-12`}
                  disabled={isDemoUser}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737781] hover:text-[#003466]"
                  aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
                >
                  <span className="material-symbols-outlined text-xl">{showNew ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#172033] dark:text-[#e8ecf8] mb-2">
                Konfirmasi Password Baru
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ulangi password baru"
                className={inputClass}
                disabled={isDemoUser}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1">Password tidak cocok.</p>
              )}
            </div>
            {isDemoUser && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                Perubahan password hanya tersedia untuk akun terdaftar (Supabase).
              </p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading || isDemoUser}
                className="px-5 py-3 rounded-xl bg-[#003466] text-white font-semibold hover:bg-[#1a4b84] disabled:opacity-50 transition-colors"
              >
                {passwordLoading ? "Memproses..." : "Ubah Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

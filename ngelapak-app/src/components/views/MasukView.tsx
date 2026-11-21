"use client";

import { useState } from "react";
import { DEMO_USERS } from "@/lib/demo-store";
import { signInWithEmail, resetPasswordForEmail, type SupabaseProfile } from "@/lib/supabase/auth";

interface MasukViewProps {
  onLoginDemo: (id: string) => Promise<void> | void;
  onLoginSupabase: (profile: SupabaseProfile) => void;
  onNavigateToRegister: () => void;
  onForgotPassword?: () => void;
}

const QUICK_SUPABASE_ACCOUNTS = [
  {
    label: "Admin",
    nama: "Admin Ngelapak",
    email: "admin@example.com",
    password: "12345678",
    isAdmin: true,
  },
  {
    label: "User / Penyewa",
    nama: "User Demo",
    email: "user@example.com",
    password: "12345678",
    isAdmin: false,
  },
];

export default function MasukView({
  onLoginDemo,
  onLoginSupabase,
  onNavigateToRegister,
  onForgotPassword,
}: MasukViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [quickLoadingEmail, setQuickLoadingEmail] = useState<string | null>(null);
  const [showLocalDemo, setShowLocalDemo] = useState(false);

  // Lupa password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setForgotLoading(true);
    setError("");
    try {
      await resetPasswordForEmail(forgotEmail);
      setForgotSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setForgotLoading(false);
    }
  }

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profile = await signInWithEmail(email, password);
      onLoginSupabase(profile);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat masuk."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSupabaseLogin = async (
    demoEmail: string,
    demoPassword: string
  ) => {
    setError("");
    setQuickLoadingEmail(demoEmail);
    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      const profile = await signInWithEmail(demoEmail, demoPassword);
      onLoginSupabase(profile);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Gagal masuk dengan ${demoEmail}.`
      );
    } finally {
      setQuickLoadingEmail(null);
    }
  };

  const handleDemoLogin = async (id: string) => {
    setError("");
    try {
      await onLoginDemo(id);
    } catch {
      setError("Gagal masuk menggunakan akun demo lokal.");
    }
  };

  const isAnyLoading = loading || quickLoadingEmail !== null;

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-10 pb-24">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e2e7ff] rounded-2xl shadow-sm p-6 sm:p-8">

          {/* ── Lupa Password Panel ── */}
          {showForgotPassword ? (
            <div>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setError(""); setForgotEmail(""); }}
                className="flex items-center gap-1 text-sm font-semibold text-[#003466] hover:underline mb-6"
              >
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Kembali ke Login
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-[#edf3fa] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#003466] text-3xl">lock_reset</span>
                </div>
                <h2 className="text-xl font-bold">Lupa Password?</h2>
                <p className="text-sm text-[#737781] mt-2">
                  Masukkan email Anda dan kami akan mengirim tautan untuk mengatur ulang password.
                </p>
              </div>
              {forgotSuccess ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <span className="material-symbols-outlined text-green-600 text-3xl mb-2 block">mark_email_read</span>
                  <p className="text-sm font-semibold text-green-800">Email terkirim!</p>
                  <p className="text-xs text-green-700 mt-1">Cek inbox atau folder spam untuk tautan reset password.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {error && (
                    <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
                  )}
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      placeholder="Masukkan email akun Anda"
                      className="w-full border border-[#dce1eb] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-[#003466] hover:bg-[#1a4b84] disabled:opacity-60 text-white rounded-xl py-3 font-semibold text-sm transition-colors cursor-pointer"
                  >
                    {forgotLoading ? "Mengirim..." : "Kirim Tautan Reset"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-[#003466] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-3xl">
                store
              </span>
            </div>

            <p className="text-sm font-semibold text-[#003466]">
              NGELAPAK · UNIVERSITAS UDAYANA
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold mt-2">
              Selamat Datang!
            </h1>

            <p className="text-sm text-[#737781] mt-2">
              Masuk ke akun Anda untuk melanjutkan ke Ngelapak.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2">
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Masukkan email Anda"
                required
                autoComplete="username"
                className="w-full border border-[#dce1eb] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password Anda"
                  required
                  autoComplete="current-password"
                  className="w-full border border-[#dce1eb] rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737781] hover:text-[#003466]"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isAnyLoading}
              className="w-full bg-[#003466] hover:bg-[#1a4b84] disabled:opacity-60 text-white rounded-xl py-3 font-semibold text-sm transition-colors cursor-pointer"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Lupa password link */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={() => { setShowForgotPassword(true); setError(""); }}
              className="text-sm text-[#737781] hover:text-[#003466] hover:underline cursor-pointer"
            >
              Lupa password?
            </button>
          </div>

          <p className="text-center text-sm text-[#737781] mt-4">
            Belum memiliki akun?{" "}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-[#003466] hover:underline cursor-pointer"
            >
              Daftar sekarang
            </button>
          </p>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-[#e2e7ff]" />
            <span className="text-xs text-[#737781] font-medium">ATAU</span>
            <div className="flex-1 border-t border-[#e2e7ff]" />
          </div>

          {/* ── Login Cepat Akun Demo (Supabase) ── */}
          <div>
            <div className="mb-4">
              <h2 className="font-bold text-base">
                Login Cepat Akun Demo
              </h2>
              <p className="text-xs text-[#737781] mt-1">
                Masuk langsung ke database untuk mencoba fitur sesuai peran.
              </p>
            </div>

            <div className="space-y-3">
              {QUICK_SUPABASE_ACCOUNTS.map((acc) => {
                const isThisLoading = quickLoadingEmail === acc.email;

                return (
                  <div
                    key={acc.email}
                    className="border border-[#e2e7ff] rounded-xl p-4 hover:border-[#003466]/40 hover:bg-[#f8faff] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 bg-[#edf3fa] rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#003466]">
                          {acc.isAdmin ? "admin_panel_settings" : "person"}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-bold text-sm">{acc.nama}</p>

                          <span
                            className={`text-[10px] font-semibold px-2 py-1 rounded-full ${acc.isAdmin
                                ? "bg-purple-50 text-purple-700"
                                : "bg-blue-50 text-blue-700"
                              }`}
                          >
                            {acc.label}
                          </span>
                        </div>

                        <p className="text-xs text-[#737781] mt-1 break-all">
                          {acc.email}
                        </p>

                        <button
                          type="button"
                          disabled={isAnyLoading}
                          onClick={() =>
                            handleQuickSupabaseLogin(acc.email, acc.password)
                          }
                          className="mt-3 text-xs font-bold text-[#003466] hover:text-[#1a4b84] disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isThisLoading
                            ? "Sedang masuk..."
                            : `Masuk sebagai ${acc.isAdmin ? "Admin" : "User"} →`}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Dropdown Akun Demo Lokal (Mock Data) ── */}
          <div className="mt-6 border border-[#e2e7ff] rounded-xl overflow-hidden bg-[#f8faff]">
            <button
              type="button"
              onClick={() => setShowLocalDemo((prev) => !prev)}
              aria-expanded={showLocalDemo}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#eef3fc] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#737781]">
                  storage
                </span>
                <span className="text-xs font-semibold text-[#424750]">
                  Akun Demo Lokal (Offline / Mock Data)
                </span>
              </div>
              <span className="material-symbols-outlined text-[20px] text-[#737781]">
                {showLocalDemo ? "expand_less" : "expand_more"}
              </span>
            </button>

            {showLocalDemo && (
              <div className="px-4 pb-4 pt-2 border-t border-[#e2e7ff] bg-white space-y-2.5">
                <p className="text-[11px] text-[#737781] leading-relaxed">
                  Mode simulasi lokal tanpa koneksi database. Perubahan data hanya tersimpan sementara di browser.
                </p>

                {DEMO_USERS.map((user) => {
                  const isAdmin = user.role === "admin";

                  return (
                    <div
                      key={user.id}
                      className="border border-[#e2e7ff] rounded-lg p-3 flex items-center justify-between gap-3 hover:bg-[#f8faff] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs truncate">{user.nama}</p>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isAdmin
                                ? "bg-purple-50 text-purple-700"
                                : "bg-blue-50 text-blue-700"
                              }`}
                          >
                            {isAdmin ? "Admin" : "Penyewa"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#737781] truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={isAnyLoading}
                        onClick={() => handleDemoLogin(user.id)}
                        className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#edf3fa] hover:bg-[#dce7f5] text-[11px] font-bold text-[#003466] transition-colors cursor-pointer"
                      >
                        Masuk →
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#737781] mt-5">
          Ngelapak · Universitas Udayana
        </p>
      </div>
    </div>
  );
}
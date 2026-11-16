
"use client";

import { useState, type FormEvent } from "react";
import { signUpWithEmail } from "@/lib/supabase/auth";

interface DaftarViewProps {
  onNavigateToLogin: () => void;
}

export default function DaftarView({
  onNavigateToLogin,
}: DaftarViewProps) {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (nama.trim().length < 2) {
      setError("Nama harus terdiri dari minimal 2 karakter.");
      return;
    }

    if (password.length < 8) {
      setError("Password harus terdiri dari minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);

    try {
      const result = await signUpWithEmail({
        nama,
        email,
        password,
      });

      if (result.needsEmailConfirmation) {
        setSuccess(
          "Registrasi berhasil! Silakan periksa email Anda untuk melakukan konfirmasi akun sebelum masuk."
        );
      } else {
        setSuccess(
          "Registrasi berhasil! Akun Anda sudah dibuat. Silakan lanjut ke halaman masuk."
        );
      }

      setNama("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat melakukan registrasi."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-128px)] flex items-center justify-center px-4 py-10 pb-24">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#e2e7ff] rounded-2xl shadow-sm p-6 sm:p-8">
          {/* HEADER */}
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
              Buat Akun
            </h1>

            <p className="text-sm text-[#737781] mt-2">
              Daftarkan akun Anda untuk mulai menggunakan Ngelapak.
            </p>
          </div>

          {/* REGISTER FORM */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-semibold mb-2"
              >
                Nama Lengkap
              </label>

              <input
                id="nama"
                type="text"
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                autoComplete="name"
                className="w-full border border-[#dce1eb] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Masukkan email aktif"
                required
                autoComplete="email"
                className="w-full border border-[#dce1eb] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full border border-[#dce1eb] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold mb-2"
              >
                Konfirmasi Password
              </label>

              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Ulangi password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full border border-[#dce1eb] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#424750] cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) =>
                  setShowPassword(event.target.checked)
                }
                className="accent-[#003466]"
              />
              Tampilkan password
            </label>

            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#003466] hover:bg-[#1a4b84] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl py-3 font-semibold text-sm transition-colors"
            >
              {loading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-[#737781]">
              Sudah memiliki akun?{" "}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-[#003466] hover:underline"
              >
                Masuk
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#737781] mt-5">
          Ngelapak · Universitas Udayana
        </p>
      </div>
    </div>
  );
}

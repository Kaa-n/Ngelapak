"use client";

import { useState, type FormEvent } from "react";
import type { DemoUser, ToastMessage } from "@/lib/types";
import { updateDemoProfile } from "@/lib/demo-store";
import {
  updateCurrentSupabaseProfile,
  type SupabaseProfile,
} from "@/lib/supabase/auth";

interface EditProfileViewProps {
  user: DemoUser | SupabaseProfile;
  onBack: () => void;
  onShowToast: (toast: Omit<ToastMessage, "id">) => void;
  onProfileUpdated?: (profile: SupabaseProfile) => void;
}

export default function EditProfileView({
  user,
  onBack,
  onShowToast,
  onProfileUpdated,
}: EditProfileViewProps) {
  const [nama, setNama] = useState(user.nama);
  const [email, setEmail] = useState(user.email);
  const [nim, setNim] = useState(user.nim ?? "");
  const [fakultas, setFakultas] = useState(user.fakultas ?? "");
  const [telepon, setTelepon] = useState(user.telepon ?? "");
  const [loading, setLoading] = useState(false);

  const isDemoUser = user.id === "ayu" || user.id === "bayu" || user.id === "admin";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  try {
    setLoading(true);

    if (isDemoUser) {
      updateDemoProfile({
        nama,
        email: user.email,
        nim,
        fakultas,
        telepon,
      });

    } else {
      const updatedProfile = await updateCurrentSupabaseProfile({
        nama,
        nim,
        fakultas,
        telepon,
      });

      onProfileUpdated?.(updatedProfile);
    }

    onShowToast({
      type: "success",
      message: "Profil berhasil diperbarui",
      description: "Informasi profil kamu sudah berhasil disimpan.",
    });
  } catch (error) {
    onShowToast({
      type: "error",
      message: "Gagal memperbarui profil",
      description:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan profil.",
    });
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-24">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#003466] hover:underline mb-6"
      >
        <span className="material-symbols-outlined text-lg">
          arrow_back
        </span>
        Kembali
      </button>

      <div className="mb-8">
        <p className="text-sm font-semibold text-[#855300] mb-2">
          Pengaturan Akun
        </p>
        <h1 className="text-3xl font-bold text-[#003466]">
          Edit Profile
        </h1>
        <p className="text-[#737781] mt-2">
          Perbarui informasi profil yang digunakan pada akun Ngelapak.
        </p>
      </div>

      <div className="bg-white border border-[#e2e7ff] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-[#e2e7ff]">
          <div className="w-14 h-14 rounded-full bg-[#eaf0ff] flex items-center justify-center text-[#003466]">
            <span className="material-symbols-outlined text-3xl">
              person
            </span>
          </div>

          <div>
            <p className="font-bold text-[#172033]">{user.nama}</p>
            <p className="text-sm text-[#737781]">
              {user.role === "admin" ? "Admin" : "Penyewa"} ·{" "}
              {isDemoUser ? "Akun Demo" : "Akun Terdaftar"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          <div>
            <label
              htmlFor="profile-name"
              className="block text-sm font-semibold text-[#172033] mb-2"
            >
              Nama Lengkap
            </label>
            <input
              id="profile-name"
              type="text"
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              required
              maxLength={100}
              placeholder="Masukkan nama lengkap"
              className="w-full border border-[#d8deeb] rounded-xl px-4 py-3 outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="block text-sm font-semibold text-[#172033] mb-2"
            >
              Alamat Email
            </label>
           <input
              id="profile-email"
              type="email"
              value={email}
              readOnly
              className="w-full border border-[#d8deeb] rounded-xl px-4 py-3 bg-[#f4f6ff] text-[#737781] cursor-not-allowed outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="profile-nim"
              className="block text-sm font-semibold text-[#172033] mb-2"
            >
              NIM / NIK
            </label>
            <input
              id="profile-nim"
              type="text"
              value={nim}
              onChange={(event) => setNim(event.target.value)}
              required
              maxLength={30}
              placeholder="Masukkan NIM atau NIK"
              className="w-full border border-[#d8deeb] rounded-xl px-4 py-3 outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
            />
          </div>

          <div>
            <label
              htmlFor="profile-fakultas"
              className="block text-sm font-semibold text-[#172033] mb-2"
            >
              Instansi
            </label>
            <input
              id="profile-fakultas"
              type="text"
              value={fakultas}
              onChange={(event) => setFakultas(event.target.value)}
              required
              maxLength={100}
              placeholder="Masukkan instansi"
              className="w-full border border-[#d8deeb] rounded-xl px-4 py-3 outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
            />
          </div>

          <div>
            <label
              htmlFor="profile-telepon"
              className="block text-sm font-semibold text-[#172033] mb-2"
            >
              Nomor Telepon / WhatsApp
            </label>
            <input
              id="profile-telepon"
              type="tel"
              value={telepon}
              onChange={(event) => setTelepon(event.target.value)}
              required
              maxLength={20}
              placeholder="Contoh: 081234567890"
              className="w-full border border-[#d8deeb] rounded-xl px-4 py-3 outline-none focus:border-[#003466] focus:ring-2 focus:ring-[#003466]/10"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-3 rounded-xl border border-[#d8deeb] text-[#424750] font-semibold hover:bg-[#f4f6ff]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-[#003466] text-white font-semibold hover:bg-[#1a4b84] disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

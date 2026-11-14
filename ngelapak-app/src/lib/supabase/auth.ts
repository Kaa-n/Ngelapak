
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

// Struktur profil pengguna Supabase.
// Dibuat agar atributnya konsisten dengan DemoUser.
export interface SupabaseProfile {
  id: string;
  nama: string;
  email: string;
  role: Role;
  nim: string | null;
  fakultas: string | null;
  telepon: string | null;
}

// Mengambil profil berdasarkan ID akun Supabase Auth.
export async function getSupabaseProfile(
  userId: string
): Promise<SupabaseProfile> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nama, email, role, nim, fakultas, telepon")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(
      `Gagal mengambil profil pengguna: ${error.message}`
    );
  }

  if (data.role !== "admin" && data.role !== "penyewa") {
    throw new Error("Role pengguna tidak valid.");
  }

  return {
    id: data.id,
    nama: data.nama,
    email: data.email,
    role: data.role,
    nim: data.nim,
    fakultas: data.fakultas,
    telepon: data.telepon,
  };
}

// Login pengguna biasa menggunakan Supabase Auth.
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SupabaseProfile> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  return getSupabaseProfile(data.user.id);
}

// Registrasi pengguna baru.
export async function signUpWithEmail(input: {
  nama: string;
  email: string;
  password: string;
}) {
  const supabase = createClient();

  const nama = input.nama.trim();
  const email = input.email.trim().toLowerCase();

  if (!nama || !email || !input.password) {
    throw new Error("Nama, email, dan password wajib diisi.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        nama,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Registrasi gagal membuat akun.");
  }

  return {
    user: data.user,
    session: data.session,
    needsEmailConfirmation: !data.session,
  };
}

// Mengambil profil pengguna yang sedang login.
export async function getCurrentSupabaseProfile() {
  const supabase = createClient();

  const { data, error } = await supabase.auth.getUser();

  // Jika belum login (Auth session missing) atau tidak ada user, kembalikan null (bukan lempar error)
  if (error || !data?.user) {
    return null;
  }

  return getSupabaseProfile(data.user.id);
}

// Logout pengguna Supabase.
export async function signOutSupabase() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

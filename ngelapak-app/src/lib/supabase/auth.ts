import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

// Struktur profil pengguna Supabase.
// Dibuat agar atributnya konsisten dengan DemoUser.
export interface SupabaseProfile {
  id: string;
  nama: string;
  email: string;
  role: Role;
}

// Mengambil profil berdasarkan ID akun Supabase Auth.
export async function getSupabaseProfile(
  userId: string
): Promise<SupabaseProfile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nama, email, role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.role !== "admin" && data.role !== "penyewa") {
    return null;
  }

  return {
    id: data.id,
    nama: data.nama,
    email: data.email,
    role: data.role,
  };
}

// Login pengguna biasa menggunakan Supabase Auth.
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SupabaseProfile> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error("Kredensial Supabase belum dikonfigurasi di Environment Variables.");
  }

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

  const profile = await getSupabaseProfile(data.user.id);
  if (!profile) {
    throw new Error("Profil pengguna tidak ditemukan di database.");
  }

  return profile;
}

// Registrasi pengguna baru.
export async function signUpWithEmail(input: {
  nama: string;
  email: string;
  password: string;
}) {
  const supabase = createClient();
  if (!supabase) {
    throw new Error("Kredensial Supabase belum dikonfigurasi di Environment Variables.");
  }

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
  if (!supabase) {
    return null;
  }

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
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

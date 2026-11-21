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
): Promise<SupabaseProfile | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nama, email, role, nim, fakultas, telepon")
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
      emailRedirectTo: new URL("/auth/callback", window.location.origin).href,
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

// Kirim email reset password ke alamat email yang diberikan.
export async function resetPasswordForEmail(email: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Koneksi Supabase belum dikonfigurasi.");
  const redirectTo = typeof window !== "undefined"
    ? new URL("/masuk?konfirmasi=reset", window.location.origin).href
    : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
  if (error) throw new Error(error.message);
}

// Ubah email pengguna yang sedang login.
export async function updateEmail(newEmail: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Koneksi Supabase belum dikonfigurasi.");
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
  if (error) throw new Error(error.message);
}

// Ubah password pengguna yang sedang login.
export async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
  const supabase = createClient();
  if (!supabase) throw new Error("Koneksi Supabase belum dikonfigurasi.");
  // Verifikasi password lama dengan re-login
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) throw new Error("Sesi login tidak ditemukan.");
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  });
  if (signInError) throw new Error("Password lama tidak sesuai.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

// Memperbarui data profil pengguna yang sedang login.
export async function updateCurrentSupabaseProfile(input: {
  nama: string;
  nim: string;
  fakultas: string;
  telepon: string;
}): Promise<SupabaseProfile> {
  const supabase = createClient();

  if (!supabase) {
    throw new Error("Koneksi Supabase belum dikonfigurasi.");
  }

  // Mengambil identitas pengguna dari sesi Supabase.
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  const nama = input.nama.trim();
  const nim = input.nim.trim();
  const fakultas = input.fakultas.trim();
  const telepon = input.telepon.trim();

  if (!nama || !nim || !fakultas || !telepon) {
    throw new Error("Semua data profil wajib diisi.");
  }

  // Update hanya berdasarkan ID akun yang sedang login.
  const { data, error } = await supabase
    .from("profiles")
    .update({
      nama,
      nim,
      fakultas,
      telepon,
      updated_at: new Date().toISOString(),
    })
    .eq("id", authData.user.id)
    .select("id, nama, email, role, nim, fakultas, telepon")
    .single();

  if (error) {
    throw new Error(error.message);
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

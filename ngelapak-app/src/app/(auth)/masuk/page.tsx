"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import MasukView from "@/components/views/MasukView";
import { demoLogin, demoLogout } from "@/lib/demo-store";
import { signOutSupabase } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  return (
    <>
      <Link href="/" className="inline-block px-6 pt-5 text-sm font-semibold text-[#003466]">← Beranda</Link>
      <MasukView
        onLoginDemo={async (id) => {
          await signOutSupabase();
          demoLogin(id);
          router.replace("/");
        }}
        onLoginSupabase={(user) => {
          demoLogout();
          router.replace(user.role === "admin" ? "/admin" : "/");
        }}
        onNavigateToRegister={() => router.push("/daftar")}
      />
    </>
  );
}

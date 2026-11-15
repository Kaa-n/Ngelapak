"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MasukView from "@/components/views/MasukView";
import { demoLogin, demoLogout } from "@/lib/demo-store";
import { signOutSupabase } from "@/lib/supabase/auth";

export default function LoginPage() {
  const router = useRouter();
  return (
    <>
      <Link href="/" className="inline-block px-6 pt-5 text-sm font-semibold text-[#003466]">← Beranda</Link>
      <Suspense fallback={null}><ConfirmationFeedback /></Suspense>
      <MasukView
        onLoginDemo={async (id) => {
          if (id === "admin") {
            demoLogin(id);
            router.replace("/demo/admin");
            return;
          }
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

function ConfirmationFeedback() {
  const searchParams = useSearchParams();
  if (searchParams.get("konfirmasi") !== "gagal") return null;
  return (
    <p role="alert" className="mx-auto mt-4 max-w-md px-4 text-sm text-red-700">
      Tautan konfirmasi tidak dapat dipakai. Buka tautan terbaru dari email pendaftaran di browser yang sama, lalu coba masuk.
    </p>
  );
}

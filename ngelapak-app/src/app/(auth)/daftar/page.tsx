"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import DaftarView from "@/components/views/DaftarView";

export default function RegistrationPage() {
  const router = useRouter();
  return (
    <>
      <Link href="/" className="inline-block px-6 pt-5 text-sm font-semibold text-[#003466]">← Beranda</Link>
      <DaftarView onNavigateToLogin={() => router.push("/masuk")} />
    </>
  );
}

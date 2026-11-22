import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./server";

export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/masuk");

  const { data, error } = await supabase
    .from("profiles").select("nama, role").eq("id", user.id).maybeSingle();
  if (error) throw new Error("Gagal memeriksa izin admin.");
  if (data?.role !== "admin") redirect("/");

  return { supabase, name: data.nama, email: user.email ?? "" };
});

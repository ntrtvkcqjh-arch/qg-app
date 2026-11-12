"use server";

import { revalidatePath } from "next/cache";
import { requireUser, UUID_RE } from "@/lib/auth";

export async function marquerAnnulee(fd: FormData) {
  const { supabase } = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!UUID_RE.test(id)) return;
  const annulee = fd.get("annulee") === "true";
  await supabase.from("decisions").update({ annulee }).eq("id", id);
  revalidatePath("/decisions");
}

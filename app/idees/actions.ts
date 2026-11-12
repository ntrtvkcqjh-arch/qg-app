"use server";

import { revalidatePath } from "next/cache";
import { requireUser, UUID_RE } from "@/lib/auth";

export async function ajouterIdee(fd: FormData) {
  const { supabase } = await requireUser();
  const texte = String(fd.get("texte") ?? "").trim().slice(0, 2000);
  if (!texte) return;
  await supabase.from("idees").insert({ texte });
  revalidatePath("/idees");
}

const STATUTS = ["nouvelle", "retenue", "ecartee"];

export async function changerStatutIdee(fd: FormData) {
  const { supabase } = await requireUser();
  const id = String(fd.get("id") ?? "");
  const statut = String(fd.get("statut") ?? "");
  if (!UUID_RE.test(id) || !STATUTS.includes(statut)) return;
  await supabase.from("idees").update({ statut }).eq("id", id);
  revalidatePath("/idees");
}

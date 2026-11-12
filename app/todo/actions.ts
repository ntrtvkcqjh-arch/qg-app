"use server";

import { revalidatePath } from "next/cache";
import { requireUser, UUID_RE } from "@/lib/auth";

function idValide(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  return UUID_RE.test(id) ? id : null;
}

export async function ajouterTodo(fd: FormData) {
  const { supabase } = await requireUser();
  const texte = String(fd.get("texte") ?? "").trim().slice(0, 500);
  const priorite = Number(fd.get("priorite") ?? 2);
  if (!texte || ![1, 2, 3].includes(priorite)) return;
  await supabase.from("todos").insert({ texte, priorite });
  revalidatePath("/todo");
}

export async function basculerTodo(fd: FormData) {
  const { supabase } = await requireUser();
  const id = idValide(fd);
  if (!id) return;
  await supabase.from("todos").update({ fait: fd.get("fait") !== "true" }).eq("id", id);
  revalidatePath("/todo");
}

export async function changerPriorite(fd: FormData) {
  const { supabase } = await requireUser();
  const id = idValide(fd);
  const actuelle = Number(fd.get("priorite"));
  if (!id || ![1, 2, 3].includes(actuelle)) return;
  await supabase.from("todos").update({ priorite: (actuelle % 3) + 1 }).eq("id", id);
  revalidatePath("/todo");
}

export async function supprimerTodo(fd: FormData) {
  const { supabase } = await requireUser();
  const id = idValide(fd);
  if (!id) return;
  await supabase.from("todos").delete().eq("id", id);
  revalidatePath("/todo");
}

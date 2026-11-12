"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatConnexion = { erreur?: string };

/** Connexion par e-mail + mot de passe choisi par Marjana. */
export async function seConnecter(_prev: EtatConnexion, formData: FormData): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { erreur: "Renseigne ton e-mail et ton mot de passe." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) return { erreur: "Trop de tentatives. Patiente quelques minutes." };
    // Message volontairement vague : on ne dit pas si l'adresse existe.
    return { erreur: "E-mail ou mot de passe incorrect." };
  }
  redirect("/");
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

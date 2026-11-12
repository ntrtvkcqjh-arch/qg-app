"use server";

import { requireUser } from "@/lib/auth";

export type EtatMotDePasse = { ok?: boolean; erreur?: string };

const LONGUEUR_MIN = 10;

export async function changerMotDePasse(_prev: EtatMotDePasse, fd: FormData): Promise<EtatMotDePasse> {
  const { supabase } = await requireUser(); // seulement connectée
  const mdp = String(fd.get("mdp") ?? "");
  const confirmation = String(fd.get("confirmation") ?? "");

  if (mdp.length < LONGUEUR_MIN) return { erreur: `Au moins ${LONGUEUR_MIN} caractères.` };
  if (mdp !== confirmation) return { erreur: "Les deux saisies ne correspondent pas." };

  const { error } = await supabase.auth.updateUser({ password: mdp });
  if (error) {
    if (error.code === "same_password") return { erreur: "C'est déjà ton mot de passe actuel." };
    if (error.code === "weak_password") return { erreur: "Mot de passe jugé trop faible : allonge-le." };
    return { erreur: "Enregistrement impossible. Réessaie." };
  }
  return { ok: true };
}

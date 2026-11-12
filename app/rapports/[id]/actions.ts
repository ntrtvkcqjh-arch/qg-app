"use server";

import { revalidatePath } from "next/cache";
import { requireUser, UUID_RE } from "@/lib/auth";

export type EtatRetour = { ok?: boolean; valeur?: string; erreur?: string };

const VALEURS = ["utile", "bof", "inutile"] as const;

export async function enregistrerRetour(
  _prev: EtatRetour,
  formData: FormData,
): Promise<EtatRetour> {
  const { supabase } = await requireUser();
  const rapportId = String(formData.get("rapport_id") ?? "");
  const valeur = String(formData.get("valeur") ?? "");
  const commentaire = String(formData.get("commentaire") ?? "").trim().slice(0, 2000) || null;

  if (!UUID_RE.test(rapportId) || !VALEURS.includes(valeur as (typeof VALEURS)[number])) {
    return { erreur: "Retour invalide." };
  }

  const { error } = await supabase
    .from("retours")
    .insert({ rapport_id: rapportId, valeur, commentaire });
  if (error) return { erreur: "Enregistrement impossible." };

  revalidatePath(`/rapports/${rapportId}`);
  return { ok: true, valeur };
}

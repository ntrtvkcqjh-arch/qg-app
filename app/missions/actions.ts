"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { collecterTout } from "@/lib/missions/collecter";
import { lancerMission } from "@/lib/missions/lancer";

export type EtatMission = { message?: string; erreur?: string };

export async function lancerManuellement(_prev: EtatMission, fd: FormData): Promise<EtatMission> {
  await requireUser(); // Marjana uniquement
  const mission = fd.get("mission");
  if (mission !== "journal" && mission !== "recap" && mission !== "style") return { erreur: "Mission inconnue." };

  const r = await lancerMission(mission);
  revalidatePath("/missions");
  revalidatePath("/");
  if (r.statut === "lance") return { message: "Mission lancée. Compte 10 à 30 minutes ; actualise pour suivre." };
  if (r.statut === "deja_fait") return { message: "Déjà en cours ou publiée aujourd'hui." };
  return { erreur: `Lancement impossible : ${r.message}` };
}

export async function actualiser() {
  await requireUser();
  await collecterTout();
  revalidatePath("/missions");
  revalidatePath("/");
}

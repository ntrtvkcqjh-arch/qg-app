import type { Activite } from "@/lib/types";

export const LIBELLE_ACTIVITE: Record<Activite, string> = {
  absent: "Absent",
  travaille: "Au bureau",
  reunion: "En réunion",
  pause: "En pause",
  formation: "En formation",
  archives: "Aux archives",
  accueil: "À l'accueil",
  conge: "En congés",
  malade: "Malade",
  teletravail: "Télétravail",
};

export const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

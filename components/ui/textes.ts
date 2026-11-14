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
  dejeuner: "Au repas",
  sport: "À la salle de sport",
  evacuation: "Évacuation !",
};

export const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

const POSTE_SERVICE: Record<string, string> = { accueil: "À l'accueil", cuisine: "En cuisine", pressing: "Au pressing", coach: "À la salle de sport", menage: "En tournée de ménage", it: "En salle IT", office: "À l'accueil" };

/** Statut affiché : les services du campus sont « à leur poste » (accueil, cuisine…), pas « au bureau ». */
export function statutAgent(a: { activite: keyof typeof LIBELLE_ACTIVITE; filiere: string; service?: string }) {
  if (a.filiere === "service" && a.activite === "travaille") return POSTE_SERVICE[a.service ?? "office"] ?? "À son poste";
  if (a.filiere === "rh" && a.activite === "travaille") return "Au bureau RH";
  return LIBELLE_ACTIVITE[a.activite];
}

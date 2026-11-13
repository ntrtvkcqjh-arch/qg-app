import type { PieceId } from "@/lib/types";

// Niveaux de locaux : on agrandit le cabinet au fil de la croissance.

export type NiveauLocaux = {
  niveau: number;
  nom: string;
  pieces: PieceId[];
  postes: number; // nombre de bureaux dans l'open space
  loyer: number;
  travaux: number; // coût pour atteindre ce niveau
  description: string;
};

export const LOCAUX: NiveauLocaux[] = [
  { niveau: 1, nom: "Petit local", pieces: ["associee", "openspace", "accueil"], postes: 4, loyer: 1200, travaux: 0, description: "Ton bureau, un petit open space de 4 postes et un accueil." },
  { niveau: 2, nom: "Plateau", pieces: ["associee", "openspace", "accueil", "cafe", "archives"], postes: 7, loyer: 2200, travaux: 6000, description: "Cafétéria (pauses plus efficaces) et archives. 7 postes." },
  { niveau: 3, nom: "Cabinet complet", pieces: ["associee", "openspace", "accueil", "cafe", "archives", "reunion", "formation"], postes: 10, loyer: 3500, travaux: 14000, description: "Salle de réunion et salle de formation. 10 postes." },
  { niveau: 4, nom: "Cabinet premium", pieces: ["associee", "openspace", "accueil", "cafe", "archives", "reunion", "formation"], postes: 10, loyer: 4500, travaux: 25000, description: "Rénovation haut de gamme : moral et réputation en hausse, clients plus généreux." },
];

/** Ordre dans lequel les bureaux de l'open space sont ouverts. */
export const ORDRE_POSTES = [0, 1, 2, 3, 5, 6, 7, 4, 8, 9];

export const niveauLocaux = (n: number) => LOCAUX[Math.max(0, Math.min(LOCAUX.length - 1, n - 1))];

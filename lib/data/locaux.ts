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
  { niveau: 1, nom: "Petit local", pieces: ["accueil", "cafe", "openspace", "bulle1", "associee"], postes: 10, loyer: 1200, travaux: 0, description: "Accueil, cafétéria, le pôle Expertise et ton bureau." },
  { niveau: 2, nom: "Plateau", pieces: ["accueil", "cafe", "openspace", "bulle1", "associee", "os_fiscal", "bulle2", "reunion", "archives"], postes: 20, loyer: 2400, travaux: 6000, description: "Pôle Fiscal, salle de réunion, archives et une deuxième bulle." },
  { niveau: 3, nom: "Cabinet complet", pieces: ["accueil", "cafe", "openspace", "bulle1", "associee", "os_fiscal", "bulle2", "reunion", "archives", "os_social", "os_juridique", "bulle3", "reunion2", "formation", "bur_expertise", "bur_fiscal"], postes: 28, loyer: 3800, travaux: 14000, description: "Pôles Social et Juridique, grande salle, formation et bureaux des associés Expertise et Fiscal." },
  { niveau: 4, nom: "Campus services", pieces: ["accueil", "cafe", "openspace", "bulle1", "associee", "os_fiscal", "bulle2", "reunion", "archives", "os_social", "os_juridique", "bulle3", "reunion2", "formation", "bur_expertise", "bur_fiscal", "pressing", "sport", "detente", "terrasse"], postes: 28, loyer: 5000, travaux: 25000, description: "Pressing, salle de sport, espace détente et terrasse sur le toit : moral et attractivité en hausse." },
  { niveau: 5, nom: "Campus des pôles", pieces: ["accueil", "cafe", "openspace", "bulle1", "associee", "os_fiscal", "bulle2", "reunion", "archives", "os_social", "os_juridique", "bulle3", "reunion2", "formation", "bur_expertise", "bur_fiscal", "pressing", "sport", "detente", "terrasse", "annexe", "bur_social", "bur_juridique", "bur_audit", "rh"], postes: 34, loyer: 6800, travaux: 40000, description: "Pôle Audit, bureaux des associés Social, Juridique et Audit, bureau RH." },
  { niveau: 6, nom: "Campus complet", pieces: ["accueil", "cafe", "openspace", "bulle1", "associee", "os_fiscal", "bulle2", "reunion", "archives", "os_social", "os_juridique", "bulle3", "reunion2", "formation", "bur_expertise", "bur_fiscal", "pressing", "sport", "detente", "terrasse", "annexe", "bur_social", "bur_juridique", "bur_audit", "rh", "it", "conseil"], postes: 34, loyer: 8500, travaux: 60000, description: "Salle IT et salle du conseil : le campus est complet." },
];

/** Ordre dans lequel les bureaux de l'open space sont ouverts. */
export const ORDRE_POSTES = Array.from({ length: 40 }, (_, i) => i);

export const niveauLocaux = (n: number) => LOCAUX[Math.max(0, Math.min(LOCAUX.length - 1, n - 1))];

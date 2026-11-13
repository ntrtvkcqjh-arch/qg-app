import type { Activite, Filiere, PieceId } from "@/lib/types";

// Plan du campus : 4 étages de même emprise (x de -12 à 12, z de -8 à 8).
// Rangée du fond (z -8 à -2), couloir (z = -1), rangée de devant (z 0 à 8).
// L'ascenseur est au même endroit à chaque étage (x 4 à 6, au fond).

export type Piece = {
  id: PieceId;
  nom: string;
  etage: number;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  sol: string;
  porte: number; // x de la porte côté couloir
  description: string;
  vitre?: boolean; // cloisons vitrées (bureaux, bulles)
};

export const COULOIR_Z = -1;
export const ASCENSEUR = { x: 5, z: -3.2, porte: 5 };
export const ETAGES = ["Rez-de-chaussée", "1er étage : Expertise & Fiscal", "2e étage : Social, Juridique & Audit", "3e étage : Direction"];

export const PIECES: Piece[] = [
  // Rez-de-chaussée : accueil et services
  { id: "pressing", nom: "Pressing & conciergerie", etage: 0, x0: -12, x1: -8, z0: -8, z1: -2, sol: "#e3e8ee", porte: -10, description: "Le pressing et la conciergerie font gagner du temps à l'équipe." },
  { id: "archives", nom: "Archives", etage: 0, x0: -8, x1: -4, z0: -8, z1: -2, sol: "#cfc6b8", porte: -6, description: "Dossiers permanents et pièces justificatives (phase Collecte)." },
  { id: "sport", nom: "Salle de sport", etage: 0, x0: -4, x1: 4, z0: -8, z1: -2, sol: "#90a4ae", porte: 0, description: "Tapis de course, vélos, poids : le stress retombe." },
  { id: "detente", nom: "Espace détente", etage: 0, x0: 6, x1: 12, z0: -8, z1: -2, sol: "#c8e6c9", porte: 9, description: "Sieste, jeux, phone box : la fatigue retombe plus vite." },
  { id: "accueil", nom: "Accueil", etage: 0, x0: -12, x1: -3, z0: 0, z1: 8, sol: "#e8dcc8", porte: -7.5, description: "Hôtes et hôtesses d'accueil reçoivent clients et prospects." },
  { id: "cafe", nom: "Cafétéria", etage: 0, x0: -3, x1: 12, z0: 0, z1: 8, sol: "#e6e1d6", porte: 4.5, description: "Petit-déjeuner de 8 h à 9 h 30, déjeuner de 12 h à 14 h." },
  // 1er étage : pôles Expertise et Fiscal
  { id: "bur_expertise", nom: "Associé Expertise", etage: 1, x0: -12, x1: -8, z0: -8, z1: -2, sol: "#a47551", porte: -10, description: "Bureau vitré de l'associé du pôle Expertise.", vitre: true },
  { id: "bulle1", nom: "Bulle de réunion", etage: 1, x0: -8, x1: -5, z0: -8, z1: -2, sol: "#d7e3f4", porte: -6.5, description: "Points rapides à 2 ou 4.", vitre: true },
  { id: "reunion", nom: "Salle de réunion", etage: 1, x0: -5, x1: 4, z0: -8, z1: -2, sol: "#d9cbb5", porte: -0.5, description: "Réunions d'équipe et rendez-vous clients." },
  { id: "bur_fiscal", nom: "Associé Fiscal", etage: 1, x0: 6, x1: 9, z0: -8, z1: -2, sol: "#a47551", porte: 7.5, description: "Bureau vitré de l'associé du pôle Fiscal.", vitre: true },
  { id: "bulle2", nom: "Bulle de réunion", etage: 1, x0: 9, x1: 12, z0: -8, z1: -2, sol: "#d7e3f4", porte: 10.5, description: "Points rapides à 2 ou 4.", vitre: true },
  { id: "openspace", nom: "Pôle Expertise", etage: 1, x0: -12, x1: 0, z0: 0, z1: 8, sol: "#9fb4d8", porte: -6, description: "Bilans, révision, clôtures." },
  { id: "os_fiscal", nom: "Pôle Fiscal", etage: 1, x0: 0, x1: 12, z0: 0, z1: 8, sol: "#e8c99b", porte: 6, description: "TVA, IS, liasses." },
  // 2e étage : pôles Social, Juridique, Audit
  { id: "bur_social", nom: "Associé Social", etage: 2, x0: -12, x1: -9, z0: -8, z1: -2, sol: "#a47551", porte: -10.5, description: "Bureau vitré de l'associé du pôle Social.", vitre: true },
  { id: "bulle3", nom: "Bulle de réunion", etage: 2, x0: -9, x1: -6, z0: -8, z1: -2, sol: "#d7e3f4", porte: -7.5, description: "Points rapides à 2 ou 4.", vitre: true },
  { id: "reunion2", nom: "Grande salle de réunion", etage: 2, x0: -6, x1: 4, z0: -8, z1: -2, sol: "#d9cbb5", porte: -1, description: "Réunions de pôle et comités." },
  { id: "bur_juridique", nom: "Associé Juridique", etage: 2, x0: 6, x1: 9, z0: -8, z1: -2, sol: "#a47551", porte: 7.5, description: "Bureau vitré de l'associé du pôle Juridique.", vitre: true },
  { id: "bur_audit", nom: "Associé Audit", etage: 2, x0: 9, x1: 12, z0: -8, z1: -2, sol: "#a47551", porte: 10.5, description: "Bureau vitré de l'associé du pôle Audit.", vitre: true },
  { id: "os_social", nom: "Pôle Social / Paie", etage: 2, x0: -12, x1: -4, z0: 0, z1: 8, sol: "#a8dccf", porte: -8, description: "Paie, DSN, contrats." },
  { id: "os_juridique", nom: "Pôle Juridique", etage: 2, x0: -4, x1: 4, z0: 0, z1: 8, sol: "#cdb8e0", porte: 0, description: "AG, statuts, formalités." },
  { id: "annexe", nom: "Pôle Audit", etage: 2, x0: 4, x1: 12, z0: 0, z1: 8, sol: "#e8b0b0", porte: 8, description: "Missions d'audit et de commissariat aux comptes." },
  // 3e étage : direction
  { id: "associee", nom: "Ton bureau", etage: 3, x0: -12, x1: -5, z0: -8, z1: -2, sol: "#b98b5e", porte: -8.5, description: "Messagerie, validations, décisions." },
  { id: "conseil", nom: "Salle du conseil", etage: 3, x0: -5, x1: 4, z0: -8, z1: -2, sol: "#8d6e63", porte: -0.5, description: "Comités d'associés et grandes décisions." },
  { id: "it", nom: "Salle IT", etage: 3, x0: 6, x1: 9, z0: -8, z1: -2, sol: "#b0bec5", porte: 7.5, description: "Serveurs et cybersécurité." },
  { id: "rh", nom: "Bureau RH", etage: 3, x0: 9, x1: 12, z0: -8, z1: -2, sol: "#e1bee7", porte: 10.5, description: "Recrutements et suivi du personnel." },
  { id: "formation", nom: "Salle de formation", etage: 3, x0: -12, x1: -2, z0: 0, z1: 8, sol: "#c9d6e3", porte: -7, description: "Formations des équipes, QCM et oral blanc." },
  { id: "terrasse", nom: "Terrasse & micro-cuisine", etage: 3, x0: -2, x1: 12, z0: 0, z1: 8, sol: "#b08d63", porte: 5, description: "Rooftop : transats, plantes et micro-cuisine." },
];

export const pieceParId = (id: PieceId) => PIECES.find((p) => p.id === id);
export const etageDe = (id: PieceId) => (id === "dehors" ? 0 : (pieceParId(id)?.etage ?? 0));

/** Open space de chaque pôle. */
export const OPEN_SPACE: Partial<Record<Filiere, PieceId>> = {
  expertise: "openspace",
  fiscal: "os_fiscal",
  social: "os_social",
  juridique: "os_juridique",
  audit: "annexe",
};
/** Bureau de l'associé de chaque pôle. */
export const BUREAU_ASSOCIE: Partial<Record<Filiere, PieceId>> = {
  expertise: "bur_expertise",
  fiscal: "bur_fiscal",
  social: "bur_social",
  juridique: "bur_juridique",
  audit: "bur_audit",
};
/** Bulle de réunion la plus proche de chaque open space. */
export const BULLE_DE: Partial<Record<PieceId, PieceId>> = {
  openspace: "bulle1",
  os_fiscal: "bulle2",
  os_social: "bulle3",
  os_juridique: "bulle3",
  annexe: "reunion2",
};

export type Poste = { x: number; z: number; rot: number; piece: PieceId };

/** Postes de travail : deux rangées de bureaux face à face dans chaque open space. */
export const POSTES: Poste[] = (() => {
  const res: Poste[] = [];
  for (const id of ["openspace", "os_fiscal", "os_social", "os_juridique", "annexe"] as PieceId[]) {
    const p = pieceParId(id)!;
    const largeur = p.x1 - p.x0;
    const colonnes = Math.max(2, Math.floor((largeur - 1) / 2.1));
    const pas = (largeur - 1) / colonnes;
    for (let c = 0; c < colonnes; c++) {
      const x = p.x0 + 0.5 + pas * (c + 0.5);
      res.push({ x, z: 3.0, rot: 0, piece: id });
      res.push({ x, z: 5.0, rot: Math.PI, piece: id });
    }
  }
  return res;
})();

export const MAX_POSTES = POSTES.length;

export const PIECE_ACTIVITE: Record<Activite, PieceId> = {
  absent: "dehors",
  travaille: "openspace",
  reunion: "reunion",
  pause: "cafe",
  formation: "formation",
  archives: "archives",
  accueil: "accueil",
  conge: "dehors",
  malade: "dehors",
  teletravail: "dehors",
  dejeuner: "cafe",
  sport: "sport",
};

/** Point de stationnement d'un agent dans une pièce (dispersé selon son index). */
export function placeDans(piece: PieceId, index: number, bureau: number): { x: number; z: number } {
  const poste = POSTES[bureau];
  if (poste && poste.piece === piece) return { x: poste.x, z: poste.z + (poste.rot === 0 ? -0.7 : 0.7) };
  if (piece === "dehors") return { x: -7.5, z: 9.5 };
  const pc = pieceParId(piece)!;
  const cx = (pc.x0 + pc.x1) / 2;
  const cz = (pc.z0 + pc.z1) / 2;
  const angle = (index * 2.39996) % (Math.PI * 2);
  const rx = Math.min(1.2 + (index % 3) * 0.5, (pc.x1 - pc.x0) / 2 - 0.6);
  const rz = Math.min(1.0 + (index % 3) * 0.45, (pc.z1 - pc.z0) / 2 - 0.6);
  return { x: cx + Math.cos(angle) * rx, z: cz + Math.sin(angle) * rz };
}

export type Point = { x: number; z: number; etage: number };

/** Chemin : sortir par la porte, suivre le couloir, prendre l'ascenseur si besoin, entrer par la porte. */
export function chemin(de: { x: number; z: number; piece: PieceId }, vers: { x: number; z: number; piece: PieceId }): Point[] {
  const eDe = etageDe(de.piece);
  const eVers = etageDe(vers.piece);
  if (de.piece === vers.piece) return [{ x: vers.x, z: vers.z, etage: eVers }];
  const pts: Point[] = [];
  const porteDe = de.piece === "dehors" ? -7.5 : pieceParId(de.piece)!.porte;
  const porteVers = vers.piece === "dehors" ? -7.5 : pieceParId(vers.piece)!.porte;
  if (de.piece === "dehors") pts.push({ x: -7.5, z: 4, etage: 0 });
  pts.push({ x: porteDe, z: COULOIR_Z, etage: eDe });
  if (eDe !== eVers) {
    pts.push({ x: ASCENSEUR.porte, z: COULOIR_Z, etage: eDe });
    pts.push({ x: ASCENSEUR.x, z: ASCENSEUR.z, etage: eDe });
    pts.push({ x: ASCENSEUR.x, z: ASCENSEUR.z, etage: eVers }); // changement d'étage
    pts.push({ x: ASCENSEUR.porte, z: COULOIR_Z, etage: eVers });
  }
  pts.push({ x: porteVers, z: COULOIR_Z, etage: eVers });
  if (vers.piece === "dehors") pts.push({ x: -7.5, z: 4, etage: 0 });
  pts.push({ x: vers.x, z: vers.z, etage: eVers });
  return pts;
}

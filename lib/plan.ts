import type { Activite, PieceId } from "@/lib/types";

// Plan du cabinet (unités 3D). x de -12 à 12, z de -8 à 8.
// Rangée du fond : réunion, archives, formation, bureau de l'associée.
// Couloir en z = -1. Rangée de devant : accueil, open space, cafétéria.

export type Piece = {
  id: PieceId;
  nom: string;
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  sol: string;
  porte: number; // x de la porte côté couloir
  description: string;
};

export const COULOIR_Z = -1;

export const PIECES: Piece[] = [
  { id: "reunion", nom: "Salle de réunion", x0: -12, x1: -5, z0: -8, z1: -2, sol: "#d9cbb5", porte: -8.5, description: "Dilemmes, points d'équipe et Boss Fights des échéances." },
  { id: "archives", nom: "Archives", x0: -5, x1: 0, z0: -8, z1: -2, sol: "#cfc6b8", porte: -2.5, description: "Dossiers permanents et pièces justificatives (phase Collecte)." },
  { id: "formation", nom: "Salle de formation", x0: 0, x1: 5, z0: -8, z1: -2, sol: "#c9d6e3", porte: 2.5, description: "QCM blanc hebdomadaire et oral blanc du DEC." },
  { id: "associee", nom: "Ton bureau", x0: 5, x1: 12, z0: -8, z1: -2, sol: "#b98b5e", porte: 8.5, description: "Messagerie, Ghost Writer et validations." },
  { id: "accueil", nom: "Accueil", x0: -12, x1: -6, z0: 0, z1: 8, sol: "#e8dcc8", porte: -9, description: "Clients et prospects qui passent au cabinet." },
  { id: "openspace", nom: "Open space", x0: -6, x1: 6, z0: 0, z1: 8, sol: "#9fb4d8", porte: 0, description: "L'équipe au travail sur les dossiers." },
  { id: "cafe", nom: "Cafétéria", x0: 6, x1: 12, z0: 0, z1: 8, sol: "#e6e1d6", porte: 9, description: "Pauses, rumeurs, clans et moral." },
  // Aile Est (agrandissements 5 et 6)
  { id: "associes", nom: "Bureaux des associés", x0: 12, x1: 16, z0: -8, z1: -2, sol: "#a47551", porte: 14, description: "Tes associés y reçoivent leurs propres clients." },
  { id: "it", nom: "Salle IT", x0: 16, x1: 18.5, z0: -8, z1: -2, sol: "#b0bec5", porte: 17.25, description: "Serveurs et cybersécurité : moins de pannes et d'attaques." },
  { id: "detente", nom: "Espace détente", x0: 18.5, x1: 22, z0: -8, z1: -2, sol: "#c8e6c9", porte: 20.25, description: "Sieste, sport, phone box : la fatigue retombe plus vite." },
  { id: "rh", nom: "Bureau RH", x0: 12, x1: 15, z0: 0, z1: 8, sol: "#e1bee7", porte: 13.5, description: "Entretiens d'embauche et suivi du personnel." },
  { id: "annexe", nom: "Open space annexe", x0: 15, x1: 22, z0: 0, z1: 8, sol: "#a5c8b8", porte: 18.5, description: "Pôle audit et conseil : 6 postes supplémentaires." },
];

export const AILE_EST: PieceId[] = ["associes", "it", "detente", "rh", "annexe"];

export const pieceParId = (id: PieceId) => PIECES.find((p) => p.id === id);

/** Postes de travail de l'open space : deux îlots de 5 bureaux. */
export const POSTES: { x: number; z: number; rot: number }[] = (() => {
  const res: { x: number; z: number; rot: number }[] = [];
  for (const ilot of [-2.8, 2.8]) {
    for (const [dx, dz, rot] of [
      [-1.1, 2.6, 0],
      [1.1, 2.6, 0],
      [-1.1, 5.0, Math.PI],
      [1.1, 5.0, Math.PI],
      [0, 6.6, Math.PI],
    ] as const) {
      res.push({ x: ilot + dx, z: dz, rot });
    }
  }
  return res;
})();

// Postes de l'open space annexe (indices 10 à 15).
for (const [x, z, rot] of [
  [16.6, 2.6, 0],
  [18.6, 2.6, 0],
  [20.6, 2.6, 0],
  [16.6, 5.0, Math.PI],
  [18.6, 5.0, Math.PI],
  [20.6, 5.0, Math.PI],
] as const)
  POSTES.push({ x, z, rot });

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
};

/** Point de stationnement d'un agent dans une pièce (dispersé selon son index). */
export function placeDans(piece: PieceId, index: number, bureau: number): { x: number; z: number } {
  if (piece === "openspace" || piece === "annexe") {
    const p = POSTES[bureau % POSTES.length];
    // la chaise est devant le bureau
    return { x: p.x, z: p.z + (p.rot === 0 ? -0.7 : 0.7) };
  }
  if (piece === "dehors") return { x: -9, z: 9.5 };
  const pc = pieceParId(piece)!;
  const cx = (pc.x0 + pc.x1) / 2;
  const cz = (pc.z0 + pc.z1) / 2;
  const angle = (index * 2.39996) % (Math.PI * 2);
  const r = 1.2 + (index % 3) * 0.55;
  return { x: cx + Math.cos(angle) * r, z: cz + Math.sin(angle) * r * 0.8 };
}

/** Chemin : sortir par la porte, suivre le couloir, entrer par la porte. */
export function chemin(
  de: { x: number; z: number; piece: PieceId },
  vers: { x: number; z: number; piece: PieceId },
): { x: number; z: number }[] {
  if (de.piece === vers.piece) return [{ x: vers.x, z: vers.z }];
  const pts: { x: number; z: number }[] = [];
  const porteDe = de.piece === "dehors" ? -9 : pieceParId(de.piece)!.porte;
  const porteVers = vers.piece === "dehors" ? -9 : pieceParId(vers.piece)!.porte;
  if (de.piece === "dehors") pts.push({ x: -9, z: 4 });
  pts.push({ x: porteDe, z: COULOIR_Z });
  pts.push({ x: porteVers, z: COULOIR_Z });
  if (vers.piece === "dehors") pts.push({ x: -9, z: 4 });
  pts.push({ x: vers.x, z: vers.z });
  return pts;
}

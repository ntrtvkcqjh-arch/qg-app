"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { POSITIONS } from "./positions";
import Corps, { ASSIS, DEBOUT, animerSquelette, apparencePour, postureMarche, tournerVers, useSquelette, type Accessoire, type Posture } from "./Corps";
import { PIECE_ACTIVITE, POSTES, chemin, pieceParId, placeDans } from "@/lib/plan";
import type { Agent, PieceId } from "@/lib/types";

type Props = {
  minute: number;
  agent: Agent;
  index: number;
  selectionne: boolean;
  vitesseJeu: number;
  onClick: (id: string) => void;
  piecesOuvertes: PieceId[];
};

const VITESSE_MARCHE = 1.5; // m/s à vitesse ×1 (pas tranquille)

function hachage(s: string) {
  let x = 0;
  for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x;
}

/** Pièce où se trouve l'agent selon son activité et les pièces construites. */
export function pieceAgent(agent: Agent, ouvertes: PieceId[]): PieceId {
  const ouvert = (p: PieceId) => ouvertes.includes(p);
  let p: PieceId = PIECE_ACTIVITE[agent.activite];
  if (agent.activite === "travaille") {
    if (agent.filiere === "rh" && ouvert("rh")) p = "rh";
    else if (agent.filiere === "associe" && ouvert("associes")) p = "associes";
    else if (agent.bureau >= 10) p = "annexe";
  }
  if (agent.activite === "pause" && ouvert("detente") && (agent.id.charCodeAt(0) + agent.id.length) % 2 === 0) p = "detente";
  if (p !== "dehors" && !ouvert(p)) p = "openspace";
  return p;
}

export default function Personnage({ minute, agent, index, selectionne, vitesseJeu, onClick, piecesOuvertes }: Props) {
  const groupe = useRef<Group>(null);
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...DEBOUT });
  const apparence = useMemo(() => apparencePour(agent.id, agent.prenom, agent.couleur, agent.peau, agent.cheveux), [agent.id, agent.prenom, agent.couleur, agent.peau, agent.cheveux]);
  const piece = pieceAgent(agent, piecesOuvertes);
  const cible = placeDans(piece, index, agent.bureau);

  // Gestes : téléphone par moments, café en pause, tête dans les mains si très stressé.
  const tranche = Math.floor(minute / 40);
  const auTelephone = agent.activite === "travaille" && hachage(agent.id + tranche) % 6 === 0;
  const stresse = agent.activite === "travaille" && agent.stress > 75 && hachage(agent.id + tranche + "s") % 3 === 0;
  const accessoire: Accessoire = agent.activite === "pause" ? "cafe" : auTelephone ? "telephone" : null;
  const centre = (() => {
    if (piece === "formation") return { x: 2.5, z: -7.9 };
    const pc = pieceParId(piece);
    return pc ? { x: (pc.x0 + pc.x1) / 2, z: (pc.z0 + pc.z1) / 2 } : null;
  })();

  const etat = useRef({
    x: piece === "dehors" ? -9 : cible.x,
    z: piece === "dehors" ? 9.5 : cible.z,
    piece: piece as PieceId,
    chemin: [] as { x: number; z: number }[],
    t: index * 1.7,
    lacet: 0,
    vitesse: 0,
  });

  useEffect(() => {
    const s = etat.current;
    s.chemin = chemin({ x: s.x, z: s.z, piece: s.piece }, { ...cible, piece });
    s.piece = piece;
  }, [piece, cible.x, cible.z]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleHtml = !(agent.activite === "absent" || agent.activite === "conge" || agent.activite === "malade" || agent.activite === "teletravail") || !!agent.bulle;

  useFrame((_, dtBrut) => {
    const s = etat.current;
    const g = groupe.current;
    if (!g) return;
    const dt = Math.min(dtBrut, 0.1);
    const accel = Math.min(Math.max(vitesseJeu, 1), 3);
    s.t += dt * (0.6 + 0.4 * accel);

    // Déplacement avec accélération et freinage doux à l'arrivée.
    let marche = false;
    let lacetVoulu = s.lacet;
    if (s.chemin.length) {
      const p = s.chemin[0];
      const dx = p.x - s.x;
      const dz = p.z - s.z;
      const dist = Math.hypot(dx, dz);
      const restant = dist + (s.chemin.length > 1 ? 1 : 0);
      const vmax = VITESSE_MARCHE * accel * Math.min(1, 0.35 + restant / 1.2);
      s.vitesse += (vmax - s.vitesse) * (1 - Math.exp(-dt * 5));
      const pas = s.vitesse * dt;
      if (dist <= pas || dist < 0.01) {
        s.x = p.x;
        s.z = p.z;
        s.chemin.shift();
      } else {
        s.x += (dx / dist) * pas;
        s.z += (dz / dist) * pas;
        lacetVoulu = Math.atan2(dx, dz);
      }
      marche = true;
    } else s.vitesse = 0;
    g.position.set(s.x, 0, s.z);

    const auPoste = !marche && agent.activite === "travaille" && (piece === "openspace" || piece === "annexe");
    const assis = !marche && (agent.activite === "travaille" || agent.activite === "formation" || agent.activite === "reunion");
    if (auPoste) lacetVoulu = POSTES[agent.bureau % POSTES.length].rot === 0 ? 0 : Math.PI;
    else if (!marche && centre && (agent.activite === "reunion" || agent.activite === "pause" || agent.activite === "formation")) lacetVoulu = Math.atan2(centre.x - s.x, centre.z - s.z);
    s.lacet = tournerVers(s.lacet, lacetVoulu, dt, marche ? 8 : 4);
    g.rotation.y = s.lacet;

    // Pose cible selon l'activité, puis transition douce.
    let cibleP: Posture;
    if (marche) cibleP = postureMarche(s.t, 7.5);
    else if (assis) {
      cibleP = { ...ASSIS };
      if (auPoste && !auTelephone && !stresse) {
        const f = Math.sin(s.t * 13) * 0.05; // frappe au clavier
        cibleP.coudeG += f;
        cibleP.coudeD -= f;
      }
      if (agent.activite === "reunion") {
        cibleP.epauleG = -0.5 + Math.sin(s.t * 1.8) * 0.2; // on parle avec les mains
        cibleP.coudeG = -1.2 + Math.sin(s.t * 2.3) * 0.25;
      }
    } else {
      cibleP = { ...DEBOUT };
      cibleP.hauteur = Math.sin(s.t * 1.6) * 0.004; // respiration
    }
    if (accessoire === "cafe" && !assis) {
      cibleP.epauleD = marche ? -0.2 : -0.3;
      cibleP.coudeD = -1.4 + (marche ? 0 : Math.sin(s.t * 0.5) * 0.25);
    }
    if (auTelephone && !marche) {
      cibleP.epauleD = -0.25;
      cibleP.epauleDz = 0.35;
      cibleP.coudeD = -2.45; // combiné à l'oreille
    }
    if (stresse && auPoste) {
      cibleP.epauleG = cibleP.epauleD = -0.85;
      cibleP.epauleGz = -0.25;
      cibleP.epauleDz = 0.25;
      cibleP.coudeG = cibleP.coudeD = -2.2; // tête dans les mains
      cibleP.inclinaison = 0.35;
    }
    if (auPoste && agent.fatigue > 85) cibleP.inclinaison = 0.45; // épuisé, affalé sur le bureau
    animerSquelette(sq, pose.current, cibleP, dt, marche ? 14 : 5);

    g.visible = !(s.piece === "dehors" && !s.chemin.length);
    POSITIONS.set(agent.id, { x: s.x, y: 1.55 + (1 - Math.min(1, -pose.current.hauteur / 0.42)) * 0.4, z: s.z, visible: g.visible && visibleHtml });
  });

  const clic = (ev: ThreeEvent<MouseEvent>) => {
    ev.stopPropagation();
    onClick(agent.id);
  };

  return (
    <group ref={groupe} onClick={clic}>
      {selectionne && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.5, 32]} />
          <meshBasicMaterial color="#2f5bea" />
        </mesh>
      )}
      <Corps a={apparence} sq={sq} accessoire={accessoire} />
    </group>
  );
}

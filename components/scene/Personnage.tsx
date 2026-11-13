"use client";

import { useEffect, useMemo, useRef } from "react";
import Corps, { apparencePour } from "./Corps";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { POSITIONS } from "./positions";
import { PIECE_ACTIVITE, POSTES, chemin, placeDans } from "@/lib/plan";
import type { Agent, PieceId } from "@/lib/types";

type Props = {
  agent: Agent;
  index: number;
  selectionne: boolean;
  vitesseJeu: number;
  onClick: (id: string) => void;
  piecesOuvertes: PieceId[];
};

const VITESSE_MARCHE = 2.4;

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


export default function Personnage({ agent, index, selectionne, vitesseJeu, onClick, piecesOuvertes }: Props) {
  const groupe = useRef<Group>(null);
  const corps = useRef<Group>(null);
  const jambeG = useRef<Group>(null);
  const jambeD = useRef<Group>(null);
  const brasG = useRef<Group>(null);
  const brasD = useRef<Group>(null);
  const apparence = useMemo(() => apparencePour(agent.id, agent.prenom, agent.couleur, agent.peau, agent.cheveux), [agent.id, agent.prenom, agent.couleur, agent.peau, agent.cheveux]);
  const piece = pieceAgent(agent, piecesOuvertes);
  const cible = placeDans(piece, index, agent.bureau);

  const etat = useRef({
    x: piece === "dehors" ? -9 : cible.x,
    z: piece === "dehors" ? 9.5 : cible.z,
    piece: piece as PieceId,
    chemin: [] as { x: number; z: number }[],
    t: index * 1.7,
  });

  useEffect(() => {
    const s = etat.current;
    s.chemin = chemin({ x: s.x, z: s.z, piece: s.piece }, { ...cible, piece });
    s.piece = piece;
  }, [piece, cible.x, cible.z]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleHtml = !(agent.activite === "absent" || agent.activite === "conge" || agent.activite === "malade" || agent.activite === "teletravail") || !!agent.bulle;

  useFrame((_, dt) => {
    const s = etat.current;
    const g = groupe.current;
    const c = corps.current;
    if (!g || !c) return;
    s.t += dt;
    const pas = Math.min(dt, 0.1) * VITESSE_MARCHE * Math.min(Math.max(vitesseJeu, 1), 4);
    let marche = false;
    if (s.chemin.length) {
      const p = s.chemin[0];
      const dx = p.x - s.x;
      const dz = p.z - s.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= pas) {
        s.x = p.x;
        s.z = p.z;
        s.chemin.shift();
      } else {
        s.x += (dx / dist) * pas;
        s.z += (dz / dist) * pas;
        g.rotation.y = Math.atan2(dx, dz);
      }
      marche = true;
    }
    g.position.set(s.x, 0, s.z);
    const auPoste = !marche && agent.activite === "travaille" && (piece === "openspace" || piece === "annexe");
    const assis = !marche && (agent.activite === "travaille" || agent.activite === "formation" || agent.activite === "reunion");
    if (auPoste) {
      const poste = POSTES[agent.bureau % POSTES.length];
      g.rotation.y = poste.rot === 0 ? 0 : Math.PI;
    }
    const epuise = auPoste && agent.fatigue > 85;
    c.rotation.x = epuise ? 0.5 : 0;
    c.position.y = assis ? -0.4 : marche ? Math.abs(Math.sin(s.t * 9)) * 0.04 : Math.sin(s.t * 2) * 0.008;

    // Bras et jambes
    const balance = marche ? Math.sin(s.t * 9) * 0.6 : 0;
    if (jambeG.current && jambeD.current) {
      jambeG.current.rotation.x = assis ? -1.45 : balance;
      jambeD.current.rotation.x = assis ? -1.45 : -balance;
    }
    if (brasG.current && brasD.current) {
      const frappe = auPoste && !epuise ? Math.sin(s.t * 14) * 0.08 : 0;
      brasG.current.rotation.x = assis ? -1.0 + frappe : -balance * 0.8;
      brasD.current.rotation.x = assis ? -1.0 - frappe : balance * 0.8;
    }
    g.visible = !(s.piece === "dehors" && !s.chemin.length);
    POSITIONS.set(agent.id, { x: s.x, y: assis ? 1.55 : 1.95, z: s.z, visible: g.visible && visibleHtml });
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
      <group ref={corps}>
        <Corps a={apparence} membres={{ jambeG, jambeD, brasG, brasD }} />
      </group>
    </group>
  );
}

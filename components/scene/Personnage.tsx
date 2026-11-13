"use client";

import { useEffect, useRef } from "react";
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
};

const VITESSE_MARCHE = 2.4; // unités par seconde réelle (x vitesse du jeu, plafonnée)

export default function Personnage({
  agent,
  index,
  selectionne,
  vitesseJeu,
  onClick,
}: Props) {
  const groupe = useRef<Group>(null);
  const corps = useRef<Group>(null);
  const piece: PieceId = PIECE_ACTIVITE[agent.activite];
  const cible = placeDans(piece, index, agent.bureau);

  // Position courante et chemin restant, gardés hors du rendu React.
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

  const visibleHtml =
    !(
      agent.activite === "absent" ||
      agent.activite === "conge" ||
      agent.activite === "malade"
    ) || !!agent.bulle;

  useFrame((_, dt) => {
    const s = etat.current;
    const g = groupe.current;
    const c = corps.current;
    if (!g || !c) return;
    s.t += dt;
    const pas =
      Math.min(dt, 0.1) * VITESSE_MARCHE * Math.min(Math.max(vitesseJeu, 1), 4);
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
    const assis =
      !marche &&
      (agent.activite === "travaille" ||
        agent.activite === "formation" ||
        agent.activite === "reunion");
    if (!marche && agent.activite === "travaille") {
      const poste = POSTES[agent.bureau % POSTES.length];
      g.rotation.y = poste.rot === 0 ? 0 : Math.PI;
    }
    c.position.y = assis
      ? -0.28
      : marche
        ? Math.abs(Math.sin(s.t * 9)) * 0.06
        : Math.sin(s.t * 2) * 0.01;
    g.visible = !(s.piece === "dehors" && !s.chemin.length);
    POSITIONS.set(agent.id, {
      x: s.x,
      y: assis ? 1.7 : 1.98,
      z: s.z,
      visible: g.visible && visibleHtml,
    });
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
        {/* jambes */}
        <mesh position={[-0.09, 0.3, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
          <meshStandardMaterial color="#2d3142" />
        </mesh>
        <mesh position={[0.09, 0.3, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
          <meshStandardMaterial color="#2d3142" />
        </mesh>
        {/* buste */}
        <mesh position={[0, 0.82, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.38, 6, 12]} />
          <meshStandardMaterial color={agent.couleur} roughness={0.7} />
        </mesh>
        {/* tête */}
        <mesh position={[0, 1.33, 0]} castShadow>
          <sphereGeometry args={[0.17, 20, 16]} />
          <meshStandardMaterial color={agent.peau} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.4, -0.03]} castShadow>
          <sphereGeometry
            args={[0.18, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.9]}
          />
          <meshStandardMaterial color={agent.cheveux} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

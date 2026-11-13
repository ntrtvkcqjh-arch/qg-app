"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { chemin, placeDans } from "@/lib/plan";
import type { PieceId, Visiteur } from "@/lib/types";
import { POSITIONS } from "./positions";

// Clients et prospects qui viennent en personne au cabinet.

function Silhouette({ v, index, reunionOuverte }: { v: Visiteur; index: number; reunionOuverte: boolean }) {
  const g = useRef<Group>(null);
  const piece: PieceId = v.etat === "attend" ? "accueil" : v.etat === "reunion" ? (reunionOuverte ? "reunion" : "associee") : "dehors";
  const cible = placeDans(piece, index + 3, 0);
  const s = useRef({ x: -9, z: 9.5, piece: "dehors" as PieceId, chemin: [] as { x: number; z: number }[], t: index });

  useEffect(() => {
    const e = s.current;
    e.chemin = chemin({ x: e.x, z: e.z, piece: e.piece }, { ...cible, piece });
    e.piece = piece;
  }, [piece, cible.x, cible.z]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const e = s.current;
    if (!g.current) return;
    e.t += dt;
    const pas = Math.min(dt, 0.1) * 2.2;
    let marche = false;
    if (e.chemin.length) {
      const p = e.chemin[0];
      const dx = p.x - e.x;
      const dz = p.z - e.z;
      const d = Math.hypot(dx, dz);
      if (d <= pas) {
        e.x = p.x;
        e.z = p.z;
        e.chemin.shift();
      } else {
        e.x += (dx / d) * pas;
        e.z += (dz / d) * pas;
        g.current.rotation.y = Math.atan2(dx, dz);
      }
      marche = true;
    }
    g.current.position.set(e.x, marche ? Math.abs(Math.sin(e.t * 9)) * 0.05 : 0, e.z);
    const visible = !(e.piece === "dehors" && !e.chemin.length);
    g.current.visible = visible;
    POSITIONS.set(`v_${v.id}`, { x: e.x, y: 1.98, z: e.z, visible });
  });

  return (
    <group ref={g}>
      <mesh position={[-0.09, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
      <mesh position={[0.09, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
        <meshStandardMaterial color="#263238" />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <capsuleGeometry args={[0.21, 0.4, 6, 12]} />
        <meshStandardMaterial color={v.couleur} />
      </mesh>
      <mesh position={[0, 1.33, 0]} castShadow>
        <sphereGeometry args={[0.17, 18, 14]} />
        <meshStandardMaterial color="#e0b08a" />
      </mesh>
      <mesh position={[0.26, 0.55, 0.05]} castShadow>
        <boxGeometry args={[0.08, 0.3, 0.4]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
    </group>
  );
}

export default function Visiteurs({ visiteurs, reunionOuverte }: { visiteurs: Visiteur[]; reunionOuverte: boolean }) {
  return (
    <>
      {visiteurs.map((v, i) => (
        <Silhouette key={v.id} v={v} index={i} reunionOuverte={reunionOuverte} />
      ))}
    </>
  );
}

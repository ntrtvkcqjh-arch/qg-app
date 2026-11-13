"use client";

import { useEffect, useMemo, useRef } from "react";
import Corps, { ASSIS, DEBOUT, animerSquelette, apparencePour, postureMarche, tournerVers, useSquelette, type Posture } from "./Corps";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { chemin, placeDans, type Point } from "@/lib/plan";
import type { PieceId, Visiteur } from "@/lib/types";
import { POSITIONS } from "./positions";

// Clients et prospects qui viennent en personne au cabinet.

function Silhouette({ v, index, reunionOuverte, etageVue }: { v: Visiteur; index: number; reunionOuverte: boolean; etageVue: number }) {
  const g = useRef<Group>(null);
  const piece: PieceId = v.etat === "attend" ? "accueil" : v.etat === "reunion" ? (reunionOuverte ? "reunion" : "accueil") : "dehors";
  const cible = placeDans(piece, index + 3, 0);
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...DEBOUT });
  const apparence = useMemo(() => ({ ...apparencePour(v.id, v.nom.split(" ")[0], v.couleur, "#e0b08a", "#3b2a20"), veste: true }), [v.id, v.nom, v.couleur]);
  const s = useRef({ x: -9, z: 9.5, piece: "dehors" as PieceId, etage: 0, chemin: [] as Point[], t: index });

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
        e.etage = p.etage;
        e.chemin.shift();
      } else {
        e.x += (dx / d) * pas;
        e.z += (dz / d) * pas;
        g.current.rotation.y = tournerVers(g.current.rotation.y, Math.atan2(dx, dz), Math.min(dt, 0.1), 8);
      }
      marche = true;
    }
    g.current.position.set(e.x, 0, e.z);
    const assis = !marche && v.etat === "reunion";
    const cibleP = marche ? postureMarche(e.t, 7) : assis ? { ...ASSIS, coudeG: -0.6, coudeD: -0.6 } : { ...DEBOUT };
    animerSquelette(sq, pose.current, cibleP, Math.min(dt, 0.1), marche ? 14 : 5);
    const visible = !(e.piece === "dehors" && !e.chemin.length) && e.etage === etageVue;
    g.current.visible = visible;
    POSITIONS.set(`v_${v.id}`, { x: e.x, y: 1.95, z: e.z, visible });
  });

  return (
    <group ref={g}>
      <Corps a={apparence} sq={sq} />
      <mesh position={[0.3, 0.62, 0.05]} castShadow>
        <boxGeometry args={[0.08, 0.28, 0.38]} />
        <meshStandardMaterial color="#4e342e" />
      </mesh>
    </group>
  );
}

export default function Visiteurs({ visiteurs, reunionOuverte, etageVue }: { visiteurs: Visiteur[]; reunionOuverte: boolean; etageVue: number }) {
  return (
    <>
      {visiteurs.map((v, i) => (
        <Silhouette key={v.id} v={v} index={i} reunionOuverte={reunionOuverte} etageVue={etageVue} />
      ))}
    </>
  );
}

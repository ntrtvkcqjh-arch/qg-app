"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { POSTES, chemin, etageDe, pieceParId, type Point } from "@/lib/plan";
import type { PieceId } from "@/lib/types";
import Corps, { DEBOUT, animerSquelette, postureMarche, tournerVers, useSquelette, type Posture } from "./Corps";
import { POSITIONS } from "./positions";

// Ambiance du soir : lampes de bureau et écrans allumés pour ceux qui
// restent tard, et la femme de ménage qui fait sa tournée.

export function LampesBureaux({ postes, etage }: { postes: number[]; etage: number }) {
  return (
    <>
      {postes.map((i, k) => {
        const p = POSTES[i];
        if (!p || etageDe(p.piece) !== etage) return null;
        const sens = p.rot === 0 ? 1 : -1;
        return (
          <group key={i}>
            {/* lampe de bureau */}
            <mesh position={[p.x + 0.55 * sens, 1.05, p.z + 0.15 * sens]}>
              <sphereGeometry args={[0.07, 12, 10]} />
              <meshStandardMaterial color="#fff3c4" emissive="#ffcf70" emissiveIntensity={2.2} />
            </mesh>
            <mesh position={[p.x + 0.55 * sens, 0.9, p.z + 0.15 * sens]}>
              <cylinderGeometry args={[0.012, 0.012, 0.28, 6]} />
              <meshStandardMaterial color="#333" />
            </mesh>
            {/* lueur de l'écran */}
            <mesh position={[p.x, 1.0, p.z + 0.12 * sens]} rotation={[0, p.rot === 0 ? Math.PI : 0, 0]}>
              <planeGeometry args={[0.55, 0.32]} />
              <meshStandardMaterial color="#9cc4ff" emissive="#6fa8ff" emissiveIntensity={1.4} side={2} />
            </mesh>
            {k < 4 && <pointLight position={[p.x + 0.4 * sens, 1.4, p.z]} intensity={4} distance={3.5} color="#ffd59a" />}
          </group>
        );
      })}
    </>
  );
}

export function FemmeDeMenage({ pieces, etage }: { pieces: PieceId[]; etage: number }) {
  const g = useRef<Group>(null);
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...DEBOUT });
  const s = useRef({ x: 5, z: -1, piece: "openspace" as PieceId, chemin: [] as Point[], etape: 0, pause: 0, t: 0 });

  useFrame((_, dt) => {
    const e = s.current;
    if (!g.current) return;
    e.t += dt;
    if (!e.chemin.length) {
      e.pause -= dt;
      if (e.pause <= 0) {
        const liste = pieces.filter((p) => etageDe(p) === etage);
        const suivante = liste[e.etape % liste.length];
        e.etape++;
        const pc = pieceParId(suivante);
        if (pc) {
          const cible = { x: (pc.x0 + pc.x1) / 2 + Math.sin(e.etape) * 1.5, z: (pc.z0 + pc.z1) / 2 + Math.cos(e.etape) * 1.2 };
          e.chemin = chemin({ x: e.x, z: e.z, piece: etageDe(e.piece) === etage ? e.piece : suivante }, { ...cible, piece: suivante });
          e.piece = suivante;
        }
        e.pause = 6;
      }
    }
    let marche = false;
    if (e.chemin.length) {
      const p = e.chemin[0];
      const dx = p.x - e.x;
      const dz = p.z - e.z;
      const d = Math.hypot(dx, dz);
      const pas = Math.min(dt, 0.1) * 1.6;
      if (d <= pas) {
        e.x = p.x;
        e.z = p.z;
        e.chemin.shift();
      } else {
        e.x += (dx / d) * pas;
        e.z += (dz / d) * pas;
        g.current.rotation.y = tournerVers(g.current.rotation.y, Math.atan2(dx, dz), Math.min(dt, 0.1), 6);
      }
      marche = true;
    }
    g.current.position.set(e.x, 0, e.z);
    // pousse le chariot en marchant, passe le balai à l'arrêt
    const cibleP = marche ? { ...postureMarche(e.t, 6.5), epauleG: -0.7, epauleD: -0.7, coudeG: -0.5, coudeD: -0.5 } : { ...DEBOUT, epauleG: -0.8 + Math.sin(e.t * 3) * 0.3, epauleD: -0.8 - Math.sin(e.t * 3) * 0.3, coudeG: -0.6, coudeD: -0.6, inclinaison: 0.15 };
    animerSquelette(sq, pose.current, cibleP, Math.min(dt, 0.1), 8);
    POSITIONS.set("menage", { x: e.x, y: 1.95, z: e.z, visible: true });
  });

  return (
    <group ref={g}>
      <Corps a={{ haut: "#4f7cac", bas: "#4f7cac", peau: "#c68b5e", cheveux: "#1d1d1d", coiffure: "chignon" }} sq={sq} />
      {/* chariot de ménage */}
      <group position={[0, 0, 0.55]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.45, 0.5, 0.35]} />
          <meshStandardMaterial color="#ffca28" />
        </mesh>
        <mesh position={[0.12, 0.85, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.7, 6]} />
          <meshStandardMaterial color="#8d6e63" />
        </mesh>
      </group>
    </group>
  );
}

/** Formateur devant l'écran de la salle de formation (3e étage). */
export function Formateur() {
  const g = useRef<Group>(null);
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...DEBOUT });
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (g.current) g.current.rotation.y = Math.PI / 2 + Math.sin(t * 0.6) * 0.4;
    animerSquelette(sq, pose.current, { ...DEBOUT, epauleD: -0.9 + Math.sin(t * 1.5) * 0.4, coudeD: -0.8, epauleG: -0.2 }, Math.min(dt, 0.1), 4);
  });
  return (
    <group ref={g} position={[-11.2, 0, 4]}>
      <Corps a={{ haut: "#ffffff", bas: "#37474f", peau: "#e0b08a", cheveux: "#5d4037", coiffure: "courte", veste: true }} sq={sq} />
    </group>
  );
}

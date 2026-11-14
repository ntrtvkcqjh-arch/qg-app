"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import Corps, { DEBOUT, animerSquelette, postureMarche, useSquelette, type Posture } from "./Corps";

// Le quartier autour du campus (visible depuis le rez-de-chaussée) :
// rue animée, voitures, passants, boulangerie, brasserie, arbres de saison.

const BOUTIQUES = [
  { x: -14, nom: "Boulangerie", c: "#c8a27a", store: "#d84315" },
  { x: -6, nom: "Brasserie", c: "#6d4c41", store: "#2e7d32" },
  { x: 2, nom: "Pharmacie", c: "#eceff1", store: "#43a047" },
  { x: 10, nom: "Fleuriste", c: "#f8bbd0", store: "#ad1457" },
  { x: 18, nom: "Banque", c: "#cfd8dc", store: "#1565c0" },
];

function Voiture({ couleur, depart, vitesse, voie }: { couleur: string; depart: number; vitesse: number; voie: number }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const L = 70;
    const x = (((depart + clock.elapsedTime * vitesse) % L) + L) % L - 35;
    g.current.position.set(vitesse > 0 ? x : -x, 0, voie);
    g.current.rotation.y = vitesse > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.9, 0.45, 0.85]} />
        <meshStandardMaterial color={couleur} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[-0.1, 0.7, 0]} castShadow>
        <boxGeometry args={[1.0, 0.35, 0.78]} />
        <meshStandardMaterial color="#cfe3f5" metalness={0.2} roughness={0.1} />
      </mesh>
      {[-0.65, 0.65].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.15, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.1, 12]} />
            <meshStandardMaterial color="#1b1b1b" />
          </mesh>
        )),
      )}
    </group>
  );
}

function Passant({ depart, vitesse, couleur, z }: { depart: number; vitesse: number; couleur: string; z: number }) {
  const g = useRef<Group>(null);
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...DEBOUT });
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    const L = 64;
    const x = (((depart + t * vitesse) % L) + L) % L - 32;
    g.current.position.set(vitesse > 0 ? x : -x, 0, z);
    g.current.rotation.y = vitesse > 0 ? Math.PI / 2 : -Math.PI / 2;
    animerSquelette(sq, pose.current, postureMarche(t + depart, 7), Math.min(dt, 0.1), 14);
  });
  return (
    <group ref={g}>
      <Corps a={{ haut: couleur, bas: "#37474f", peau: "#d9a07a", cheveux: "#3b2a20", coiffure: depart % 2 ? "courte" : "longue" }} sq={sq} />
    </group>
  );
}

export default function Quartier({ mois }: { mois: number }) {
  const feuillage = mois >= 12 || mois <= 2 ? null : mois >= 9 && mois <= 11 ? "#e07b39" : mois >= 3 && mois <= 4 ? "#f8bbd0" : "#4f8a4b";
  return (
    <group>
      {/* trottoirs et chaussée */}
      <mesh position={[0, -0.09, 9.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 2.2]} />
        <meshStandardMaterial color="#cfcac2" />
      </mesh>
      <mesh position={[0, -0.095, 12.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 3.4]} />
        <meshStandardMaterial color="#5f6368" />
      </mesh>
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} position={[-32 + i * 5, -0.085, 12.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2, 0.12]} />
          <meshStandardMaterial color="#f5f5f5" />
        </mesh>
      ))}
      <mesh position={[0, -0.09, 14.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 1.6]} />
        <meshStandardMaterial color="#cfcac2" />
      </mesh>
      {/* arbres d'alignement */}
      {[-16, -10, -4, 2, 8, 14, 20].map((x) => (
        <group key={x} position={[x, 0, 9.2]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 1.8, 8]} />
            <meshStandardMaterial color="#6d4c41" />
          </mesh>
          {feuillage && (
            <mesh position={[0, 2.2, 0]} castShadow>
              <icosahedronGeometry args={[0.9, 1]} />
              <meshStandardMaterial color={feuillage} flatShading />
            </mesh>
          )}
        </group>
      ))}
      {/* boutiques de l'autre côté de la rue */}
      {BOUTIQUES.map((b) => (
        <group key={b.nom} position={[b.x, 0, 17.5]}>
          <mesh position={[0, 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[7.6, 4, 3]} />
            <meshStandardMaterial color={b.c} />
          </mesh>
          <mesh position={[0, 1.05, -1.52]}>
            <planeGeometry args={[5.5, 1.8]} />
            <meshStandardMaterial color="#bcd8f2" emissive="#ffe0a3" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, 2.25, -1.85]} rotation={[0.5, 0, 0]} castShadow>
            <boxGeometry args={[6.2, 0.06, 0.9]} />
            <meshStandardMaterial color={b.store} />
          </mesh>
          {b.nom === "Brasserie" &&
            [-2, 0, 2].map((x) => (
              <group key={x} position={[x, 0, -2.6]}>
                <mesh position={[0, 0.7, 0]}>
                  <cylinderGeometry args={[0.35, 0.35, 0.04, 14]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0, 0.35, 0]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
                  <meshStandardMaterial color="#333" />
                </mesh>
              </group>
            ))}
        </group>
      ))}
      <Voiture couleur="#d32f2f" depart={0} vitesse={6} voie={11.6} />
      <Voiture couleur="#1976d2" depart={30} vitesse={5} voie={11.6} />
      <Voiture couleur="#fbc02d" depart={12} vitesse={-7} voie={13.0} />
      <Voiture couleur="#455a64" depart={45} vitesse={-5.5} voie={13.0} />
      {[
        [0, 1.2, "#e57373"],
        [20, -1.1, "#64b5f6"],
        [40, 0.9, "#81c784"],
        [9, -1.3, "#ffb74d"],
        [27, 1.0, "#9575cd"],
      ].map(([d, v, c]) => (
        <Passant key={String(d)} depart={Number(d)} vitesse={Number(v)} couleur={String(c)} z={Number(v) > 0 ? 14.6 : 15.1} />
      ))}
    </group>
  );
}

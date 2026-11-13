"use client";

import type { RefObject } from "react";
import type { Group } from "three";

// Silhouette humaine faite maison, aux proportions réalistes (≈ 1,7 m),
// avec bras et jambes articulés pilotés par le composant parent.

export type Coiffure = "courte" | "longue" | "chignon" | "carre" | "rasee";

export type Apparence = {
  haut: string; // couleur du haut
  bas: string; // pantalon / jupe
  peau: string;
  cheveux: string;
  coiffure: Coiffure;
  veste?: boolean;
};

const PRENOMS_F = new Set(["Léa", "Sophie", "Inès", "Nadia", "Camille", "Manon", "Chloé", "Emma", "Sarah", "Amina", "Zoé", "Clara", "Lina", "Jade", "Mona", "Anna", "Claire", "Hélène", "Martine", "Agathe", "Sylvie", "Mme"]);
const BAS = ["#2d3142", "#37474f", "#3e2723", "#1b2a49", "#4a4a4a", "#5d4037"];

function h(s: string) {
  let x = 0;
  for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x;
}

/** Apparence stable d'une personne, dérivée de son identifiant et de son prénom. */
export function apparencePour(id: string, prenom: string, haut: string, peau: string, cheveux: string): Apparence {
  const k = h(id + prenom);
  const femme = PRENOMS_F.has(prenom);
  const coiffure: Coiffure = femme ? (["longue", "chignon", "carre", "longue"] as Coiffure[])[k % 4] : (["courte", "courte", "rasee", "courte"] as Coiffure[])[k % 4];
  return { haut, bas: BAS[k % BAS.length], peau, cheveux, coiffure, veste: k % 3 === 0 };
}

function Capsule({ p, r, l, c, rot }: { p: [number, number, number]; r: number; l: number; c: string; rot?: [number, number, number] }) {
  return (
    <mesh position={p} rotation={rot} castShadow>
      <capsuleGeometry args={[r, l, 6, 12]} />
      <meshStandardMaterial color={c} roughness={0.75} />
    </mesh>
  );
}

type Membres = {
  jambeG: RefObject<Group | null>;
  jambeD: RefObject<Group | null>;
  brasG: RefObject<Group | null>;
  brasD: RefObject<Group | null>;
};

export default function Corps({ a, membres }: { a: Apparence; membres: Membres }) {
  const fonce = a.veste ? "#263238" : a.haut;
  return (
    <group>
      {/* jambes (pivot à la hanche) */}
      {(
        [
          [membres.jambeG, -0.09],
          [membres.jambeD, 0.09],
        ] as const
      ).map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 0.86, 0]}>
          <Capsule p={[0, -0.22, 0]} r={0.075} l={0.32} c={a.bas} />
          <Capsule p={[0, -0.6, 0]} r={0.06} l={0.34} c={a.bas} />
          <mesh position={[0, -0.84, 0.05]} castShadow>
            <boxGeometry args={[0.1, 0.07, 0.24]} />
            <meshStandardMaterial color="#1b1b1b" roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* bassin et buste */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.18]} />
        <meshStandardMaterial color={a.bas} roughness={0.75} />
      </mesh>
      <Capsule p={[0, 1.18, 0]} r={0.15} l={0.26} c={a.haut} />
      {a.veste && (
        <>
          <mesh position={[-0.085, 1.18, 0.07]} castShadow>
            <boxGeometry args={[0.1, 0.46, 0.18]} />
            <meshStandardMaterial color={fonce} roughness={0.6} />
          </mesh>
          <mesh position={[0.085, 1.18, 0.07]} castShadow>
            <boxGeometry args={[0.1, 0.46, 0.18]} />
            <meshStandardMaterial color={fonce} roughness={0.6} />
          </mesh>
        </>
      )}
      <mesh position={[0, 1.36, 0]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.2]} />
        <meshStandardMaterial color={fonce} roughness={0.7} />
      </mesh>
      {/* bras (pivot à l'épaule) */}
      {(
        [
          [membres.brasG, -0.22],
          [membres.brasD, 0.22],
        ] as const
      ).map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 1.36, 0]}>
          <Capsule p={[0, -0.16, 0]} r={0.05} l={0.22} c={fonce} />
          <Capsule p={[0, -0.42, 0]} r={0.042} l={0.22} c={a.veste ? fonce : a.peau} />
          <mesh position={[0, -0.6, 0]} castShadow>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshStandardMaterial color={a.peau} />
          </mesh>
        </group>
      ))}
      {/* cou et tête */}
      <mesh position={[0, 1.45, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.1, 10]} />
        <meshStandardMaterial color={a.peau} />
      </mesh>
      <mesh position={[0, 1.58, 0]} scale={[0.9, 1.08, 0.95]} castShadow>
        <sphereGeometry args={[0.115, 24, 18]} />
        <meshStandardMaterial color={a.peau} roughness={0.55} />
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 1.6, 0.104]}>
          <sphereGeometry args={[0.013, 8, 8]} />
          <meshStandardMaterial color="#1b1b1b" />
        </mesh>
      ))}
      <Cheveux a={a} />
    </group>
  );
}

function Cheveux({ a }: { a: Apparence }) {
  const mat = <meshStandardMaterial color={a.cheveux} roughness={0.9} />;
  const calotte = (
    <mesh position={[0, 1.62, -0.012]} scale={[0.95, 1, 1]} castShadow>
      <sphereGeometry args={[0.122, 24, 18, 0, Math.PI * 2, 0, a.coiffure === "rasee" ? Math.PI / 3.2 : Math.PI / 2]} />
      {mat}
    </mesh>
  );
  switch (a.coiffure) {
    case "longue":
      return (
        <group>
          {calotte}
          <mesh position={[0, 1.5, -0.07]} castShadow>
            <boxGeometry args={[0.22, 0.28, 0.08]} />
            {mat}
          </mesh>
        </group>
      );
    case "chignon":
      return (
        <group>
          {calotte}
          <mesh position={[0, 1.69, -0.1]} castShadow>
            <sphereGeometry args={[0.06, 14, 10]} />
            {mat}
          </mesh>
        </group>
      );
    case "carre":
      return (
        <group>
          {calotte}
          <mesh position={[0, 1.55, -0.02]} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.14, 20, 1, true, Math.PI * 0.3, Math.PI * 1.4]} />
            <meshStandardMaterial color={a.cheveux} roughness={0.9} side={2} />
          </mesh>
        </group>
      );
    default:
      return calotte;
  }
}

"use client";
/* eslint-disable react-hooks/refs -- les refs du squelette sont seulement transmises aux groupes 3D (attribut ref), jamais lues pendant le rendu */

import { useRef, type RefObject } from "react";
import type { Group } from "three";

// Silhouette humaine faite maison, aux proportions réalistes (≈ 1,70 m),
// avec hanches, genoux, épaules et coudes articulés. Le composant parent
// anime ces articulations (voir `useSquelette` et `animerSquelette`).

export type Coiffure = "courte" | "longue" | "chignon" | "carre" | "rasee";

export type Apparence = {
  haut: string;
  bas: string;
  peau: string;
  cheveux: string;
  coiffure: Coiffure;
  veste?: boolean;
};

export type Accessoire = "telephone" | "cafe" | null;

const PRENOMS_F = new Set(["Léa", "Sophie", "Inès", "Nadia", "Camille", "Manon", "Chloé", "Emma", "Sarah", "Amina", "Zoé", "Clara", "Lina", "Jade", "Mona", "Anna", "Claire", "Hélène", "Martine", "Agathe", "Sylvie", "Mme"]);
const BAS = ["#2d3142", "#37474f", "#3e2723", "#1b2a49", "#4a4a4a", "#5d4037"];

function h(s: string) {
  let x = 0;
  for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x;
}

export function apparencePour(id: string, prenom: string, haut: string, peau: string, cheveux: string): Apparence {
  const k = h(id + prenom);
  const femme = PRENOMS_F.has(prenom);
  const coiffure: Coiffure = femme ? (["longue", "chignon", "carre", "longue"] as Coiffure[])[k % 4] : (["courte", "courte", "rasee", "courte"] as Coiffure[])[k % 4];
  return { haut, bas: BAS[k % BAS.length], peau, cheveux, coiffure, veste: k % 3 === 0 };
}

// ---------- squelette ----------

export type Squelette = {
  hancheG: RefObject<Group | null>;
  hancheD: RefObject<Group | null>;
  genouG: RefObject<Group | null>;
  genouD: RefObject<Group | null>;
  epauleG: RefObject<Group | null>;
  epauleD: RefObject<Group | null>;
  coudeG: RefObject<Group | null>;
  coudeD: RefObject<Group | null>;
  buste: RefObject<Group | null>;
};

export function useSquelette(): Squelette {
  const hancheG = useRef<Group>(null);
  const hancheD = useRef<Group>(null);
  const genouG = useRef<Group>(null);
  const genouD = useRef<Group>(null);
  const epauleG = useRef<Group>(null);
  const epauleD = useRef<Group>(null);
  const coudeG = useRef<Group>(null);
  const coudeD = useRef<Group>(null);
  const buste = useRef<Group>(null);
  return { hancheG, hancheD, genouG, genouD, epauleG, epauleD, coudeG, coudeD, buste };
}

/** Pose (angles en radians). */
export type Posture = {
  hancheG: number;
  hancheD: number;
  genouG: number;
  genouD: number;
  epauleG: number;
  epauleD: number;
  epauleGz: number;
  epauleDz: number;
  coudeG: number;
  coudeD: number;
  inclinaison: number; // buste vers l'avant
  hauteur: number; // décalage vertical du corps
};

export const DEBOUT: Posture = { hancheG: 0, hancheD: 0, genouG: 0.05, genouD: 0.05, epauleG: 0.05, epauleD: 0.05, epauleGz: -0.08, epauleDz: 0.08, coudeG: -0.15, coudeD: -0.15, inclinaison: 0, hauteur: 0 };
export const ASSIS: Posture = { hancheG: -1.5, hancheD: -1.5, genouG: 1.5, genouD: 1.5, epauleG: -0.35, epauleD: -0.35, epauleGz: -0.05, epauleDz: 0.05, coudeG: -1.05, coudeD: -1.05, inclinaison: 0.08, hauteur: -0.42 };

/** Rapproche en douceur la pose courante de la cible, puis l'applique au squelette. */
export function animerSquelette(sq: Squelette, courante: Posture, cible: Posture, dt: number, vitesse = 7) {
  const k = 1 - Math.exp(-Math.min(dt, 0.1) * vitesse);
  for (const cle of Object.keys(cible) as (keyof Posture)[]) courante[cle] += (cible[cle] - courante[cle]) * k;
  const c = courante;
  if (sq.hancheG.current) sq.hancheG.current.rotation.x = c.hancheG;
  if (sq.hancheD.current) sq.hancheD.current.rotation.x = c.hancheD;
  if (sq.genouG.current) sq.genouG.current.rotation.x = c.genouG;
  if (sq.genouD.current) sq.genouD.current.rotation.x = c.genouD;
  if (sq.epauleG.current) {
    sq.epauleG.current.rotation.x = c.epauleG;
    sq.epauleG.current.rotation.z = c.epauleGz;
  }
  if (sq.epauleD.current) {
    sq.epauleD.current.rotation.x = c.epauleD;
    sq.epauleD.current.rotation.z = c.epauleDz;
  }
  if (sq.coudeG.current) sq.coudeG.current.rotation.x = c.coudeG;
  if (sq.coudeD.current) sq.coudeD.current.rotation.x = c.coudeD;
  if (sq.buste.current) {
    sq.buste.current.rotation.x = c.inclinaison;
    sq.buste.current.position.y = c.hauteur;
  }
}

/** Cycle de marche naturel : hanches, genoux et bras en opposition. */
export function postureMarche(t: number, cadence = 7.5): Posture {
  const ph = t * cadence;
  const s = Math.sin(ph);
  return {
    hancheG: s * 0.45,
    hancheD: -s * 0.45,
    genouG: Math.max(0, Math.sin(ph + 1.6)) * 0.75 + 0.05,
    genouD: Math.max(0, Math.sin(ph + 1.6 + Math.PI)) * 0.75 + 0.05,
    epauleG: -s * 0.4,
    epauleD: s * 0.4,
    epauleGz: -0.08,
    epauleDz: 0.08,
    coudeG: -0.3 - Math.max(0, s) * 0.3,
    coudeD: -0.3 - Math.max(0, -s) * 0.3,
    inclinaison: 0.04,
    hauteur: Math.abs(Math.cos(ph)) * 0.025 - 0.015,
  };
}

/** Rotation douce vers un angle (chemin le plus court). */
export function tournerVers(actuel: number, cible: number, dt: number, vitesse = 6) {
  let d = cible - actuel;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return actuel + d * (1 - Math.exp(-Math.min(dt, 0.1) * vitesse));
}

// ---------- géométrie ----------

function Capsule({ p, r, l, c }: { p: [number, number, number]; r: number; l: number; c: string }) {
  return (
    <mesh position={p} castShadow>
      <capsuleGeometry args={[r, l, 6, 12]} />
      <meshStandardMaterial color={c} roughness={0.75} />
    </mesh>
  );
}

export type Humeur = "content" | "neutre" | "triste";

export default function Corps({ a, sq, accessoire = null, humeur = "neutre" }: { a: Apparence; sq: Squelette; accessoire?: Accessoire; humeur?: Humeur }) {
  const manche = a.veste ? "#263238" : a.haut;
  return (
    <group ref={sq.buste}>
      {/* jambes : hanche → cuisse → genou → tibia → pied */}
      <Jambe hanche={sq.hancheG} genou={sq.genouG} x={-0.09} c={a.bas} />
      <Jambe hanche={sq.hancheD} genou={sq.genouD} x={0.09} c={a.bas} />
      {/* bassin et buste */}
      <mesh position={[0, 0.92, 0]} castShadow>
        <boxGeometry args={[0.3, 0.16, 0.18]} />
        <meshStandardMaterial color={a.bas} roughness={0.75} />
      </mesh>
      <Capsule p={[0, 1.18, 0]} r={0.15} l={0.26} c={a.haut} />
      {a.veste &&
        [-0.085, 0.085].map((x) => (
          <mesh key={x} position={[x, 1.18, 0.07]} castShadow>
            <boxGeometry args={[0.1, 0.46, 0.18]} />
            <meshStandardMaterial color={manche} roughness={0.6} />
          </mesh>
        ))}
      <mesh position={[0, 1.36, 0]} castShadow>
        <boxGeometry args={[0.38, 0.1, 0.2]} />
        <meshStandardMaterial color={manche} roughness={0.7} />
      </mesh>
      {/* bras : épaule → bras → coude → avant-bras → main */}
      <Bras epaule={sq.epauleG} coude={sq.coudeG} x={-0.22} manche={manche} avantBras={a.veste ? manche : a.peau} peau={a.peau} accessoire={null} />
      <Bras epaule={sq.epauleD} coude={sq.coudeD} x={0.22} manche={manche} avantBras={a.veste ? manche : a.peau} peau={a.peau} accessoire={accessoire} />
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
      {/* bouche : sourire, neutre ou moue selon le moral */}
      {humeur === "neutre" ? (
        <mesh position={[0, 1.535, 0.108]}>
          <boxGeometry args={[0.045, 0.008, 0.008]} />
          <meshStandardMaterial color="#7a3b2e" />
        </mesh>
      ) : (
        <mesh position={[0, humeur === "content" ? 1.545 : 1.525, 0.106]} rotation={[0, 0, humeur === "content" ? Math.PI : 0]}>
          <torusGeometry args={[0.024, 0.006, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#7a3b2e" />
        </mesh>
      )}
      <Cheveux a={a} />
    </group>
  );
}

type RefG = RefObject<Group | null>;

function Jambe({ hanche, genou, x, c }: { hanche: RefG; genou: RefG; x: number; c: string }) {
  return (
    <group ref={hanche} position={[x, 0.86, 0]}>
      <Capsule p={[0, -0.2, 0]} r={0.075} l={0.28} c={c} />
      <group ref={genou} position={[0, -0.42, 0]}>
        <Capsule p={[0, -0.19, 0]} r={0.06} l={0.3} c={c} />
        <mesh position={[0, -0.41, 0.05]} castShadow>
          <boxGeometry args={[0.1, 0.07, 0.24]} />
          <meshStandardMaterial color="#1b1b1b" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function Bras({ epaule, coude, x, manche, avantBras, peau, accessoire }: { epaule: RefG; coude: RefG; x: number; manche: string; avantBras: string; peau: string; accessoire: Accessoire }) {
  return (
    <group ref={epaule} position={[x, 1.36, 0]}>
      <Capsule p={[0, -0.14, 0]} r={0.05} l={0.18} c={manche} />
      <group ref={coude} position={[0, -0.29, 0]}>
        <Capsule p={[0, -0.12, 0]} r={0.042} l={0.18} c={avantBras} />
        <mesh position={[0, -0.28, 0]} castShadow>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color={peau} />
        </mesh>
        {accessoire === "telephone" && (
          <mesh position={[-0.02, -0.3, 0.04]}>
            <boxGeometry args={[0.035, 0.15, 0.075]} />
            <meshStandardMaterial color="#111" roughness={0.3} />
          </mesh>
        )}
        {accessoire === "cafe" && (
          <group position={[0, -0.32, 0.06]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.032, 0.1, 14]} />
              <meshStandardMaterial color="#f5f0e6" />
            </mesh>
            <mesh position={[0, 0.05, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.012, 14]} />
              <meshStandardMaterial color="#6d4c41" />
            </mesh>
          </group>
        )}
      </group>
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

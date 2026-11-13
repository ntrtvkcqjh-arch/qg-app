"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Group, type Mesh } from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

// Personnages animés du pack « Mini Characters » de Kenney (licence CC0).

const FEMMES = ["character-female-a", "character-female-b", "character-female-c", "character-female-d", "character-female-e", "character-female-f"];
const HOMMES = ["character-male-a", "character-male-b", "character-male-c", "character-male-d", "character-male-e", "character-male-f"];
const PRENOMS_F = new Set(["Léa", "Sophie", "Inès", "Nadia", "Camille", "Manon", "Chloé", "Emma", "Sarah", "Amina", "Zoé", "Clara", "Lina", "Jade", "Mona", "Anna", "Claire", "Hélène", "Martine", "Agathe", "Sylvie", "Mme"]);

export const url = (m: string) => `/modeles/persos/${m}.glb`;

/** Modèle attribué à un collaborateur (stable d'une partie à l'autre). */
export function modelePour(id: string, prenom: string): string {
  let h = 0;
  for (const c of id + prenom) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const liste = PRENOMS_F.has(prenom) ? FEMMES : HOMMES;
  return liste[h % liste.length];
}

export type Pose = "idle" | "walk" | "sit";

export default function Humain({ modele, pose, hauteur = 1.4 }: { modele: string; pose: Pose; hauteur?: number }) {
  const { scene, animations } = useGLTF(url(modele));
  const racine = useRef<Group>(null);
  const { objet, echelle } = useMemo(() => {
    const o = clone(scene) as Group;
    o.traverse((x) => {
      const m = x as Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
      }
    });
    const b = new Box3().setFromObject(o);
    const h = b.getSize(new Vector3()).y || 1;
    return { objet: o, echelle: hauteur / h };
  }, [scene, hauteur]);
  const { actions } = useAnimations(animations, racine);

  useEffect(() => {
    const a = actions[pose] ?? actions.idle;
    a?.reset().fadeIn(0.25).play();
    return () => {
      a?.fadeOut(0.25);
    };
  }, [actions, pose]);

  return (
    <group ref={racine} scale={echelle}>
      <primitive object={objet} />
    </group>
  );
}

if (typeof window !== "undefined") for (const m of [...FEMMES, ...HOMMES, "character-worker"]) useGLTF.preload(url(m));

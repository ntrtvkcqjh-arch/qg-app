"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { Box3, Vector3, type Mesh, type Object3D } from "three";

// Meubles 3D du « Furniture Kit » de Kenney (licence CC0, www.kenney.nl).
// Chaque modèle est recentré, posé au sol et mis à l'échelle voulue.

export const MEUBLES = [
  "desk",
  "deskCorner",
  "chairDesk",
  "computerScreen",
  "computerKeyboard",
  "laptop",
  "bookcaseOpen",
  "bookcaseClosedWide",
  "bookcaseClosed",
  "pottedPlant",
  "plantSmall1",
  "plantSmall2",
  "plantSmall3",
  "loungeSofa",
  "loungeSofaLong",
  "loungeChair",
  "loungeChairRelax",
  "loungeDesignSofa",
  "tableCoffee",
  "tableRound",
  "table",
  "chairModernCushion",
  "chairCushion",
  "kitchenBar",
  "kitchenBarEnd",
  "kitchenCoffeeMachine",
  "kitchenFridgeLarge",
  "stoolBar",
  "lampRoundFloor",
  "lampSquareTable",
  "rugRectangle",
  "rugRound",
  "trashcan",
  "coatRackStanding",
  "televisionModern",
  "sideTableDrawers",
  "cardboardBoxClosed",
  "books",
  "speaker",
] as const;

export type NomMeuble = (typeof MEUBLES)[number];

const url = (n: NomMeuble) => `/modeles/meubles/${n}.glb`;

type Props = {
  nom: NomMeuble;
  p: [number, number, number];
  rot?: number;
  /** Largeur voulue (axe x du modèle, avant rotation). Sinon `echelle`. */
  largeur?: number;
  echelle?: number;
  ombre?: boolean;
};

export function Meuble({ nom, p, rot = 0, largeur, echelle = 2.6, ombre = true }: Props) {
  const { scene } = useGLTF(url(nom));
  const { objet, s, decalage } = useMemo(() => {
    const o: Object3D = scene.clone(true);
    o.traverse((x) => {
      const m = x as Mesh;
      if (m.isMesh) {
        m.castShadow = ombre;
        m.receiveShadow = true;
      }
    });
    const b = new Box3().setFromObject(o);
    const taille = b.getSize(new Vector3());
    const centre = b.getCenter(new Vector3());
    const k = largeur ? largeur / Math.max(taille.x, 0.001) : echelle;
    return { objet: o, s: k, decalage: new Vector3(-centre.x * k, -b.min.y * k, -centre.z * k) };
  }, [scene, largeur, echelle, ombre]);

  return (
    <group position={p} rotation={[0, rot, 0]}>
      <group position={decalage} scale={s}>
        <primitive object={objet} />
      </group>
    </group>
  );
}

if (typeof window !== "undefined") for (const n of MEUBLES) useGLTF.preload(url(n));

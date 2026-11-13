"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { minuteDuJour } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { POSITIONS } from "./positions";
import Corps from "./Corps";

// Toi, l'associée, assise à ton bureau pendant les heures d'ouverture.
const PLACE = { x: 8.5, z: -6.75 };
const AVATAR_DEFAUT = { cheveux: "#2a1a12", tenue: "#121a2e", peau: "#e8b894", deco: "#3a2a1d" };

export default function Associee() {
  const presente = useJeu((s) => {
    const m = s.etat ? minuteDuJour(s.etat.minute) : 0;
    return m >= 8 * 60 + 30 && m < 19 * 60 + 30;
  });
  const corps = useRef<Group>(null);
  const jambeG = useRef<Group>(null);
  const jambeD = useRef<Group>(null);
  const brasG = useRef<Group>(null);
  const brasD = useRef<Group>(null);
  const avatar = useJeu((s) => s.etat?.avatar ?? AVATAR_DEFAUT);

  useFrame(({ clock }) => {
    POSITIONS.set("toi", { x: PLACE.x, y: 1.55, z: PLACE.z, visible: presente });
    if (corps.current) corps.current.position.y = -0.4 + Math.sin(clock.elapsedTime * 1.5) * 0.006;
    if (jambeG.current && jambeD.current) jambeG.current.rotation.x = jambeD.current.rotation.x = -1.45;
    if (brasG.current && brasD.current) {
      brasG.current.rotation.x = -1.0 + Math.sin(clock.elapsedTime * 12) * 0.06;
      brasD.current.rotation.x = -1.0 - Math.sin(clock.elapsedTime * 12) * 0.06;
    }
  });

  if (!presente) return null;
  return (
    <group position={[PLACE.x, 0, PLACE.z]}>
      <group ref={corps}>
        <Corps
          a={{ haut: avatar.tenue, bas: "#2d3142", peau: avatar.peau, cheveux: avatar.cheveux, coiffure: "longue", veste: true }}
          membres={{ jambeG, jambeD, brasG, brasD }}
        />
      </group>
    </group>
  );
}

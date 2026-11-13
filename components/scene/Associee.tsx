"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { minuteDuJour } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { POSITIONS } from "./positions";

// Toi, l'associée, assise à ton bureau pendant les heures d'ouverture.
const PLACE = { x: 8.5, z: -6.75 };

export default function Associee() {
  const presente = useJeu((s) => {
    const m = s.etat ? minuteDuJour(s.etat.minute) : 0;
    return m >= 8 * 60 + 30 && m < 19 * 60;
  });
  const corps = useRef<Group>(null);

  useFrame(({ clock }) => {
    POSITIONS.set("toi", { x: PLACE.x, y: 1.7, z: PLACE.z, visible: presente });
    if (corps.current) corps.current.position.y = -0.28 + Math.sin(clock.elapsedTime * 1.5) * 0.008;
  });

  if (!presente) return null;
  return (
    <group position={[PLACE.x, 0, PLACE.z]}>
      <group ref={corps}>
        <mesh position={[-0.09, 0.3, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
          <meshStandardMaterial color="#1f2430" />
        </mesh>
        <mesh position={[0.09, 0.3, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
          <meshStandardMaterial color="#1f2430" />
        </mesh>
        <mesh position={[0, 0.82, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.38, 6, 12]} />
          <meshStandardMaterial color="#121a2e" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.33, 0]} castShadow>
          <sphereGeometry args={[0.17, 20, 16]} />
          <meshStandardMaterial color="#e8b894" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.38, -0.05]} castShadow>
          <sphereGeometry args={[0.2, 20, 16, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshStandardMaterial color="#2a1a12" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { minuteDuJour } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { POSITIONS } from "./positions";
import Corps, { ASSIS, animerSquelette, useSquelette, type Posture } from "./Corps";

// Toi, l'associée, assise à ton bureau pendant les heures d'ouverture.
const PLACE = { x: 8.5, z: -6.75 };
const AVATAR_DEFAUT = { cheveux: "#2a1a12", tenue: "#121a2e", peau: "#e8b894", deco: "#3a2a1d" };

export default function Associee() {
  const presente = useJeu((s) => {
    const m = s.etat ? minuteDuJour(s.etat.minute) : 0;
    return m >= 8 * 60 + 30 && m < 19 * 60 + 30;
  });
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...ASSIS });
  const avatar = useJeu((s) => s.etat?.avatar ?? AVATAR_DEFAUT);

  useFrame(({ clock }, dt) => {
    POSITIONS.set("toi", { x: PLACE.x, y: 1.55, z: PLACE.z, visible: presente });
    const t = clock.elapsedTime;
    const f = Math.sin(t * 13) * 0.05;
    // tape au clavier, avec de temps en temps une pause pour réfléchir
    const reflechit = Math.sin(t * 0.25) > 0.75;
    animerSquelette(sq, pose.current, { ...ASSIS, coudeG: ASSIS.coudeG + (reflechit ? -0.9 : f), coudeD: ASSIS.coudeD - (reflechit ? 0 : f), epauleG: reflechit ? -0.8 : ASSIS.epauleG }, dt, 4);
  });

  if (!presente) return null;
  return (
    <group position={[PLACE.x, 0, PLACE.z]}>
      <Corps a={{ haut: avatar.tenue, bas: "#2d3142", peau: avatar.peau, cheveux: avatar.cheveux, coiffure: "longue", veste: true }} sq={sq} />
    </group>
  );
}

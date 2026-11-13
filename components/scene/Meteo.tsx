"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, type Points } from "three";

// Pluie ou neige autour du bâtiment (jamais à l'intérieur des pièces).

function construire(n: number, largeurBatiment: number) {
  // Générateur déterministe (le rendu doit rester pur).
  let graine = 12345;
  const alea = () => {
    graine = (graine * 16807) % 2147483647;
    return (graine - 1) / 2147483646;
  };
  const pos = new Float32Array(n * 3);
  let i = 0;
  let essais = 0;
  while (i < n && essais < n * 20) {
    essais++;
    const x = -22 + alea() * (largeurBatiment + 30);
    const z = -14 + alea() * 30;
    const dedans =
      x > -12.4 && x < largeurBatiment + 0.4 && z > -8.4 && z < 8.4;
    if (dedans) continue;
    pos[i * 3] = x;
    pos[i * 3 + 1] = alea() * 12;
    pos[i * 3 + 2] = z;
    i++;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(pos, 3));
  return g;
}

export default function Meteo({
  type,
  largeurBatiment,
}: {
  type: string;
  largeurBatiment: number;
}) {
  const ref = useRef<Points>(null);
  const n = type === "neige" ? 900 : 1400;
  const geo = useMemo(
    () => construire(n, largeurBatiment),
    [n, largeurBatiment],
  );

  useFrame((_, dt) => {
    const p = ref.current;
    if (!p) return;
    const attr = p.geometry.getAttribute("position") as BufferAttribute;
    const vitesse = type === "neige" ? 1.2 : 9;
    for (let i = 0; i < attr.count; i++) {
      let y = attr.getY(i) - vitesse * Math.min(dt, 0.1);
      if (y < 0) y = 12;
      attr.setY(i, y);
      if (type === "neige")
        attr.setX(i, attr.getX(i) + Math.sin(y + i) * 0.003);
    }
    attr.needsUpdate = true;
  });

  if (type !== "pluie" && type !== "neige") return null;
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color={type === "neige" ? "#ffffff" : "#9fb3c8"}
        size={type === "neige" ? 0.12 : 0.06}
        transparent
        opacity={type === "neige" ? 0.95 : 0.7}
      />
    </points>
  );
}

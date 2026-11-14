"use client";

import { jourDuMois, moisDe } from "@/lib/calendrier";

// Décorations de saison au rez-de-chaussée : sapin de Noël à l'accueil en
// décembre, citrouilles fin octobre.

function Sapin() {
  const boules = ["#e53935", "#fdd835", "#1e88e5", "#ffffff", "#e53935", "#fdd835"];
  return (
    <group position={[-10.6, 0, 6.6]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 0.4, 10]} />
        <meshStandardMaterial color="#8d5524" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.75 + i * 0.55, 0]} castShadow>
          <coneGeometry args={[0.85 - i * 0.22, 0.9, 12]} />
          <meshStandardMaterial color="#2e7d32" flatShading />
        </mesh>
      ))}
      {boules.map((c, i) => {
        const ang = i * 1.1;
        const h = 0.7 + (i % 3) * 0.5;
        const r = 0.7 - (i % 3) * 0.2;
        return (
          <mesh key={i} position={[Math.cos(ang) * r, h, Math.sin(ang) * r]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.4} />
          </mesh>
        );
      })}
      <mesh position={[0, 2.35, 0]}>
        <octahedronGeometry args={[0.13]} />
        <meshStandardMaterial color="#ffd54f" emissive="#ffca28" emissiveIntensity={0.9} />
      </mesh>
      {[-0.5, 0.45].map((x, i) => (
        <mesh key={x} position={[x, 0.15, 0.5 - i * 0.9]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={i ? "#8e24aa" : "#e53935"} />
        </mesh>
      ))}
    </group>
  );
}

function Citrouilles() {
  return (
    <group position={[-7.5, 0, 8.6]}>
      {[-1.2, 1.2, 0].map((x, i) => (
        <group key={x} position={[x, 0, i === 2 ? 0.5 : 0]}>
          <mesh position={[0, 0.22, 0]} scale={[1, 0.8, 1]} castShadow>
            <sphereGeometry args={[0.28, 14, 12]} />
            <meshStandardMaterial color="#ef6c00" emissive="#ff9800" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.12, 6]} />
            <meshStandardMaterial color="#4e342e" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function DecoFetes({ jour }: { jour: number }) {
  const m = moisDe(jour);
  const d = jourDuMois(jour);
  return (
    <group>
      {m === 12 && <Sapin />}
      {m === 10 && d >= 25 && <Citrouilles />}
    </group>
  );
}

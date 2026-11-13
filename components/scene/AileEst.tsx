"use client";

import { memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import type { PieceId } from "@/lib/types";

// Aile Est : bureaux des associés, salle IT, espace détente, bureau RH.
// (Les postes de l'open space annexe sont dessinés avec ceux de l'open space.)

type V3 = [number, number, number];

function B({ p, s, c, opacite }: { p: V3; s: V3; c: string; opacite?: number }) {
  return (
    <mesh position={p} castShadow={opacite === undefined} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.75} transparent={opacite !== undefined} opacity={opacite ?? 1} />
    </mesh>
  );
}

function Fauteuil({ x, z, rot = 0, c = "#5d4037" }: { x: number; z: number; rot?: number; c?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <B p={[0, 0.25, 0]} s={[0.7, 0.4, 0.7]} c={c} />
      <B p={[0, 0.6, -0.3]} s={[0.7, 0.5, 0.12]} c={c} />
    </group>
  );
}

function Leds() {
  const refs = useRef<Mesh[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      const mat = m.material as MeshStandardMaterial;
      mat.emissiveIntensity = Math.sin(clock.elapsedTime * (3 + (i % 4)) + i) > 0.2 ? 1.5 : 0.2;
    });
  });
  return (
    <>
      {[16.6, 17.3, 18].flatMap((x, k) =>
        [0.6, 0.9, 1.2, 1.5, 1.8].map((y, j) => (
          <mesh key={`${k}${j}`} ref={(m) => { if (m) refs.current[k * 5 + j] = m; }} position={[x, y, -7.18]}>
            <boxGeometry args={[0.06, 0.04, 0.02]} />
            <meshStandardMaterial color={j % 2 ? "#4caf50" : "#29b6f6"} emissive={j % 2 ? "#4caf50" : "#29b6f6"} emissiveIntensity={1} />
          </mesh>
        )),
      )}
    </>
  );
}

function Formateur() {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.8) * 0.5;
  });
  return (
    <group ref={g} position={[2.5, 0, -7.1]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.36, 6, 12]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.17, 18, 14]} />
        <meshStandardMaterial color="#e0b08a" />
      </mesh>
    </group>
  );
}

function AileEst({ pieces, formation }: { pieces: string; formation: boolean }) {
  const ouvert = (p: PieceId) => pieces.split(",").includes(p);
  const aile = ouvert("rh") || ouvert("associes");
  return (
    <group>
      {formation && ouvert("formation") && <Formateur />}
      {aile && (
        <group>
          {/* dalle, murs et couloir de l'aile */}
          <mesh position={[17.2, -0.05, 0]} receiveShadow>
            <boxGeometry args={[10.4, 0.1, 17]} />
            <meshStandardMaterial color="#d8d2c6" />
          </mesh>
          <mesh position={[17, 0.008, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[10, 2]} />
            <meshStandardMaterial color="#cbbfae" />
          </mesh>
          <B p={[17.1, 1.6, -8.1]} s={[10.2, 3.2, 0.2]} c="#efe9df" />
          <B p={[22.1, 0.15, 0]} s={[0.15, 0.3, 16.2]} c="#f3efe7" />
          <B p={[17, 0.15, 8]} s={[10, 0.3, 0.15]} c="#f3efe7" />
          {/* cloisons */}
          {[
            [12.6, 13.4],
            [14.6, 16.6],
            [17.9, 19.6],
            [20.9, 22],
          ].map(([a, b]) => (
            <B key={`f${a}`} p={[(a + b) / 2, 0.55, -2]} s={[b - a, 1.1, 0.15]} c="#f3efe7" />
          ))}
          <B p={[16, 0.55, -5]} s={[0.15, 1.1, 6]} c="#f3efe7" />
          <B p={[18.5, 0.55, -5]} s={[0.15, 1.1, 6]} c="#f3efe7" />
          <B p={[15, 0.3, 4]} s={[0.15, 0.6, 8]} c="#f3efe7" />
          {[
            [12, 12.6],
            [14.4, 17.6],
            [19.4, 22],
          ].map(([a, b]) => (
            <B key={`d${a}`} p={[(a + b) / 2, 0.3, 0]} s={[b - a, 0.6, 0.15]} c="#f3efe7" />
          ))}
        </group>
      )}

      {ouvert("associes") && (
        <group>
          {[13, 15].map((x) => (
            <group key={x}>
              <B p={[x, 0.76, -6.4]} s={[1.5, 0.07, 0.8]} c="#4e342e" />
              <B p={[x, 0.38, -6.4]} s={[1.3, 0.76, 0.1]} c="#3e2723" />
              <B p={[x, 1.05, -6.6]} s={[0.6, 0.4, 0.04]} c="#1f2430" />
              <Fauteuil x={x} z={-7.1} c="#1f2430" />
              <Fauteuil x={x} z={-5.3} rot={Math.PI} c="#8d6e63" />
            </group>
          ))}
          <B p={[14, 1.2, -7.85]} s={[3.6, 2.4, 0.3]} c="#6d4c41" />
        </group>
      )}

      {ouvert("it") && (
        <group>
          {[16.6, 17.3, 18].map((x) => (
            <B key={x} p={[x, 1.1, -7.45]} s={[0.6, 2.2, 0.5]} c="#263238" />
          ))}
          <Leds />
          <B p={[17.25, 0.75, -4]} s={[1.6, 0.06, 0.7]} c="#eceff1" />
          <B p={[17.25, 1.0, -4.2]} s={[0.5, 0.35, 0.04]} c="#1f2430" />
        </group>
      )}

      {ouvert("detente") && (
        <group>
          <B p={[20.3, 0.3, -7.4]} s={[2.6, 0.45, 0.8]} c="#26a69a" />
          <B p={[20.3, 0.65, -7.75]} s={[2.6, 0.5, 0.15]} c="#1f8a80" />
          {[
            [19.3, -5],
            [20.4, -4.3],
          ].map(([x, z]) => (
            <mesh key={`${x}`} position={[x, 0.3, z]} castShadow>
              <sphereGeometry args={[0.45, 16, 12]} />
              <meshStandardMaterial color={x > 20 ? "#ff7043" : "#ffca28"} roughness={0.9} />
            </mesh>
          ))}
          {/* tapis de course */}
          <B p={[21.4, 0.15, -4.5]} s={[0.7, 0.15, 1.6]} c="#37474f" />
          <B p={[21.4, 0.8, -3.85]} s={[0.6, 1.2, 0.08]} c="#455a64" />
          {/* phone box */}
          <B p={[19.2, 1.1, -2.9]} s={[1, 2.2, 1]} c="#b3e5fc" opacite={0.35} />
          <B p={[19.2, 2.22, -2.9]} s={[1.05, 0.06, 1.05]} c="#455a64" />
        </group>
      )}

      {ouvert("rh") && (
        <group>
          <B p={[13.5, 0.76, 2.2]} s={[1.8, 0.07, 0.8]} c="#f4f1ea" />
          <B p={[13.5, 0.38, 2.2]} s={[1.6, 0.76, 0.1]} c="#c9c4ba" />
          <B p={[13.5, 1.05, 2.0]} s={[0.6, 0.4, 0.04]} c="#1f2430" />
          <Fauteuil x={13.5} z={1.4} c="#7e57c2" />
          <Fauteuil x={13.1} z={3.2} rot={Math.PI} c="#b39ddb" />
          <Fauteuil x={13.9} z={3.2} rot={Math.PI} c="#b39ddb" />
          <B p={[14.6, 0.6, 6.5]} s={[0.5, 1.2, 1.4]} c="#90a4ae" />
        </group>
      )}
    </group>
  );
}

export default memo(AileEst);

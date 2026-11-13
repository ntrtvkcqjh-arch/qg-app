"use client";

import { memo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { PIECES, POSTES, type Piece } from "@/lib/plan";
import type { PieceId } from "@/lib/types";

type V3 = [number, number, number];

function Boite({
  p,
  s,
  c,
  ombre = true,
  opacite,
}: {
  p: V3;
  s: V3;
  c: string;
  ombre?: boolean;
  opacite?: number;
}) {
  return (
    <mesh position={p} castShadow={ombre} receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial
        color={c}
        roughness={0.8}
        transparent={opacite !== undefined}
        opacity={opacite ?? 1}
      />
    </mesh>
  );
}

function Cylindre({
  p,
  r,
  h,
  c,
  r2,
}: {
  p: V3;
  r: number;
  h: number;
  c: string;
  r2?: number;
}) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <cylinderGeometry args={[r, r2 ?? r, h, 18]} />
      <meshStandardMaterial color={c} roughness={0.8} />
    </mesh>
  );
}

function Plante({
  x,
  z,
  grande = false,
}: {
  x: number;
  z: number;
  grande?: boolean;
}) {
  const k = grande ? 1.4 : 1;
  return (
    <group position={[x, 0, z]}>
      <Cylindre
        p={[0, 0.25 * k, 0]}
        r={0.22 * k}
        r2={0.17 * k}
        h={0.5 * k}
        c="#e9e4da"
      />
      <mesh position={[0, 0.8 * k, 0]} castShadow>
        <icosahedronGeometry args={[0.42 * k, 0]} />
        <meshStandardMaterial color="#4f8a4b" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.12 * k, 1.15 * k, 0.05]} castShadow>
        <icosahedronGeometry args={[0.28 * k, 0]} />
        <meshStandardMaterial color="#5f9e57" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

function Chaise({
  x,
  z,
  rot = 0,
  c = "#3d4a5c",
}: {
  x: number;
  z: number;
  rot?: number;
  c?: string;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Cylindre p={[0, 0.22, 0]} r={0.04} h={0.44} c="#555" />
      <Boite p={[0, 0.46, 0]} s={[0.46, 0.08, 0.46]} c={c} />
      <Boite p={[0, 0.78, -0.21]} s={[0.46, 0.55, 0.07]} c={c} />
    </group>
  );
}

function Bureau({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Boite p={[0, 0.74, 0]} s={[1.9, 0.06, 0.85]} c="#f4f1ea" />
      <Boite p={[-0.88, 0.37, 0]} s={[0.06, 0.74, 0.8]} c="#c9c4ba" />
      <Boite p={[0.88, 0.37, 0]} s={[0.06, 0.74, 0.8]} c="#c9c4ba" />
      {/* écran */}
      <Boite p={[0, 1.08, 0.22]} s={[0.75, 0.45, 0.04]} c="#1f2430" />
      <mesh position={[0, 1.08, 0.195]}>
        <planeGeometry args={[0.68, 0.38]} />
        <meshStandardMaterial
          color="#7fb2ff"
          emissive="#4a7fd6"
          emissiveIntensity={0.5}
          side={2}
        />
      </mesh>
      <Boite p={[0, 0.83, 0.24]} s={[0.06, 0.16, 0.06]} c="#1f2430" />
      <Boite p={[0, 0.78, -0.12]} s={[0.5, 0.02, 0.16]} c="#d9d9d9" />
    </group>
  );
}

function Sol({
  piece,
  onClick,
}: {
  piece: Piece;
  onClick: (id: PieceId) => void;
}) {
  const w = piece.x1 - piece.x0;
  const d = piece.z1 - piece.z0;
  return (
    <mesh
      position={[(piece.x0 + piece.x1) / 2, 0.01, (piece.z0 + piece.z1) / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      onClick={(ev: ThreeEvent<MouseEvent>) => {
        ev.stopPropagation();
        onClick(piece.id);
      }}
    >
      <planeGeometry args={[w - 0.05, d - 0.05]} />
      <meshStandardMaterial color={piece.sol} roughness={0.95} />
    </mesh>
  );
}

const MUR = "#f3efe7";
const H_CLOISON = 1.1;
const H_FOND = 3.2;

/** Cloison le long de x (z fixe) avec des ouvertures. */
function CloisonX({
  z,
  x0,
  x1,
  portes,
  h = H_CLOISON,
  c = MUR,
  ep = 0.15,
  opacite,
}: {
  z: number;
  x0: number;
  x1: number;
  portes: number[];
  h?: number;
  c?: string;
  ep?: number;
  opacite?: number;
}) {
  const segs: [number, number][] = [];
  let debut = x0;
  for (const p of [...portes].sort((a, b) => a - b)) {
    if (p - 0.9 > debut) segs.push([debut, p - 0.9]);
    debut = p + 0.9;
  }
  if (debut < x1) segs.push([debut, x1]);
  return (
    <>
      {segs.map(([a, b]) => (
        <Boite
          key={a}
          p={[(a + b) / 2, h / 2, z]}
          s={[b - a, h, ep]}
          c={c}
          opacite={opacite}
          ombre={opacite === undefined}
        />
      ))}
    </>
  );
}

function CloisonZ({
  x,
  z0,
  z1,
  h = H_CLOISON,
  c = MUR,
  opacite,
}: {
  x: number;
  z0: number;
  z1: number;
  h?: number;
  c?: string;
  opacite?: number;
}) {
  return (
    <Boite
      p={[x, h / 2, (z0 + z1) / 2]}
      s={[0.15, h, z1 - z0]}
      c={c}
      opacite={opacite}
      ombre={opacite === undefined}
    />
  );
}

function Decor({ onPiece }: { onPiece: (id: PieceId) => void }) {
  return (
    <group>
      {/* dalle et extérieur */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[25, 0.1, 17]} />
        <meshStandardMaterial color="#d8d2c6" />
      </mesh>
      <mesh
        position={[0, -0.12, 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#e9edf2" />
      </mesh>
      {/* couloir */}
      <mesh
        position={[0, 0.008, -1]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[24, 2]} />
        <meshStandardMaterial color="#cbbfae" />
      </mesh>
      {PIECES.map((p) => (
        <Sol key={p.id} piece={p} onClick={onPiece} />
      ))}

      {/* murs du fond (hauts) avec fenêtres */}
      <Boite p={[0, H_FOND / 2, -8.1]} s={[24.3, H_FOND, 0.2]} c="#efe9df" />
      <Boite p={[-12.1, H_FOND / 2, 0]} s={[0.2, H_FOND, 16.4]} c="#e9e2d6" />
      {[-9, -3, 3, 9].map((x) => (
        <mesh key={x} position={[x, 1.9, -7.98]}>
          <planeGeometry args={[3.2, 1.3]} />
          <meshStandardMaterial
            color="#bcd8f2"
            emissive="#9cc4ea"
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
      {[-5, 4].map((z) => (
        <mesh
          key={z}
          position={[-11.98, 1.9, z]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[3, 1.3]} />
          <meshStandardMaterial
            color="#bcd8f2"
            emissive="#9cc4ea"
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}

      {/* cloisons basses */}
      <CloisonX z={-2} x0={-12} x1={5} portes={[-8.5, -2.5, 2.5]} />
      <CloisonX
        z={-2}
        x0={5}
        x1={12}
        portes={[8.5]}
        c="#cfe3f5"
        opacite={0.45}
        h={2.2}
        ep={0.06}
      />
      <CloisonZ x={-5} z0={-8} z1={-2} />
      <CloisonZ x={0} z0={-8} z1={-2} />
      <CloisonZ x={5} z0={-8} z1={-2} c="#cfe3f5" opacite={0.45} h={2.2} />
      <CloisonX z={0} x0={-12} x1={12} portes={[-9, -1.2, 1.2, 9]} h={0.6} />
      <CloisonZ x={-6} z0={0} z1={8} h={0.6} />
      <CloisonZ x={6} z0={0} z1={8} h={0.6} />
      <CloisonX z={8} x0={-12} x1={12} portes={[-9]} h={0.3} />
      <CloisonZ x={12} z0={-8} z1={8} h={0.3} />

      {/* Salle de réunion */}
      <Boite p={[-8.5, 0.76, -5]} s={[4.2, 0.08, 1.8]} c="#7a5638" />
      <Boite p={[-8.5, 0.38, -5]} s={[0.3, 0.76, 1]} c="#5b3f29" />
      {[-10, -8.5, -7].flatMap((x) => [
        <Chaise key={`a${x}`} x={x} z={-6.25} c="#2f5bea" />,
        <Chaise key={`b${x}`} x={x} z={-3.75} rot={Math.PI} c="#2f5bea" />,
      ])}
      <Boite p={[-8.5, 1.6, -7.9]} s={[3, 1.3, 0.06]} c="#ffffff" />
      <Boite p={[-8.5, 0.92, -7.85]} s={[3, 0.06, 0.15]} c="#9aa4b1" />

      {/* Archives */}
      {[-4.2, -2.5, -0.8].map((x) => (
        <group key={x}>
          <Boite p={[x, 1.1, -7.5]} s={[1.5, 2.2, 0.6]} c="#8d7b68" />
          {[0.35, 0.95, 1.55].map((y) =>
            [-0.5, -0.25, 0, 0.25, 0.5].map((dx, i) => (
              <Boite
                key={`${y}${dx}`}
                p={[x + dx, y + 0.2, -7.3]}
                s={[0.18, 0.42, 0.4]}
                c={
                  ["#d1495b", "#2f5bea", "#f2a541", "#17a398", "#8e44ad"][
                    (i + Math.round(y * 3)) % 5
                  ]
                }
                ombre={false}
              />
            )),
          )}
        </group>
      ))}
      <Boite p={[-2.5, 0.5, -4.5]} s={[1.6, 1, 0.8]} c="#b8ad9f" />
      <Boite p={[-2.5, 1.05, -4.5]} s={[0.4, 0.1, 0.3]} c="#f4f1ea" />

      {/* Formation */}
      <Boite p={[2.5, 1.7, -7.9]} s={[3.4, 1.8, 0.05]} c="#fafafa" />
      <mesh position={[2.5, 1.7, -7.87]}>
        <planeGeometry args={[3.2, 1.6]} />
        <meshStandardMaterial
          color="#e8f0ff"
          emissive="#c8dbff"
          emissiveIntensity={0.35}
        />
      </mesh>
      {[-5.6, -4.1].flatMap((z) =>
        [1.5, 3.5].map((x) => (
          <group key={`${x}${z}`}>
            <Boite p={[x, 0.72, z]} s={[1.4, 0.05, 0.6]} c="#f4f1ea" />
            <Boite p={[x, 0.36, z]} s={[1.3, 0.72, 0.05]} c="#c9c4ba" />
            <Chaise x={x - 0.35} z={z + 0.6} rot={Math.PI} c="#17a398" />
            <Chaise x={x + 0.35} z={z + 0.6} rot={Math.PI} c="#17a398" />
          </group>
        )),
      )}

      {/* Ton bureau (associée) */}
      <mesh
        position={[8.5, 0.012, -5]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.2, 40]} />
        <meshStandardMaterial color="#e7d8c3" />
      </mesh>
      <group position={[8.5, 0, -6]}>
        <Boite p={[0, 0.76, 0]} s={[2.6, 0.08, 1.1]} c="#3a2a1d" />
        <Boite p={[-1.15, 0.38, 0]} s={[0.15, 0.76, 1]} c="#2c2016" />
        <Boite p={[1.15, 0.38, 0]} s={[0.15, 0.76, 1]} c="#2c2016" />
        <Boite p={[-0.5, 1.1, -0.25]} s={[0.9, 0.55, 0.04]} c="#1f2430" />
        <Boite p={[0.6, 0.83, 0.1]} s={[0.35, 0.05, 0.25]} c="#c0c0c0" />
      </group>
      <Chaise x={8.5} z={-6.9} c="#1f2430" />
      <Chaise x={8} z={-4.6} rot={Math.PI} c="#8b6f4e" />
      <Chaise x={9.1} z={-4.6} rot={Math.PI} c="#8b6f4e" />
      <Boite p={[11.6, 1.2, -6]} s={[0.5, 2.4, 2.4]} c="#6b4f36" />
      {[-0.8, 0, 0.8].map((dz) => (
        <Boite
          key={dz}
          p={[11.4, 1.5, -6 + dz]}
          s={[0.25, 0.4, 0.5]}
          c="#c9a227"
          ombre={false}
        />
      ))}
      <Plante x={6} z={-7.3} grande />
      <Boite p={[11.2, 0.35, -3.2]} s={[1, 0.5, 1.8]} c="#a9744f" />

      {/* Accueil */}
      <Boite p={[-9, 0.55, 2]} s={[3, 1.1, 0.7]} c="#2f3b52" />
      <Boite p={[-9, 1.12, 2]} s={[3.1, 0.06, 0.8]} c="#e9e4da" />
      <Chaise x={-9} z={1.2} c="#2f3b52" />
      <Boite p={[-11.3, 0.35, 5.5]} s={[0.9, 0.5, 2.6]} c="#c17c5a" />
      <Boite p={[-11.65, 0.7, 5.5]} s={[0.25, 0.7, 2.6]} c="#b36d4c" />
      <Boite p={[-10.2, 0.25, 5.5]} s={[0.8, 0.4, 0.8]} c="#e9e4da" />
      <Plante x={-7} z={7.2} grande />
      <Plante x={-11.4} z={0.8} />

      {/* Open space */}
      <mesh
        position={[0, 0.012, 4.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[10.6, 6.6]} />
        <meshStandardMaterial color="#8aa3cf" />
      </mesh>
      {POSTES.map((p, i) => (
        <group key={i}>
          <Bureau x={p.x} z={p.z} rot={p.rot} />
          <Chaise x={p.x} z={p.z + (p.rot === 0 ? -0.7 : 0.7)} rot={p.rot} />
        </group>
      ))}
      <Plante x={-5.4} z={0.7} />
      <Plante x={5.4} z={0.7} />
      <Plante x={0} z={7.3} grande />
      <Boite p={[0, 0.5, 3.8]} s={[0.5, 1, 1.4]} c="#d4cfc4" />

      {/* Cafétéria */}
      <Boite p={[11.5, 0.5, 4]} s={[0.8, 1, 5]} c="#f0ece4" />
      <Boite p={[11.5, 1.03, 4]} s={[0.9, 0.06, 5.1]} c="#5d6d7e" />
      <Boite p={[11.5, 1.3, 2.4]} s={[0.5, 0.5, 0.4]} c="#1f2430" />
      <Boite p={[11.5, 1.1, 6.8]} s={[0.8, 2.2, 0.8]} c="#dfe6ec" />
      {[
        [8, 3],
        [9.4, 5.8],
      ].map(([x, z]) => (
        <group key={`${x}`}>
          <Cylindre p={[x, 0.72, z]} r={0.6} h={0.05} c="#ffffff" />
          <Cylindre p={[x, 0.36, z]} r={0.06} h={0.72} c="#666" />
          {[0, 1, 2].map((k) => (
            <Cylindre
              key={k}
              p={[
                x + Math.cos(k * 2.1) * 0.9,
                0.3,
                z + Math.sin(k * 2.1) * 0.9,
              ]}
              r={0.22}
              h={0.6}
              c="#f2a541"
            />
          ))}
        </group>
      ))}
      <Plante x={6.6} z={7.3} />
    </group>
  );
}

export default memo(Decor);

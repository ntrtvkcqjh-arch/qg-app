"use client";

import { memo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { PIECES, POSTES, type Piece } from "@/lib/plan";
import type { PieceId } from "@/lib/types";
import { ORDRE_POSTES, niveauLocaux } from "@/lib/data/locaux";
import { AILE_EST } from "@/lib/plan";
import { revetement, skyline, type Revetement } from "./textures";

const REVETEMENT: Partial<Record<PieceId, Revetement>> = {
  associee: "parquet",
  accueil: "parquet",
  reunion: "parquet",
  associes: "parquet",
  openspace: "moquette",
  annexe: "moquette",
  formation: "moquette",
  rh: "moquette",
  cafe: "carrelage",
  detente: "carrelage",
  archives: "beton",
  it: "beton",
};

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
  echelle = 1,
  fane = false,
}: {
  x: number;
  z: number;
  grande?: boolean;
  echelle?: number;
  fane?: boolean;
}) {
  const k = (grande ? 1.4 : 1) * echelle;
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
        <meshStandardMaterial color={fane ? "#9a9a4b" : "#4f8a4b"} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.12 * k, 1.15 * k, 0.05]} castShadow>
        <icosahedronGeometry args={[0.28 * k, 0]} />
        <meshStandardMaterial color={fane ? "#a8a356" : "#5f9e57"} roughness={0.9} flatShading />
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
  verrou,
  onDouble,
}: {
  piece: Piece;
  onClick: (id: PieceId) => void;
  verrou: boolean;
  onDouble?: (id: PieceId) => void;
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
      onDoubleClick={(ev: ThreeEvent<MouseEvent>) => {
        ev.stopPropagation();
        onDouble?.(piece.id);
      }}
    >
      <planeGeometry args={[w - 0.05, d - 0.05]} />
      {verrou || !REVETEMENT[piece.id] ? (
        <meshStandardMaterial color={verrou ? "#bdb8b0" : piece.sol} roughness={0.95} />
      ) : (
        <meshStandardMaterial color={piece.sol} map={revetement(REVETEMENT[piece.id]!, w, d)} roughness={0.85} />
      )}
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

type PropsDecor = {
  onPiece: (id: PieceId) => void;
  onFocus: (id: PieceId) => void;
  niveau: number;
  achats: string; // ids séparés par des virgules
  mois: number;
  fenetre: string; // couleur des fenêtres selon l'heure
  mood: number; // arrondi à la dizaine
  piles: string; // charge par poste, ex. "2,0,5,…"
  poles: string; // couleur du pôle par poste, ex. "#2f5bea,,#17a398,…"
  deco: string; // bois de ton bureau
  nuit: boolean;
  meteo: string;
};

function Sapin({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cylindre p={[0, 0.15, 0]} r={0.12} h={0.3} c="#6b4423" />
      {[0, 1, 2].map((k) => (
        <mesh key={k} position={[0, 0.6 + k * 0.42, 0]} castShadow>
          <coneGeometry args={[0.7 - k * 0.18, 0.7, 10]} />
          <meshStandardMaterial color="#2e7d32" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 1.75, 0]}>
        <octahedronGeometry args={[0.13]} />
        <meshStandardMaterial color="#ffd54f" emissive="#ffb300" emissiveIntensity={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} position={[Math.cos(k * 1.3) * 0.45, 0.7 + (k % 3) * 0.3, Math.sin(k * 1.3) * 0.45]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial color={["#e53935", "#fdd835", "#1e88e5"][k % 3]} emissive={["#e53935", "#fdd835", "#1e88e5"][k % 3]} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function Chantier({ piece }: { piece: (typeof PIECES)[number] }) {
  const cx = (piece.x0 + piece.x1) / 2;
  const cz = (piece.z0 + piece.z1) / 2;
  return (
    <group>
      {[-1, 0, 1].map((k) => (
        <mesh key={k} position={[cx + k * 1.2, 0.3, cz]} castShadow>
          <coneGeometry args={[0.22, 0.6, 12]} />
          <meshStandardMaterial color="#ff7f27" />
        </mesh>
      ))}
      <Boite p={[cx, 0.5, cz + 0.8]} s={[3, 0.12, 0.08]} c="#ffd400" />
      <Boite p={[cx, 0.25, cz + 1.8]} s={[1.4, 0.5, 0.9]} c="#a1887f" />
    </group>
  );
}

function Decor({ onPiece, onFocus, niveau, achats, mois, fenetre, mood, piles, poles, deco, nuit, meteo }: PropsDecor) {
  const couleursPoles = poles.split(",");
  const vue = skyline(fenetre, nuit, meteo);
  const aile = niveau >= 5;
  const visibles = PIECES.filter((p) => !AILE_EST.includes(p.id) || niveau >= 4);
  const n = niveauLocaux(niveau);
  const ouvert = (id: PieceId) => n.pieces.includes(id);
  const a = new Set(achats.split(",").filter(Boolean));
  const postes = new Set(ORDRE_POSTES.slice(0, n.postes));
  const charges = piles.split(",").map(Number);
  const echelle = 0.75 + (mood / 100) * 0.6;
  const fane = mood < 40;
  const premium = niveau >= 4;

  return (
    <group>
      {/* dalle et extérieur */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[25, 0.1, 17]} />
        <meshStandardMaterial color="#d8d2c6" />
      </mesh>
      <mesh position={[0, -0.12, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color="#e9edf2" />
      </mesh>
      <mesh position={[0, 0.008, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 2]} />
        <meshStandardMaterial color="#cbbfae" />
      </mesh>
      {visibles.map((p) => (
        <Sol key={p.id} piece={p} onClick={onPiece} onDouble={onFocus} verrou={!ouvert(p.id)} />
      ))}
      {visibles.filter((p) => !ouvert(p.id)).map((p) => (
        <Chantier key={p.id} piece={p} />
      ))}

      {/* murs du fond avec fenêtres (couleur selon l'heure) */}
      <Boite p={[0, H_FOND / 2, -8.1]} s={[24.3, H_FOND, 0.2]} c={premium ? "#f4efe6" : "#efe9df"} />
      <Boite p={[-12.1, H_FOND / 2, 0]} s={[0.2, H_FOND, 16.4]} c="#e9e2d6" />
      {premium && <Boite p={[0, 3.1, -7.98]} s={[24.2, 0.08, 0.05]} c="#c9a227" ombre={false} />}
      {[-9, -3, 3, 9].map((x) => (
        <mesh key={x} position={[x, 1.9, -7.98]}>
          <planeGeometry args={[3.2, 1.3]} />
          <meshStandardMaterial map={vue} emissive="#ffffff" emissiveMap={vue} emissiveIntensity={nuit ? 0.9 : 0.45} />
        </mesh>
      ))}
      {[-5, 4].map((z) => (
        <mesh key={z} position={[-11.98, 1.9, z]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[3, 1.3]} />
          <meshStandardMaterial map={vue} emissive="#ffffff" emissiveMap={vue} emissiveIntensity={nuit ? 0.9 : 0.45} />
        </mesh>
      ))}
      {premium &&
        [-6, 0, 6].map((x, k) => (
          <group key={x} position={[x, 1.9, -7.97]}>
            <Boite p={[0, 0, 0]} s={[1, 0.75, 0.04]} c="#c9a227" ombre={false} />
            <Boite p={[0, 0, 0.02]} s={[0.85, 0.6, 0.02]} c={["#3f51b5", "#e57373", "#26a69a"][k]} ombre={false} />
          </group>
        ))}
      {a.has("clim") &&
        [-3, 3, 9].map((x) => <Boite key={x} p={[x, 2.75, -7.9]} s={[1.1, 0.3, 0.25]} c="#fafafa" />)}

      {/* cloisons basses */}
      <CloisonX z={-2} x0={-12} x1={5} portes={[-8.5, -2.5, 2.5]} />
      <CloisonX z={-2} x0={5} x1={12} portes={[8.5]} c="#cfe3f5" opacite={0.45} h={2.2} ep={0.06} />
      <CloisonZ x={-5} z0={-8} z1={-2} />
      <CloisonZ x={0} z0={-8} z1={-2} />
      <CloisonZ x={5} z0={-8} z1={-2} c="#cfe3f5" opacite={0.45} h={2.2} />
      <CloisonX z={0} x0={-12} x1={12} portes={[-9, -1.2, 1.2, 9]} h={0.6} />
      <CloisonZ x={-6} z0={0} z1={8} h={0.6} />
      <CloisonZ x={6} z0={0} z1={8} h={0.6} />
      <CloisonX z={8} x0={-12} x1={12} portes={[-9]} h={0.3} />
      {!aile && <CloisonZ x={12} z0={-8} z1={8} h={0.3} />}

      {ouvert("reunion") && (
        <group>
          <Boite p={[-8.5, 0.76, -5]} s={[4.2, 0.08, 1.8]} c={premium ? "#4e342e" : "#7a5638"} />
          <Boite p={[-8.5, 0.38, -5]} s={[0.3, 0.76, 1]} c="#5b3f29" />
          {[-10, -8.5, -7].flatMap((x) => [
            <Chaise key={`a${x}`} x={x} z={-6.25} c="#2f5bea" />,
            <Chaise key={`b${x}`} x={x} z={-3.75} rot={Math.PI} c="#2f5bea" />,
          ])}
          <Boite p={[-8.5, 1.6, -7.9]} s={[3, 1.3, 0.06]} c="#ffffff" />
          <Boite p={[-8.5, 0.92, -7.85]} s={[3, 0.06, 0.15]} c="#9aa4b1" />
          {a.has("visio") && (
            <group position={[-11.9, 1.6, -5]} rotation={[0, Math.PI / 2, 0]}>
              <Boite p={[0, 0, 0]} s={[2.4, 1.35, 0.08]} c="#111" />
              <mesh position={[0, 0, 0.045]}>
                <planeGeometry args={[2.25, 1.2]} />
                <meshStandardMaterial color="#5c8dff" emissive="#3b6ef5" emissiveIntensity={0.6} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {ouvert("archives") && (
        <group>
          {[-4.2, -2.5, -0.8].map((x) => (
            <group key={x}>
              <Boite p={[x, 1.1, -7.5]} s={[1.5, 2.2, 0.6]} c="#8d7b68" />
              {[0.35, 0.95, 1.55].map((y) =>
                [-0.5, -0.25, 0, 0.25, 0.5].map((dx, i) => (
                  <Boite key={`${y}${dx}`} p={[x + dx, y + 0.2, -7.3]} s={[0.18, 0.42, 0.4]} c={["#d1495b", "#2f5bea", "#f2a541", "#17a398", "#8e44ad"][(i + Math.round(y * 3)) % 5]} ombre={false} />
                )),
              )}
            </group>
          ))}
          <Boite p={[-2.5, 0.5, -4.5]} s={[1.6, 1, 0.8]} c="#b8ad9f" />
          <Boite p={[-2.5, 1.05, -4.5]} s={[0.4, 0.1, 0.3]} c="#f4f1ea" />
          {(mois === 4 || mois === 5) &&
            [-3.8, -1.2].map((x) => <Boite key={x} p={[x, 0.35, -3]} s={[0.7, 0.7, 0.5]} c="#d7ccc8" />)}
          {a.has("biblio") && (
            <group position={[-4.75, 0, -4.5]}>
              <Boite p={[0, 1, 0]} s={[0.4, 2, 2]} c="#5d4037" />
              {[0.5, 1.1, 1.6].map((y) => (
                <Boite key={y} p={[0.1, y, 0]} s={[0.25, 0.35, 1.8]} c="#1565c0" ombre={false} />
              ))}
            </group>
          )}
        </group>
      )}

      {ouvert("formation") && (
        <group>
          <Boite p={[2.5, 1.7, -7.9]} s={[3.4, 1.8, 0.05]} c="#fafafa" />
          <mesh position={[2.5, 1.7, -7.87]}>
            <planeGeometry args={[3.2, 1.6]} />
            <meshStandardMaterial color="#e8f0ff" emissive="#c8dbff" emissiveIntensity={0.35} />
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
        </group>
      )}

      {/* Ton bureau */}
      <mesh position={[8.5, 0.012, -5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.2, 40]} />
        <meshStandardMaterial color={premium ? "#d7c4a3" : "#e7d8c3"} />
      </mesh>
      <group position={[8.5, 0, -6]}>
        <Boite p={[0, 0.76, 0]} s={[2.6, 0.08, 1.1]} c={deco} />
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
        <Boite key={dz} p={[11.4, 1.5, -6 + dz]} s={[0.25, 0.4, 0.5]} c="#c9a227" ombre={false} />
      ))}
      <Plante echelle={echelle} fane={fane} x={6} z={-7.3} grande />
      <Boite p={[11.2, 0.35, -3.2]} s={[1, 0.5, 1.8]} c="#a9744f" />

      {/* Accueil */}
      <Boite p={[-9, 0.55, 2]} s={[3, 1.1, 0.7]} c="#2f3b52" />
      <Boite p={[-9, 1.12, 2]} s={[3.1, 0.06, 0.8]} c={premium ? "#c9a227" : "#e9e4da"} />
      <Chaise x={-9} z={1.2} c="#2f3b52" />
      <Boite p={[-11.3, 0.35, 5.5]} s={[0.9, 0.5, 2.6]} c="#c17c5a" />
      <Boite p={[-11.65, 0.7, 5.5]} s={[0.25, 0.7, 2.6]} c="#b36d4c" />
      <Boite p={[-10.2, 0.25, 5.5]} s={[0.8, 0.4, 0.8]} c="#e9e4da" />
      <Plante echelle={echelle} fane={fane} x={-7} z={7.2} grande />
      <Plante echelle={echelle} fane={fane} x={-11.4} z={0.8} />
      {mois === 12 && <Sapin x={-7.4} z={4.2} />}
      {mois === 10 && (
        <mesh position={[-7.2, 0.25, 6]} castShadow>
          <sphereGeometry args={[0.3, 14, 10]} />
          <meshStandardMaterial color="#ef6c00" />
        </mesh>
      )}

      {/* Open space */}
      <mesh position={[0, 0.012, 4.3]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.6, 6.6]} />
        <meshStandardMaterial color="#8aa3cf" />
      </mesh>
      {POSTES.map((p, i) =>
        postes.has(i) ? (
          <group key={i}>
            {couleursPoles[i] && (
              <mesh position={[p.x, 0.016, p.z + (p.rot === 0 ? -0.35 : 0.35)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[2, 1.9]} />
                <meshStandardMaterial color={couleursPoles[i]} transparent opacity={0.35} />
              </mesh>
            )}
            <Bureau x={p.x} z={p.z} rot={p.rot} />
            <Boite p={[p.x + (p.rot === 0 ? -0.55 : 0.55), 0.83, p.z + (p.rot === 0 ? -0.15 : 0.15)]} s={[0.09, 0.11, 0.09]} c={i % 3 ? "#ffffff" : "#d1495b"} ombre={false} />
            <Chaise x={p.x} z={p.z + (p.rot === 0 ? -0.7 : 0.7)} rot={p.rot} />
            {Array.from({ length: Math.min(6, charges[i] ?? 0) }).map((_, k) => (
              <Boite key={k} p={[p.x + (p.rot === 0 ? 0.65 : -0.65), 0.8 + k * 0.07, p.z]} s={[0.32, 0.06, 0.42]} c={k % 2 ? "#f5f5f5" : "#fff3c4"} ombre={false} />
            ))}
            {(mois === 7 || mois === 8) && !a.has("clim") && (
              <Cylindre p={[p.x + (p.rot === 0 ? -0.7 : 0.7), 0.9, p.z]} r={0.12} h={0.25} c="#90a4ae" />
            )}
          </group>
        ) : null,
      )}
      <Plante echelle={echelle} fane={fane} x={-5.4} z={0.7} />
      <Plante echelle={echelle} fane={fane} x={5.4} z={0.7} />
      <Plante echelle={echelle} fane={fane} x={0} z={7.3} grande />
      <Boite p={[0, 0.5, 3.8]} s={[0.5, 1, 1.4]} c="#d4cfc4" />
      {a.has("imprimante") && <Boite p={[5.3, 0.5, 3.5]} s={[0.7, 1, 0.6]} c="#607d8b" />}
      {a.has("mur_vegetal") && (
        <group>
          {[-4.5, -3, -1.5, 1.5, 3, 4.5].map((x) => (
            <mesh key={x} position={[x, 0.55, 7.75]} castShadow>
              <icosahedronGeometry args={[0.45, 0]} />
              <meshStandardMaterial color="#43a047" flatShading />
            </mesh>
          ))}
        </group>
      )}

      {ouvert("cafe") && (
        <group>
          <Boite p={[11.5, 0.5, 4]} s={[0.8, 1, 5]} c="#f0ece4" />
          <Boite p={[11.5, 1.03, 4]} s={[0.9, 0.06, 5.1]} c="#5d6d7e" />
          <Boite p={[11.5, 1.3, 2.4]} s={[0.5, 0.5, 0.4]} c={a.has("cafe_premium") ? "#c9a227" : "#1f2430"} />
          <Boite p={[11.5, 1.1, 6.8]} s={[0.8, 2.2, 0.8]} c="#dfe6ec" />
          {[
            [8, 3],
            [9.4, 5.8],
          ].map(([x, z]) => (
            <group key={`${x}`}>
              <Cylindre p={[x, 0.72, z]} r={0.6} h={0.05} c="#ffffff" />
              <Cylindre p={[x, 0.36, z]} r={0.06} h={0.72} c="#666" />
              {[0, 1, 2].map((k) => (
                <Cylindre key={k} p={[x + Math.cos(k * 2.1) * 0.9, 0.3, z + Math.sin(k * 2.1) * 0.9]} r={0.22} h={0.6} c="#f2a541" />
              ))}
            </group>
          ))}
          <Plante echelle={echelle} fane={fane} x={6.6} z={7.3} />
          {a.has("canape") && (
            <group position={[7.4, 0, 1]}>
              <Boite p={[0, 0.3, 0]} s={[2.2, 0.45, 0.9]} c="#7e57c2" />
              <Boite p={[0, 0.65, -0.38]} s={[2.2, 0.55, 0.2]} c="#6a45b0" />
            </group>
          )}
          {a.has("babyfoot") && (
            <group position={[7.6, 0, 6.8]}>
              <Boite p={[0, 0.8, 0]} s={[1.3, 0.25, 0.75]} c="#2e7d32" />
              {[-0.55, 0.55].map((x) => (
                <Boite key={x} p={[x, 0.4, 0]} s={[0.1, 0.8, 0.6]} c="#5d4037" />
              ))}
            </group>
          )}
        </group>
      )}
    </group>
  );
}

export default memo(Decor);

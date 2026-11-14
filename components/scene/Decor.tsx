"use client";

import { memo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { ASCENSEUR, PIECES, POSTES, type Piece } from "@/lib/plan";
import type { PieceId } from "@/lib/types";
import { niveauLocaux } from "@/lib/data/locaux";
import { revetement, skyline, type Revetement } from "./textures";
import { Meuble } from "./Modeles";

const ECHELLE = 2.0; // échelle commune des meubles Kenney (bureau ≈ 0,77 de haut)
const HAUT_BUREAU = 0.77; // hauteur du plateau du bureau à cette échelle

const REVETEMENT: Partial<Record<PieceId, Revetement>> = {
  associee: "parquet",
  accueil: "parquet",
  reunion: "parquet",
  reunion2: "parquet",
  conseil: "parquet",
  bur_expertise: "parquet",
  bur_fiscal: "parquet",
  bur_social: "parquet",
  bur_juridique: "parquet",
  bur_audit: "parquet",
  terrasse: "parquet",
  openspace: "moquette",
  os_fiscal: "moquette",
  os_social: "moquette",
  os_juridique: "moquette",
  annexe: "moquette",
  plateau3: "moquette",
  ext_expertise: "moquette",
  ext_fiscal: "moquette",
  ext_social: "moquette",
  ext_juridique: "moquette",
  ext_audit: "moquette",
  bulle4: "moquette",
  bulle5: "moquette",
  formation: "moquette",
  rh: "moquette",
  bulle1: "moquette",
  bulle2: "moquette",
  bulle3: "moquette",
  cafe: "carrelage",
  detente: "carrelage",
  pressing: "carrelage",
  sport: "beton",
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

function Plante({ x, z, grande = false, echelle = 1, fane = false }: { x: number; z: number; grande?: boolean; echelle?: number; fane?: boolean }) {
  // Une plante fanée est plus petite ; la taille suit le moral de l'équipe.
  return <Meuble nom={grande ? "pottedPlant" : fane ? "plantSmall3" : "plantSmall1"} p={[x, 0, z]} echelle={ECHELLE * (grande ? 1.3 : 1.6) * echelle} />;
}

function Chaise({ x, z, rot = 0, c }: { x: number; z: number; rot?: number; c?: string }) {
  void c;
  return <Meuble nom="chairDesk" p={[x, 0, z]} rot={rot + Math.PI} echelle={ECHELLE} />;
}

function Bureau({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  // Modèles Kenney : bureau, écran et clavier (le dos du bureau est côté +z local).
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Meuble nom="desk" p={[0, 0, 0]} rot={Math.PI} echelle={ECHELLE} />
      <Meuble nom="computerScreen" p={[0, HAUT_BUREAU, 0.2]} rot={Math.PI} echelle={ECHELLE} ombre={false} />
      <Meuble nom="computerKeyboard" p={[0, HAUT_BUREAU, -0.15]} rot={Math.PI} echelle={ECHELLE} ombre={false} />
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
  etage: number;
  formation: boolean; // une session de formation a lieu aujourd'hui
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

/** Mobilier propre à chaque type de salle. */
function Mobilier({ p, a, mois, piles, poles, deco, echelle, fane, formation }: { p: Piece; a: Set<string>; mois: number; piles: number[]; poles: string[]; deco: string; echelle: number; fane: boolean; formation: boolean }) {
  const cx = (p.x0 + p.x1) / 2;
  const cz = (p.z0 + p.z1) / 2;
  const L = p.x1 - p.x0;
  const P = { echelle, fane };
  switch (p.id) {
    case "openspace":
    case "os_fiscal":
    case "os_social":
    case "os_juridique":
    case "annexe":
    case "plateau3":
    case "ext_expertise":
    case "ext_fiscal":
    case "ext_social":
    case "ext_juridique":
    case "ext_audit":
      return (
        <group>
          {POSTES.map((po, i) =>
            po.piece === p.id ? (
              <group key={i}>
                {poles[i] && (
                  <mesh position={[po.x, 0.016, po.z + (po.rot === 0 ? -0.35 : 0.35)]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <planeGeometry args={[1.8, 1.8]} />
                    <meshStandardMaterial color={poles[i]} transparent opacity={0.3} />
                  </mesh>
                )}
                <Bureau x={po.x} z={po.z} rot={po.rot} />
                <Chaise x={po.x} z={po.z + (po.rot === 0 ? -0.7 : 0.7)} rot={po.rot} />
                {Array.from({ length: Math.min(6, piles[i] ?? 0) }).map((_, k) => (
                  <Boite key={k} p={[po.x + (po.rot === 0 ? 0.55 : -0.55), 0.8 + k * 0.06, po.z]} s={[0.3, 0.05, 0.4]} c={k % 2 ? "#f5f5f5" : "#fff3c4"} ombre={false} />
                ))}
                {(mois === 7 || mois === 8) && !a.has("clim") && <Cylindre p={[po.x + (po.rot === 0 ? -0.6 : 0.6), 0.88, po.z]} r={0.1} h={0.22} c="#90a4ae" />}
              </group>
            ) : null,
          )}
          <Plante {...P} x={p.x0 + 0.5} z={p.z0 + 0.6} grande />
          <Plante {...P} x={p.x1 - 0.5} z={p.z1 - 0.6} />
          {a.has("imprimante") && p.id === "openspace" && <Boite p={[p.x1 - 0.6, 0.5, 0.7]} s={[0.7, 1, 0.6]} c="#607d8b" />}
          {a.has("mur_vegetal") &&
            [0.2, 0.4, 0.6, 0.8].map((f) => (
              <mesh key={f} position={[p.x0 + L * f, 0.5, 7.75]} castShadow>
                <icosahedronGeometry args={[0.4, 0]} />
                <meshStandardMaterial color="#43a047" flatShading />
              </mesh>
            ))}
        </group>
      );
    case "bur_expertise":
    case "bur_fiscal":
    case "bur_social":
    case "bur_juridique":
    case "bur_audit":
      return (
        <group>
          <Meuble nom="desk" p={[cx, 0, -6.1]} rot={Math.PI} largeur={1.7} />
          <Meuble nom="laptop" p={[cx, 0.77, -6.1]} rot={Math.PI} echelle={ECHELLE} ombre={false} />
          <Chaise x={cx} z={-6.8} />
          <Meuble nom="chairModernCushion" p={[cx - 0.5, 0, -5.0]} rot={Math.PI} echelle={ECHELLE} />
          <Meuble nom="chairModernCushion" p={[cx + 0.5, 0, -5.0]} rot={Math.PI} echelle={ECHELLE} />
          <Meuble nom="bookcaseOpen" p={[p.x0 + 0.35, 0, -5]} rot={Math.PI / 2} largeur={1.2} />
          <Plante {...P} x={p.x1 - 0.45} z={-7.5} />
        </group>
      );
    case "bulle1":
    case "bulle2":
    case "bulle3":
    case "bulle4":
    case "bulle5":
      return (
        <group>
          <Meuble nom="tableRound" p={[cx, 0, cz]} largeur={1.3} />
          {[0, 1, 2].map((k) => (
            <Meuble key={k} nom="chairCushion" p={[cx + Math.sin(k * 2.09) * 1.0, 0, cz + Math.cos(k * 2.09) * 1.0]} rot={k * 2.09 + Math.PI} echelle={ECHELLE} />
          ))}
          <Plante {...P} x={p.x1 - 0.4} z={-7.6} />
        </group>
      );
    case "reunion":
    case "reunion2":
    case "conseil": {
      const n = Math.max(2, Math.floor((L - 2) / 1.8));
      const xs = Array.from({ length: n }, (_, k) => cx + (k - (n - 1) / 2) * 1.8);
      return (
        <group>
          {xs.map((x) => (
            <Meuble key={x} nom="table" p={[x, 0, -5]} echelle={2.4} />
          ))}
          {xs.flatMap((x) => [
            <Meuble key={`a${x}`} nom="chairModernCushion" p={[x, 0, -6.2]} echelle={ECHELLE} />,
            <Meuble key={`b${x}`} nom="chairModernCushion" p={[x, 0, -3.8]} rot={Math.PI} echelle={ECHELLE} />,
          ])}
          <group position={[cx, 1.55, -7.92]}>
            <Boite p={[0, 0, 0]} s={[2.4, 1.3, 0.06]} c="#111" />
            <mesh position={[0, 0, 0.035]}>
              <planeGeometry args={[2.25, 1.15]} />
              <meshStandardMaterial color="#5c8dff" emissive="#3b6ef5" emissiveIntensity={a.has("visio") ? 0.7 : 0.25} />
            </mesh>
          </group>
          {p.id === "conseil" && <Boite p={[cx, 0.012, -5]} s={[L - 1.2, 0.01, 4.5]} c="#6d4c41" ombre={false} />}
          <Plante {...P} x={p.x0 + 0.5} z={-7.5} grande />
        </group>
      );
    }
    case "cafe":
      return (
        <group>
          {[1.2, 2.2, 3.2, 4.2, 5.2].map((z) => (
            <Meuble key={z} nom="kitchenBar" p={[11.45, 0, z]} rot={-Math.PI / 2} largeur={1} />
          ))}
          <Meuble nom="kitchenCoffeeMachine" p={[11.5, 0.86, 1.4]} rot={-Math.PI / 2} echelle={ECHELLE * (a.has("cafe_premium") ? 1.3 : 1)} />
          <Meuble nom="kitchenFridgeLarge" p={[11.45, 0, 6.9]} rot={-Math.PI / 2} largeur={0.9} />
          {/* buffet */}
          <Boite p={[8.6, 0.45, 0.8]} s={[3.6, 0.9, 0.7]} c="#f0ece4" />
          {[7.4, 8.6, 9.8].map((x) => (
            <Boite key={x} p={[x, 0.95, 0.8]} s={[0.8, 0.1, 0.5]} c="#c9a227" ombre={false} />
          ))}
          {[
            [0, 2.6],
            [3, 2.6],
            [0, 5.8],
            [3, 5.8],
            [6.2, 4.4],
          ].map(([x, z]) => (
            <group key={`${x}${z}`}>
              <Meuble nom="tableRound" p={[x, 0, z]} largeur={1.2} />
              {[0, 1, 2, 3].map((k) => (
                <Meuble key={k} nom="chairCushion" p={[x + Math.sin(k * 1.57) * 0.95, 0, z + Math.cos(k * 1.57) * 0.95]} rot={k * 1.57 + Math.PI} echelle={ECHELLE} />
              ))}
            </group>
          ))}
          {a.has("canape") && <Meuble nom="loungeDesignSofa" p={[-1.8, 0, 7.3]} rot={Math.PI} largeur={2.2} />}
          {a.has("babyfoot") && (
            <group position={[6.4, 0, 7.1]}>
              <Boite p={[0, 0.8, 0]} s={[1.3, 0.25, 0.75]} c="#2e7d32" />
              {[-0.55, 0.55].map((x) => (
                <Boite key={x} p={[x, 0.4, 0]} s={[0.1, 0.8, 0.6]} c="#5d4037" />
              ))}
            </group>
          )}
          <Plante {...P} x={-2.5} z={0.6} grande />
        </group>
      );
    case "accueil":
      return (
        <group>
          <Boite p={[-7.5, 0.55, 2.2]} s={[3.2, 1.1, 0.7]} c="#2f3b52" />
          <Boite p={[-7.5, 1.12, 2.2]} s={[3.3, 0.06, 0.8]} c="#e9e4da" />
          <Boite p={[-7.5, 1.6, 0.25]} s={[2.6, 1.2, 0.08]} c="#2f5bea" />
          <Boite p={[-7.5, 1.6, 0.3]} s={[0.9, 0.5, 0.02]} c="#ffffff" ombre={false} />
          <Meuble nom="loungeSofaLong" p={[-11.1, 0, 5.5]} rot={Math.PI / 2} echelle={2.2} />
          <Meuble nom="tableCoffee" p={[-9.9, 0, 5.5]} echelle={ECHELLE} />
          <Meuble nom="coatRackStanding" p={[-11.5, 0, 1.2]} echelle={ECHELLE} />
          <Plante {...P} x={-3.6} z={7.3} grande />
          <Plante {...P} x={-11.5} z={7.4} />
          {mois === 12 && <Sapin x={-4.5} z={4.5} />}
          {mois === 10 && (
            <mesh position={[-4.5, 0.25, 6]} castShadow>
              <sphereGeometry args={[0.3, 14, 10]} />
              <meshStandardMaterial color="#ef6c00" />
            </mesh>
          )}
        </group>
      );
    case "pressing":
      return (
        <group>
          <Boite p={[-10, 0.55, -3.2]} s={[2.6, 1.1, 0.6]} c="#eceff1" />
          <Boite p={[-10, 1.6, -7.4]} s={[3, 0.05, 0.05]} c="#90a4ae" />
          {[-11.2, -10.8, -10.4, -10, -9.6, -9.2, -8.8].map((x, k) => (
            <Boite key={x} p={[x, 1.2, -7.4]} s={[0.3, 0.75, 0.08]} c={["#5c6bc0", "#ffffff", "#26a69a", "#e57373", "#ffffff", "#8d6e63", "#90caf9"][k]} ombre={false} />
          ))}
          {[-11.3, -10.3].map((x) => (
            <group key={x} position={[x, 0, -5.4]}>
              <Boite p={[0, 0.45, 0]} s={[0.8, 0.9, 0.7]} c="#fafafa" />
              <mesh position={[0.41, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
                <circleGeometry args={[0.24, 20]} />
                <meshStandardMaterial color="#90a4ae" />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "sport":
      return (
        <group>
          <mesh position={[cx, 0.015, cz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[L - 0.6, 5.2]} />
            <meshStandardMaterial color="#37474f" />
          </mesh>
          {[-3, -1.6, -0.2].map((x) => (
            <group key={x} position={[x, 0, -7]}>
              <Boite p={[0, 0.15, 0]} s={[0.7, 0.15, 1.6]} c="#263238" />
              <Boite p={[0, 0.8, 0.7]} s={[0.6, 1.2, 0.08]} c="#455a64" />
            </group>
          ))}
          {[1.4, 2.6].map((x) => (
            <group key={x} position={[x, 0, -6.8]}>
              <Boite p={[0, 0.35, 0]} s={[0.3, 0.7, 1]} c="#ef5350" />
              <Boite p={[0, 0.8, 0.35]} s={[0.4, 0.06, 0.25]} c="#212121" />
            </group>
          ))}
          <Boite p={[0.5, 0.3, -3.5]} s={[1.6, 0.12, 0.5]} c="#212121" />
          {[-0.3, 1.3].map((x) => (
            <Cylindre key={x} p={[x, 0.55, -3.5]} r={0.18} h={0.06} c="#424242" />
          ))}
          {[-2.8, -1.9].map((x) => (
            <mesh key={x} position={[x, 0.02, -3.6]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.7, 1.7]} />
              <meshStandardMaterial color={x < -2 ? "#7e57c2" : "#26a69a"} />
            </mesh>
          ))}
          <Boite p={[cx, 1.4, -7.95]} s={[L - 1, 1.6, 0.04]} c="#cfd8dc" />
        </group>
      );
    case "detente":
      return (
        <group>
          <Meuble nom="loungeSofaLong" p={[9, 0, -7.3]} echelle={2.2} />
          <Meuble nom="loungeChairRelax" p={[7, 0, -4.5]} rot={Math.PI / 2} echelle={ECHELLE} />
          {[
            [9.5, -4.5, "#ff7043"],
            [10.6, -3.6, "#ffca28"],
          ].map(([x, z, c]) => (
            <mesh key={String(x)} position={[Number(x), 0.3, Number(z)]} castShadow>
              <sphereGeometry args={[0.45, 16, 12]} />
              <meshStandardMaterial color={String(c)} roughness={0.9} />
            </mesh>
          ))}
          <Boite p={[11.3, 1.1, -3.1]} s={[1, 2.2, 1]} c="#b3e5fc" opacite={0.35} />
        </group>
      );
    case "archives":
      return (
        <group>
          {[-7.2, -6, -4.8].map((x) => (
            <Meuble key={x} nom="bookcaseClosedWide" p={[x, 0, -7.5]} largeur={1.15} />
          ))}
          <Boite p={[-6, 0.5, -4.5]} s={[1.4, 1, 0.8]} c="#b8ad9f" />
          {(mois === 4 || mois === 5) && [-7.2, -4.8].map((x) => <Boite key={x} p={[x, 0.35, -3]} s={[0.7, 0.7, 0.5]} c="#d7ccc8" />)}
          {a.has("biblio") && <Meuble nom="bookcaseOpen" p={[-7.7, 0, -5]} rot={Math.PI / 2} largeur={1.4} />}
        </group>
      );
    case "associee":
      return (
        <group>
          <mesh position={[-8.5, 0.012, -5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[2.2, 40]} />
            <meshStandardMaterial color="#e7d8c3" />
          </mesh>
          <group position={[-8.5, 0, -6]}>
            <Boite p={[0, 0.76, 0]} s={[2.6, 0.08, 1.1]} c={deco} />
            <Boite p={[-1.15, 0.38, 0]} s={[0.15, 0.76, 1]} c="#2c2016" />
            <Boite p={[1.15, 0.38, 0]} s={[0.15, 0.76, 1]} c="#2c2016" />
            <Boite p={[-0.5, 1.1, -0.25]} s={[0.9, 0.55, 0.04]} c="#1f2430" />
          </group>
          <Chaise x={-8.5} z={-6.9} />
          <Meuble nom="chairModernCushion" p={[-9.1, 0, -4.6]} rot={Math.PI} echelle={ECHELLE} />
          <Meuble nom="chairModernCushion" p={[-7.9, 0, -4.6]} rot={Math.PI} echelle={ECHELLE} />
          <Meuble nom="bookcaseClosedWide" p={[-11.6, 0, -6]} rot={Math.PI / 2} largeur={1.8} />
          <Plante {...P} x={-5.6} z={-7.4} grande />
        </group>
      );
    case "it":
      return (
        <group>
          {[6.6, 7.4, 8.2].map((x) => (
            <group key={x}>
              <Boite p={[x, 1.1, -7.45]} s={[0.6, 2.2, 0.5]} c="#263238" />
              {[0.6, 1, 1.4, 1.8].map((y) => (
                <mesh key={y} position={[x, y, -7.18]}>
                  <boxGeometry args={[0.06, 0.04, 0.02]} />
                  <meshStandardMaterial color="#4caf50" emissive="#4caf50" emissiveIntensity={1.4} />
                </mesh>
              ))}
            </group>
          ))}
          <Boite p={[7.5, 0.75, -4]} s={[1.6, 0.06, 0.7]} c="#eceff1" />
        </group>
      );
    case "rh":
      return (
        <group>
          <Meuble nom="desk" p={[10.5, 0, -6.1]} rot={Math.PI} largeur={1.5} />
          <Chaise x={10.5} z={-6.8} />
          <Meuble nom="chairModernCushion" p={[10.5, 0, -4.8]} rot={Math.PI} echelle={ECHELLE} />
          <Boite p={[11.6, 0.6, -3.2]} s={[0.5, 1.2, 1.2]} c="#90a4ae" />
        </group>
      );
    case "formation":
      return (
        <group>
          <Boite p={[-11.9, 1.6, 4]} s={[0.06, 1.6, 3.4]} c="#fafafa" />
          <mesh position={[-11.86, 1.6, 4]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[3.2, 1.4]} />
            <meshStandardMaterial color="#e8f0ff" emissive="#c8dbff" emissiveIntensity={formation ? 0.8 : 0.3} />
          </mesh>
          {[-9.6, -7.4, -5.2].flatMap((x) =>
            [2.4, 5.6].map((z) => (
              <group key={`${x}${z}`}>
                <Boite p={[x, 0.72, z]} s={[0.6, 0.05, 1.6]} c="#f4f1ea" />
                <Boite p={[x, 0.36, z]} s={[0.05, 0.72, 1.5]} c="#c9c4ba" />
                <Meuble nom="chairCushion" p={[x + 0.6, 0, z - 0.4]} rot={-Math.PI / 2} echelle={ECHELLE} />
                <Meuble nom="chairCushion" p={[x + 0.6, 0, z + 0.4]} rot={-Math.PI / 2} echelle={ECHELLE} />
              </group>
            )),
          )}
        </group>
      );
    case "terrasse":
      return (
        <group>
          {[2, 4.5, 7].map((x) => (
            <Meuble key={x} nom="loungeChairRelax" p={[x, 0, 6.6]} rot={Math.PI} echelle={ECHELLE} />
          ))}
          {[3.2, 8.5].map((x) => (
            <group key={x} position={[x, 0, 3.4]}>
              <Cylindre p={[0, 1.1, 0]} r={0.04} h={2.2} c="#795548" />
              <mesh position={[0, 2.2, 0]} castShadow>
                <coneGeometry args={[1.1, 0.5, 16]} />
                <meshStandardMaterial color={x < 5 ? "#ef5350" : "#ffffff"} />
              </mesh>
              <Meuble nom="tableRound" p={[0, 0, 0]} largeur={1.1} />
            </group>
          ))}
          {/* micro-cuisine */}
          {[0.6, 1.6].map((z) => (
            <Meuble key={z} nom="kitchenBar" p={[11.45, 0, z]} rot={-Math.PI / 2} largeur={1} />
          ))}
          <Meuble nom="kitchenCoffeeMachine" p={[11.5, 0.86, 0.9]} rot={-Math.PI / 2} echelle={ECHELLE} />
          {[-1.5, 0.5, 10.5].map((x) => (
            <Plante key={x} {...P} x={x} z={7.4} grande />
          ))}
          <Boite p={[5, 0.55, 7.95]} s={[14, 1.1, 0.05]} c="#cfe3f5" opacite={0.4} />
        </group>
      );
    default:
      return null;
  }
}

function Ascenseur({ etage }: { etage: number }) {
  return (
    <group>
      <Boite p={[ASCENSEUR.x, 1.4, -5]} s={[2, 2.8, 6]} c="#78909c" />
      <Boite p={[ASCENSEUR.x, 1.1, -1.99]} s={[1.2, 2.2, 0.05]} c="#b0bec5" />
      <Boite p={[ASCENSEUR.x, 2.35, -1.97]} s={[0.5, 0.18, 0.02]} c="#1b1b1b" ombre={false} />
      <mesh position={[ASCENSEUR.x, 2.35, -1.955]}>
        <planeGeometry args={[0.3, 0.12]} />
        <meshStandardMaterial color="#ff7043" emissive="#ff7043" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[ASCENSEUR.x, 2.35, -1.95]}>
        <planeGeometry args={[0.08, 0.08]} />
        <meshBasicMaterial color={["#ffffff", "#ffeb3b", "#80deea", "#ce93d8"][etage]} />
      </mesh>
    </group>
  );
}

function Decor({ onPiece, onFocus, niveau, achats, mois, fenetre, mood, piles, poles, deco, nuit, meteo, etage, formation }: PropsDecor) {
  const n = niveauLocaux(niveau);
  const ouvert = (id: PieceId) => n.pieces.includes(id);
  const a = new Set(achats.split(",").filter(Boolean));
  const charges = piles.split(",").map(Number);
  const couleursPoles = poles.split(",");
  const echelle = 0.75 + (mood / 100) * 0.6;
  const fane = mood < 40;
  const vue = skyline(fenetre, nuit, meteo);
  const pieces = PIECES.filter((p) => p.etage === etage);

  return (
    <group>
      {/* dalle, extérieur et couloir */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[24.4, 0.1, 16.4]} />
        <meshStandardMaterial color="#d8d2c6" />
      </mesh>
      <mesh position={[0, -0.12 - etage * 0.02, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 60]} />
        <meshStandardMaterial color={etage === 0 ? "#e9edf2" : "#dfe6ee"} />
      </mesh>
      {etage === 0 && (
        <mesh position={[0, -0.1, 11]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 4]} />
          <meshStandardMaterial color="#9e9e9e" />
        </mesh>
      )}
      <mesh position={[0, 0.008, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 2]} />
        <meshStandardMaterial color="#cbbfae" />
      </mesh>

      {pieces.map((p) => (
        <Sol key={p.id} piece={p} onClick={onPiece} onDouble={onFocus} verrou={!ouvert(p.id)} />
      ))}

      {/* murs extérieurs avec fenêtres (vue sur la ville) */}
      <Boite p={[0, H_FOND / 2, -8.1]} s={[24.3, H_FOND, 0.2]} c="#efe9df" />
      <Boite p={[-12.1, H_FOND / 2, 0]} s={[0.2, H_FOND, 16.4]} c="#e9e2d6" />
      {[-9, -3, 9].map((x) => (
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
      <CloisonX z={8} x0={-12} x1={12} portes={etage === 0 ? [-7.5] : []} h={0.3} />
      <CloisonZ x={12} z0={-8} z1={8} h={0.3} />

      {/* cloisons de chaque salle (vitrées pour les bureaux et bulles) */}
      {pieces.map((p) => {
        const fond = p.z1 <= -2;
        const verre = p.vitre ? { c: "#cfe3f5", opacite: 0.4, h: 2.2 } : { c: MUR, opacite: undefined, h: fond ? H_CLOISON : 0.6 };
        return (
          <group key={`m${p.id}`}>
            <CloisonX z={fond ? -2 : 0} x0={p.x0} x1={p.x1} portes={[p.porte]} h={verre.h} c={verre.c} opacite={verre.opacite} ep={p.vitre ? 0.06 : 0.15} />
            {p.x0 > -12 && <CloisonZ x={p.x0} z0={p.z0} z1={p.z1} h={verre.h} c={verre.c} opacite={verre.opacite} />}
          </group>
        );
      })}

      <Ascenseur etage={etage} />

      {pieces.map((p) =>
        ouvert(p.id) ? (
          <Mobilier key={`f${p.id}`} p={p} a={a} mois={mois} piles={charges} poles={couleursPoles} deco={deco} echelle={echelle} fane={fane} formation={formation} />
        ) : (
          <Chantier key={`c${p.id}`} piece={p} />
        ),
      )}
    </group>
  );
}

export default memo(Decor);

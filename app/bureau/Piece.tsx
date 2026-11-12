"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { AgentBureau } from "@/lib/bureau";
import styles from "./Bureau.module.css";

// ---------------------------------------------------------------------------
// Géométrie isométrique : i va vers la droite-bas, j vers la gauche-bas,
// z vers le haut. Une case du sol fait 32 × 16 unités.
// ---------------------------------------------------------------------------
const T = 16;
const H = 8;
const N = 8; // pièce de 8 × 8 cases
const MUR = 70; // hauteur des murs

type P = [number, number];
const iso = (i: number, j: number, z = 0): P => [(i - j) * T, (i + j) * H - z];
const pts = (...p: P[]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

function teinte(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))),
  );
  return `rgb(${c.join(",")})`;
}

/** Un pavé : dessus clair, face gauche moyenne, face droite sombre. */
function Pave({ i, j, w, d, h, z = 0, c }: { i: number; j: number; w: number; d: number; h: number; z?: number; c: string }) {
  return (
    <g>
      <polygon points={pts(iso(i, j + d, z), iso(i + w, j + d, z), iso(i + w, j + d, z + h), iso(i, j + d, z + h))} fill={teinte(c, 0.82)} />
      <polygon points={pts(iso(i + w, j, z), iso(i + w, j + d, z), iso(i + w, j + d, z + h), iso(i + w, j, z + h))} fill={teinte(c, 0.66)} />
      <polygon points={pts(iso(i, j, z + h), iso(i + w, j, z + h), iso(i + w, j + d, z + h), iso(i, j + d, z + h))} fill={teinte(c, 1.08)} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Personnages en pixels (8 × 14), dessins originaux.
// h cheveux · s peau · e œil · g lunettes · c haut (couleur de l'agent)
// w blanc · p bas · k chaussures
// ---------------------------------------------------------------------------
const SPRITES: Record<string, string[]> = {
  redacteur: [
    "..hhhh..", ".hhhhhh.", ".hssssh.", ".gegsge.", ".ssssss.", "..ssss..", ".ccwwcc.",
    "cccwwccc", "sccccccs", "sccccccs", ".pppppp.", ".pp..pp.", ".pp..pp.", ".kk..kk.",
  ],
  "chef-cabinet": [
    "...hh...", "..hhhh..", ".hhhhhh.", ".hseesh.", ".ssssss.", "..ssss..", ".cwccwc.",
    "ccwccwcc", "sccccccs", "sccccccs", ".pppppp.", ".pp..pp.", ".pp..pp.", ".kk..kk.",
  ],
  styliste: [
    "..hhhh..", ".hhhhhh.", "hhsssshh", "hsessesh", "hssssssh", "hhsssshh", "hcccccch",
    "hcccccch", "sccccccs", ".cccccc.", "pppppppp", ".ss..ss.", ".ss..ss.", ".kk..kk.",
  ],
};
const TEINTES: Record<string, { h: string; s: string; p: string }> = {
  redacteur: { h: "#2b1d14", s: "#e0ac69", p: "#2e2e2e" },
  "chef-cabinet": { h: "#a3a3a3", s: "#f1c27d", p: "#222222" },
  styliste: { h: "#7a3b1d", s: "#c68642", p: "#3a3a3a" },
};
const PX = 2;

function Sprite({ agent, couleur, dort }: { agent: string; couleur: string; dort: boolean }) {
  const lignes = SPRITES[agent] ?? SPRITES.redacteur;
  const t = TEINTES[agent] ?? TEINTES.redacteur;
  const pal: Record<string, string> = { h: t.h, s: t.s, c: couleur, w: "#f4f1ea", p: t.p, k: "#151515", g: "#151515", e: "#151515" };
  const rects: ReactNode[] = [];
  lignes.forEach((ligne, y) =>
    [...ligne].forEach((ch, x) => {
      if (ch === ".") return;
      if (ch === "e" && dort) {
        rects.push(<rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX} height={PX} fill={t.s} />);
        rects.push(<rect key={`${x}-${y}z`} x={x * PX} y={y * PX + 1.2} width={PX} height={0.8} fill="#151515" />);
        return;
      }
      rects.push(<rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX + 0.05} height={PX + 0.05} fill={pal[ch]} />);
    }),
  );
  return <g shapeRendering="crispEdges">{rects}</g>;
}

// Décalage horizontal des bulles, pour que deux bulles voisines ne se chevauchent pas.
const DECALAGE: Record<string, number> = { redacteur: -26, "chef-cabinet": 26, styliste: 0 };

const COURT: Record<string, string> = { redacteur: "Rédacteur", "chef-cabinet": "Chef", styliste: "Styliste" };

// Postes de travail et coins de repos de chaque agent (en cases).
const POSTES: Record<string, { travail: [number, number]; repos: [number, number]; bureau: [number, number] }> = {
  redacteur: { travail: [1.75, 3.55], repos: [1.95, 6.95], bureau: [1, 4] },
  "chef-cabinet": { travail: [3.75, 0.85], repos: [6.1, 1.5], bureau: [3, 1.3] },
  styliste: { travail: [5.75, 3.55], repos: [5.75, 7.2], bureau: [5, 4] },
};

function Bulle({ x, y, texte, alerte, dx = 0 }: { x: number; y: number; texte: string; alerte?: boolean; dx?: number }) {
  const l = Math.max(30, texte.length * 4.7 + 12);
  const gauche = Math.max(-l + 8, Math.min(-8, -l / 2 + dx));
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <rect x={gauche} y={-15} width={l} height={14} rx={3} fill="#fff" stroke={alerte ? "#8a1c2b" : "#121212"} strokeWidth={0.8} />
      <polygon points="-3,-1.4 3,-1.4 0,3" fill="#fff" stroke={alerte ? "#8a1c2b" : "#121212"} strokeWidth={0.8} />
      <rect x={-3.4} y={-2.2} width={6.8} height={1.6} fill="#fff" />
      <text x={gauche + l / 2} y={-5.3} textAnchor="middle" fontSize={8.4} fontFamily="-apple-system, system-ui, sans-serif" fill={alerte ? "#8a1c2b" : "#121212"}>
        {texte}
      </text>
    </g>
  );
}

function Personnage({ a, choisi, onChoisir }: { a: AgentBureau; choisi: boolean; onChoisir: () => void }) {
  const poste = POSTES[a.id];
  const [i, j] = a.etat === "travaille" ? poste.travail : poste.repos;
  const [x, y] = iso(i, j);
  const anim =
    a.etat === "travaille" ? styles.travaille : a.etat === "publie" ? styles.saute : a.etat === "dort" ? styles.respire : "";
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${a.nom} : ${a.statut}`}
      onClick={onChoisir}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onChoisir()}
      className={styles.perso}
    >
      {choisi && <polygon points={pts(iso(i - 0.45, j - 0.45), iso(i + 0.45, j - 0.45), iso(i + 0.45, j + 0.45), iso(i - 0.45, j + 0.45))} fill="none" stroke={a.couleur} strokeWidth={1.4} />}
      <ellipse cx={x} cy={y} rx={7} ry={3} fill="rgba(0,0,0,.18)" />
      <g transform={`translate(${x - 8} ${y - 28})`}>
        <g className={anim}>
          <Sprite agent={a.id} couleur={a.couleur} dort={a.etat === "dort"} />
        </g>
      </g>
      {/* zone de toucher plus large que le dessin, pour le doigt */}
      <rect x={x - 14} y={y - 34} width={28} height={38} fill="transparent" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Décor
// ---------------------------------------------------------------------------
function Sol() {
  const cases: ReactNode[] = [];
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++)
      cases.push(
        <polygon key={`${i}-${j}`} points={pts(iso(i, j), iso(i + 1, j), iso(i + 1, j + 1), iso(i, j + 1))} fill={(i + j) % 2 ? "#c49d6c" : "#cba778"} stroke="#b88f5f" strokeWidth={0.3} />,
      );
  return <g>{cases}</g>;
}

function Murs({ ciel, nuit }: { ciel: string; nuit: boolean }) {
  const etoiles: P[] = [[0, 2.6], [0, 3.4], [0, 4.0], [0, 2.9]].map(([, jj], k) => iso(0, jj, 52 - k * 6));
  return (
    <g>
      <polygon points={pts(iso(0, 0), iso(0, N), iso(0, N, MUR), iso(0, 0, MUR))} fill="#ece5d6" />
      <polygon points={pts(iso(0, 0), iso(N, 0), iso(N, 0, MUR), iso(0, 0, MUR))} fill="#e0d7c4" />
      {/* plinthes */}
      <polygon points={pts(iso(0, 0), iso(0, N), iso(0, N, 4), iso(0, 0, 4))} fill="#a9876a" />
      <polygon points={pts(iso(0, 0), iso(N, 0), iso(N, 0, 4), iso(0, 0, 4))} fill="#9b7a5f" />
      {/* tranche du haut des murs */}
      <polygon points={pts(iso(0, 0, MUR), iso(0, N, MUR), iso(-0.2, N, MUR), iso(-0.2, -0.2, MUR), iso(N, -0.2, MUR), iso(N, 0, MUR))} fill="#cfc5b1" />
      {/* fenêtre sur Paris */}
      <polygon points={pts(iso(0, 2, 26), iso(0, 4.6, 26), iso(0, 4.6, 58), iso(0, 2, 58))} fill={ciel} stroke="#f7f4ee" strokeWidth={2.2} />
      {/* toits au loin */}
      <polygon
        points={pts(iso(0, 2, 26), iso(0, 2, 33), iso(0, 2.5, 33), iso(0, 2.5, 37), iso(0, 3.1, 37), iso(0, 3.1, 31), iso(0, 3.6, 31), iso(0, 3.6, 39), iso(0, 3.9, 43), iso(0, 4.2, 39), iso(0, 4.2, 34), iso(0, 4.6, 34), iso(0, 4.6, 26))}
        fill={nuit ? "#2a3150" : "#8696a7"}
      />
      {nuit && etoiles.map(([x, y], k) => <rect key={k} x={x - 0.6} y={y - 0.6} width={1.2} height={1.2} fill="#f6e7a8" />)}
      <line x1={iso(0, 3.3, 26)[0]} y1={iso(0, 3.3, 26)[1]} x2={iso(0, 3.3, 58)[0]} y2={iso(0, 3.3, 58)[1]} stroke="#f7f4ee" strokeWidth={1.4} />
      <polygon points={pts(iso(0.25, 2, 26), iso(0.25, 4.6, 26), iso(0, 4.6, 26), iso(0, 2, 26))} fill="#f7f4ee" />
      {/* tableau « QG » */}
      <polygon points={pts(iso(0, 5.6, 34), iso(0, 7, 34), iso(0, 7, 52), iso(0, 5.6, 52))} fill="#121212" />
      <text transform={`translate(${iso(0, 6.3, 41)[0]} ${iso(0, 6.3, 41)[1]}) skewY(26.57)`} textAnchor="middle" fontSize={8} fontFamily="Georgia, serif" fontWeight={700} fill="#fbfaf7">
        QG
      </text>
    </g>
  );
}

function Horloge({ heure, minute }: { heure: number; minute: number }) {
  const ci = 5.4;
  const cz = 52;
  const r = 7;
  const cercle: P[] = Array.from({ length: 20 }, (_, k) => {
    const t = (k / 20) * Math.PI * 2;
    return iso(ci + (Math.cos(t) * r) / (T * 1.1), 0, cz + Math.sin(t) * r);
  });
  const aiguille = (frac: number, long: number): P => {
    const t = frac * Math.PI * 2;
    return iso(ci + (Math.sin(t) * long) / (T * 1.1), 0, cz + Math.cos(t) * long);
  };
  const c = iso(ci, 0, cz);
  const hh = aiguille(((heure % 12) + minute / 60) / 12, 3.8);
  const mm = aiguille(minute / 60, 5.6);
  return (
    <g aria-hidden="true">
      <polygon points={pts(...cercle)} fill="#fbfaf7" stroke="#121212" strokeWidth={1.2} />
      <line x1={c[0]} y1={c[1]} x2={hh[0]} y2={hh[1]} stroke="#121212" strokeWidth={1.4} strokeLinecap="round" />
      <line x1={c[0]} y1={c[1]} x2={mm[0]} y2={mm[1]} stroke="#121212" strokeWidth={0.9} strokeLinecap="round" />
    </g>
  );
}

function Bibliotheque() {
  const livres: ReactNode[] = [];
  const couleurs = ["#1f3a5f", "#8a1c2b", "#3e4a3a", "#8a4f0f", "#4b3a6b", "#2f5d50", "#d9d6cf"];
  [8, 22, 36].forEach((z, r) => {
    let i = 0.95;
    let k = r * 3;
    while (i < 2.45) {
      const w = 0.13 + ((k * 7) % 5) * 0.025;
      const h = 9 + ((k * 3) % 4);
      livres.push(<polygon key={`${r}-${k}`} points={pts(iso(i, 0.36, z), iso(i + w, 0.36, z), iso(i + w, 0.36, z + h), iso(i, 0.36, z + h))} fill={couleurs[k % couleurs.length]} />);
      i += w + 0.02;
      k++;
    }
  });
  return (
    <g>
      <Pave i={0.8} j={0} w={1.8} d={0.35} h={50} c="#7a5236" />
      {[6, 20, 34, 48].map((z) => (
        <polygon key={z} points={pts(iso(0.85, 0.36, z), iso(2.55, 0.36, z), iso(2.55, 0.36, z + 1.5), iso(0.85, 0.36, z + 1.5))} fill="#5a3b26" />
      ))}
      {livres}
    </g>
  );
}

function Bureau({ i, j, agent, travaille }: { i: number; j: number; agent: string; travaille: boolean }) {
  const ecran = travaille ? "#bfe3ff" : "#3a3f45";
  return (
    <g>
      <Pave i={i} j={j} w={1.6} d={0.8} h={12} c="#8b5e3c" />
      {/* écran */}
      <Pave i={i + 1.05} j={j + 0.12} w={0.42} d={0.1} h={11} z={12} c="#2b2b2b" />
      <polygon points={pts(iso(i + 1.08, j + 0.23, 14), iso(i + 1.44, j + 0.23, 14), iso(i + 1.44, j + 0.23, 22), iso(i + 1.08, j + 0.23, 22))} fill={ecran} />
      {/* accessoires propres à chacun */}
      {agent === "redacteur" && (
        <>
          <Pave i={i + 0.2} j={j + 0.3} w={0.5} d={0.35} h={2} z={12} c="#f4f1ea" />
          <Pave i={i + 0.22} j={j + 0.32} w={0.46} d={0.31} h={1.5} z={14} c="#e6e1d5" />
        </>
      )}
      {agent === "chef-cabinet" && (
        <>
          <Pave i={i + 0.2} j={j + 0.3} w={0.45} d={0.32} h={1.6} z={12} c="#4b3a6b" />
          <Pave i={i + 0.22} j={j + 0.31} w={0.42} d={0.3} h={1.6} z={13.6} c="#d9d6cf" />
          <Pave i={i + 0.24} j={j + 0.33} w={0.4} d={0.28} h={1.6} z={15.2} c="#4b3a6b" />
        </>
      )}
      {agent === "styliste" && (
        <>
          <Pave i={i + 0.2} j={j + 0.35} w={0.42} d={0.3} h={1} z={12} c="#efe3d0" />
          <polygon points={pts(iso(i + 0.3, j + 0.45, 13.2), iso(i + 0.55, j + 0.45, 13.2), iso(i + 0.42, j + 0.45, 16))} fill="#2f5d50" />
        </>
      )}
      {travaille && <ellipse cx={iso(i + 1.25, j + 0.5, 18)[0]} cy={iso(i + 1.25, j + 0.5, 18)[1]} rx={13} ry={7} fill="#ffe9a8" opacity={0.35} className={styles.lampe} />}
    </g>
  );
}

function Portant() {
  const vetements = ["#121212", "#f4f1ea", "#2f5d50", "#c8a27a", "#1f3a5f"];
  return (
    <g>
      <Pave i={7.0} j={2.6} w={0.08} d={0.08} h={34} c="#6b6b6b" />
      <Pave i={7.0} j={4.4} w={0.08} d={0.08} h={34} c="#6b6b6b" />
      <polygon points={pts(iso(7.04, 2.62, 34), iso(7.04, 4.46, 34), iso(7.04, 4.46, 35.4), iso(7.04, 2.62, 35.4))} fill="#4a4a4a" />
      {vetements.map((c, k) => {
        const jj = 2.85 + k * 0.33;
        return <polygon key={k} points={pts(iso(7.04, jj - 0.1, 33), iso(7.04, jj + 0.18, 33), iso(7.04, jj + 0.24, 16), iso(7.04, jj - 0.16, 16))} fill={c} stroke="rgba(0,0,0,.25)" strokeWidth={0.4} />;
      })}
    </g>
  );
}

function CoinCafe() {
  return (
    <g>
      <Pave i={0.15} j={6.3} w={1.2} d={1.5} h={14} c="#e7e2d8" />
      <Pave i={0.35} j={6.5} w={0.5} d={0.5} h={11} z={14} c="#8a1c2b" />
      <Pave i={0.45} j={7.25} w={0.16} d={0.16} h={3} z={14} c="#fbfaf7" />
      <Pave i={0.75} j={7.2} w={0.16} d={0.16} h={3} z={14} c="#1f3a5f" />
    </g>
  );
}

function DossierCanape() {
  return (
    <g>
      <Pave i={4.6} j={6.75} w={2.3} d={0.3} h={16} c="#5f7f6d" />
      <Pave i={4.4} j={6.75} w={0.22} d={0.95} h={11} c="#557463" />
    </g>
  );
}

function AssiseCanape() {
  return (
    <g>
      <Pave i={4.6} j={7.05} w={2.3} d={0.65} h={7} c="#5f7f6d" />
      <Pave i={6.9} j={6.75} w={0.22} d={0.95} h={11} c="#557463" />
    </g>
  );
}

function Tapis() {
  return (
    <g>
      <polygon points={pts(iso(4.2, 5.4, 0.3), iso(7.4, 5.4, 0.3), iso(7.4, 7.0, 0.3), iso(4.2, 7.0, 0.3))} fill="#a65848" />
      <polygon points={pts(iso(4.4, 5.55, 0.4), iso(7.2, 5.55, 0.4), iso(7.2, 6.85, 0.4), iso(4.4, 6.85, 0.4))} fill="none" stroke="#e9c79b" strokeWidth={0.8} />
    </g>
  );
}

function Plante({ i, j }: { i: number; j: number }) {
  const [x, y] = iso(i + 0.25, j + 0.25, 14);
  return (
    <g>
      <Pave i={i} j={j} w={0.5} d={0.5} h={10} c="#b4643c" />
      <circle cx={x - 4} cy={y} r={6} fill="#3e6b47" />
      <circle cx={x + 4} cy={y - 2} r={6} fill="#4c7c55" />
      <circle cx={x} cy={y - 8} r={6} fill="#5a8c62" />
    </g>
  );
}

// ---------------------------------------------------------------------------

export default function Piece({ agents, heure, minute }: { agents: AgentBureau[]; heure: number; minute: number }) {
  const [choix, setChoix] = useState<string>(() => agents.find((a) => a.etat === "travaille")?.id ?? agents[0]?.id);
  const nuit = heure >= 22 || heure < 6;
  const crepuscule = !nuit && (heure < 8 || heure >= 19);
  const ciel = nuit ? "#1b2340" : crepuscule ? "#e7a77c" : "#9fcbe8";
  const selection = agents.find((a) => a.id === choix) ?? agents[0];

  // Tout ce qui a de la profondeur est trié de l'arrière vers l'avant.
  const objets: { prof: number; node: ReactNode }[] = [
    { prof: 1.1, node: <Bibliotheque key="biblio" /> },
    { prof: 7.6, node: <Plante key="plante" i={7.2} j={0.2} /> },
    { prof: 8.0, node: <CoinCafe key="cafe" /> },
    { prof: 11.0, node: <Portant key="portant" /> },
    { prof: 12.2, node: <DossierCanape key="dossier" /> },
    { prof: 13.2, node: <AssiseCanape key="assise" /> },
    { prof: 8.2, node: <Plante key="plante2" i={0.2} j={0.5} /> },
  ];
  for (const a of agents) {
    const p = POSTES[a.id];
    if (!p) continue;
    const [bi, bj] = p.bureau;
    objets.push({ prof: bi + 0.8 + bj + 0.4, node: <Bureau key={`b-${a.id}`} i={bi} j={bj} agent={a.id} travaille={a.etat === "travaille"} /> });
    const [ci, cj] = a.etat === "travaille" ? p.travail : p.repos;
    objets.push({ prof: ci + cj, node: <Personnage key={`p-${a.id}`} a={a} choisi={a.id === selection?.id} onChoisir={() => setChoix(a.id)} /> });
  }
  objets.sort((x, y) => x.prof - y.prof);

  return (
    <div>
      <svg viewBox="-140 -100 280 236" className={styles.piece} role="img" aria-label="Le bureau des agents">
        <Sol />
        <Tapis />
        <Murs ciel={ciel} nuit={nuit} />
        <Horloge heure={heure} minute={minute} />
        {objets.map((o) => o.node)}
        {nuit && <polygon points={pts(iso(0, 0, MUR), iso(0, N, MUR), iso(0, N), iso(N, N), iso(N, 0), iso(N, 0, MUR))} fill="#0b1430" opacity={0.3} pointerEvents="none" />}
        {agents.map((a) => {
          const p = POSTES[a.id];
          if (!p || !a.bulle) return null;
          const [ci, cj] = a.etat === "travaille" ? p.travail : p.repos;
          const [x, y] = iso(ci, cj);
          return a.etat === "dort" ? (
            <text key={`z-${a.id}`} x={x + 6} y={y - 30} fontSize={8} fontFamily="Georgia, serif" fontStyle="italic" fill={nuit ? "#f6e7a8" : "#4a4a4a"} className={styles.zzz} aria-hidden="true">
              Zzz
            </text>
          ) : (
            <Bulle key={`bu-${a.id}`} x={x} y={y - 31} texte={a.bulle} alerte={a.etat === "echec"} dx={DECALAGE[a.id] ?? 0} />
          );
        })}
      </svg>

      <div className={styles.equipe} role="tablist" aria-label="Choisir un agent">
        {agents.map((a) => (
          <button
            key={a.id}
            role="tab"
            aria-selected={a.id === selection?.id}
            className={styles.puce}
            style={{ "--couleur": a.couleur } as React.CSSProperties}
            onClick={() => setChoix(a.id)}
          >
            <span className="pastille" />
            {COURT[a.id] ?? a.nom}
          </button>
        ))}
      </div>

      {selection && (
        <section className={styles.fiche} style={{ "--couleur": selection.couleur } as React.CSSProperties} aria-live="polite">
          <p className="k" style={{ color: selection.couleur }}>{selection.nom}</p>
          <p className={styles.statut}>{selection.statut}</p>
          {selection.activite.length > 0 && (
            <>
              <p className="meta" style={{ margin: "8px 0 2px" }}>Ses dernières actions</p>
              <ul className={styles.activite}>
                {selection.activite.map((e, k) => (
                  <li key={k}>{e}</li>
                ))}
              </ul>
            </>
          )}
          <p style={{ margin: "8px 0 0", display: "flex", gap: 16, flexWrap: "wrap" }}>
            {selection.rapportId && selection.etat !== "travaille" && (
              <Link href={`/rapports/${selection.rapportId}`} className="lien petit">Lire son rapport →</Link>
            )}
            <Link href="/missions" className="lien petit">Missions et lancement →</Link>
          </p>
        </section>
      )}
    </div>
  );
}

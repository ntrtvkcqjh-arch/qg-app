"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
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


type Pas = 0 | 1 | 2; // 0 debout, 1 et 2 : jambe gauche ou droite levée

/** Personnage en pixels. `pas` anime les jambes, `yeuxFermes` sert au clignement et au sommeil. */
const Sprite = memo(function Sprite({ agent, couleur, yeuxFermes, pas }: { agent: string; couleur: string; yeuxFermes: boolean; pas: Pas }) {
  const lignes = [...(SPRITES[agent] ?? SPRITES.redacteur)].map((l) => [...l]);
  if (pas) {
    const [a, b] = pas === 1 ? [1, 2] : [5, 6];
    for (const x of [a, b]) {
      lignes[12][x] = "k";
      lignes[13][x] = ".";
    }
  }
  const t = TEINTES[agent] ?? TEINTES.redacteur;
  const pal: Record<string, string> = { h: t.h, s: t.s, c: couleur, w: "#f4f1ea", p: t.p, k: "#151515", g: "#151515", e: "#151515" };
  const rects: ReactNode[] = [];
  lignes.forEach((ligne, y) =>
    ligne.forEach((ch, x) => {
      if (ch === ".") return;
      if (ch === "e" && yeuxFermes) {
        rects.push(<rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX} height={PX} fill={t.s} />);
        rects.push(<rect key={`${x}-${y}z`} x={x * PX} y={y * PX + 1.2} width={PX} height={0.8} fill="#151515" />);
        return;
      }
      rects.push(<rect key={`${x}-${y}`} x={x * PX} y={y * PX} width={PX + 0.05} height={PX + 0.05} fill={pal[ch]} />);
    }),
  );
  return <g shapeRendering="crispEdges">{rects}</g>;
});

// Décalage horizontal des bulles, pour que deux bulles voisines ne se chevauchent pas.
const DECALAGE: Record<string, number> = { redacteur: -26, "chef-cabinet": 26, styliste: 0 };

const COURT: Record<string, string> = { redacteur: "Rédacteur", "chef-cabinet": "Chef", styliste: "Styliste" };

// Poste de travail (chaise) et bureau de chaque agent (en cases).
const POSTES: Record<string, { travail: [number, number]; bureau: [number, number] }> = {
  redacteur: { travail: [1.75, 3.55], bureau: [1, 4] },
  "chef-cabinet": { travail: [3.75, 0.85], bureau: [3, 1.3] },
  styliste: { travail: [5.75, 3.55], bureau: [5, 4] },
};

// Promenades au repos : des allées dégagées, qui contournent les meubles.
// pause = secondes passées sur place (café, fenêtre, portant, canapé…).
type Etape = { i: number; j: number; pause: number };
const ROUTES: Record<string, Etape[]> = {
  redacteur: [
    { i: 1.95, j: 6.95, pause: 6 }, // coin café
    { i: 2.8, j: 5.6, pause: 0 },
    { i: 3.7, j: 3.1, pause: 4 }, // passe voir la bibliothèque
    { i: 2.8, j: 5.6, pause: 0 },
  ],
  "chef-cabinet": [
    { i: 6.1, j: 1.5, pause: 5 }, // près de la plante
    { i: 6.3, j: 3.1, pause: 0 },
    { i: 4.8, j: 3.1, pause: 4 }, // fait le tour des bureaux
    { i: 6.3, j: 3.1, pause: 0 },
  ],
  styliste: [
    { i: 5.75, j: 7.2, pause: 8 }, // assise sur le canapé
    { i: 5.75, j: 7.9, pause: 0 },
    { i: 7.5, j: 7.9, pause: 0 },
    { i: 7.5, j: 3.4, pause: 5 }, // devant le portant
    { i: 7.5, j: 7.9, pause: 0 },
    { i: 5.75, j: 7.9, pause: 0 },
  ],
};
const VITESSE = 0.75; // cases par seconde

type Pose = { i: number; j: number; pas: Pas; face: 1 | -1; yeuxFermes: boolean };

function Bulle({ x, y, texte, alerte, dx = 0 }: { x: number; y: number; texte: string; alerte?: boolean; dx?: number }) {
  const l = Math.max(30, texte.length * 4.7 + 12);
  const gauche = Math.max(-l + 8, Math.min(-8, -l / 2 + dx));
  return (
    <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`} aria-hidden="true">
      <rect x={gauche} y={-15} width={l} height={14} rx={3} fill="#fff" stroke={alerte ? "#8a1c2b" : "#121212"} strokeWidth={0.8} />
      <polygon points="-3,-1.4 3,-1.4 0,3" fill="#fff" stroke={alerte ? "#8a1c2b" : "#121212"} strokeWidth={0.8} />
      <rect x={-3.4} y={-2.2} width={6.8} height={1.6} fill="#fff" />
      <text x={gauche + l / 2} y={-5.3} textAnchor="middle" fontSize={8.4} fontFamily="-apple-system, system-ui, sans-serif" fill={alerte ? "#8a1c2b" : "#121212"}>
        {texte}
      </text>
    </g>
  );
}

function Personnage({ a, pose, choisi, onChoisir }: { a: AgentBureau; pose: Pose; choisi: boolean; onChoisir: () => void }) {
  const { i, j } = pose;
  const [x, y] = iso(i, j);
  const anim = a.etat === "travaille" ? styles.travaille : a.etat === "dort" ? styles.respire : pose.pas ? styles.marche : "";
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
      {/* face = -1 : le personnage regarde vers la gauche (miroir autour de son axe) */}
      <g transform={`translate(${(x - 8 * pose.face).toFixed(2)} ${(y - 28).toFixed(2)}) scale(${pose.face} 1)`}>
        <g className={anim}>
          <Sprite agent={a.id} couleur={a.couleur} yeuxFermes={pose.yeuxFermes || a.etat === "dort"} pas={pose.pas} />
        </g>
      </g>
      {/* zone de toucher plus large que le dessin, pour le doigt */}
      <rect x={x - 14} y={y - 34} width={28} height={38} fill="transparent" />
    </g>
  );
}

/** Position de départ : à son poste s'il travaille, sinon au premier arrêt de sa promenade. */
function poseInitiale(a: AgentBureau): Pose {
  const depart = a.etat === "travaille" ? { i: POSTES[a.id].travail[0], j: POSTES[a.id].travail[1] } : ROUTES[a.id][0];
  return { i: depart.i, j: depart.j, pas: 0, face: 1, yeuxFermes: false };
}

/**
 * Fait vivre la pièce : promenades au repos, pas qui alternent, clignements.
 * Une seule boucle d'animation (~30 images/s), coupée si l'iPhone demande
 * moins de mouvement ou si l'onglet est caché.
 */
function useVie(agents: AgentBureau[]) {
  const [poses, setPoses] = useState<Record<string, Pose>>(() => Object.fromEntries(agents.map((a) => [a.id, poseInitiale(a)])));
  const cle = agents.map((a) => `${a.id}:${a.etat}`).join("|");

  useEffect(() => {
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const marcheurs = agents.map((a, n) => ({
      a,
      marche: !reduit && (a.etat === "repos" || a.etat === "publie" || a.etat === "echec"),
      cible: 1,
      pose: poseInitiale(a),
      // Départs décalés : chacun commence sa promenade à un moment différent.
      attendJusqua: performance.now() + 1500 + n * 2200,
      cligne: 1800 + n * 1300,
    }));
    if (reduit) {
      // Pas d'animation : on place seulement chacun à sa position du moment.
      const id = requestAnimationFrame(() => setPoses(Object.fromEntries(marcheurs.map((m) => [m.a.id, m.pose]))));
      return () => cancelAnimationFrame(id);
    }

    let precedent = performance.now();
    let dernierRendu = 0;
    let id = 0;
    const boucle = (t: number) => {
      const dt = Math.min(0.1, (t - precedent) / 1000);
      precedent = t;
      for (const m of marcheurs) {
        const p = m.pose;
        p.yeuxFermes = (t + m.cligne) % 4300 < 150;
        if (!m.marche) continue;
        const route = ROUTES[m.a.id];
        if (t < m.attendJusqua) {
          p.pas = 0;
          continue;
        }
        const but = route[m.cible];
        const di = but.i - p.i;
        const dj = but.j - p.j;
        const dist = Math.hypot(di, dj);
        const avance = VITESSE * dt;
        if (dist <= avance) {
          p.i = but.i;
          p.j = but.j;
          p.pas = 0;
          m.attendJusqua = t + but.pause * 1000 * (0.8 + Math.random() * 0.5);
          m.cible = (m.cible + 1) % route.length;
        } else {
          p.i += (di / dist) * avance;
          p.j += (dj / dist) * avance;
          const ecranX = di - dj; // sens du déplacement à l'écran
          if (Math.abs(ecranX) > 0.05) p.face = ecranX < 0 ? -1 : 1;
          p.pas = Math.floor(t / 190) % 2 ? 1 : 2;
        }
      }
      if (t - dernierRendu > 33) {
        dernierRendu = t;
        setPoses(Object.fromEntries(marcheurs.map((m) => [m.a.id, { ...m.pose }])));
      }
      id = requestAnimationFrame(boucle);
    };
    id = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  return poses;
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
  const poses = useVie(agents);
  const nuit = heure >= 22 || heure < 6;
  const crepuscule = !nuit && (heure < 8 || heure >= 19);
  const ciel = nuit ? "#1b2340" : crepuscule ? "#e7a77c" : "#9fcbe8";
  const selection = agents.find((a) => a.id === choix) ?? agents[0];

  // Le décor ne change pas d'une image à l'autre : construit une seule fois.
  const fond = useMemo(
    () => (
      <>
        <Sol />
        <Tapis />
        <Murs ciel={ciel} nuit={nuit} />
        <Horloge heure={heure} minute={minute} />
      </>
    ),
    [ciel, nuit, heure, minute],
  );
  const meubles = useMemo(() => {
    const liste: { prof: number; node: ReactNode }[] = [
      { prof: 1.1, node: <Bibliotheque key="biblio" /> },
      { prof: 7.6, node: <Plante key="plante" i={7.2} j={0.2} /> },
      { prof: 8.0, node: <CoinCafe key="cafe" /> },
      { prof: 11.0, node: <Portant key="portant" /> },
      { prof: 12.2, node: <DossierCanape key="dossier" /> },
      { prof: 13.2, node: <AssiseCanape key="assise" /> },
      { prof: 8.2, node: <Plante key="plante2" i={0.2} j={0.5} /> },
    ];
    for (const a of agents) {
      const [bi, bj] = POSTES[a.id]?.bureau ?? [0, 0];
      if (!POSTES[a.id]) continue;
      liste.push({ prof: bi + 0.8 + bj + 0.4, node: <Bureau key={`b-${a.id}`} i={bi} j={bj} agent={a.id} travaille={a.etat === "travaille"} /> });
    }
    return liste;
  }, [agents]);

  // Meubles et personnages triés ensemble, de l'arrière vers l'avant.
  const objets = [...meubles];
  for (const a of agents) {
    const p = poses[a.id];
    if (!p || !POSTES[a.id]) continue;
    objets.push({ prof: p.i + p.j, node: <Personnage key={`p-${a.id}`} a={a} pose={p} choisi={a.id === selection?.id} onChoisir={() => setChoix(a.id)} /> });
  }
  objets.sort((x, y) => x.prof - y.prof);

  return (
    <div>
      <svg viewBox="-140 -100 280 236" className={styles.piece} role="img" aria-label="Le bureau des agents">
        {fond}
        {objets.map((o) => o.node)}
        {nuit && <polygon points={pts(iso(0, 0, MUR), iso(0, N, MUR), iso(0, N), iso(N, N), iso(N, 0), iso(N, 0, MUR))} fill="#0b1430" opacity={0.3} pointerEvents="none" />}
        {agents.map((a) => {
          const p = poses[a.id];
          if (!p || !a.bulle) return null;
          const [x, y] = iso(p.i, p.j);
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

"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { ETAGES_AGENTS, POSITIONS } from "./positions";
import Corps, { ASSIS, DEBOUT, animerSquelette, apparencePour, postureMarche, tournerVers, useSquelette, type Accessoire, type Posture, type StyleMarche } from "./Corps";
import { BULLE_DE, BUREAU_ASSOCIE, EST_OPEN_SPACE, POSTES, chemin, etageDe, pieceParId, placeDans, type Point } from "@/lib/plan";
import type { Agent, PieceId } from "@/lib/types";

type Props = {
  tranche: number; // tranche de 40 minutes de jeu (gestes)
  agent: Agent;
  index: number;
  selectionne: boolean;
  vitesseJeu: number;
  onClick: (id: string) => void;
  piecesOuvertes: PieceId[];
  etageVue: number;
  cuisine: boolean;
  decontracte?: boolean;
};

/** Éclaircit une couleur (tenue décontractée). */
function eclaircir(c: string, k = 0.3) {
  const n = parseInt(c.slice(1), 16);
  const f = (v: number) => Math.round(v + (255 - v) * k);
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, "0")).join("")}`;
}

const VITESSE_MARCHE = 1.5; // m/s à vitesse ×1 (pas tranquille)

function hachage(s: string) {
  let x = 0;
  for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  return x;
}

const PIECE_SERVICE: Record<string, PieceId> = { accueil: "accueil", cuisine: "cafe", pressing: "pressing", coach: "sport", menage: "detente", it: "it", office: "accueil" };

/** Pièce où se trouve la personne selon son activité et les pièces construites. */
export function pieceAgent(agent: Agent, ouvertes: PieceId[], cuisine = false): PieceId {
  const ouvert = (p: PieceId) => ouvertes.includes(p);
  const poste = POSTES[agent.bureau]?.piece;
  const sonPoste: PieceId = poste && ouvert(poste) ? poste : "openspace";
  let p: PieceId;
  switch (agent.activite) {
    case "absent":
    case "conge":
    case "malade":
    case "teletravail":
    case "evacuation":
      return "dehors";
    case "travaille":
      if (agent.filiere === "service") p = PIECE_SERVICE[agent.service ?? "office"];
      else if (agent.filiere === "rh") p = "rh";
      else if (agent.filiere === "associe") p = BUREAU_ASSOCIE[agent.associeDe ?? "expertise"] ?? sonPoste;
      else p = sonPoste;
      break;
    case "reunion":
      if (agent.enComite) {
        p = ouvert("conseil") ? "conseil" : "reunion"; // réunion live des managers
        break;
      }
      if (agent.filiere === "associe" && ouvert("conseil")) {
        p = "conseil"; // comité des associés
        break;
      }
      p = BULLE_DE[sonPoste] ?? "reunion";
      if (!ouvert(p)) p = "reunion";
      break;
    case "pause": {
      const k = (agent.id.charCodeAt(0) + agent.id.length) % 3;
      p = k === 0 && ouvert("detente") ? "detente" : k === 1 && ouvert("terrasse") ? "terrasse" : "cafe";
      break;
    }
    case "dejeuner":
      return cuisine ? "cafe" : "dehors"; // sans cuisine, l'équipe sort déjeuner
    case "sport":
      p = "sport";
      break;
    case "formation":
      p = "formation";
      break;
    case "archives":
      p = "archives";
      break;
    default:
      p = "accueil";
  }
  if (!ouvert(p)) p = ouvert(sonPoste) ? sonPoste : "accueil";
  return p;
}

function Personnage({ tranche, agent, index, selectionne, vitesseJeu, onClick, piecesOuvertes, etageVue, cuisine, decontracte = false }: Props) {
  const groupe = useRef<Group>(null);
  const sq = useSquelette();
  const pose = useRef<Posture>({ ...DEBOUT });
  const apparence = useMemo(() => {
    const a = apparencePour(agent.id, agent.prenom, agent.couleur, agent.peau, agent.cheveux);
    return decontracte ? { ...a, veste: false, haut: eclaircir(a.haut) } : a;
  }, [agent.id, agent.prenom, agent.couleur, agent.peau, agent.cheveux, decontracte]);
  // Allure : pressée si stressée ou au téléphone, fatiguée le soir, détendue en pause.
  const style: StyleMarche = agent.fatigue > 70 ? "fatigue" : agent.stress > 70 ? "presse" : ["pause", "dejeuner", "sport"].includes(agent.activite) ? "detendu" : "normal";
  const facteurAllure = { normal: 1, presse: 1.3, fatigue: 0.72, detendu: 0.85 }[style];
  const piece = pieceAgent(agent, piecesOuvertes, cuisine);
  const evacue = agent.activite === "evacuation";
  const cible = evacue ? { x: -11 + (index % 22) * 1.05, z: 10.2 + Math.floor(index / 22) * 0.7 } : placeDans(piece, index, agent.bureau);

  // Gestes : téléphone par moments, café en pause, tête dans les mains si très stressé.
  const auTelephone = agent.activite === "travaille" && hachage(agent.id + tranche) % 6 === 0;
  const stresse = agent.activite === "travaille" && agent.stress > 75 && hachage(agent.id + tranche + "s") % 3 === 0;
  const accessoire: Accessoire = agent.activite === "pause" ? "cafe" : auTelephone ? "telephone" : null;
  const centre = (() => {
    if (piece === "formation") return { x: -11.9, z: 4 };
    const pc = pieceParId(piece);
    return pc ? { x: (pc.x0 + pc.x1) / 2, z: (pc.z0 + pc.z1) / 2 } : null;
  })();

  const etat = useRef({
    x: piece === "dehors" ? -7.5 : cible.x,
    z: piece === "dehors" ? 9.5 : cible.z,
    piece: piece as PieceId,
    etage: etageDe(piece),
    chemin: [] as Point[],
    t: index * 1.7,
    lacet: 0,
    vitesse: 0,
    salut: 0,
    salutId: "",
    regard: 0,
  });

  useEffect(() => {
    const s = etat.current;
    s.chemin = chemin({ x: s.x, z: s.z, piece: s.piece }, { ...cible, piece });
    s.piece = piece;
  }, [piece, cible.x, cible.z]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleHtml = !(agent.activite === "absent" || agent.activite === "conge" || agent.activite === "malade" || agent.activite === "teletravail") || !!agent.bulle;

  useFrame((_, dtBrut) => {
    const s = etat.current;
    const g = groupe.current;
    if (!g) return;
    const dt = Math.min(dtBrut, 0.1);
    const accel = Math.min(Math.max(vitesseJeu, 1), 3);
    s.t += dt * (0.6 + 0.4 * accel);

    // Déplacement avec accélération et freinage doux à l'arrivée.
    let marche = false;
    let lacetVoulu = s.lacet;
    if (s.chemin.length) {
      const p = s.chemin[0];
      const dx = p.x - s.x;
      const dz = p.z - s.z;
      const dist = Math.hypot(dx, dz);
      const restant = dist + (s.chemin.length > 1 ? 1 : 0);
      const vmax = VITESSE_MARCHE * facteurAllure * accel * Math.min(1, 0.35 + restant / 1.2);
      s.vitesse += (vmax - s.vitesse) * (1 - Math.exp(-dt * 5));
      const pas = s.vitesse * dt;
      if (dist <= pas || dist < 0.01) {
        s.x = p.x;
        s.z = p.z;
        s.etage = p.etage; // l'ascenseur change d'étage
        s.chemin.shift();
      } else {
        s.x += (dx / dist) * pas;
        s.z += (dz / dist) * pas;
        lacetVoulu = Math.atan2(dx, dz);
      }
      marche = true;
    } else s.vitesse = 0;

    // Évitement des collègues et salut quand on se croise.
    let proche: { id: string; dx: number; dz: number; d: number } | null = null;
    if (marche) {
      for (const [id, p] of POSITIONS) {
        if (id === agent.id || ETAGES_AGENTS.get(id) !== s.etage) continue;
        const dx = s.x - p.x;
        const dz = s.z - p.z;
        const d = Math.hypot(dx, dz);
        if (d > 0.001 && d < 0.6) {
          const pousse = (0.6 - d) * dt * 3;
          s.x += (dx / d) * pousse;
          s.z += (dz / d) * pousse;
        }
        if (d < 1.4 && (!proche || d < proche.d)) proche = { id, dx, dz, d };
      }
      if (proche && proche.id !== s.salutId && hachage(agent.id + proche.id) % 3 === 0) {
        s.salut = 1.1;
        s.salutId = proche.id;
      }
    }
    s.salut = Math.max(0, s.salut - dt);
    g.position.set(s.x, 0, s.z);

    const auPoste = !marche && agent.activite === "travaille" && EST_OPEN_SPACE.has(piece);
    const assis = !marche && (agent.activite === "travaille" || agent.activite === "formation" || agent.activite === "reunion");
    if (auPoste) lacetVoulu = POSTES[agent.bureau % POSTES.length].rot === 0 ? 0 : Math.PI;
    else if (!marche && centre && (agent.activite === "reunion" || agent.activite === "pause" || agent.activite === "formation")) lacetVoulu = Math.atan2(centre.x - s.x, centre.z - s.z);
    s.lacet = tournerVers(s.lacet, lacetVoulu, dt, marche ? 8 : 4);
    g.rotation.y = s.lacet;

    // Pose cible selon l'activité, puis transition douce.
    let cibleP: Posture;
    if (marche) {
      cibleP = postureMarche(s.t, 7.5, style);
      if (proche) cibleP.teteY = Math.max(-0.7, Math.min(0.7, Math.atan2(-proche.dx, -proche.dz) - s.lacet));
      if (s.salut > 0) {
        cibleP.epauleG = -2.7; // petit signe de la main
        cibleP.epauleGz = -0.3 + Math.sin(s.t * 14) * 0.25;
        cibleP.coudeG = -0.4;
      }
      if (auTelephone) {
        cibleP.epauleD = -0.25;
        cibleP.epauleDz = 0.35;
        cibleP.coudeD = -2.45; // téléphone à l'oreille en marchant
      }
    }
    else if (assis) {
      cibleP = { ...ASSIS };
      if (auPoste && !auTelephone && !stresse) {
        const f = Math.sin(s.t * 13) * 0.05; // frappe au clavier
        cibleP.coudeG += f;
        cibleP.coudeD -= f;
      }
      if (agent.activite === "reunion") {
        cibleP.epauleG = -0.5 + Math.sin(s.t * 1.8) * 0.2; // on parle avec les mains
        cibleP.coudeG = -1.2 + Math.sin(s.t * 2.3) * 0.25;
        cibleP.teteY = Math.sin(s.t * 0.45 + index) * 0.5; // regarde celui qui parle
      }
      if (auPoste && !auTelephone && !stresse) {
        // Petits gestes du quotidien, par fenêtres de 9 secondes.
        const fenetre = Math.floor(s.t / 9);
        const dansFenetre = s.t % 9;
        const geste = hachage(agent.id + fenetre) % 9;
        cibleP.teteX = 0.12; // regard vers l'écran
        if (dansFenetre < 2.6) {
          if (geste === 0) {
            cibleP.epauleG = cibleP.epauleD = -2.9; // s'étire
            cibleP.coudeG = cibleP.coudeD = -0.3;
            cibleP.inclinaison = -0.12;
            cibleP.teteX = -0.25;
          } else if (geste === 1) {
            cibleP.epauleD = -2.2; // se gratte la tête
            cibleP.coudeD = -2.0 + Math.sin(s.t * 10) * 0.15;
            cibleP.teteX = 0.05;
          } else if (geste === 2) {
            cibleP.inclinaison = 0.28; // se penche vers l'écran
            cibleP.teteX = 0.2;
          } else if (geste === 3) {
            cibleP.teteY = 0.8; // regarde la fenêtre, rêveur
            cibleP.teteX = -0.1;
          } else if (geste === 4) {
            cibleP.teteY = -0.6; // échange avec le voisin
          }
        }
      }
    } else {
      cibleP = { ...DEBOUT };
      cibleP.hauteur = Math.sin(s.t * 1.6) * 0.004; // respiration
      cibleP.teteY = Math.sin(s.t * 0.3 + index) * 0.35; // regarde autour
      if (style === "detendu") {
        cibleP.epauleGz = -0.2; // mains dans les poches
        cibleP.coudeG = -0.55;
      }
    }
    if (accessoire === "cafe" && !assis) {
      cibleP.epauleD = marche ? -0.2 : -0.3;
      cibleP.coudeD = -1.4 + (marche ? 0 : Math.sin(s.t * 0.5) * 0.25);
    }
    if (auTelephone && !marche) {
      cibleP.epauleD = -0.25;
      cibleP.epauleDz = 0.35;
      cibleP.coudeD = -2.45; // combiné à l'oreille
    }
    if (stresse && auPoste) {
      cibleP.epauleG = cibleP.epauleD = -0.85;
      cibleP.epauleGz = -0.25;
      cibleP.epauleDz = 0.25;
      cibleP.coudeG = cibleP.coudeD = -2.2; // tête dans les mains
      cibleP.inclinaison = 0.35;
    }
    if (auPoste && agent.fatigue > 85) cibleP.inclinaison = 0.45; // épuisé, affalé sur le bureau
    animerSquelette(sq, pose.current, cibleP, dt, marche ? 14 : 5);

    g.visible = (evacue || !(s.piece === "dehors" && !s.chemin.length)) && s.etage === etageVue;
    ETAGES_AGENTS.set(agent.id, s.etage);
    POSITIONS.set(agent.id, { x: s.x, y: 1.55 + (1 - Math.min(1, -pose.current.hauteur / 0.42)) * 0.4, z: s.z, visible: g.visible && visibleHtml });
  });

  const clic = (ev: ThreeEvent<MouseEvent>) => {
    ev.stopPropagation();
    onClick(agent.id);
  };

  return (
    <group ref={groupe} onClick={clic}>
      {selectionne && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.5, 32]} />
          <meshBasicMaterial color="#2f5bea" />
        </mesh>
      )}
      <Corps a={apparence} sq={sq} accessoire={accessoire} humeur={agent.moral > 65 ? "content" : agent.moral < 35 ? "triste" : "neutre"} />
    </group>
  );
}

/** Ne redessine un personnage que si ce qui se voit a changé (sinon 110 rendus par seconde). */
function egal(a: Props, b: Props) {
  const x = a.agent;
  const y = b.agent;
  return (
    a.tranche === b.tranche &&
    a.index === b.index &&
    a.selectionne === b.selectionne &&
    a.vitesseJeu === b.vitesseJeu &&
    a.onClick === b.onClick &&
    a.piecesOuvertes === b.piecesOuvertes &&
    a.etageVue === b.etageVue &&
    a.cuisine === b.cuisine &&
    a.decontracte === b.decontracte &&
    x.id === y.id &&
    x.prenom === y.prenom &&
    x.couleur === y.couleur &&
    x.peau === y.peau &&
    x.cheveux === y.cheveux &&
    x.activite === y.activite &&
    x.bureau === y.bureau &&
    x.filiere === y.filiere &&
    x.service === y.service &&
    x.associeDe === y.associeDe &&
    x.enComite === y.enComite &&
    x.bulle === y.bulle &&
    x.fatigue > 70 === y.fatigue > 70 &&
    x.stress > 70 === y.stress > 70 &&
    x.stress > 75 === y.stress > 75 &&
    (x.moral > 65 ? 1 : x.moral < 35 ? -1 : 0) === (y.moral > 65 ? 1 : y.moral < 35 ? -1 : 0)
  );
}

export default memo(Personnage, egal);

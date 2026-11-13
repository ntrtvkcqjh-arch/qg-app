"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, OrthographicCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector3 } from "three";
import Decor from "./Decor";
import Personnage from "./Personnage";
import Associee from "./Associee";
import Visiteurs from "./Visiteurs";
import AileEst from "./AileEst";
import Meteo from "./Meteo";
import { CoucheEtiquettes, Projecteur } from "./Etiquettes";
import { jourDe, minuteDuJour, moisDe } from "@/lib/calendrier";
import { POLES } from "@/lib/data/developpement";
import { niveauLocaux } from "@/lib/data/locaux";
import { pieceParId } from "@/lib/plan";
import { useJeu } from "@/lib/store";
import type { PieceId } from "@/lib/types";

/** Ambiance lumineuse selon l'heure simulée. */
function ambiance(m: number, meteo: string) {
  const gris = meteo === "pluie" || meteo === "neige" || meteo === "nuages";
  if (m < 9 * 60 + 30) return { soleil: "#ffe0b2", force: gris ? 0.9 : 1.35, ciel: 0.85, fond: "#f3efe9", fenetre: gris ? "#aeb8c4" : "#ffd9a8", lampes: 0.3, nuit: false };
  if (m < 17 * 60) return { soleil: "#ffffff", force: gris ? 1.05 : 1.6, ciel: 0.9, fond: gris ? "#e4e8ee" : "#eef1f5", fenetre: gris ? "#b8c3cf" : "#9cc8f0", lampes: gris ? 0.3 : 0, nuit: false };
  if (m < 19 * 60) return { soleil: "#ffcc80", force: 1.25, ciel: 0.75, fond: "#efe6dc", fenetre: "#f6a85b", lampes: 0.7, nuit: false };
  if (m < 20 * 60 + 30) return { soleil: "#9fa8da", force: 0.7, ciel: 0.55, fond: "#cfd3ea", fenetre: "#5c6bc0", lampes: 1.3, nuit: false };
  return { soleil: "#5c6bc0", force: 0.35, ciel: 0.35, fond: "#1d2240", fenetre: "#141a33", lampes: 1.8, nuit: true };
}

const VUE = { target: new Vector3(2.5, 0, -2.5), zoom: 38 };
const VUE_AILE = { target: new Vector3(6.5, 0, -2.5), zoom: 31 };

/** Anime la caméra vers une pièce (double-clic) ou la vue d'ensemble. */
function Pilote({ controles, focus, aile }: { controles: React.RefObject<OrbitControlsImpl | null>; focus: PieceId | null; aile: boolean }) {
  // On n'anime que pendant ~1,5 s après un changement : ensuite la caméra est libre.
  const anim = useRef({ cle: "", images: 0 });
  useFrame(({ camera }) => {
    const c = controles.current;
    if (!c) return;
    const cle = `${focus}-${aile}`;
    if (cle !== anim.current.cle) anim.current = { cle, images: 90 };
    if (anim.current.images <= 0) return;
    anim.current.images--;
    const base = aile ? VUE_AILE : VUE;
    let cible = base.target;
    let zoom = base.zoom;
    if (focus) {
      const p = pieceParId(focus);
      if (p) {
        cible = new Vector3((p.x0 + p.x1) / 2, 0, (p.z0 + p.z1) / 2);
        zoom = 75;
      }
    }
    const avant = c.target.clone();
    c.target.lerp(cible, 0.08);
    camera.position.add(c.target.clone().sub(avant));
    camera.zoom += (zoom - camera.zoom) * 0.08;
    camera.updateProjectionMatrix();
  });
  return null;
}

export default function Cabinet3D() {
  const agents = useJeu((s) => s.etat?.agents ?? []);
  const vitesse = useJeu((s) => s.etat?.vitesse ?? 1);
  const minute = useJeu((s) => s.etat?.minute ?? 0);
  const niveau = useJeu((s) => s.etat?.niveauLocaux ?? 3);
  const achats = useJeu((s) => (s.etat?.achats ?? []).join(","));
  const moodBrut = useJeu((s) => s.etat?.moodGlobal ?? 60);
  const visiteurs = useJeu((s) => s.etat?.visiteurs ?? []);
  const meteo = useJeu((s) => s.etat?.meteo ?? "soleil");
  const deco = useJeu((s) => s.etat?.avatar?.deco ?? "#3a2a1d");
  const formation = useJeu((s) => !!s.etat?.sessions?.some((x) => x.jour === jourDe(s.etat!.minute) && !x.terminee));
  const piles = useJeu((s) => {
    const e = s.etat;
    if (!e) return "";
    const t = Array(16).fill(0);
    for (const a of e.agents) t[a.bureau] = e.dossiers.filter((d) => d.agent === a.id && d.phase < 5).length;
    return t.join(",");
  });
  const poles = useJeu((s) => {
    const e = s.etat;
    if (!e) return "";
    const t = Array(16).fill("");
    for (const a of e.agents) t[a.bureau] = POLES.find((p) => p.filiere === a.filiere)?.couleur ?? "";
    return t.join(",");
  });
  const selection = useJeu((s) => s.selectionAgent);
  const selectionner = useJeu((s) => s.selectionner);
  const selectionnerPiece = useJeu((s) => s.selectionnerPiece);
  const controles = useRef<OrbitControlsImpl>(null);
  const [focus, setFocus] = useState<PieceId | null>(null);
  const [visite, setVisite] = useState(false);
  const [pret, setPret] = useState(false);

  const m = minuteDuJour(minute);
  const amb = ambiance(m, meteo);
  const mois = moisDe(jourDe(minute));
  const piecesListe = niveauLocaux(niveau).pieces;
  const pieces = piecesListe.join(",");
  const mood = Math.round(moodBrut / 10) * 10;
  const aile = niveau >= 5;

  return (
    <div className="scene-3d">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={() => selectionner(null)} onCreated={() => requestAnimationFrame(() => setPret(true))}>
        <color attach="background" args={[amb.fond]} />
        <OrthographicCamera makeDefault position={[22.5, 22, 17.5]} zoom={VUE.zoom} near={-100} far={200} />
        <OrbitControls
          ref={controles}
          target={[2.5, 0, -2.5]}
          enableDamping
          minZoom={18}
          maxZoom={110}
          minPolarAngle={0.45}
          maxPolarAngle={1.15}
          screenSpacePanning
          autoRotate={visite}
          autoRotateSpeed={0.6}
        />
        <Pilote controles={controles} focus={focus} aile={aile} />
        <Environment resolution={128} frames={1}>
          <Lightformer intensity={1.2} position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
          <Lightformer intensity={0.6} color="#ffe6c4" position={[-10, 4, 10]} scale={[10, 4, 1]} />
          <Lightformer intensity={0.5} color="#cfe3ff" position={[10, 4, -10]} scale={[10, 4, 1]} />
        </Environment>
        <hemisphereLight args={["#ffffff", "#d6cbb8", amb.ciel]} />
        <directionalLight
          position={[12, 22, 10]}
          intensity={amb.force}
          color={amb.soleil}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-22}
          shadow-camera-right={26}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-bias={-0.0004}
        />
        {amb.lampes > 0 &&
          [
            [0, 3, 4],
            [8.5, 3, -5],
            [-9, 3, 4],
            [9, 3, 4],
            ...(aile ? [[18.5, 3, 4]] : []),
          ].map(([x, y, z]) => <pointLight key={`${x}${z}`} position={[x, y, z]} intensity={amb.lampes * 8} distance={9} color="#ffd59a" />)}
        <Decor
          onPiece={selectionnerPiece}
          onFocus={(p) => setFocus(p)}
          niveau={niveau}
          achats={achats}
          mois={mois}
          fenetre={amb.fenetre}
          mood={mood}
          piles={piles}
          poles={poles}
          deco={deco}
          nuit={amb.nuit}
          meteo={meteo}
        />
        <AileEst pieces={pieces} formation={formation} />
        <Meteo type={meteo} largeurBatiment={aile ? 22 : 12} />
        {agents.map((a, i) => (
          <Personnage key={a.id} agent={a} index={i} selectionne={selection === a.id} vitesseJeu={vitesse} onClick={selectionner} piecesOuvertes={piecesListe} />
        ))}
        <Associee />
        <Visiteurs visiteurs={visiteurs} reunionOuverte={piecesListe.includes("reunion")} />
        <Projecteur />
      </Canvas>
      <CoucheEtiquettes />
      {!pret && (
        <div className="voile-chargement">
          <span>
            <i />
            Ouverture du cabinet…
          </span>
        </div>
      )}
      <div className="commandes-camera">
        {focus && (
          <button onClick={() => setFocus(null)} title="Revenir à la vue d'ensemble">
            🔭 Vue d&apos;ensemble
          </button>
        )}
        <button className={visite ? "actif" : ""} onClick={() => setVisite(!visite)} title="La caméra tourne autour du cabinet">
          🎥 {visite ? "Arrêter la visite" : "Visite"}
        </button>
        <span className="astuce">Double-clic sur une pièce pour zoomer</span>
      </div>
    </div>
  );
}

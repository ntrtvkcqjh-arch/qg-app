"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import Decor from "./Decor";
import Personnage from "./Personnage";
import Associee from "./Associee";
import Visiteurs from "./Visiteurs";
import { CoucheEtiquettes, Projecteur } from "./Etiquettes";
import { jourDe, minuteDuJour, moisDe } from "@/lib/calendrier";
import { niveauLocaux } from "@/lib/data/locaux";
import { useJeu } from "@/lib/store";

/** Ambiance lumineuse selon l'heure simulée. */
function ambiance(m: number) {
  if (m < 9 * 60 + 30) return { soleil: "#ffe0b2", force: 1.35, ciel: 0.85, fond: "#f3efe9", fenetre: "#ffe9c7", lampes: 0 };
  if (m < 17 * 60) return { soleil: "#ffffff", force: 1.6, ciel: 0.9, fond: "#eef1f5", fenetre: "#bcd8f2", lampes: 0 };
  if (m < 18 * 60 + 30) return { soleil: "#ffcc80", force: 1.35, ciel: 0.8, fond: "#efe6dc", fenetre: "#f6b26b", lampes: 0.6 };
  return { soleil: "#9fa8da", force: 0.75, ciel: 0.6, fond: "#d4d8ec", fenetre: "#3f4f8f", lampes: 1.4 };
}

export default function Cabinet3D() {
  const agents = useJeu((s) => s.etat?.agents ?? []);
  const vitesse = useJeu((s) => s.etat?.vitesse ?? 1);
  const minute = useJeu((s) => s.etat?.minute ?? 0);
  const niveau = useJeu((s) => s.etat?.niveauLocaux ?? 3);
  const achats = useJeu((s) => (s.etat?.achats ?? []).join(","));
  const moodBrut = useJeu((s) => s.etat?.moodGlobal ?? 60);
  const visiteurs = useJeu((s) => s.etat?.visiteurs ?? []);
  const piles = useJeu((s) => {
    const e = s.etat;
    if (!e) return "";
    const t = Array(10).fill(0);
    for (const a of e.agents) t[a.bureau] = e.dossiers.filter((d) => d.agent === a.id && d.phase < 5).length;
    return t.join(",");
  });
  const selection = useJeu((s) => s.selectionAgent);
  const selectionner = useJeu((s) => s.selectionner);
  const selectionnerPiece = useJeu((s) => s.selectionnerPiece);

  const m = minuteDuJour(minute);
  const amb = ambiance(m);
  const mois = moisDe(jourDe(minute));
  const pieces = niveauLocaux(niveau).pieces;
  const mood = Math.round(moodBrut / 10) * 10;

  return (
    <div className="scene-3d">
      <Canvas shadows dpr={[1, 2]} onPointerMissed={() => selectionner(null)}>
        <color attach="background" args={[amb.fond]} />
        <OrthographicCamera makeDefault position={[22.5, 22, 17.5]} zoom={38} near={-100} far={200} />
        <OrbitControls target={[2.5, 0, -2.5]} enableDamping minZoom={18} maxZoom={90} minPolarAngle={0.45} maxPolarAngle={1.15} screenSpacePanning />
        <hemisphereLight args={["#ffffff", "#d6cbb8", amb.ciel]} />
        <directionalLight
          position={[12, 22, 10]}
          intensity={amb.force}
          color={amb.soleil}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-18}
          shadow-camera-right={18}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
          shadow-bias={-0.0004}
        />
        {amb.lampes > 0 &&
          [
            [0, 3, 4],
            [8.5, 3, -5],
            [-9, 3, 4],
            [9, 3, 4],
          ].map(([x, y, z]) => <pointLight key={`${x}${z}`} position={[x, y, z]} intensity={amb.lampes * 8} distance={9} color="#ffd59a" />)}
        <Decor onPiece={selectionnerPiece} niveau={niveau} achats={achats} mois={mois} fenetre={amb.fenetre} mood={mood} piles={piles} />
        {agents.map((a, i) => (
          <Personnage key={a.id} agent={a} index={i} selectionne={selection === a.id} vitesseJeu={vitesse} onClick={selectionner} piecesOuvertes={pieces} />
        ))}
        <Associee />
        <Visiteurs visiteurs={visiteurs} reunionOuverte={pieces.includes("reunion")} />
        <Projecteur />
      </Canvas>
      <CoucheEtiquettes />
    </div>
  );
}

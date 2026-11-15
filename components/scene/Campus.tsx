"use client";

import { useMemo, memo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { niveauLocaux } from "@/lib/data/locaux";
import { POLES } from "@/lib/data/developpement";
import { EST_OPEN_SPACE, OPEN_SPACES, PIECES, POSTES, pieceParId } from "@/lib/plan";
import { useJeu } from "@/lib/store";
import type { Filiere, PieceId } from "@/lib/types";
import { Meuble } from "./Modeles";

// Ambiance « campus tech » : logo et écran d'accueil, mur végétal, gradins,
// micro-cuisines colorées, cabines téléphoniques, signalétique des pôles,
// double écran et plante sur chaque bureau, bibliothèque-salon et potager
// sur le toit.

const HAUT_BUREAU = 0.77;

function texteTexture(dessin: (c: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 256) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d")!;
  dessin(c, w, h);
  const t = new CanvasTexture(cv);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Logo() {
  const tex = useMemo(
    () =>
      texteTexture((c, w, h) => {
        c.fillStyle = "#2f5bea";
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#ffffff";
        c.beginPath();
        c.roundRect(40, 58, 140, 140, 28);
        c.fill();
        c.fillStyle = "#2f5bea";
        c.font = "bold 84px Inter, system-ui, sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillText("EZ", 110, 132);
        c.fillStyle = "#ffffff";
        c.textAlign = "left";
        c.font = "bold 64px Inter, system-ui, sans-serif";
        c.fillText("CABINET EZ", 210, 108);
        c.font = "28px Inter, system-ui, sans-serif";
        c.fillText("Expertise · Conseil · Audit", 212, 168);
      }),
    [],
  );
  return (
    <mesh position={[-7.5, 1.6, 0.31]}>
      <planeGeometry args={[2.5, 1.18]} />
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.25} />
    </mesh>
  );
}

function EcranAccueil() {
  const chiffres = useJeu((s) => {
    const e = s.etat;
    if (!e) return "";
    return [e.agents.length, e.clients.length, e.compteurs.livres ?? 0, Math.round(e.reputation)].join("|");
  });
  const tex = useMemo(() => {
    const [agents, clients, livres, rep] = chiffres.split("|");
    return texteTexture(
      (c, w, h) => {
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, "#121a2e");
        g.addColorStop(1, "#2f3b6b");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        c.fillStyle = "#8fb3ff";
        c.font = "bold 30px Inter, system-ui, sans-serif";
        c.fillText("AUJOURD'HUI AU CABINET", 30, 60);
        const lignes: [string, string][] = [
          ["Collaborateurs", agents],
          ["Clients", clients],
          ["Dossiers livrés", livres],
          ["Réputation", `${rep}/100`],
        ];
        lignes.forEach(([l, v], i) => {
          c.fillStyle = "#cfd8ff";
          c.font = "26px Inter, system-ui, sans-serif";
          c.fillText(l, 30, 130 + i * 92);
          c.fillStyle = "#ffffff";
          c.font = "bold 46px Inter, system-ui, sans-serif";
          c.fillText(v ?? "0", 30, 178 + i * 92);
        });
      },
      320,
      512,
    );
  }, [chiffres]);
  return (
    <group position={[-4.3, 0, 1.4]} rotation={[0, -0.6, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.12, 0.9, 0.12]} />
        <meshStandardMaterial color="#9aa3b5" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.72, 1.12, 0.06]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 1.55, 0.032]}>
        <planeGeometry args={[0.66, 1.06]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function MurVegetal() {
  const tex = useMemo(
    () =>
      texteTexture(
        (c, w, h) => {
          c.fillStyle = "#2e5d32";
          c.fillRect(0, 0, w, h);
          const verts = ["#2e7d32", "#43a047", "#66bb6a", "#81c784", "#1b5e20", "#558b2f", "#7cb342"];
          let s = 7;
          const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
          for (let i = 0; i < 900; i++) {
            c.fillStyle = verts[Math.floor(r() * verts.length)];
            c.beginPath();
            c.ellipse(r() * w, r() * h, 6 + r() * 12, 3 + r() * 6, r() * Math.PI, 0, Math.PI * 2);
            c.fill();
          }
          for (let i = 0; i < 40; i++) {
            c.fillStyle = ["#f8bbd0", "#fff59d", "#ffffff"][i % 3];
            c.beginPath();
            c.arc(r() * w, r() * h, 3, 0, Math.PI * 2);
            c.fill();
          }
        },
        512,
        384,
      ),
    [],
  );
  return (
    <group position={[-11.93, 1.5, 3.4]} rotation={[0, Math.PI / 2, 0]}>
      <mesh>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      <mesh position={[0, -1.25, 0.12]}>
        <boxGeometry args={[3.3, 0.12, 0.25]} />
        <meshStandardMaterial color="#8d6e63" />
      </mesh>
    </group>
  );
}

/** Grand escalier-gradins en bois (réunions générales, pauses). */
function Gradins() {
  const coussins = ["#ff7043", "#2f5bea", "#ffca28", "#17a398", "#8e44ad"];
  return (
    <group position={[-4.6, 0, 5.6]}>
      {[0, 1, 2, 3].map((k) => (
        <mesh key={k} position={[0, 0.17 + k * 0.17, -1.5 + k * 0.75]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.34 + k * 0.34, 0.75]} />
          <meshStandardMaterial color={k % 2 ? "#c79a6b" : "#d4a774"} roughness={0.7} />
        </mesh>
      ))}
      {[0, 1, 2, 3].flatMap((k) =>
        [-0.7, 0.3].map((x, j) => (
          <mesh key={`${k}${j}`} position={[x + (k % 2) * 0.3, 0.38 + k * 0.34, -1.5 + k * 0.75]}>
            <boxGeometry args={[0.45, 0.07, 0.45]} />
            <meshStandardMaterial color={coussins[(k + j) % coussins.length]} roughness={0.95} />
          </mesh>
        )),
      )}
    </group>
  );
}

function MicroCuisine({ couleur }: { couleur: string }) {
  return (
    <group position={[3.05, 0, -1.72]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.5, 0.9, 0.42]} />
        <meshStandardMaterial color={couleur} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[1.56, 0.05, 0.46]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} />
      </mesh>
      <mesh position={[-0.45, 1.08, 0]}>
        <boxGeometry args={[0.28, 0.28, 0.25]} />
        <meshStandardMaterial color="#263238" metalness={0.4} />
      </mesh>
      {[0.1, 0.3, 0.5].map((x, i) => (
        <mesh key={x} position={[x, 1.02, 0.05]}>
          <cylinderGeometry args={[0.07, 0.07, 0.15, 12]} />
          <meshStandardMaterial color={["#ef5350", "#ffca28", "#66bb6a"][i]} />
        </mesh>
      ))}
    </group>
  );
}

function Cabine() {
  return (
    <group position={[11.35, 0, -1]}>
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[1, 2.2, 1.2]} />
        <meshStandardMaterial color="#b3e5fc" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 2.24, 0]}>
        <boxGeometry args={[1.04, 0.08, 1.24]} />
        <meshStandardMaterial color="#37474f" />
      </mesh>
      <mesh position={[0.25, 0.45, 0]}>
        <boxGeometry args={[0.4, 0.45, 0.6]} />
        <meshStandardMaterial color="#ff7043" />
      </mesh>
    </group>
  );
}

function Panneau({ x, z, nom, couleur }: { x: number; z: number; nom: string; couleur: string }) {
  const tex = useMemo(
    () =>
      texteTexture(
        (c, w, h) => {
          c.fillStyle = couleur;
          c.fillRect(0, 0, w, h);
          c.fillStyle = "#ffffff";
          c.font = "bold 54px Inter, system-ui, sans-serif";
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(nom.toUpperCase(), w / 2, h / 2);
        },
        512,
        96,
      ),
    [nom, couleur],
  );
  return (
    <group position={[x, 2.7, z]} rotation={[0, 0.55, 0]}>
      {[-0.9, 0.9].map((dx) => (
        <mesh key={dx} position={[dx, 0.45, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.9, 4]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[2.3, 0.44, 0.04]} />
        <meshStandardMaterial color={couleur} />
      </mesh>
      {[0.022, -0.022].map((dz) => (
        <mesh key={dz} position={[0, 0, dz]} rotation={[0, dz < 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[2.25, 0.42]} />
          <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

const couleurPiece = (id: PieceId) => {
  const f = (Object.entries(OPEN_SPACES) as [Filiere, PieceId[]][]).find(([, l]) => l.includes(id))?.[0];
  return POLES.find((p) => p.filiere === f)?.couleur ?? "#3d405b";
};

/** Double écran et plante sur chaque poste des open spaces ouverts. */
function Postes({ etage, ouvertes }: { etage: number; ouvertes: PieceId[] }) {
  return (
    <group>
      {POSTES.map((po, i) => {
        const piece = pieceParId(po.piece);
        if (!piece || piece.etage !== etage || !ouvertes.includes(po.piece)) return null;
        const vert = ["#43a047", "#66bb6a", "#2e7d32"][i % 3];
        return (
          <group key={i} position={[po.x, 0, po.z]} rotation={[0, po.rot, 0]}>
            <group position={[0.46, HAUT_BUREAU, 0.17]} rotation={[0, Math.PI - 0.35, 0]}>
              <Meuble nom="computerScreen" p={[0, 0, 0]} echelle={2.0} ombre={false} />
            </group>
            <mesh position={[-0.52, HAUT_BUREAU + 0.06, 0.2]}>
              <cylinderGeometry args={[0.05, 0.04, 0.12, 10]} />
              <meshStandardMaterial color="#eceff1" />
            </mesh>
            <mesh position={[-0.52, HAUT_BUREAU + 0.17, 0.2]}>
              <icosahedronGeometry args={[0.08, 0]} />
              <meshStandardMaterial color={vert} flatShading />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Bibliotheque() {
  return (
    <group>
      <Meuble nom="bookcaseOpen" p={[6.4, 0, -6.6]} rot={Math.PI / 2} largeur={1.6} />
      <Meuble nom="loungeChair" p={[7.4, 0, -5.6]} rot={-Math.PI / 2} echelle={2.0} />
      <mesh position={[6.6, 0.75, -5]}>
        <cylinderGeometry args={[0.02, 0.02, 1.5, 6]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[6.6, 1.52, -5]}>
        <coneGeometry args={[0.18, 0.2, 14, 1, true]} />
        <meshStandardMaterial color="#ffe0a3" emissive="#ffcc80" emissiveIntensity={0.6} side={2} />
      </mesh>
    </group>
  );
}

function Potager() {
  return (
    <group position={[10.3, 0, 5.4]}>
      {[0, 1].map((k) => (
        <group key={k} position={[0, 0, k * 1.3]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[2, 0.6, 0.9]} />
            <meshStandardMaterial color="#8d6e63" />
          </mesh>
          <mesh position={[0, 0.61, 0]}>
            <boxGeometry args={[1.9, 0.04, 0.8]} />
            <meshStandardMaterial color="#4e342e" />
          </mesh>
          {[-0.7, -0.35, 0, 0.35, 0.7].map((x, i) => (
            <group key={x} position={[x, 0.7, (i % 2) * 0.25 - 0.12]}>
              <mesh>
                <icosahedronGeometry args={[0.13, 0]} />
                <meshStandardMaterial color={i % 2 ? "#66bb6a" : "#558b2f"} flatShading />
              </mesh>
              {k === 0 && i % 2 === 0 && (
                <mesh position={[0.06, 0.02, 0.08]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshStandardMaterial color="#e53935" />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function Campus({ etage }: { etage: number }) {
  const niveau = useJeu((s) => s.etat?.niveauLocaux ?? 1);
  const leger = useJeu((s) => !!s.etat?.compteurs.graphismes);
  const ouvertes = niveauLocaux(niveau).pieces;
  const ouvert = (id: PieceId) => ouvertes.includes(id);
  const espaces = PIECES.filter((p) => p.etage === etage && EST_OPEN_SPACE.has(p.id) && ouvert(p.id));
  return (
    <group>
      {etage === 0 && ouvert("accueil") && (
        <>
          <Logo />
          <EcranAccueil />
          <MurVegetal />
          <Gradins />
        </>
      )}
      {etage === 0 && ouvert("detente") && <Bibliotheque />}
      {etage >= 1 && etage <= 4 && (
        <>
          <MicroCuisine couleur={["#ffca28", "#ff7043", "#26a69a", "#ab47bc"][etage - 1]} />
          <Cabine />
        </>
      )}
      {etage === 5 && ouvert("terrasse") && <Potager />}
      {espaces.map((p) => (
        <Panneau key={p.id} x={(p.x0 + p.x1) / 2} z={(p.z0 + p.z1) / 2} nom={p.nom} couleur={couleurPiece(p.id)} />
      ))}
      {!leger && <Postes etage={etage} ouvertes={ouvertes} />}
    </group>
  );
}

export default memo(Campus);

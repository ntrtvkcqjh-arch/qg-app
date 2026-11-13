"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { PIECES } from "@/lib/plan";
import { niveauLocaux } from "@/lib/data/locaux";
import { useJeu } from "@/lib/store";
import { ETIQUETTES, POSITIONS } from "./positions";

const v = new Vector3();

/** À placer dans le <Canvas> : projette les positions 3D vers l'écran. */
export function Projecteur() {
  const size = useThree((s) => s.size);
  useFrame(({ camera }) => {
    for (const [cle, el] of ETIQUETTES) {
      let p: { x: number; y: number; z: number; visible: boolean } | undefined;
      if (cle.startsWith("p:")) {
        const piece = PIECES.find((x) => x.id === cle.slice(2));
        if (piece)
          p = {
            x: (piece.x0 + piece.x1) / 2,
            y: 0.05,
            z: piece.z1 - 0.5,
            visible: true,
          };
      } else p = POSITIONS.get(cle.slice(2));
      if (!p || !p.visible) {
        el.style.visibility = "hidden";
        continue;
      }
      v.set(p.x, p.y, p.z).project(camera);
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      el.style.visibility = "visible";
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, ${cle.startsWith("p:") ? "-50%" : "-100%"})`;
    }
  });
  return null;
}

const CACHE = { display: "none" } as const;

const enregistrer = (cle: string) => (el: HTMLElement | null) => {
  if (el) ETIQUETTES.set(cle, el);
  else ETIQUETTES.delete(cle);
};

/** Couche HTML au-dessus du canvas : noms, bulles et noms des pièces. */
export function CoucheEtiquettes() {
  const agents = useJeu((s) => s.etat?.agents ?? []);
  const selection = useJeu((s) => s.selectionAgent);
  const selectionner = useJeu((s) => s.selectionner);
  const selectionnerPiece = useJeu((s) => s.selectionnerPiece);
  const monClient = useJeu((s) => {
    const d = s.etat?.dossiers.find((x) => x.id === s.etat?.travailToi);
    return d ? s.etat?.clients.find((c) => c.id === d.client)?.nom ?? null : null;
  });
  const ouvrir = useJeu((s) => s.ouvrir);
  const ouvrirMessage = useJeu((s) => s.ouvrirMessage);
  const pieces = useJeu((s) => niveauLocaux(s.etat?.niveauLocaux ?? 3).pieces);
  const etageVue = useJeu((s) => s.etageVue);
  const visiteurs = useJeu((s) => s.etat?.visiteurs ?? []);
  const menage = useJeu((s) => {
    const m = (s.etat?.minute ?? 0) % 1440;
    return m >= 20 * 60 + 30 && m < 22 * 60 + 30;
  });
  const propositions = useJeu((s) => s.etat?.propositions ?? []);

  return (
    <div className="couche-etiquettes">
      {PIECES.filter((p) => p.etage === etageVue).map((p) => (
        <button
          key={p.id}
          ref={enregistrer(`p:${p.id}`)}
          className="etiquette-piece pos"
          onClick={() => selectionnerPiece(p.id)}
        >
          {pieces.includes(p.id) ? p.nom : `🔒 ${p.nom}`}
        </button>
      ))}
      <div ref={enregistrer("a:toi")} className="etiquette pos" onClick={() => ouvrir("dossiers")}>
        {monClient && <div className="bulle">Je traite {monClient}</div>}
        <div className="nom toi">Toi</div>
      </div>
      <div ref={enregistrer("a:menage")} className="etiquette pos" style={menage ? undefined : CACHE}>
        <div className="nom visiteur">🧹 Ménage</div>
      </div>
      {visiteurs.map((v) => {
        const prop = propositions.find((x) => x.id === v.message);
        return (
          <div
            key={v.id}
            ref={enregistrer(`a:v_${v.id}`)}
            className="etiquette pos"
            onClick={() => (prop ? ouvrir("demandes") : ouvrirMessage(v.message))}
          >
            {v.etat === "attend" && <div className="bulle visiteur">{prop ? "Je voudrais être reçu·e" : "Je dois vous parler !"}</div>}
            <div className="nom visiteur">👤 {v.nom}</div>
          </div>
        );
      })}
      {agents.map((a) => (
        <div
          key={a.id}
          ref={enregistrer(`a:${a.id}`)}
          className="etiquette pos"
          onClick={() => selectionner(a.id)}
        >
          {a.bulle && <div className="bulle">{a.bulle}</div>}
          <div className={`nom ${selection === a.id ? "actif" : ""}`}>
            <span
              className="pastille"
              style={{
                background:
                  a.stress > 70
                    ? "#e4572e"
                    : a.stress > 45
                      ? "#f2a541"
                      : "#43aa8b",
              }}
            />
            {a.prenom}
          </div>
        </div>
      ))}
    </div>
  );
}

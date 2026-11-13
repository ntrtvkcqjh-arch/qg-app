"use client";

import { dateLongue, heure, jourDe, minuteDuJour } from "@/lib/calendrier";
import { passerAuLendemain } from "@/lib/moteur";
import { useJeu } from "@/lib/store";
import type { Etat } from "@/lib/types";

const VITESSES: { v: Etat["vitesse"]; label: string }[] = [
  { v: 0, label: "❚❚" },
  { v: 1, label: "×1" },
  { v: 3, label: "×3" },
  { v: 10, label: "×10" },
];

export default function BarreHaut() {
  const e = useJeu((s) => s.etat)!;
  const setVitesse = useJeu((s) => s.setVitesse);
  const agir = useJeu((s) => s.agir);
  const soir = minuteDuJour(e.minute) >= 18 * 60;
  const restent = e.agents.filter((a) => !["absent", "conge", "malade"].includes(a.activite)).length;
  const jour = jourDe(e.minute);

  return (
    <header className="barre-haut">
      <div className="bh-cabinet">
        <strong>{e.nomCabinet}</strong>
        <span className="date">
          {dateLongue(jour)} · {heure(e.minute)}
        </span>
      </div>
      <div className="bh-vitesse" role="group" aria-label="Vitesse du temps">
        {VITESSES.map((x) => (
          <button key={x.v} className={e.vitesse === x.v ? "actif" : ""} onClick={() => setVitesse(x.v)} title={x.v === 0 ? "Pause" : `Vitesse ${x.label}`}>
            {x.label}
          </button>
        ))}
      </div>
      {soir && (
        <button className="bouton-nuit" onClick={() => agir(passerAuLendemain)} title="Sauter la soirée jusqu'au lendemain matin">
          🌙 Passer à demain{restent ? ` (${restent} encore au bureau)` : ""}
        </button>
      )}
      <div className="bh-stats">
        <div className="pa" title="Points d'action du jour">
          {Array.from({ length: e.paMax }).map((_, i) => (
            <span key={i} className={i < e.pa ? "plein" : ""} />
          ))}
          <em>PA</em>
        </div>
        <Stat label="Mood" valeur={Math.round(e.moodGlobal)} couleur={e.moodGlobal > 60 ? "vert" : e.moodGlobal > 40 ? "orange" : "rouge"} />
        <Stat label="Réputation" valeur={Math.round(e.reputation)} couleur="bleu" />
        <div className="tresorerie" title="Trésorerie">
          <span>Trésorerie</span>
          <strong className={e.tresorerie < 0 ? "negatif" : ""}>{Math.round(e.tresorerie).toLocaleString("fr-FR")} €</strong>
        </div>
        <span className={`live ${e.vitesse ? "" : "pause"}`}>{e.vitesse ? "● En direct" : "En pause"}</span>
      </div>
    </header>
  );
}

function Stat({ label, valeur, couleur }: { label: string; valeur: number; couleur: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <div className="jauge">
        <div className={couleur} style={{ width: `${valeur}%` }} />
      </div>
      <strong>{valeur}</strong>
    </div>
  );
}

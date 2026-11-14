"use client";

import { jourDe } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { OBJECTIFS } from "@/lib/vie6";
import type { Etat } from "@/lib/types";

/** Écran de victoire (ou de fin de délai) de l'objectif de partie. */
export default function Victoire() {
  const e = useJeu((s) => s.etat);
  const agir = useJeu((s) => s.agir);
  if (!e || !e.compteurs.objectif) return null;
  const gagne = !!e.compteurs.victoire && e.compteurs.victoireVue !== e.compteurs.victoire;
  const perdu = !!e.compteurs.defaite && e.compteurs.defaiteVue !== e.compteurs.defaite;
  if (!gagne && !perdu) return null;
  const o = OBJECTIFS[e.compteurs.objectif - 1];
  const fermer = () =>
    agir((x: Etat) => {
      if (gagne) x.compteurs.victoireVue = x.compteurs.victoire;
      if (perdu) x.compteurs.defaiteVue = x.compteurs.defaite;
      return null;
    });
  const duree = Math.round((jourDe(e.minute) - (e.compteurs.objectifDebut ?? 0)) / 30);
  return (
    <div className="voile">
      <div className={`victoire ${gagne ? "" : "rate"}`}>
        <span className="grand-emoji">{gagne ? "👑" : "⌛"}</span>
        <h2>{gagne ? "Victoire !" : "Délai écoulé"}</h2>
        <p>
          {gagne ? `Objectif « ${o?.nom} » atteint en ${duree} mois.` : `L'objectif « ${o?.nom} » n'a pas été atteint dans les temps.`} {e.nomCabinet} compte {e.agents.length} personnes, {e.clients.length} clients et {e.badges.length} badges.
        </p>
        <p className="aide">Tu peux continuer la partie librement ou choisir un nouvel objectif dans les réglages.</p>
        <button className="bouton principal-btn" onClick={fermer}>
          Continuer
        </button>
      </div>
    </div>
  );
}

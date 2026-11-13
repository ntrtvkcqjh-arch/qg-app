"use client";

import { setAvatar, setPolitiqueHeures, setSons, setTeletravail } from "@/lib/ext";
import { useJeu } from "@/lib/store";

const COULEURS_TENUE = ["#121a2e", "#2f5bea", "#d1495b", "#17a398", "#8e44ad", "#f2a541", "#3d405b", "#ffffff"];
const COULEURS_CHEVEUX = ["#2a1a12", "#111111", "#6b4423", "#c89b5d", "#a0522d", "#d4b483", "#8d8d8d", "#b03a2e"];
const COULEURS_PEAU = ["#f6d3b8", "#e8b894", "#d9a07a", "#c68b5e", "#8d5524", "#5c3a21"];
const COULEURS_DECO = ["#3a2a1d", "#f4f1ea", "#1f2430", "#7a5638", "#5d6d7e"];

function Pastilles({ couleurs, valeur, onChoix }: { couleurs: string[]; valeur: string; onChoix: (c: string) => void }) {
  return (
    <div className="pastilles">
      {couleurs.map((c) => (
        <button key={c} className={`pastille-choix ${valeur === c ? "actif" : ""}`} style={{ background: c }} onClick={() => onChoix(c)} aria-label={c} />
      ))}
    </div>
  );
}

export default function Reglages() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);

  return (
    <div>
      <h3 className="titre-section">Heures de travail</h3>
      <p className="aide">
        Tout le monde est présent de 9 h à 18 h. Après, chacun décide de rester ou non selon sa charge et sa personnalité. Les heures
        supplémentaires sont payées avec une majoration de 25 %. Le droit du travail impose 48 h maximum par semaine et 11 h de repos
        entre deux journées : en cas d&apos;abus, l&apos;inspection du travail peut passer.
      </p>
      <div className="onglets">
        {(
          [
            ["libre", "Libres jusqu'à minuit"],
            ["limitee", "Limitées à 20 h"],
            ["interdite", "Départ à 18 h 30"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} className={e.politiqueHeures === v ? "actif" : ""} onClick={() => agir(setPolitiqueHeures, v)}>
            {l}
          </button>
        ))}
      </div>

      <h3 className="titre-section">Télétravail</h3>
      <p className="aide">Plus de moral, un peu moins de productivité et pas de réunions ces jours-là. Jamais le lundi.</p>
      <div className="onglets">
        {([0, 1, 2] as const).map((n) => (
          <button key={n} className={e.teletravailJours === n ? "actif" : ""} onClick={() => agir(setTeletravail, n)}>
            {n === 0 ? "Aucun" : `${n} jour${n > 1 ? "s" : ""} / semaine`}
          </button>
        ))}
      </div>

      <h3 className="titre-section">Ton avatar</h3>
      <div className="reglage-ligne">
        <span>Tenue</span>
        <Pastilles couleurs={COULEURS_TENUE} valeur={e.avatar.tenue} onChoix={(c) => agir(setAvatar, "tenue", c)} />
      </div>
      <div className="reglage-ligne">
        <span>Cheveux</span>
        <Pastilles couleurs={COULEURS_CHEVEUX} valeur={e.avatar.cheveux} onChoix={(c) => agir(setAvatar, "cheveux", c)} />
      </div>
      <div className="reglage-ligne">
        <span>Peau</span>
        <Pastilles couleurs={COULEURS_PEAU} valeur={e.avatar.peau} onChoix={(c) => agir(setAvatar, "peau", c)} />
      </div>
      <div className="reglage-ligne">
        <span>Bois de ton bureau</span>
        <Pastilles couleurs={COULEURS_DECO} valeur={e.avatar.deco} onChoix={(c) => agir(setAvatar, "deco", c)} />
      </div>

      <h3 className="titre-section">Ambiance sonore</h3>
      <p className="aide">Claviers, machine à café et imprimante, générés par le navigateur. Volume discret.</p>
      <button className={`bouton ${e.sons ? "principal-btn" : ""}`} onClick={() => agir(setSons, !e.sons)}>
        {e.sons ? "🔊 Sons activés" : "🔇 Sons désactivés"}
      </button>
    </div>
  );
}

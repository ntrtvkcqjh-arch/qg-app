"use client";

import { setAvatar, setPolitiqueHeures, setSons, setTeletravail } from "@/lib/ext";
import { useJeu } from "@/lib/store";
import { useState } from "react";
import { setAuto } from "@/lib/vie5";
import { CHAINES, lancerChaine } from "@/lib/chaines";
import type { Etat } from "@/lib/types";

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
      <h3 className="titre-section">🤖 Délégation (mode automatique)</h3>
      <p className="aide">Coche les thèmes que tes associés et managers gèrent pour toi. Pendant tes vacances, tout est délégué. Leurs choix sont prudents, pas toujours optimaux.</p>
      {(
        [
          ["dec", "Contrôles DEC, revues et missions expertes"],
          ["rh", "Ressources humaines (promotions, alternants, événements)"],
          ["finances", "Finances (clôture, offres, rachats, lettres de mission)"],
        ] as const
      ).map(([k, l]) => (
        <label key={k} className="case-reglage">
          <input type="checkbox" checked={!!e.auto?.[k]} onChange={(ev) => agir(setAuto, k, ev.target.checked)} /> {l}
        </label>
      ))}

      <h3 className="titre-section">🎬 Lancer un scénario</h3>
      <p className="aide">Missions expertes et crises en plusieurs étapes. Elles arrivent aussi toutes seules au fil des mois.</p>
      <div className="scenarios">
        {Object.entries(CHAINES).map(([id, c]) => (
          <button key={id} className="bouton petit" onClick={() => agir(lancerChaine, id, {})}>
            {c.emoji} {c.nom}
          </button>
        ))}
      </div>

      <Sauvegardes />

      <h3 className="titre-section">🎓 Tutoriel</h3>
      <button className="bouton" onClick={() => agir((x: Etat) => { x.compteurs.tuto = 0; return null; })}>
        Revoir le tutoriel
      </button>
    </div>
  );
}

const CLE_SLOT = (n: number) => `cabinet-ez-slot-${n}`;

function lireSlot(n: number): { nom: string; date: string; etat: Etat } | null {
  try {
    const t = localStorage.getItem(CLE_SLOT(n));
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
}

function Sauvegardes() {
  const e = useJeu((s) => s.etat)!;
  const chargerEtat = useJeu((s) => s.chargerEtat);
  const notifier = useJeu((s) => s.notifier);
  const [, rafraichir] = useState(0);
  const sauver = (n: number) => {
    try {
      localStorage.setItem(CLE_SLOT(n), JSON.stringify({ nom: e.nomCabinet, date: new Date().toLocaleString("fr-FR"), etat: e }));
      notifier(`💾 Partie sauvegardée dans l'emplacement ${n}.`);
      rafraichir((x) => x + 1);
    } catch {
      notifier("Sauvegarde impossible (stockage du navigateur plein).");
    }
  };
  const exporter = () => {
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([JSON.stringify(e)], { type: "application/json" }));
    lien.download = `cabinet-ez-${new Date().toISOString().slice(0, 10)}.json`;
    lien.click();
  };
  const importer = (f: File | undefined) => {
    if (!f) return;
    f.text().then((t) => {
      try {
        const etat = JSON.parse(t) as Etat;
        if (!etat.agents || !etat.clients) throw new Error();
        chargerEtat(etat);
        notifier("📂 Partie importée.");
      } catch {
        notifier("Fichier de sauvegarde invalide.");
      }
    });
  };
  return (
    <div className="sauvegardes">
      <h3 className="titre-section">💾 Sauvegardes</h3>
      <p className="aide">Garde plusieurs parties en parallèle (création à zéro, reprise…). La partie en cours reste sauvegardée automatiquement.</p>
      {[1, 2, 3].map((n) => {
        const s = lireSlot(n);
        return (
          <div key={n} className="slot">
            <span>
              <strong>Emplacement {n}</strong>
              <small>{s ? `${s.nom} · ${s.date}` : "vide"}</small>
            </span>
            <button className="bouton petit" onClick={() => sauver(n)}>
              Sauver ici
            </button>
            <button
              className="bouton petit"
              disabled={!s}
              onClick={() => {
                if (s) {
                  chargerEtat(s.etat);
                  notifier(`📂 Partie « ${s.nom} » chargée.`);
                }
              }}
            >
              Charger
            </button>
          </div>
        );
      })}
      <div className="slot">
        <button className="bouton petit" onClick={exporter}>
          ⬇️ Exporter un fichier
        </button>
        <label className="bouton petit">
          ⬆️ Importer un fichier
          <input type="file" accept="application/json" hidden onChange={(ev) => importer(ev.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}

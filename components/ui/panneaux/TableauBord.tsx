"use client";

import { useState } from "react";
import { useJeu } from "@/lib/store";
import { INDICATEURS, alerterDirigeant, tendance } from "@/lib/tableauBord";
import type { Client } from "@/lib/types";

// Tableaux de bord des clients : repère les signaux faibles avant la crise.

function Courbe({ v, mauvais }: { v: number[]; mauvais: boolean }) {
  if (v.length < 2) return <svg className="courbe-kpi" viewBox="0 0 100 30" />;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const pts = v.map((x, i) => `${(i / (v.length - 1)) * 100},${28 - ((x - min) / (max - min || 1)) * 26}`).join(" ");
  return (
    <svg className="courbe-kpi" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={mauvais ? "#e04a3a" : "#3b82c4"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function CarteKpi({ c }: { c: Client }) {
  const agir = useJeu((s) => s.agir);
  const jour = useJeu((s) => Math.floor((s.etat?.minute ?? 0) / 1440));
  if (!c.kpi) return null;
  const attente = (c.alerte ?? -99) > jour - 20;
  return (
    <div className="carte-kpi">
      <div className="grille-kpi">
        {INDICATEURS.map((i) => {
          const v = c.kpi![i.id];
          const t = tendance(c, i.id);
          const mauvais = i.bon === "haut" ? t < (i.id === "marge" ? -1.5 : -12) : t > 8;
          const unite = i.id === "marge" ? " pt" : i.id === "dso" ? " j" : " %";
          return (
            <div key={i.id} className="indic">
              <small>{i.nom}</small>
              <strong>
                {v[v.length - 1].toLocaleString("fr-FR")} <em>{i.unite}</em>
              </strong>
              <Courbe v={v} mauvais={mauvais} />
              <span className={mauvais ? "rouge-t" : ""}>
                {t > 0 ? "+" : ""}
                {t}
                {unite} sur 3 mois
              </span>
            </div>
          );
        })}
      </div>
      <button className="bouton petit" disabled={attente} onClick={() => agir(alerterDirigeant, c.id)}>
        {attente ? "📞 Dirigeant déjà alerté ce mois-ci" : "🔎 Alerter le dirigeant"}
      </button>
    </div>
  );
}

export function TableauxBord() {
  const e = useJeu((s) => s.etat)!;
  const [tous, setTous] = useState(false);
  const suivis = e.clients.filter((c) => c.kpi);
  const liste = tous ? suivis : suivis.slice(0, 12);
  return (
    <div className="tableaux-bord">
      <p className="aide">
        Les chiffres de tes clients, mois par mois. Une courbe qui se dégrade plusieurs mois de suite est un signal faible : alerte le dirigeant avant la crise et il te confiera une mission de conseil. Attention aux fausses alertes sur un seul mauvais mois.
        {` Signaux repérés : ${e.compteurs.signauxReperes ?? 0} · ratés : ${e.compteurs.signauxRates ?? 0}.`}
      </p>
      {liste.map((c) => (
        <div key={c.id} className="bloc-kpi">
          <h4>
            {c.nom} <small>· {c.secteur}</small>
          </h4>
          <CarteKpi c={c} />
        </div>
      ))}
      {!tous && suivis.length > 12 && (
        <button className="bouton petit" onClick={() => setTous(true)}>
          Voir les {suivis.length} clients
        </button>
      )}
      {!suivis.length && <p className="vide">Les tableaux de bord arrivent dès demain matin.</p>}
    </div>
  );
}

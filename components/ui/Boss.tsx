"use client";

import { heure, jourDe } from "@/lib/calendrier";
import { actionBoss, dossiersEcheance, resteAvantValidation } from "@/lib/moteur";
import { useJeu } from "@/lib/store";

export default function Boss() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const ouvrirValidation = useJeu((s) => s.ouvrirValidation);
  if (!e.bossActif) return null;
  const ec = e.echeances.find((x) => x.id === e.bossActif);
  if (!ec) return null;
  const lies = dossiersEcheance(e, ec.id);
  const restants = lies.filter((d) => d.phase < 4);
  const pv = restants.reduce((s, d) => s + resteAvantValidation(d), 0);
  const pct = ec.pvMax ? Math.max(0, Math.min(100, (pv / ec.pvMax) * 100)) : 0;
  const aValider = restants.filter((d) => d.phase === 3 && d.progression >= 100);
  const rush = e.compteurs.rushJour === jourDe(e.minute);

  return (
    <div className="boss">
      <div className="boss-tete">
        <span className="boss-icone">⚔️</span>
        <div>
          <small>Boss Fight · fin à 19:30 (il est {heure(e.minute)})</small>
          <strong>{ec.nom}</strong>
        </div>
        <span className="boss-compte">
          {restants.length} dossier{restants.length > 1 ? "s" : ""} à abattre
        </span>
      </div>
      <div className="pv">
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className="boss-actions">
        <button className="bouton" disabled={rush} onClick={() => agir(actionBoss, "rush")}>
          🔥 Rush collectif{rush ? " — lancé" : ""}
        </button>
        <button className="bouton" disabled={!restants.length} onClick={() => agir(actionBoss, "renfort")}>
          💪 Mettre la main à la pâte
        </button>
        {aValider.map((d) => (
          <button key={d.id} className="bouton principal-btn" onClick={() => ouvrirValidation(d.id)}>
            ✔ Valider {d.titre.split(" — ")[1] ?? d.titre}
          </button>
        ))}
      </div>
    </div>
  );
}

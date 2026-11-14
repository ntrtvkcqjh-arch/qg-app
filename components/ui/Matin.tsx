"use client";

import { dateLongue, jourDe, minuteDuJour } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { etatDefi } from "@/lib/vie5";
import type { Etat } from "@/lib/types";

// « Ce matin au cabinet » : un résumé par jour (3 urgences, 2 bonnes
// nouvelles, 1 risque) avant d'attaquer les décisions.

function resume(e: Etat) {
  const jour = jourDe(e.minute);
  const retard = e.dossiers.filter((d) => d.phase < 5 && d.echeance < jour);
  const aValider = e.dossiers.filter((d) => d.phase === 3 && d.progression >= 100);
  const ech = e.echeances.find((x) => !x.resolue && x.jour >= jour);
  const attente = e.messages.filter((m) => m.statut === "attente");
  const urgences = [
    retard.length ? `⏰ ${retard.length} dossier${retard.length > 1 ? "s" : ""} en retard, dont ${retard[0].titre}` : null,
    aValider.length ? `✔ ${aValider.length} révision${aValider.length > 1 ? "s" : ""} à valider` : null,
    ech ? `⚔️ ${ech.nom} dans ${ech.jour - jour} jour${ech.jour - jour > 1 ? "s" : ""}` : null,
    attente.length ? `🔔 ${attente.length} décision${attente.length > 1 ? "s" : ""} en attente` : null,
  ].filter(Boolean).slice(0, 3) as string[];
  const bonnes = e.journal.filter((j) => j.ton === "bien" && j.jour >= jour - 1).slice(0, 2).map((j) => j.texte);
  const c = [...e.clients].sort((a, b) => a.satisfaction - b.satisfaction)[0];
  const stress = e.agents.length ? e.agents.reduce((s, a) => s + a.stress, 0) / e.agents.length : 0;
  const risque = (e.risquesRC ?? []).length
    ? "⚖️ Une erreur passée inaperçue pourrait ressortir (RC Pro)."
    : stress > 55
      ? `😰 Stress moyen de l'équipe à ${Math.round(stress)}/100.`
      : c && c.satisfaction < 50
        ? `😠 ${c.nom} est mécontent (${Math.round(c.satisfaction)}/100).`
        : "🙂 Aucun risque majeur ce matin.";
  return { urgences, bonnes, risque, defi: etatDefi(e) };
}

export default function Matin() {
  const e = useJeu((s) => s.etat);
  const agir = useJeu((s) => s.agir);
  const occupe = useJeu((s) => s.reunionOuverte || s.timelapse || s.bilanAnnee);
  if (!e || occupe) return null;
  const jour = jourDe(e.minute);
  const m = minuteDuJour(e.minute);
  if (m < 8 * 60 || m > 12 * 60 || e.compteurs.matinVu === jour || e.compteurs.tuto !== undefined && e.compteurs.tuto < 99) return null;
  const r = resume(e);
  const fermer = () =>
    agir((x: Etat) => {
      x.compteurs.matinVu = jourDe(x.minute);
      return null;
    });
  return (
    <div className="voile">
      <div className="modale matin">
        <small>{dateLongue(jour)}</small>
        <h2>☀️ Ce matin au cabinet</h2>
        <h4>🚨 Urgences</h4>
        <ul>{r.urgences.length ? r.urgences.map((u) => <li key={u}>{u}</li>) : <li>Rien d&apos;urgent, profites-en !</li>}</ul>
        <h4>🎉 Bonnes nouvelles</h4>
        <ul>{r.bonnes.length ? r.bonnes.map((b) => <li key={b}>{b}</li>) : <li>Une journée calme hier.</li>}</ul>
        <h4>⚠️ À surveiller</h4>
        <ul>
          <li>{r.risque}</li>
        </ul>
        {r.defi && (
          <p className="aide">
            🏁 Défi de la semaine : {r.defi.nom} ({r.defi.reussi ? "réussi pour l'instant" : `${r.defi.valeur}${r.defi.objectif ? ` / ${r.defi.objectif}` : ""}`})
          </p>
        )}
        <button className="bouton principal-btn" onClick={fermer}>
          C&apos;est parti !
        </button>
      </div>
    </div>
  );
}

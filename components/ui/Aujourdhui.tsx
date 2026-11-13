"use client";

import { dateCourte, jourDe, joursOuvresEntre } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { LIBELLE_ACTIVITE } from "./textes";

export default function Aujourdhui() {
  const e = useJeu((s) => s.etat)!;
  const selectionner = useJeu((s) => s.selectionner);
  const ouvrir = useJeu((s) => s.ouvrir);
  const jour = jourDe(e.minute);
  const presents = e.agents.filter((a) => !["absent", "conge", "malade"].includes(a.activite));
  const actifs = e.dossiers.filter((d) => d.phase < 5);
  const aValider = actifs.filter((d) => d.phase === 3 && d.progression >= 100);
  const enAttente = e.messages.filter((m) => m.statut === "attente");
  const prochaine = e.echeances.find((x) => !x.resolue && x.jour >= jour);
  const parPhase = [1, 2, 3, 4].map((p) => actifs.filter((d) => d.phase === p).length);

  return (
    <aside className="panneau-droit">
      <section className="carte">
        <h3>Aujourd&apos;hui au cabinet</h3>
        <div className="kpis">
          <button className="kpi" onClick={() => ouvrir("equipe")}>
            <span>Présents</span>
            <strong>
              {presents.length}
              <small>/{e.agents.length}</small>
            </strong>
          </button>
          <button className="kpi" onClick={() => ouvrir("messages")}>
            <span>Messages</span>
            <strong className={enAttente.length > 4 ? "alerte" : ""}>{enAttente.length}</strong>
          </button>
          <button className="kpi" onClick={() => ouvrir("dossiers")}>
            <span>À valider</span>
            <strong className={aValider.length ? "alerte" : ""}>{aValider.length}</strong>
          </button>
        </div>
        {prochaine && (
          <div className="prochaine">
            <span>⚔️ Prochain boss</span>
            <strong>{prochaine.nom}</strong>
            <em>
              {dateCourte(prochaine.jour)} · {prochaine.jour === jour ? "aujourd'hui !" : `dans ${joursOuvresEntre(jour, prochaine.jour)} j ouvrés`}
            </em>
          </div>
        )}
        <div className="pipeline">
          {["Collecte", "Saisie", "Révision", "Validation"].map((n, i) => (
            <div key={n}>
              <strong>{parPhase[i]}</strong>
              <span>{n}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="carte liste-equipe">
        <h3>Équipe</h3>
        {e.agents.map((a) => (
          <button key={a.id} className="ligne-agent" onClick={() => selectionner(a.id)}>
            <span className="avatar" style={{ background: a.couleur }}>
              {a.prenom[0]}
              {a.nom[0]}
            </span>
            <span className="qui">
              <strong>{a.prenom}</strong>
              <small>{a.poste}</small>
            </span>
            <span className={`statut s-${a.activite}`}>{LIBELLE_ACTIVITE[a.activite]}</span>
          </button>
        ))}
      </section>
    </aside>
  );
}

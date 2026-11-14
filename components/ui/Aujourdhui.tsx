"use client";

import { dateCourte, jourDe, joursOuvresEntre } from "@/lib/calendrier";
import { besoins } from "@/lib/moteur";
import { LIBELLE_FILIERE } from "@/lib/data/equipe";
import { useJeu } from "@/lib/store";
import { LIBELLE_ACTIVITE } from "./textes";

export default function Aujourdhui() {
  const e = useJeu((s) => s.etat)!;
  const selectionner = useJeu((s) => s.selectionner);
  const ouvrir = useJeu((s) => s.ouvrir);
  const ouvrirMessage = useJeu((s) => s.ouvrirMessage);
  const jour = jourDe(e.minute);
  const presents = e.agents.filter((a) => !["absent", "conge", "malade"].includes(a.activite));
  const actifs = e.dossiers.filter((d) => d.phase < 5);
  const aValider = actifs.filter((d) => d.phase === 3 && d.progression >= 100);
  const enAttente = e.messages.filter((m) => m.statut === "attente");
  const prochaine = e.echeances.find((x) => !x.resolue && x.jour >= jour);
  const parPhase = [1, 2, 3, 4].map((p) => actifs.filter((d) => d.phase === p).length);
  const monDossier = e.dossiers.find((d) => d.id === e.travailToi);
  const manque = besoins(e).filter((b) => b.ratio > 1).sort((a, b) => b.ratio - a.ratio)[0];

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
          <button className="kpi" onClick={() => enAttente[0] && ouvrirMessage(enAttente[0].id)}>
            <span>Décisions</span>
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
        {monDossier && (
          <div className="toi-travaille">
            <span>🧑‍💼 Tu travailles sur</span>
            <strong>{monDossier.titre}</strong>
          </div>
        )}
        {e.propositions.length > 0 && (
          <button className="conseil-demandes" onClick={() => ouvrir("demandes")}>
            📥 {e.propositions.length} demande(s) en attente
            {e.propositions.some((p) => p.origine === "visite") ? " · quelqu'un t'attend à l'accueil !" : ""}
          </button>
        )}
        {manque && (
          <button className="conseil-rh" onClick={() => ouvrir("equipe")}>
            👥 Surcharge en {LIBELLE_FILIERE[manque.filiere].toLowerCase()} : pense à recruter
          </button>
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
        {e.agents.length === 0 && <p className="vide">Personne pour l&apos;instant : tu es seule au cabinet. Recrute dans Équipe &amp; RH.</p>}
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

"use client";

import { dateCourte } from "@/lib/calendrier";
import { LIBELLE_FILIERE, LIBELLE_PERSO } from "@/lib/data/equipe";
import { recruter } from "@/lib/moteur";
import { MAX_POSTES } from "@/lib/plan";
import { useJeu } from "@/lib/store";
import { LIBELLE_ACTIVITE, euros } from "../textes";

export default function Equipe() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const selectionner = useJeu((s) => s.selectionner);
  const masse = e.agents.reduce((s, a) => s + a.salaire * 1.45, 0);

  return (
    <div>
      <h3 className="titre-section">
        Collaborateurs ({e.agents.length}/{MAX_POSTES} bureaux)
      </h3>
      <p className="aide">Masse salariale chargée : {euros(masse)} par mois. Clique sur une ligne pour ouvrir la fiche.</p>
      <table className="tableau">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Statut</th>
            <th>Comp.</th>
            <th>Stress</th>
            <th>Fatigue</th>
            <th>Confiance</th>
            <th>Moral</th>
          </tr>
        </thead>
        <tbody>
          {e.agents.map((a) => (
            <tr key={a.id} onClick={() => selectionner(a.id)} className="cliquable">
              <td>
                <span className="avatar petit" style={{ background: a.couleur }}>
                  {a.prenom[0]}
                </span>
                {a.prenom} <small>{a.poste}</small>
              </td>
              <td>
                <span className={`statut s-${a.activite}`}>{LIBELLE_ACTIVITE[a.activite]}</span>
              </td>
              <td>{Math.round(a.competence)}</td>
              <td className={a.stress > 70 ? "rouge-t" : ""}>{Math.round(a.stress)}</td>
              <td className={a.fatigue > 75 ? "rouge-t" : ""}>{Math.round(a.fatigue)}</td>
              <td className={a.confiance < 35 ? "rouge-t" : ""}>{Math.round(a.confiance)}</td>
              <td className={a.moral < 35 ? "rouge-t" : ""}>{Math.round(a.moral)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="titre-section">Recrutement</h3>
      <p className="aide">Nouveaux candidats chaque lundi. Recruter coûte 1 PA et 2 000 € de frais.</p>
      <div className="candidats">
        {e.candidats.length === 0 && <p className="vide">Plus de candidats cette semaine.</p>}
        {e.candidats.map((c) => (
          <div key={c.id} className="candidat">
            <strong>
              {c.prenom} {c.nom}
            </strong>
            <span>{c.poste}</span>
            <small>
              {LIBELLE_FILIERE[c.filiere]} · {LIBELLE_PERSO[c.personnalite]} · compétence {c.competence}
            </small>
            <em>{euros(c.salaire)} brut / mois</em>
            <button className="bouton petit" onClick={() => agir(recruter, c.id)}>
              Recruter
            </button>
          </div>
        ))}
      </div>

      <h3 className="titre-section">Clients ({e.clients.length})</h3>
      <table className="tableau">
        <thead>
          <tr>
            <th>Client</th>
            <th>Forfait</th>
            <th>Satisfaction</th>
          </tr>
        </thead>
        <tbody>
          {e.clients.map((c) => (
            <tr key={c.id}>
              <td>
                <strong>{c.nom}</strong>
                <small className="bloc-small">
                  {c.dirigeant} · {c.trait}
                </small>
              </td>
              <td>{euros(c.forfait)}/mois</td>
              <td className={c.satisfaction < 40 ? "rouge-t" : c.satisfaction > 70 ? "vert-t" : ""}>{Math.round(c.satisfaction)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {e.anciens.length > 0 && (
        <>
          <h3 className="titre-section">Départs</h3>
          {e.anciens.map((a, i) => (
            <p key={i} className="ancien">
              {a.prenom} {a.nom} — {a.raison} ({dateCourte(a.depart)})
            </p>
          ))}
        </>
      )}
    </div>
  );
}

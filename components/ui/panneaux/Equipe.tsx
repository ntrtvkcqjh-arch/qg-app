"use client";

import { dateCourte } from "@/lib/calendrier";
import { LIBELLE_FILIERE, LIBELLE_PERSO } from "@/lib/data/equipe";
import { aUnRH, besoins, capacitePostes, fraisRecrutement, publierAnnonce, recruter } from "@/lib/moteur";
import { useJeu } from "@/lib/store";
import { LIBELLE_ACTIVITE, euros } from "../textes";
import EquipePlus from "./EquipePlus";
import FormationEquipe from "./FormationEquipe";

export default function Equipe() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const selectionner = useJeu((s) => s.selectionner);
  const masse = e.agents.reduce((s, a) => s + a.salaire * 1.45, 0);

  return (
    <div>
      <h3 className="titre-section">
        Collaborateurs ({e.agents.length}/{capacitePostes(e)} bureaux)
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

      <h3 className="titre-section">Charge par métier</h3>
      <p className="aide">Charge des dossiers en cours (un bilan compte triple) comparée à ce que ton équipe peut absorber. Au-delà de 100 %, recrute dans ce métier.</p>
      <div className="besoins">
        {besoins(e).map((b) => {
          const pct = b.capacite ? Math.round(b.ratio * 100) : b.charge ? 999 : 0;
          return (
            <div key={b.filiere} className="besoin">
              <span>{LIBELLE_FILIERE[b.filiere]}</span>
              <div className="jauge large">
                <div className={pct > 100 ? "rouge" : pct > 75 ? "orange" : "vert"} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <strong className={pct > 100 ? "rouge-t" : ""}>{b.capacite ? `${pct} %` : b.charge ? "personne" : "—"}</strong>
            </div>
          );
        })}
      </div>
      {e.agents.length === 0 && <p className="aide">Pour l&apos;instant, c&apos;est toi qui traites tous les dossiers, plus lentement qu&apos;une équipe.</p>}

      <h3 className="titre-section">Recrutement</h3>
      <p className="aide">
        Nouveaux candidats chaque lundi, en priorité dans les métiers qui manquent. Recruter coûte {euros(fraisRecrutement(e))} de frais.
        {aUnRH(e) ? " Ta ou ton responsable RH attire de meilleurs profils et divise les frais par deux." : " Un·e responsable RH attirerait de meilleurs profils et diviserait les frais par deux."}
      </p>
      <button className="bouton petit annonce" onClick={() => agir(publierAnnonce)}>
        📢 Publier une annonce maintenant (300 €)
      </button>
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
      <EquipePlus />
      <h3 className="titre-section">🎓 Formations de l&apos;équipe</h3>
      <FormationEquipe />
    </div>
  );
}

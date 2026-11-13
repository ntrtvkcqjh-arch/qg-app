"use client";

import { useState } from "react";
import { dateCourte, jourDe, prochainJourOuvre } from "@/lib/calendrier";
import { FORMATIONS, LIBELLE_DOMAINE } from "@/lib/data/developpement";
import { DOMAINES, planifierSession } from "@/lib/ext";
import { pieceOuverte } from "@/lib/moteur";
import { useJeu } from "@/lib/store";
import { euros } from "../textes";

/** Salle de formation dédiée aux collaborateurs. */
export default function FormationEquipe() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const jour = jourDe(e.minute);
  const dates = [prochainJourOuvre(jour)];
  for (let i = 0; i < 9; i++) dates.push(prochainJourOuvre(dates[dates.length - 1]));
  const [formation, setFormation] = useState(FORMATIONS[0].id);
  const [date, setDate] = useState(dates[0]);
  const [participants, setParticipants] = useState<string[]>([]);
  const f = FORMATIONS.find((x) => x.id === formation)!;
  const salle = pieceOuverte(e, "formation");
  const aVenir = e.sessions.filter((s) => !s.terminee).sort((a, b) => a.jour - b.jour);

  return (
    <div>
      {!salle && <p className="alerte-charge">Pas encore de salle de formation : les sessions ont lieu à l&apos;extérieur (agrandis tes locaux pour l&apos;avoir au cabinet).</p>}
      <div className="kpis-bilan">
        <div>
          <span>Budget formation restant</span>
          <strong>{euros(e.budgetFormation)}</strong>
        </div>
        <div>
          <span>Prise en charge</span>
          <strong>50 %</strong>
        </div>
        <div>
          <span>Sessions à venir</span>
          <strong>{aVenir.length}</strong>
        </div>
        <div>
          <span>Formations suivies</span>
          <strong>{e.compteurs.formations ?? 0}</strong>
        </div>
      </div>

      <h3 className="titre-section">Compétences de l&apos;équipe</h3>
      <div className="tableau-defile">
        <table className="tableau competences">
          <thead>
            <tr>
              <th>Nom</th>
              {DOMAINES.map((d) => (
                <th key={d}>{LIBELLE_DOMAINE[d]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {e.agents.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.prenom}
                  {a.diplome && <small> · {a.diplome.nom} {Math.round(a.diplome.progression)} %</small>}
                </td>
                {DOMAINES.map((d) => {
                  const v = Math.round(a.skills?.[d] ?? 0);
                  return (
                    <td key={d} className={a.objectif === d ? "objectif" : ""}>
                      <span className="niveau-skill" style={{ background: `hsl(${v * 1.2}, 60%, 88%)` }}>{v}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="titre-section">Planifier une session</h3>
      <div className="planif">
        <label>
          Formation
          <select value={formation} onChange={(ev) => setFormation(ev.target.value)}>
            {FORMATIONS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nom} — {LIBELLE_DOMAINE[x.domaine]}, {x.jours} j, {euros(x.prix)}/pers.
              </option>
            ))}
          </select>
        </label>
        <p className="aide">{f.description} Gain : +{f.gain * f.jours} en {LIBELLE_DOMAINE[f.domaine]} (×1,5 si c&apos;est l&apos;objectif annuel).</p>
        <label>
          Date
          <select value={date} onChange={(ev) => setDate(Number(ev.target.value))}>
            {dates.map((d) => (
              <option key={d} value={d}>
                {dateCourte(d)}
              </option>
            ))}
          </select>
        </label>
        <div className="participants">
          {e.agents
            .filter((a) => a.filiere !== "associe")
            .map((a) => {
              const choisi = participants.includes(a.id);
              return (
                <button
                  key={a.id}
                  className={`participant ${choisi ? "actif" : ""}`}
                  onClick={() => setParticipants(choisi ? participants.filter((x) => x !== a.id) : participants.length < 4 ? [...participants, a.id] : participants)}
                >
                  {a.prenom} <small>{Math.round(a.skills?.[f.domaine] ?? 0)}</small>
                </button>
              );
            })}
        </div>
        <button
          className="bouton principal-btn"
          disabled={!participants.length}
          onClick={() => {
            agir(planifierSession, formation, date, participants);
            setParticipants([]);
          }}
        >
          Réserver la salle ({euros(f.prix * participants.length)} avant prise en charge)
        </button>
      </div>

      {aVenir.length > 0 && (
        <>
          <h3 className="titre-section">Sessions à venir</h3>
          {aVenir.map((s) => (
            <p key={s.id} className="ancien">
              {dateCourte(s.jour)} — {FORMATIONS.find((x) => x.id === s.formation)?.nom} :{" "}
              {s.participants.map((id) => e.agents.find((a) => a.id === id)?.prenom).join(", ")}
            </p>
          ))}
        </>
      )}
      <p className="aide">Parcours diplômants (DSCG, DEC) et tutorat : ouvre la fiche d&apos;un collaborateur.</p>
    </div>
  );
}

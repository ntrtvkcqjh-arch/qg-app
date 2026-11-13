"use client";

import { dateCourte, heure } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";

export default function Absence() {
  const absence = useJeu((s) => s.etat?.absence);
  const fermer = useJeu((s) => s.fermerAbsence);
  if (!absence) return null;
  const evts = absence.evenements;
  return (
    <div className="voile">
      <div className="modale">
        <h2>Pendant ton absence…</h2>
        <p className="aide">Le cabinet a continué de tourner. Voici ce qui s&apos;est passé.</p>
        {evts.length === 0 ? (
          <p>Rien de notable : l&apos;équipe a travaillé tranquillement.</p>
        ) : (
          <ul className="journal">
            {evts.slice(0, 40).map((j, i) => (
              <li key={i} className={`j-${j.ton}`}>
                <small>
                  {dateCourte(j.jour)} {heure(j.minute)}
                </small>
                <span>{j.texte}</span>
              </li>
            ))}
          </ul>
        )}
        <button className="bouton principal-btn" onClick={fermer}>
          Retourner au cabinet
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { dateCourte, jourDe } from "@/lib/calendrier";
import { CRENEAUX, JOURS, STYLE_BLOC, ajouterProduction, deplacerBloc, genererAgenda, retirerBloc } from "@/lib/vie4";
import { useJeu } from "@/lib/store";

// Ton agenda de la semaine : glisse-dépose les rendez-vous, ajoute des blocs
// de production. Plus de 5 créneaux dans une journée te fatiguent.

export default function Agenda() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [tenu, setTenu] = useState<string | null>(null);
  const jour = jourDe(e.minute);
  const agenda = e.agenda;
  if (!agenda)
    return (
      <div>
        <p className="vide">Ton agenda de la semaine n&apos;est pas encore prêt.</p>
        <button className="bouton principal-btn" onClick={() => agir(genererAgenda, jour)}>
          Préparer l&apos;agenda de la semaine
        </button>
      </div>
    );
  const aujourdhui = jour - agenda.semaine;
  const parJour = JOURS.map((_, j) => agenda.blocs.filter((b) => b.jour === j).length);

  const deposer = (j: number, c: number) => {
    if (!tenu) return;
    if (tenu === "nouveau") agir(ajouterProduction, j, c);
    else agir(deplacerBloc, tenu, j, c);
    setTenu(null);
  };

  return (
    <div className="agenda">
      <p className="aide">
        Semaine du {dateCourte(agenda.semaine)}. Glisse les blocs pour réorganiser ta semaine. Au-delà de 5 créneaux par jour, ta forme baisse ; un bloc de production fait avancer tes dossiers urgents, un rendez-vous tenu fait plaisir au client.
      </p>
      <div className="palette">
        <span draggable onDragStart={() => setTenu("nouveau")} onClick={() => setTenu(tenu === "nouveau" ? null : "nouveau")} className={`bloc production ${tenu === "nouveau" ? "tenu" : ""}`}>
          🧠 + Bloc de production
        </span>
        {tenu && <small>Clique sur un créneau pour le poser (ou glisse-le).</small>}
      </div>
      <div className="grille-agenda">
        <div />
        {JOURS.map((j, i) => (
          <div key={j} className={`tete-jour ${i === aujourdhui ? "aujourdhui" : ""} ${parJour[i] > 5 ? "charge" : ""}`}>
            {j}
            <small>{parJour[i]} créneau{parJour[i] > 1 ? "x" : ""}</small>
          </div>
        ))}
        {CRENEAUX.map((h, c) => (
          <div key={h} className="ligne-agenda">
            <div className="heure">{h}</div>
            {JOURS.map((_, j) => {
              const b = agenda.blocs.find((x) => x.jour === j && x.creneau === c);
              const st = b ? STYLE_BLOC[b.type] : null;
              return (
                <div key={j} className={`case ${j < aujourdhui ? "passee" : ""}`} onDragOver={(ev) => ev.preventDefault()} onDrop={() => deposer(j, c)} onClick={() => !b && deposer(j, c)}>
                  {b && st && (
                    <div
                      className={`bloc ${tenu === b.id ? "tenu" : ""}`}
                      style={{ background: st.couleur }}
                      draggable
                      onDragStart={() => setTenu(b.id)}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setTenu(tenu === b.id ? null : b.id);
                      }}
                      title={`${st.nom} : ${b.titre}`}
                    >
                      <span>
                        {st.emoji} {b.titre}
                      </span>
                      <button
                        aria-label="Annuler ce créneau"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          agir(retirerBloc, b.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

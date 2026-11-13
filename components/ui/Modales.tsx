"use client";

import { dateCourte } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import type { Gazette } from "@/lib/types";

export function VueGazette({ g }: { g: Gazette }) {
  return (
    <article className={`gazette g-${g.ton}`}>
      <header>
        <small>La Gazette du cabinet · lundi {dateCourte(g.jour)}</small>
        <h2>{g.titre}</h2>
      </header>
      <section className="une">
        <h4>À la une</h4>
        <p>{g.une}</p>
      </section>
      <div className="colonnes">
        <section>
          <h4>Les chiffres de la semaine</h4>
          <ul>
            {g.chiffres.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Potins de la machine à café</h4>
          {g.potins.map((p, i) => (
            <p key={i} className="potin">
              « {p} »
            </p>
          ))}
        </section>
      </div>
      <section>
        <h4>L&apos;humeur du cabinet</h4>
        <p>{g.humeur}</p>
      </section>
      <section className="mot-dec">
        <h4>📚 Le mot du DEC</h4>
        <p>{g.motDuDec}</p>
      </section>
    </article>
  );
}

/** Gazette du lundi et résultat du contrôle qualité, affichés une fois. */
export default function Modales() {
  const absence = useJeu((s) => s.etat?.absence);
  const gazette = useJeu((s) => (s.etat?.gazetteNonLue ? s.etat.gazettes[0] : null));
  const controle = useJeu((s) => s.etat?.controleResultat ?? null);
  const etat = useJeu((s) => s.etat);
  if (!etat || absence) return null;

  const fermer = (patch: Partial<typeof etat>) => useJeu.setState({ etat: { ...etat, ...patch } });

  if (controle)
    return (
      <div className="voile">
        <div className="modale">
          <h2>🏛️ Contrôle qualité de l&apos;Ordre</h2>
          <p className="aide">Le contrôleur a passé la journée au cabinet. Verdict :</p>
          <p className={`verdict v-${controle.note === "Satisfaisant" ? "ok" : controle.note === "Insuffisant" ? "ko" : "moyen"}`}>{controle.note}</p>
          <ul className="points-controle">
            {controle.points.map((p, i) => (
              <li key={i} className={p.ok ? "ok" : "ko"}>
                {p.ok ? "✔" : "✘"} {p.label}
              </li>
            ))}
          </ul>
          <p>{controle.effet}</p>
          <button className="bouton principal-btn" onClick={() => fermer({ controleResultat: null })}>
            Compris
          </button>
        </div>
      </div>
    );

  if (gazette)
    return (
      <div className="voile">
        <div className="modale large">
          <VueGazette g={gazette} />
          <button className="bouton principal-btn" onClick={() => fermer({ gazetteNonLue: false })}>
            Refermer la gazette
          </button>
        </div>
      </div>
    );
  return null;
}

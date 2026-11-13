"use client";

import { useState } from "react";
import { dateCourte, jourDe, joursOuvresEntre } from "@/lib/calendrier";
import { ETAPES_MEMOIRE, SESSIONS_DEC, SUJETS_MEMOIRE } from "@/lib/data/developpement";
import { choisirSujet, etapeMemoire, fixerDateDec, themesFaibles } from "@/lib/ext";
import { useJeu } from "@/lib/store";

/** Compte à rebours vers le DEC, thèmes faibles et mémoire. */
export default function DecPlan() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const jour = jourDe(e.minute);
  const restant = joursOuvresEntre(jour, e.dateDec);
  const faibles = themesFaibles(e);
  const m = e.memoire;
  const etape = ETAPES_MEMOIRE[m.etape];
  const [choix, setChoix] = useState<number | null>(null);

  return (
    <div className="dec-plan">
      <div className="compte-rebours">
        <div>
          <small>Objectif DEC</small>
          <strong>{restant > 0 ? `J-${restant} jours ouvrés` : "Session passée : choisis la suivante"}</strong>
          <span>Épreuve visée le {dateCourte(e.dateDec)}</span>
        </div>
        <select value="" onChange={(ev) => agir(fixerDateDec, Number(ev.target.value))}>
          <option value="">Changer de session…</option>
          {SESSIONS_DEC.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="plan-semaine">
        <strong>Ton plan de la semaine</strong>
        <ul>
          <li className={e.qcmDisponible ? "" : "fait"}>{e.qcmDisponible ? "☐" : "☑"} QCM blanc (orienté sur tes thèmes faibles)</li>
          <li>☐ Un oral blanc tous les 15 jours</li>
          <li className={m.soutenu ? "fait" : ""}>{m.soutenu ? "☑" : "☐"} Avancer le mémoire (1 étape par jour)</li>
          <li>☐ Relire ton carnet de révision ({e.carnet.length} notion{e.carnet.length > 1 ? "s" : ""})</li>
        </ul>
        {faibles.length > 0 && <p className="aide">Tes thèmes les plus fragiles : {faibles.join(", ")}.</p>}
      </div>

      <h3 className="titre-section">📘 Ton mémoire</h3>
      {!m.sujet ? (
        <div className="sujets">
          <p className="aide">Choisis un sujet. Chaque étape te demande une décision de méthode ; la soutenance blanche donne une note sur 20.</p>
          {SUJETS_MEMOIRE.map((s) => (
            <button key={s} className="option" onClick={() => agir(choisirSujet, s)}>
              <span>{s}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="memoire">
          <p>
            <b>Sujet :</b> {m.sujet}
          </p>
          <div className="frise-memoire">
            {ETAPES_MEMOIRE.map((x, i) => (
              <span key={x.titre} className={i < m.etape ? "fait" : i === m.etape ? "courant" : ""}>
                {x.titre}
              </span>
            ))}
          </div>
          {m.soutenu ? (
            <p className="verdict v-ok">Soutenance blanche : {e.compteurs.noteMemoire}/20</p>
          ) : (
            etape && (
              <div className="etape-memoire">
                <h4>{etape.titre}</h4>
                <p>{etape.question}</p>
                {etape.choix.map((c, i) => (
                  <button key={i} className={`option ${choix === i ? "actif" : ""}`} onClick={() => setChoix(i)}>
                    <span>{c}</span>
                  </button>
                ))}
                <button
                  className="bouton principal-btn"
                  disabled={choix === null}
                  onClick={() => {
                    agir(etapeMemoire, choix!);
                    setChoix(null);
                  }}
                >
                  Travailler sur cette étape
                </button>
                <p className="aide">💡 {etape.conseil}</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

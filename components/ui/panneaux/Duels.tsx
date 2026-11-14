"use client";

import { useState } from "react";
import { QCM } from "@/lib/data/formation";
import { QUESTIONS_DEC } from "@/lib/data/questionsDec";
import { NB_ETAPES_FR, lancerFilRouge } from "@/lib/filRouge";
import { useJeu } from "@/lib/store";
import type { Agent, Etat } from "@/lib/types";

// Duels de quiz contre les collaborateurs et dossier complet « fil rouge ».

type Q = { theme: string; question: string; choix: string[]; bonne: number; explication: string };
const METIERS = ["expertise", "fiscal", "social", "juridique", "audit"];

function tirer(): Q[] {
  return [...QUESTIONS_DEC, ...QCM]
    .map((q) => ({ ...q, question: q.question.replace(/\{client\}/g, "le client") }))
    .sort(() => Math.random() - 0.5)
    .slice(0, 5);
}

function enregistrer(e: Etat, id: string, gagne: boolean, nul: boolean): string | null {
  const a = e.agents.find((x) => x.id === id);
  e.duels ??= {};
  const d = (e.duels[id] ??= { v: 0, d: 0 });
  if (!nul) {
    if (gagne) d.v++;
    else d.d++;
  }
  if (a) {
    if (gagne) a.confiance = Math.min(100, a.confiance + 3);
    else {
      a.moral = Math.min(100, a.moral + 5);
      a.competence = Math.min(95, a.competence + 0.5);
    }
  }
  e.niveauDec = Math.min(100, e.niveauDec + 1);
  return null;
}

export function Duels() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [adv, setAdv] = useState<Agent | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [moi, setMoi] = useState<number[]>([]);
  const [lui, setLui] = useState<boolean[]>([]);
  const collegues = e.agents.filter((a) => METIERS.includes(a.filiere));

  if (adv && qs.length) {
    const i = moi.length;
    const fini = i >= qs.length;
    const monScore = moi.filter((r, k) => r === qs[k].bonne).length;
    const sonScore = lui.filter(Boolean).length;
    if (fini)
      return (
        <div className="duel">
          <h3 className="titre-section">
            ⚔️ Toi {monScore} – {sonScore} {adv.prenom}
          </h3>
          <p className="aide">{monScore > sonScore ? `Victoire ! ${adv.prenom} te félicite.` : monScore === sonScore ? "Match nul, revanche ?" : `${adv.prenom} gagne ce duel et en est tout·e fier·e.`}</p>
          <ol className="corrections">
            {qs.map((q, k) => (
              <li key={k} className={moi[k] === q.bonne ? "ok" : "ko"}>
                <strong>{q.question}</strong>
                <span>
                  Toi {moi[k] === q.bonne ? "✔" : "✘"} · {adv.prenom} {lui[k] ? "✔" : "✘"} · réponse : {q.choix[q.bonne]}
                </span>
              </li>
            ))}
          </ol>
          <button
            className="bouton principal-btn"
            onClick={() => {
              agir(enregistrer, adv.id, monScore > sonScore, monScore === sonScore);
              setAdv(null);
              setQs([]);
            }}
          >
            Terminer le duel
          </button>
        </div>
      );
    const q = qs[i];
    return (
      <div className="duel">
        <div className="examen-tete">
          <span>
            ⚔️ Duel contre {adv.prenom} · question {i + 1}/5 · {q.theme}
          </span>
          <strong>
            {moi.filter((r, k) => r === qs[k].bonne).length} – {sonScore}
          </strong>
        </div>
        <h4>{q.question}</h4>
        {q.choix.map((c, k) => (
          <button
            key={k}
            className="option"
            onClick={() => {
              setMoi([...moi, k]);
              setLui([...lui, Math.random() < 0.3 + (adv.competence / 100) * 0.6]);
            }}
          >
            <span>{c}</span>
          </button>
        ))}
      </div>
    );
  }

  const classement = [
    { nom: "Toi", v: Object.values(e.duels ?? {}).reduce((s, d) => s + d.v, 0), d: Object.values(e.duels ?? {}).reduce((s, d) => s + d.d, 0), moi: true },
    ...collegues.filter((a) => e.duels?.[a.id]).map((a) => ({ nom: `${a.prenom} (${a.poste})`, v: e.duels![a.id].d, d: e.duels![a.id].v, moi: false })),
  ].sort((a, b) => b.v - a.v || a.d - b.d);

  return (
    <div className="duels">
      <p className="aide">Défie un collaborateur sur 5 questions DEC. Plus il est compétent, plus il est redoutable. Gagner renforce sa confiance en toi ; perdre le motive et le fait progresser.</p>
      <div className="adversaires">
        {[...collegues]
          .sort((a, b) => b.competence - a.competence)
          .slice(0, 12)
          .map((a) => (
            <button
              key={a.id}
              className="adversaire"
              onClick={() => {
                setAdv(a);
                setQs(tirer());
                setMoi([]);
                setLui([]);
              }}
            >
              <span className="avatar" style={{ background: a.couleur }}>
                {a.prenom[0]}
                {a.nom[0]}
              </span>
              <span>
                <strong>{a.prenom}</strong>
                <small>
                  {a.poste} · niveau {Math.round(a.competence)}
                </small>
              </span>
              {e.duels?.[a.id] && (
                <em>
                  {e.duels[a.id].v}V / {e.duels[a.id].d}D
                </em>
              )}
            </button>
          ))}
      </div>
      {classement.length > 1 && (
        <>
          <h3 className="titre-section">🏆 Classement interne des duels</h3>
          <ol className="classement-duels">
            {classement.map((c) => (
              <li key={c.nom} className={c.moi ? "moi" : ""}>
                <span>{c.nom}</span>
                <strong>
                  {c.v} victoire{c.v > 1 ? "s" : ""} · {c.d} défaite{c.d > 1 ? "s" : ""}
                </strong>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export function FilRouge() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const fr = e.filRouge;
  const enCours = fr && fr.etape < NB_ETAPES_FR;
  return (
    <div className="fil-rouge">
      <p className="aide">
        Suis l&apos;Atelier Lumière SARL sur tout un exercice : saisie en janvier, TVA, paie, clôture, liasse et AG. Chaque réponse alimente les chiffres de l&apos;étape suivante : une erreur en janvier fausse ton résultat, ton IS et l&apos;affectation. Les étapes arrivent en popups tous les 3 jours.
      </p>
      {enCours ? (
        <div className="frise-memoire">
          {["Saisie", "TVA", "Paie", "Clôture", "Liasse", "AG"].map((x, i) => (
            <span key={x} className={i < fr!.etape ? "fait" : i === fr!.etape ? "courant" : ""}>
              {x}
            </span>
          ))}
        </div>
      ) : (
        <button className="bouton principal-btn" onClick={() => agir(lancerFilRouge)}>
          📒 {fr ? "Recommencer un dossier fil rouge" : "Démarrer le dossier fil rouge"}
        </button>
      )}
      {fr && !enCours && fr.bilan && (
        <div className="bilan-fr">
          <h4>
            Dernier dossier : {fr.score}/{NB_ETAPES_FR}
          </h4>
          <p>{fr.bilan}</p>
          {fr.erreurs.length > 0 && (
            <ul className="mini-liste">
              {fr.erreurs.map((x) => (
                <li key={x}>✘ {x}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

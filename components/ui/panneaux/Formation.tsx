"use client";

import { useState } from "react";
import { dateCourte } from "@/lib/calendrier";
import { ORAL, QCM, type QuestionQcm } from "@/lib/data/formation";
import { ajouterCarnet, enregistrerOral, enregistrerQcm, retirerCarnet } from "@/lib/moteur";
import { jourDe } from "@/lib/calendrier";
import type { NoteCarnet } from "@/lib/types";
import { useJeu } from "@/lib/store";

function melanger<T>(t: T[]): T[] {
  const a = [...t];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Formation() {
  const e = useJeu((s) => s.etat)!;
  const [mode, setMode] = useState<"menu" | "qcm" | "oral" | "carnet">("menu");

  if (mode === "qcm") return <Qcm fin={() => setMode("menu")} />;
  if (mode === "oral") return <Oral fin={() => setMode("menu")} />;
  if (mode === "carnet") return <Carnet fin={() => setMode("menu")} />;

  const dernier = e.qcm[e.qcm.length - 1];
  return (
    <div>
      <div className="niveau-dec">
        <span>Niveau DEC</span>
        <div className="jauge large">
          <div className="bleu" style={{ width: `${e.niveauDec}%` }} />
        </div>
        <strong>{Math.round(e.niveauDec)} / 100</strong>
      </div>
      <div className="cartes-formation">
        <div className="carte-formation">
          <h3>📝 QCM blanc de la semaine</h3>
          <p>10 questions tirées des situations du cabinet : TVA, PCG, fiscalité, juridique, social, déontologie.</p>
          {dernier && (
            <p className="aide">
              Dernier score : {dernier.score}/{dernier.total}
            </p>
          )}
          <button className="bouton principal-btn" disabled={!e.qcmDisponible} onClick={() => setMode("qcm")}>
            {e.qcmDisponible ? "Commencer le QCM" : "Déjà fait cette semaine"}
          </button>
        </div>
        <div className="carte-formation">
          <h3>📒 Carnet de révision</h3>
          <p>Chaque question de QCM ou cas pratique raté y est noté, avec son explication. Relis-le avant tes oraux.</p>
          <button className="bouton principal-btn" onClick={() => setMode("carnet")}>
            Ouvrir le carnet ({e.carnet.length})
          </button>
        </div>
        <div className="carte-formation">
          <h3>🎤 Oral blanc</h3>
          <p>Une question de jury. Tu réponds par écrit, puis tu t&apos;auto-évalues sur les éléments attendus.</p>
          <button className="bouton principal-btn" onClick={() => setMode("oral")}>
            Passer un oral blanc
          </button>
        </div>
      </div>
      {e.oraux.length > 0 && (
        <>
          <h3 className="titre-section">Derniers oraux</h3>
          {e.oraux.slice(0, 5).map((o, i) => (
            <p key={i} className="ancien">
              {dateCourte(o.jour)} — {o.question} : <strong>{o.score} %</strong>
            </p>
          ))}
        </>
      )}
    </div>
  );
}

function Qcm({ fin }: { fin: () => void }) {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [questions] = useState<QuestionQcm[]>(() => {
    const noms = e.clients.map((c) => c.nom);
    return melanger(QCM)
      .slice(0, 10)
      .map((q) => ({ ...q, question: q.question.replace("{client}", noms[Math.floor(Math.random() * noms.length)] ?? "Un client") }));
  });
  const [i, setI] = useState(0);
  const [choix, setChoix] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [rates, setRates] = useState<NoteCarnet[]>([]);
  const [termine, setTermine] = useState(false);
  const q = questions[i];

  if (termine) {
    return (
      <div className="resultat-qcm">
        <h3>Résultat : {score}/10</h3>
        <p>{score >= 8 ? "Excellent, le jury serait conquis." : score >= 6 ? "Correct. Relis les explications des questions ratées." : "À retravailler : refais un tour sur les thèmes ratés."}</p>
        <button className="bouton principal-btn" onClick={fin}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="qcm">
      <div className="progression-qcm">
        Question {i + 1}/10 · <span className="tag">{q.theme}</span> · Score {score}
      </div>
      <h3>{q.question}</h3>
      <div className="choix">
        {q.choix.map((c, k) => (
          <button
            key={k}
            disabled={choix !== null}
            className={`choix-btn ${choix !== null && k === q.bonne ? "bon" : ""} ${choix === k && k !== q.bonne ? "faux" : ""}`}
            onClick={() => {
              setChoix(k);
              if (k === q.bonne) setScore((s) => s + 1);
              else setRates((r) => [...r, { theme: q.theme, question: q.question, explication: q.explication, jour: jourDe(e.minute) }]);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {choix !== null && (
        <div className="explication">
          <strong>{choix === q.bonne ? "✔ Bonne réponse" : "✘ Raté"}</strong>
          <p>{q.explication}</p>
          <button
            className="bouton principal-btn"
            onClick={() => {
              if (i === 9) {
                agir(enregistrerQcm, score, 10);
                if (rates.length) agir(ajouterCarnet, rates);
                setTermine(true);
              } else {
                setI(i + 1);
                setChoix(null);
              }
            }}
          >
            {i === 9 ? "Voir le résultat" : "Question suivante"}
          </button>
        </div>
      )}
    </div>
  );
}

function Oral({ fin }: { fin: () => void }) {
  const agir = useJeu((s) => s.agir);
  const [q] = useState(() => ORAL[Math.floor(Math.random() * ORAL.length)]);
  const [reponse, setReponse] = useState("");
  const [revele, setRevele] = useState(false);
  const [coches, setCoches] = useState<boolean[]>(() => q.attendus.map(() => false));
  const score = Math.round((coches.filter(Boolean).length / q.attendus.length) * 100);

  return (
    <div className="oral">
      <p className="aide">Le jury te demande :</p>
      <h3>« {q.question} »</h3>
      <textarea rows={7} value={reponse} onChange={(ev) => setReponse(ev.target.value)} placeholder="Ta réponse, comme si tu parlais au jury…" disabled={revele} />
      {!revele ? (
        <button className="bouton principal-btn" disabled={reponse.trim().length < 20} onClick={() => setRevele(true)}>
          J&apos;ai répondu : voir les éléments attendus
        </button>
      ) : (
        <div className="attendus">
          <h4>Coche ce que tu as vraiment abordé</h4>
          {q.attendus.map((a, k) => (
            <label key={k} className="case">
              <input type="checkbox" checked={coches[k]} onChange={() => setCoches(coches.map((c, j) => (j === k ? !c : c)))} />
              {a}
            </label>
          ))}
          <p>
            Score : <strong>{score} %</strong>
          </p>
          <button
            className="bouton principal-btn"
            onClick={() => {
              agir(enregistrerOral, score, q.question);
              fin();
            }}
          >
            Enregistrer et terminer
          </button>
        </div>
      )}
    </div>
  );
}

function Carnet({ fin }: { fin: () => void }) {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const themes = [...new Set(e.carnet.map((n) => n.theme))];
  return (
    <div className="carnet">
      <button className="lien" onClick={fin}>
        ← Retour
      </button>
      {e.carnet.length === 0 && <p className="vide">Ton carnet est vide : aucune erreur à revoir. Bravo !</p>}
      {themes.map((t) => (
        <section key={t}>
          <h3 className="titre-section">{t}</h3>
          {e.carnet
            .filter((n) => n.theme === t)
            .map((n) => (
              <div key={n.question} className="note-carnet">
                <p className="q">{n.question}</p>
                <p className="r">{n.explication}</p>
                <button className="bouton petit" onClick={() => agir(retirerCarnet, n.question)}>
                  ✔ Revu, je retire
                </button>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}

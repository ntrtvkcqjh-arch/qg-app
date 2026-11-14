"use client";

import { useEffect, useState } from "react";
import { QUESTIONS_DEC } from "@/lib/data/questionsDec";
import { QCM } from "@/lib/data/formation";
import { enregistrerThemes } from "@/lib/ext";
import { useJeu } from "@/lib/store";
import type { Etat } from "@/lib/types";

// Examen blanc chronométré : 20 questions tirées de la banque DEC,
// 20 minutes, note sur 20 et thèmes à retravailler.

type Q = { theme: string; question: string; choix: string[]; bonne: number; explication: string };
const DUREE = 20 * 60;

function tirer(): Q[] {
  const toutes: Q[] = [...QUESTIONS_DEC, ...QCM].map((q) => ({ ...q, question: q.question.replace(/\{client\}/g, "le client") }));
  return [...toutes].sort(() => Math.random() - 0.5).slice(0, 20);
}

export default function Examen() {
  const agir = useJeu((s) => s.agir);
  const meilleur = useJeu((s) => s.etat?.compteurs.examenMeilleur);
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [reponses, setReponses] = useState<number[]>([]);
  const [debut, setDebut] = useState(0);
  const [maintenant, setMaintenant] = useState(0);
  const fini = !!questions && (reponses.length >= questions.length || (debut > 0 && maintenant - debut >= DUREE * 1000));

  useEffect(() => {
    if (!questions || fini) return;
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, [questions, fini]);

  const demarrer = () => {
    const d = Date.now();
    setQuestions(tirer());
    setReponses([]);
    setDebut(d);
    setMaintenant(d);
  };

  if (!questions)
    return (
      <div className="examen">
        <h3 className="titre-section">📝 Examen blanc DEC</h3>
        <p className="aide">20 questions tirées au hasard parmi 158 (fiscal, social, juridique, audit, déontologie, tous secteurs), 20 minutes chrono. {meilleur !== undefined && `Ton meilleur score : ${meilleur}/20.`}</p>
        <button className="bouton principal-btn" onClick={demarrer}>
          Commencer l&apos;examen
        </button>
      </div>
    );

  if (fini) {
    const resultats = questions.map((q, i) => ({ theme: q.theme, ok: reponses[i] === q.bonne }));
    const note = resultats.filter((r) => r.ok).length;
    const parTheme = new Map<string, { ok: number; total: number }>();
    for (const r of resultats) {
      const t = parTheme.get(r.theme) ?? { ok: 0, total: 0 };
      t.total++;
      if (r.ok) t.ok++;
      parTheme.set(r.theme, t);
    }
    const faibles = [...parTheme.entries()].filter(([, v]) => v.ok / v.total < 0.6).map(([k]) => k);
    return (
      <div className="examen">
        <h3 className="titre-section">📝 Résultat : {note}/20</h3>
        <p className="aide">{note >= 14 ? "Excellent, tu es prête !" : note >= 10 ? "C'est validé, continue à t'entraîner." : "À retravailler : relis les corrections ci-dessous."}</p>
        {faibles.length > 0 && <p className="aide">Thèmes à retravailler : {faibles.join(", ")}.</p>}
        <ol className="corrections">
          {questions.map((q, i) => (
            <li key={i} className={reponses[i] === q.bonne ? "ok" : "ko"}>
              <strong>{q.question}</strong>
              <span>
                {reponses[i] === q.bonne ? "✔" : "✘"} Bonne réponse : {q.choix[q.bonne]}
              </span>
              <small>{q.explication}</small>
            </li>
          ))}
        </ol>
        <button
          className="bouton principal-btn"
          onClick={() => {
            agir((x: Etat) => {
              x.compteurs.examenMeilleur = Math.max(x.compteurs.examenMeilleur ?? 0, note);
              x.niveauDec = Math.min(100, x.niveauDec + note / 4);
              enregistrerThemes(x, resultats);
              return null;
            });
            setQuestions(null);
          }}
        >
          Enregistrer et terminer
        </button>
      </div>
    );
  }

  const i = reponses.length;
  const q = questions[i];
  const reste = Math.max(0, DUREE - Math.floor((maintenant - debut) / 1000));
  return (
    <div className="examen">
      <div className="examen-tete">
        <span>
          Question {i + 1} / {questions.length} · {q.theme}
        </span>
        <strong className={reste < 120 ? "alerte" : ""}>
          ⏱ {Math.floor(reste / 60)}:{String(reste % 60).padStart(2, "0")}
        </strong>
      </div>
      <h4>{q.question}</h4>
      {q.choix.map((c, k) => (
        <button key={k} className="option" onClick={() => setReponses([...reponses, k])}>
          <span>{c}</span>
        </button>
      ))}
    </div>
  );
}

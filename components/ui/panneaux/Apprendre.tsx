"use client";

import { useState } from "react";
import { jourDe } from "@/lib/calendrier";
import { CALCULS } from "@/lib/data/calculs";
import { FICHES, GLOSSAIRE } from "@/lib/data/fiches";
import { QCM } from "@/lib/data/formation";
import { QUESTIONS_DEC } from "@/lib/data/questionsDec";
import { useJeu } from "@/lib/store";

// Outils d'apprentissage : maîtrise par thème, fiches de cours, glossaire
// et notions à revoir (répétition espacée).

/** Tableau de maîtrise : taux de réussite par thème sur toutes tes réponses. */
export function Maitrise() {
  const stats = useJeu((s) => s.etat?.statsThemes ?? {});
  const lignes = Object.entries(stats)
    .filter(([, v]) => v.total > 0)
    .map(([t, v]) => ({ t, pct: Math.round((v.ok / v.total) * 100), total: v.total }))
    .sort((a, b) => a.pct - b.pct);
  if (!lignes.length) return <p className="vide">Réponds à des contrôles, des calculs ou un examen blanc : ta maîtrise par thème s&apos;affichera ici.</p>;
  return (
    <div className="maitrise">
      <p className="aide">Taux de réussite par thème (toutes tes réponses). En dessous de 60 %, ouvre la fiche du thème.</p>
      {lignes.map((l) => (
        <div key={l.t} className="ligne-maitrise">
          <span>{l.t}</span>
          <div className="jauge">
            <div style={{ width: `${l.pct}%`, background: l.pct >= 75 ? "#43a047" : l.pct >= 60 ? "#f2a541" : "#e04a3a" }} />
          </div>
          <strong>{l.pct} %</strong>
          <small>{l.total} rép.</small>
        </div>
      ))}
    </div>
  );
}

export function Fiches() {
  const [ouverte, setOuverte] = useState<string | null>(null);
  const stats = useJeu((s) => s.etat?.statsThemes ?? {});
  return (
    <div className="fiches">
      {FICHES.map((f) => {
        const st = stats[f.theme];
        const pct = st?.total ? Math.round((st.ok / st.total) * 100) : null;
        return (
          <div key={f.theme} className={`fiche-cours ${ouverte === f.theme ? "ouverte" : ""}`}>
            <button onClick={() => setOuverte(ouverte === f.theme ? null : f.theme)}>
              <strong>📘 {f.titre}</strong>
              {pct !== null && <small className={pct < 60 ? "rouge-t" : ""}>{pct} % de réussite</small>}
            </button>
            {ouverte === f.theme && (
              <div>
                <ul>
                  {f.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <small>Références : {f.refs}</small>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Glossaire() {
  const [q, setQ] = useState("");
  const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const liste = GLOSSAIRE.filter(([m, d]) => !q || norm(m + " " + d).includes(norm(q)));
  return (
    <div className="glossaire">
      <input placeholder="Chercher un terme (ex. BFR, Dutreil, autoliquidation…)" value={q} onChange={(ev) => setQ(ev.target.value)} />
      <dl>
        {liste.map(([m, d]) => (
          <div key={m}>
            <dt>{m}</dt>
            <dd>{d}</dd>
          </div>
        ))}
      </dl>
      {!liste.length && <p className="vide">Aucun terme trouvé.</p>}
    </div>
  );
}

/** Notions ratées, programmées pour revenir (1, 3, 7 puis 21 jours). */
export function ARevoir() {
  const e = useJeu((s) => s.etat)!;
  const jour = jourDe(e.minute);
  const toutes = [...QUESTIONS_DEC.map((x) => ({ q: x.question, t: x.theme, r: x.choix[x.bonne], ex: x.explication })), ...QCM.map((x) => ({ q: x.question, t: x.theme, r: x.choix[x.bonne], ex: x.explication })), ...CALCULS.map((x) => ({ q: x.question, t: x.theme, r: `${x.reponse.toLocaleString("fr-FR")} ${x.unite}`, ex: x.explication }))];
  const liste = (e.aRevoir ?? []).map((a) => ({ ...a, d: toutes.find((x) => x.q.slice(0, 60) === a.cle) })).filter((a) => a.d);
  if (!liste.length) return <p className="vide">Aucune notion à revoir : chaque erreur dans un contrôle viendra ici, puis reviendra dans tes popups au bon moment.</p>;
  return (
    <div className="a-revoir">
      <p className="aide">{liste.length} notion(s) en révision. Une notion réussie 4 fois de suite sort de la liste.</p>
      <ul className="mini-liste">
        {liste.map((a) => (
          <li key={a.cle}>
            <span>
              <strong>{a.d!.t}</strong> · {a.d!.q.replace(/\{client\}/g, "le client")}
            </span>
            <span>✔ {a.d!.r}</span>
            <small>
              {a.d!.ex} · {a.jour <= jour ? "à revoir maintenant" : `revient dans ${a.jour - jour} jour(s)`} · niveau {a.niveau}/4
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}

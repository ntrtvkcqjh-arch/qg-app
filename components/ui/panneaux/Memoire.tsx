"use client";

import { useState } from "react";
import { JURY, soutenir } from "@/lib/vie3";
import { useJeu } from "@/lib/store";
import DecPlan from "./DecPlan";
import Examen from "./Examen";
import { ARevoir, Fiches, Glossaire, Maitrise } from "./Apprendre";
import { Duels, FilRouge } from "./Duels";

// Ton DEC : mémoire étape par étape (avec ton directeur de mémoire), puis
// soutenance devant le jury.

export default function Memoire() {
  const e = useJeu((s) => s.etat)!;
  const [jury, setJury] = useState(false);
  const [onglet, setOnglet] = useState<"memoire" | "examen" | "filrouge" | "duels" | "maitrise" | "fiches" | "revoir" | "glossaire">("memoire");
  const diplomee = !!e.compteurs.diplomee;
  const onglets = (
    <div className="onglets onglets-dec">
      {(
        [
          ["memoire", "📘 Mémoire"],
          ["examen", "📝 Examen blanc"],
          ["filrouge", "📒 Fil rouge"],
          ["duels", "⚔️ Duels"],
          ["maitrise", "📊 Maîtrise"],
          ["fiches", "📚 Fiches"],
          ["revoir", `🔁 À revoir (${(e.aRevoir ?? []).length})`],
          ["glossaire", "🔤 Glossaire"],
        ] as const
      ).map(([k, l]) => (
        <button key={k} className={onglet === k ? "actif" : ""} onClick={() => setOnglet(k)}>
          {l}
        </button>
      ))}
    </div>
  );
  if (onglet !== "memoire")
    return (
      <div>
        {onglets}
        {onglet === "examen" && <Examen />}
        {onglet === "filrouge" && <FilRouge />}
        {onglet === "duels" && <Duels />}
        {onglet === "maitrise" && <Maitrise />}
        {onglet === "fiches" && <Fiches />}
        {onglet === "revoir" && <ARevoir />}
        {onglet === "glossaire" && <Glossaire />}
      </div>
    );
  return (
    <div>
      {onglets}
      {diplomee ? (
        <div className="diplome">
          <span>🎓</span>
          <div>
            <strong>Diplômée d&apos;expertise comptable</strong>
            <small>Soutenance : {e.compteurs.noteSoutenance}/20</small>
          </div>
        </div>
      ) : (
        <div className="directeur">
          <span className="avatar" style={{ background: "#3d405b" }}>
            PL
          </span>
          <p>
            <strong>Pr. Lemoine, ton directeur de mémoire :</strong>{" "}
            {!e.memoire.sujet
              ? "Choisis un sujet utile à la profession, que tu pourras illustrer avec des cas réels du cabinet."
              : e.memoire.soutenu
                ? "Ton mémoire est prêt. Prépare-toi aux questions pièges : le jury teste ta posture autant que le fond."
                : "Avance une étape par jour. Je relis chaque partie avant que tu passes à la suite."}
          </p>
        </div>
      )}
      {e.memoire.soutenu && !diplomee && !jury && (
        <button className="bouton principal-btn large" onClick={() => setJury(true)}>
          🎤 Passer la soutenance devant le jury
        </button>
      )}
      {jury && <Soutenance fin={() => setJury(false)} />}
      {!jury && <DecPlan />}
    </div>
  );
}

function Soutenance({ fin }: { fin: () => void }) {
  const agir = useJeu((s) => s.agir);
  const [reponses, setReponses] = useState<number[]>([]);
  const [retour, setRetour] = useState<string | null>(null);
  const i = reponses.length;
  const q = JURY[i];
  if (!q)
    return (
      <div className="soutenance">
        <h3>Délibération du jury…</h3>
        <p>Le jury s&apos;est retiré. Le résultat apparaît dans le journal du cabinet.</p>
        <button className="bouton principal-btn" onClick={fin}>
          Voir le résultat
        </button>
      </div>
    );
  return (
    <div className="soutenance">
      <small>
        Question {i + 1} / {JURY.length}
      </small>
      <h3>{q.question}</h3>
      {retour && <p className="aide">💬 {retour}</p>}
      {q.choix.map((c, k) => (
        <button
          key={k}
          className="option"
          onClick={() => {
            const r = [...reponses, k];
            setRetour(k === q.bonne ? "Le jury acquiesce." : q.retour);
            setReponses(r);
            if (r.length === JURY.length) agir(soutenir, r);
          }}
        >
          <span>{c}</span>
        </button>
      ))}
    </div>
  );
}

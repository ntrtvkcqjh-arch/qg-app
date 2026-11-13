"use client";

import { useState } from "react";
import { anneeDe, jourDe, moisDe } from "@/lib/calendrier";
import { LIBELLE_DOMAINE, POLES } from "@/lib/data/developpement";
import { DOMAINES, evenementEquipe, nommerChef, validerEntretiens } from "@/lib/ext";
import { useJeu } from "@/lib/store";
import type { Domaine } from "@/lib/types";

/** Pôles, entretiens annuels et événements d'équipe (bas du panneau Équipe). */
export default function EquipePlus() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const jour = jourDe(e.minute);
  const entretiensOuverts = moisDe(jour) === 1 && e.entretiensFaits < anneeDe(jour) && e.agents.length > 0;

  return (
    <div>
      <h3 className="titre-section">Pôles et chefs de pôle</h3>
      <p className="aide">Un chef de pôle (+200 € brut) accélère son pôle de 5 %. Les rivaux du même pôle peuvent mal le vivre.</p>
      <div className="poles">
        {POLES.map((p) => {
          const membres = e.agents.filter((a) => a.filiere === p.filiere);
          const chef = e.chefsPoles[p.filiere] ?? "";
          return (
            <div key={p.filiere} className="pole" style={{ borderColor: p.couleur }}>
              <strong style={{ color: p.couleur }}>{p.nom}</strong>
              <small>{membres.length ? membres.map((a) => a.prenom).join(", ") : "Personne pour l'instant"}</small>
              <select value={chef} disabled={!membres.length} onChange={(ev) => agir(nommerChef, p.filiere, ev.target.value || null)}>
                <option value="">Pas de chef</option>
                {membres.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.prenom}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {entretiensOuverts && <Entretiens />}

      <h3 className="titre-section">Vie d&apos;équipe</h3>
      <div className="actions-demande">
        <button className="bouton" onClick={() => agir(evenementEquipe, "afterwork")}>
          🍻 Afterwork (600 €)
        </button>
        <button className="bouton" onClick={() => agir(evenementEquipe, "seminaire")}>
          🏔️ Séminaire annuel (4 000 €, 2 PA, cabinet fermé le reste de la journée)
        </button>
      </div>
      <p className="aide">Les anniversaires arrivent tout seuls dans ta messagerie 🎂.</p>
    </div>
  );
}

function Entretiens() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [choix, setChoix] = useState(() => e.agents.map((a) => ({ agent: a.id, hausse: 0, objectif: null as Domaine | null })));
  const maj = (i: number, patch: Partial<(typeof choix)[number]>) => setChoix(choix.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  return (
    <div className="entretiens">
      <h3 className="titre-section">🗣️ Entretiens annuels</h3>
      <p className="aide">Fixe un objectif (la compétence choisie progresse deux fois plus vite toute l&apos;année) et une éventuelle augmentation.</p>
      {choix.map((c, i) => {
        const a = e.agents.find((x) => x.id === c.agent);
        if (!a) return null;
        return (
          <div key={c.agent} className="ligne-entretien">
            <strong>{a.prenom}</strong>
            <select value={c.objectif ?? ""} onChange={(ev) => maj(i, { objectif: (ev.target.value || null) as Domaine | null })}>
              <option value="">Objectif…</option>
              {DOMAINES.map((d) => (
                <option key={d} value={d}>
                  {LIBELLE_DOMAINE[d]}
                </option>
              ))}
            </select>
            <select value={c.hausse} onChange={(ev) => maj(i, { hausse: Number(ev.target.value) })}>
              <option value={0}>Pas d&apos;augmentation</option>
              <option value={2}>+2 %</option>
              <option value={4}>+4 %</option>
            </select>
          </div>
        );
      })}
      <button className="bouton principal-btn" onClick={() => agir(validerEntretiens, choix)}>
        Valider les entretiens
      </button>
    </div>
  );
}

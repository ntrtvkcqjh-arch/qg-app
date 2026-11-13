"use client";

import { dateCourte } from "@/lib/calendrier";
import { BADGES } from "@/lib/data/formation";
import { useJeu } from "@/lib/store";

export default function Badges() {
  const e = useJeu((s) => s.etat)!;
  return (
    <div>
      <p className="aide">
        {e.badges.length}/{BADGES.length} badges débloqués.
      </p>
      <div className="grille-badges">
        {BADGES.map((b) => {
          const obtenu = e.badges.find((x) => x.id === b.id);
          return (
            <div key={b.id} className={`badge-carte ${obtenu ? "obtenu" : ""}`}>
              <span className="icone-badge">{b.icone}</span>
              <strong>{b.nom}</strong>
              <small>{b.description}</small>
              {obtenu && <em>{dateCourte(obtenu.jour)}</em>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { dateCourte, heure } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";

export default function JournalPanneau() {
  const e = useJeu((s) => s.etat)!;
  const reinitialiser = useJeu((s) => s.reinitialiser);
  const [confirmer, setConfirmer] = useState(false);
  return (
    <div>
      <ul className="journal">
        {e.journal.map((j, i) => (
          <li key={i} className={`j-${j.ton}`}>
            <small>
              {dateCourte(j.jour)} {heure(j.minute)}
            </small>
            <span>{j.texte}</span>
          </li>
        ))}
      </ul>
      <div className="zone-danger">
        {!confirmer ? (
          <button className="lien danger" onClick={() => setConfirmer(true)}>
            Recommencer une nouvelle partie…
          </button>
        ) : (
          <>
            <p>Toute la partie en cours sera effacée de ce navigateur. C&apos;est définitif.</p>
            <button className="bouton danger plein" onClick={reinitialiser}>
              Oui, tout effacer
            </button>
            <button className="bouton" onClick={() => setConfirmer(false)}>
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { dateCourte, heure } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { VueGazette } from "../Modales";

export default function JournalPanneau() {
  const e = useJeu((s) => s.etat)!;
  const reinitialiser = useJeu((s) => s.reinitialiser);
  const [confirmer, setConfirmer] = useState(false);
  const [onglet, setOnglet] = useState<"journal" | "gazettes">("journal");
  if (onglet === "gazettes")
    return (
      <div>
        <div className="onglets">
          <button onClick={() => setOnglet("journal")}>Journal</button>
          <button className="actif">Gazettes ({e.gazettes.length})</button>
        </div>
        {e.gazettes.length === 0 && <p className="vide">La première gazette paraîtra lundi prochain.</p>}
        {e.gazettes.map((g) => (
          <VueGazette key={g.jour} g={g} />
        ))}
      </div>
    );
  return (
    <div>
      <div className="onglets">
        <button className="actif">Journal</button>
        <button onClick={() => setOnglet("gazettes")}>Gazettes ({e.gazettes.length})</button>
      </div>
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

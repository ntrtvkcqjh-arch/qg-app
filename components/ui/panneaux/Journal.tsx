"use client";

import { useState } from "react";
import { dateCourte, heure } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { VueGazette } from "../Modales";

export default function JournalPanneau() {
  const e = useJeu((s) => s.etat)!;
  const reinitialiser = useJeu((s) => s.reinitialiser);
  const [confirmer, setConfirmer] = useState(false);
  const [onglet, setOnglet] = useState<"journal" | "gazettes" | "album" | "decisions">("journal");
  if (onglet === "decisions")
    return (
      <div>
        <div className="onglets">
          <button onClick={() => setOnglet("journal")}>Journal</button>
          <button className="actif">⚖️ Décisions</button>
          <button onClick={() => setOnglet("album")}>📸 Album</button>
        </div>
        <ul className="mini-liste">
          {e.messages
            .filter((m) => m.statut === "repondu" && m.reponse)
            .slice(0, 80)
            .map((m) => (
              <li key={m.id}>
                <span>
                  <strong>{m.sujet}</strong>
                </span>
                <span>→ {m.reponse}</span>
                <small>
                  {dateCourte(m.jour)} {heure(m.minute)}
                  {m.dilemme?.options.find((o) => o.label === m.reponse)?.resultat ? ` · ${m.dilemme.options.find((o) => o.label === m.reponse)!.resultat}` : ""}
                </small>
              </li>
            ))}
          {!e.messages.some((m) => m.statut === "repondu") && <li className="vide">Aucune décision pour l&apos;instant.</li>}
        </ul>
      </div>
    );
  if (onglet === "album")
    return (
      <div>
        <div className="onglets">
          <button onClick={() => setOnglet("journal")}>Journal</button>
          <button onClick={() => setOnglet("gazettes")}>Gazettes ({e.gazettes.length})</button>
          <button className="actif">📸 Album ({e.souvenirs?.length ?? 0})</button>
        </div>
        {!e.souvenirs?.length && <p className="vide">Les grands moments du cabinet (premier client, séminaires, prix, photos…) s&apos;afficheront ici.</p>}
        <div className="album">
          {e.souvenirs?.map((s, i) => (
            <div key={i} className="souvenir">
              <span>{s.emoji}</span>
              <strong>{s.titre}</strong>
              <small>{dateCourte(s.jour)}</small>
            </div>
          ))}
        </div>
      </div>
    );
  if (onglet === "gazettes")
    return (
      <div>
        <div className="onglets">
          <button onClick={() => setOnglet("journal")}>Journal</button>
          <button className="actif">Gazettes ({e.gazettes.length})</button>
          <button onClick={() => setOnglet("album")}>📸 Album ({e.souvenirs?.length ?? 0})</button>
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
        <button onClick={() => setOnglet("album")}>📸 Album ({e.souvenirs?.length ?? 0})</button>
        <button onClick={() => setOnglet("decisions")}>⚖️ Décisions</button>
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

"use client";

import { useState } from "react";
import { dateCourte, jourDe } from "@/lib/calendrier";
import { reassigner, validerDossier } from "@/lib/moteur";
import { useJeu } from "@/lib/store";
import { NOMS_PHASES } from "@/lib/types";
import { euros } from "../textes";

export default function Dossiers() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [filtre, setFiltre] = useState<"cours" | "valider" | "livres">("cours");
  const jour = jourDe(e.minute);
  const client = (id: string) => e.clients.find((c) => c.id === id);

  const liste = e.dossiers
    .filter((d) => (filtre === "livres" ? d.phase === 5 : filtre === "valider" ? d.phase === 3 && d.progression >= 100 : d.phase < 5))
    .sort((a, b) => (filtre === "livres" ? (b.livre ?? 0) - (a.livre ?? 0) : a.echeance - b.echeance));

  return (
    <div>
      <div className="onglets">
        <button className={filtre === "cours" ? "actif" : ""} onClick={() => setFiltre("cours")}>
          En cours ({e.dossiers.filter((d) => d.phase < 5).length})
        </button>
        <button className={filtre === "valider" ? "actif" : ""} onClick={() => setFiltre("valider")}>
          À valider ({e.dossiers.filter((d) => d.phase === 3 && d.progression >= 100).length})
        </button>
        <button className={filtre === "livres" ? "actif" : ""} onClick={() => setFiltre("livres")}>
          Livrés
        </button>
      </div>
      <p className="aide">
        Les collaborateurs avancent seuls de la Collecte à la Révision. Ta validation (gratuite) fait passer en Validation, puis ils
        finalisent et livrent.
      </p>
      {liste.length === 0 && <p className="vide">Aucun dossier ici.</p>}
      <div className="liste-dossiers">
        {liste.slice(0, 80).map((d) => {
          const c = client(d.client);
          const enRetard = d.phase < 5 && d.echeance < jour;
          const proche = d.phase < 4 && d.echeance - jour <= 5;
          return (
            <div key={d.id} className={`dossier ${enRetard ? "retard" : proche ? "proche" : ""}`}>
              <div className="ligne1">
                <strong>{d.titre}</strong>
                <span className="honoraires">{euros(d.honoraires)}</span>
              </div>
              <div className="ligne2">
                <span className="client">{c?.secteur ?? ""}</span>
                <span>Échéance {dateCourte(d.echeance)}</span>
                {d.bloque && <span className="bloque">⛔ {d.bloque}</span>}
              </div>
              <div className="phases">
                {[1, 2, 3, 4, 5].map((p) => (
                  <div key={p} className={`etape ${d.phase > p ? "faite" : d.phase === p ? "courante" : ""}`}>
                    <span>{NOMS_PHASES[p as 1]}</span>
                    {d.phase === p && p < 5 && (
                      <div className="mini-barre">
                        <div style={{ width: `${d.progression}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {d.phase < 5 && (
                <div className="ligne3">
                  <label>
                    Responsable
                    <select value={d.agent && d.agent !== "toi" ? d.agent : "toi"} onChange={(ev) => agir(reassigner, d.id, ev.target.value)}>
                      <option value="toi">Moi (associée)</option>
                      {e.agents.filter((a) => a.filiere !== "rh").map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.prenom} ({a.poste})
                        </option>
                      ))}
                    </select>
                  </label>
                  {d.phase === 3 && d.progression >= 100 && (
                    <button className="bouton principal-btn petit" onClick={() => agir(validerDossier, d.id)}>
                      ✔ Valider la révision
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { BOUTIQUE } from "@/lib/data/boutique";
import { LOCAUX, niveauLocaux } from "@/lib/data/locaux";
import { acheter, agrandirLocaux, pieceOuverte, possede } from "@/lib/moteur";
import { pieceParId } from "@/lib/plan";
import { useJeu } from "@/lib/store";
import { euros } from "../textes";

export default function Locaux() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const actuel = niveauLocaux(e.niveauLocaux);
  const suivant = LOCAUX[e.niveauLocaux];

  return (
    <div>
      <div className="locaux-actuels">
        <div>
          <small>Tes locaux</small>
          <strong>
            {actuel.nom} (niveau {actuel.niveau}/4)
          </strong>
          <span>
            {actuel.postes} postes · loyer {euros(actuel.loyer)}/mois · {e.agents.length} collaborateur(s)
          </span>
        </div>
      </div>
      <div className="frise-locaux">
        {LOCAUX.map((l) => (
          <div key={l.niveau} className={`etape-locaux ${l.niveau <= e.niveauLocaux ? "faite" : ""}`}>
            <strong>{l.nom}</strong>
            <span>{l.description}</span>
            <small>
              {l.postes} postes · loyer {euros(l.loyer)}
              {l.travaux ? ` · travaux ${euros(l.travaux)}` : ""}
            </small>
          </div>
        ))}
      </div>
      {suivant ? (
        <button className="bouton principal-btn" disabled={e.tresorerie < suivant.travaux || e.pa < 1} onClick={() => agir(agrandirLocaux)}>
          🏗️ Passer au « {suivant.nom} » ({euros(suivant.travaux)} de travaux, 1 PA)
        </button>
      ) : (
        <p className="aide">Tu as le plus beau cabinet de la ville. 🏆</p>
      )}

      <h3 className="titre-section">Boutique de mobilier</h3>
      <p className="aide">Chaque achat apparaît dans le cabinet en 3D et a un effet réel sur l&apos;équipe.</p>
      <div className="grille-boutique">
        {BOUTIQUE.map((a) => {
          const achete = possede(e, a.id);
          const dispo = pieceOuverte(e, a.piece);
          return (
            <div key={a.id} className={`article ${achete ? "achete" : ""}`}>
              <span className="icone-badge">{a.icone}</span>
              <strong>{a.nom}</strong>
              <small>{a.effet}</small>
              <em>{pieceParId(a.piece)?.nom}</em>
              {achete ? (
                <span className="etat ok">Installé</span>
              ) : (
                <button className="bouton petit" disabled={!dispo || e.tresorerie < a.prix} onClick={() => agir(acheter, a.id)}>
                  {dispo ? `Acheter ${euros(a.prix)}` : "Pièce à construire"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { BOUTIQUE } from "@/lib/data/boutique";
import { LOCAUX, niveauLocaux } from "@/lib/data/locaux";
import { SERVICES, acheter, agrandirLocaux, licencier, marqueEmployeur, pieceOuverte, possede, recruterService } from "@/lib/moteur";
import { pieceParId } from "@/lib/plan";
import { useJeu } from "@/lib/store";
import { euros } from "../textes";
import { Agences } from "./Developpement";

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
        <button className="bouton principal-btn" disabled={e.tresorerie < suivant.travaux} onClick={() => agir(agrandirLocaux)}>
          🏗️ Passer au « {suivant.nom} » ({euros(suivant.travaux)} de travaux)
        </button>
      ) : (
        <p className="aide">Tu as le plus beau cabinet de la ville. 🏆</p>
      )}

      <h3 className="titre-section">Services du campus</h3>
      <p className="aide">
        Le personnel des services n&apos;a pas de dossiers, mais il rend le campus vivant et attire de meilleurs candidats. Marque employeur :{" "}
        <b>{Math.round(marqueEmployeur(e))}/100</b>.
      </p>
      <div className="grille-boutique">
        {SERVICES.map((sv) => {
          const equipe = e.agents.filter((a) => a.service === sv.type);
          const dispo = !sv.piece || pieceOuverte(e, sv.piece);
          return (
            <div key={sv.type} className={`article ${equipe.length ? "achete" : ""}`}>
              <strong>{sv.nom}</strong>
              <small>{sv.effet}</small>
              <em>
                {sv.poste} · {euros(sv.salaire)} brut/mois
              </em>
              {equipe.length > 0 && (
                <span className="equipe-service">
                  {equipe.map((a) => (
                    <button key={a.id} className="lien" title="Se séparer de cette personne" onClick={() => agir(licencier, a.id)}>
                      {a.prenom} ✕
                    </button>
                  ))}
                </span>
              )}
              <button className="bouton petit" disabled={!dispo || equipe.length >= 3} onClick={() => agir(recruterService, sv.type)}>
                {dispo ? "Recruter" : "Pièce à construire"}
              </button>
            </div>
          );
        })}
      </div>

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
      <Agences />
    </div>
  );
}

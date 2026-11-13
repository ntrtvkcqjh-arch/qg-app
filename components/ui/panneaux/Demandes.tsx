"use client";

import { dateCourte } from "@/lib/calendrier";
import { accepterProposition, besoins, refuserProposition } from "@/lib/moteur";
import { LIBELLE_FILIERE } from "@/lib/data/equipe";
import { useJeu } from "@/lib/store";
import { euros } from "../textes";

const ORIGINE = { visite: "🚪 Au cabinet", courrier: "📨 Courrier", client: "📋 Client existant" } as const;

export default function Demandes() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const surcharge = besoins(e).filter((b) => b.ratio > 1);

  return (
    <div>
      <p className="aide">
        Prospects et clients te sollicitent. À toi de choisir selon ta charge : accepter un nouveau client coûte 1 PA (rendez-vous et
        lettre de mission). Les vérifications d&apos;usage (identité, bénéficiaire effectif) protègent le cabinet et comptent au
        contrôle qualité. Un prospect venu en personne n&apos;attend que jusqu&apos;au soir.
      </p>
      {surcharge.length > 0 && (
        <p className="alerte-charge">
          ⚠️ Ton équipe est déjà en surcharge en {surcharge.map((b) => LIBELLE_FILIERE[b.filiere].toLowerCase()).join(", ")}. Accepter plus de
          dossiers sans recruter risque de faire rater des échéances.
        </p>
      )}
      {e.propositions.length === 0 && <p className="vide">Aucune demande pour l&apos;instant. Elles arrivent au fil des jours, d&apos;autant plus que ta réputation est bonne.</p>}
      <div className="liste-demandes">
        {e.propositions.map((p) => {
          const total = p.missions.reduce((s, m) => s + m.honoraires, 0);
          return (
            <div key={p.id} className={`demande o-${p.origine}`}>
              <div className="ligne1">
                <span className="origine">{ORIGINE[p.origine]}</span>
                <small>expire le {dateCourte(p.expire)}</small>
              </div>
              <strong>{p.titre}</strong>
              <p>{p.description}</p>
              <ul>
                {p.missions.map((m, i) => (
                  <li key={i}>
                    {m.titre} — <b>{euros(m.honoraires)}</b>
                  </li>
                ))}
              </ul>
              <div className="chiffres-demande">
                {p.forfait > 0 && <span>Forfait mensuel : <b>{euros(p.forfait)}</b></span>}
                <span>Honoraires immédiats : <b>{euros(total)}</b></span>
                <span>Difficulté : {"●".repeat(p.difficulte)}{"○".repeat(5 - p.difficulte)}</span>
              </div>
              <div className="actions-demande">
                {p.nouveau ? (
                  <>
                    <button className="bouton principal-btn petit" onClick={() => agir(accepterProposition, p.id, true)}>
                      🔎 Vérifier puis accepter (1 PA)
                    </button>
                    <button className="bouton petit" onClick={() => agir(accepterProposition, p.id, false)}>
                      Accepter directement (1 PA)
                    </button>
                  </>
                ) : (
                  <button className="bouton principal-btn petit" onClick={() => agir(accepterProposition, p.id, false)}>
                    Accepter la mission
                  </button>
                )}
                <button className="bouton petit" onClick={() => agir(refuserProposition, p.id)}>
                  Décliner
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

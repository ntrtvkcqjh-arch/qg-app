"use client";

import { useState } from "react";
import { COUT_AGENCE, VILLES, classement, ouvrirAgence } from "@/lib/vie3";
import { useJeu } from "@/lib/store";
import { euros } from "../textes";

/** Classement régional face aux concurrents (fictifs). */
export function Classement() {
  const e = useJeu((s) => s.etat)!;
  const lignes = classement(e);
  return (
    <div className="classement">
      <h3 className="titre-section">🏆 Classement régional</h3>
      <p className="aide">Mis à jour chaque mois. Objectif : devenir n°1 de la région.</p>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Cabinet</th>
            <th className="num">CA annuel</th>
            <th className="num">Effectif</th>
            <th className="num">Satisf.</th>
            <th className="num">Turnover</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={l.id} className={l.moi ? "moi" : ""}>
              <td>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
              <td>{l.nom}</td>
              <td className="num">{euros(l.ca)}</td>
              <td className="num">{l.effectif}</td>
              <td className="num">{Math.round(l.satisfaction)}</td>
              <td className="num">{Math.round(l.turnover)} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ouverture d'agences dans d'autres villes, sur une carte de France. */
export function Agences() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [ville, setVille] = useState<string | null>(null);
  const [associe, setAssocie] = useState("");
  const associes = e.agents.filter((a) => a.filiere === "associe" || /manager/i.test(a.poste));
  const agences = e.agences ?? [];
  return (
    <div className="agences">
      <h3 className="titre-section">🗺️ Agences</h3>
      <p className="aide">Ouvrir une agence coûte {euros(COUT_AGENCE)} (bail, travaux, informatique). Elle a besoin d&apos;un associé ou d&apos;un manager pour la diriger, sinon elle grandit lentement.</p>
      <div className="carte-france">
        <svg viewBox="0 0 320 320" role="img" aria-label="Carte de France des agences">
          <path d="M150 15 L200 30 L255 60 L290 90 L275 140 L250 175 L245 215 L270 250 L250 290 L195 300 L150 285 L110 295 L70 270 L80 230 L70 190 L40 165 L20 135 L55 115 L95 95 L120 60 Z" fill="#eef2fb" stroke="#c9d2e6" strokeWidth="2" />
          <circle cx={160} cy={95} r={9} fill="#2f5bea" />
          <text x={160} y={80} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2f5bea">
            Siège
          </text>
          {VILLES.map((v) => {
            const ag = agences.find((a) => a.ville === v.ville);
            return (
              <g key={v.ville} onClick={() => !ag && setVille(v.ville)} style={{ cursor: ag ? "default" : "pointer" }}>
                <circle cx={v.x} cy={v.y} r={ag ? 8 : 6} fill={ag ? "#43a047" : ville === v.ville ? "#f2a541" : "#fff"} stroke={ag ? "#2e7d32" : "#8a94a8"} strokeWidth="2" />
                <text x={v.x} y={v.y - 11} textAnchor="middle" fontSize="10" fill="#3d405b">
                  {v.ville}
                  {ag ? ` (${ag.clients})` : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {ville && (
        <div className="ouvrir-agence">
          <strong>Ouvrir l&apos;agence de {ville}</strong>
          <select value={associe} onChange={(ev) => setAssocie(ev.target.value)}>
            <option value="">Sans dirigeant dédié</option>
            {associes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.prenom} ({a.poste})
              </option>
            ))}
          </select>
          <button
            className="bouton principal-btn"
            onClick={() => {
              agir(ouvrirAgence, ville, associe || null);
              setVille(null);
            }}
          >
            Ouvrir ({euros(COUT_AGENCE)})
          </button>
        </div>
      )}
      {agences.length > 0 && (
        <ul className="mini-liste">
          {agences.map((a) => (
            <li key={a.id}>
              <span>
                <strong>{a.ville}</strong> · {a.clients} clients · {a.effectif} collaborateurs
              </span>
              <small>{euros(a.caMois)} de CA / mois · dirigée par {e.agents.find((x) => x.id === a.associe)?.prenom ?? "personne"}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Mur des promotions (affiché aussi à l'accueil). */
export function MurPromotions() {
  const e = useJeu((s) => s.etat)!;
  const p = e.promotions ?? [];
  return (
    <div className="mur-promos">
      <h3 className="titre-section">🎉 Mur des promotions</h3>
      <p className="aide">Parcours : Stagiaire → Assistant → Confirmé → Senior → Manager. Les collaborateurs demandent leur promotion quand leur compétence le permet.</p>
      {!p.length && <p className="vide">Pas encore de promotion : elles arrivent avec l&apos;expérience.</p>}
      <div className="cadres">
        {p.slice(0, 18).map((x, i) => (
          <div key={i} className="cadre">
            <span className="avatar" style={{ background: x.couleur }}>
              {x.prenom[0]}
              {x.nom[0]}
            </span>
            <strong>{x.prenom}</strong>
            <small>{x.poste}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

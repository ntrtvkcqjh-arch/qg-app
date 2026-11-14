"use client";

import { useState } from "react";
import { COUT_AGENCE, VILLES, classement, ouvrirAgence } from "@/lib/vie3";
import { LOGICIELS, changerLogiciel, type TypeLogiciel } from "@/lib/vie4";
import { ouvrirCreche } from "@/lib/vie5";
import { ABONNEMENTS, MISSIONS_CONSEIL, chanceAbonnement, proposerAbonnement, capacitePortefeuille, chanceVente, changerManager, partConseil, pointIndividuel, proposerMission, repartitionTemps, responsables } from "@/lib/associe2080";
import { PARTENAIRES, basculer, risquesCabinet, soignerPartenaire } from "@/lib/vie6";
import type { Etat } from "@/lib/types";
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

/** Logiciels du cabinet : production, paie, plateforme de facturation électronique. */
export function Logiciels() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const l = e.logiciels ?? { production: 0, paie: 0, pdp: 0, migrationJusqua: 0 };
  const migration = l.migrationJusqua > Math.floor(e.minute / 1440);
  const libelles: Record<TypeLogiciel, string> = { production: "Production comptable", paie: "Paie et DSN", pdp: "Facture électronique (plateforme agréée)" };
  return (
    <div className="logiciels">
      <h3 className="titre-section">💻 Logiciels du cabinet</h3>
      <p className="aide">Un bon outil fait gagner du temps, mais chaque changement impose trois semaines de rodage (−15 % de productivité). Depuis le 1er septembre 2026, il faut une plateforme agréée pour recevoir les factures électroniques.</p>
      {migration && <p className="verdict">⏳ Migration en cours : l&apos;équipe apprend le nouvel outil.</p>}
      {(Object.keys(LOGICIELS) as TypeLogiciel[]).map((t) => (
        <label key={t} className="ligne-logiciel">
          <span>{libelles[t]}</span>
          <select value={l[t]} onChange={(ev) => agir(changerLogiciel, t, Number(ev.target.value))}>
            {LOGICIELS[t].map((x, i) => (
              <option key={x.nom} value={i}>
                {x.nom} — {x.prix ? `${x.prix} €${t === "pdp" ? "" : " / utilisateur"} / mois` : "gratuit"}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

/** Services pour l'équipe : crèche d'entreprise et formation cybersécurité. */
export function ServicesEquipe() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  return (
    <div className="services-equipe">
      <h3 className="titre-section">🧸 Services, coworking et 🛡️ cybersécurité</h3>
      <div className="slot">
        <span>
          <strong>Crèche d&apos;entreprise</strong>
          <small>{e.compteurs.creche ? "Ouverte : les enfants passent le mercredi au cabinet." : "40 000 € d'aménagement puis 3 000 € par mois. Moral et marque employeur en hausse."}</small>
        </span>
        {!e.compteurs.creche && (
          <button className="bouton petit" onClick={() => agir(ouvrirCreche)}>
            Ouvrir
          </button>
        )}
      </div>
      <label className="case-reglage">
        <input type="checkbox" checked={!!e.compteurs.coworking} onChange={(ev) => agir(basculer, "coworking", ev.target.checked)} /> 🏙️ Espace de coworking en centre-ville pour les rendez-vous clients (2 000 € / mois : rendez-vous plus appréciés et moins fatigants)
      </label>
      <div className="slot">
        <span>
          <strong>Formation cybersécurité de l&apos;équipe</strong>
          <small>{(e.compteurs.cyber ?? 0) >= 2 ? "Équipe formée : double authentification et sauvegardes hors ligne en place." : "5 000 € : phishing, mots de passe, sauvegardes. Réduit fortement le risque de cyberattaque."}</small>
        </span>
        {(e.compteurs.cyber ?? 0) < 2 && (
          <button
            className="bouton petit"
            onClick={() =>
              agir((x: Etat) => {
                if (x.tresorerie < 5000) return "Trésorerie insuffisante.";
                x.tresorerie -= 5000;
                x.compteurs.cyber = 2;
                return null;
              })
            }
          >
            Former
          </button>
        )}
      </div>
    </div>
  );
}

/** Avis des salariés sur un site d'avis fictif, calculés depuis l'ambiance réelle. */
export function AvisSalaries() {
  const e = useJeu((s) => s.etat)!;
  const n = Math.max(1, e.agents.length);
  const moral = e.agents.reduce((s, a) => s + a.moral, 0) / n;
  const stress = e.agents.reduce((s, a) => s + a.stress, 0) / n;
  const note = Math.max(1, Math.min(5, Math.round(((moral - stress * 0.4) / 18 + 1.2) * 10) / 10));
  const avis = [
    moral > 70 ? "« Super ambiance, des associés à l'écoute. »" : moral > 50 ? "« Bonne équipe, mais la charge est parfois lourde. »" : "« Ambiance tendue, on ne se sent pas écoutés. »",
    stress > 60 ? "« La saison fiscale est épuisante, trop de nocturnes. »" : "« Horaires raisonnables, télétravail possible. »",
    e.compteurs.creche ? "« La crèche d'entreprise, ça change la vie ! »" : (e.promotions?.length ?? 0) > 2 ? "« On évolue vite si on s'investit. »" : "« Peu de perspectives d'évolution. »",
  ];
  return (
    <div className="avis-salaries">
      <h3 className="titre-section">⭐ Avis des salariés en ligne</h3>
      <p className="note-avis">
        {"★".repeat(Math.round(note))}
        {"☆".repeat(5 - Math.round(note))} <strong>{note.toFixed(1)} / 5</strong> <small>({n * 2} avis)</small>
      </p>
      <ul className="mini-liste">
        {avis.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}

/** Partenaires prescripteurs : banque, notaire, avocat. */
export function Partenaires() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  return (
    <div className="partenaires">
      <h3 className="titre-section">🤝 Partenaires prescripteurs</h3>
      <p className="aide">Entretiens la relation : au-dessus de 60, ils t&apos;envoient des clients. Sans attention, la relation s&apos;érode chaque mois.</p>
      {PARTENAIRES.map((p) => {
        const v = Math.round(e.compteurs[`part_${p.id}`] ?? 30);
        return (
          <div key={p.id} className="slot">
            <span>
              <strong>
                {p.emoji} {p.nom}
              </strong>
              <small>
                {p.role} · relation {v}/100
              </small>
              <span className="jauge-mini">
                <span style={{ width: `${v}%`, background: v >= 60 ? "#43a047" : v >= 35 ? "#f2a541" : "#e04a3a" }} />
              </span>
            </span>
            <button className="bouton petit" onClick={() => agir(soignerPartenaire, p.id, "dejeuner")}>
              🍽️ Déjeuner (150 €)
            </button>
            <button className="bouton petit" onClick={() => agir(soignerPartenaire, p.id, "dossier")}>
              📨 Lui recommander un client
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Cartographie des risques du cabinet. */
export function Risques() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const liste = risquesCabinet(e);
  return (
    <div className="risques">
      <h3 className="titre-section">🧭 Cartographie des risques du cabinet</h3>
      <ul className="mini-liste">
        {liste.map((r) => (
          <li key={r.nom} className={`risque-${r.niveau === "élevé" ? "eleve" : r.niveau}`}>
            <span>
              <strong>{r.nom}</strong> · risque {r.niveau}
            </span>
            <small>{r.detail}</small>
          </li>
        ))}
      </ul>
      {!e.compteurs.hommeCle && (
        <button
          className="bouton petit"
          onClick={() =>
            agir((x: Etat) => {
              x.compteurs.hommeCle = 1;
              return null;
            })
          }
        >
          🛡️ Souscrire une assurance homme-clé (250 € / mois)
        </button>
      )}
    </div>
  );
}

/** Barre 20/80 : répartition de ton temps entre production, conseil et management. */
export function Barre2080({ semaineDerniere = false, avecCa = false }: { semaineDerniere?: boolean; avecCa?: boolean }) {
  const e = useJeu((s) => s.etat)!;
  const r = repartitionTemps(e, semaineDerniere);
  const ca = partConseil(e);
  const abonnes = e.clients.filter((c) => c.abonnement).length;
  return (
    <div className="barre-2080">
      {avecCa && (
        <small>
          💼 Conseil : <b>{ca.pct} %</b> du CA le mois dernier · {abonnes} client{abonnes > 1 ? "s" : ""} abonné{abonnes > 1 ? "s" : ""} au conseil
        </small>
      )}
      <div className="barre">
        <span style={{ width: `${r.prod}%`, background: "#e04a3a" }} title="Production" />
        <span style={{ width: `${r.conseil}%`, background: "#2f5bea" }} title="Conseil" />
        <span style={{ width: `${r.mgmt}%`, background: "#17a398" }} title="Management" />
      </div>
      <small>
        {r.heures ? (
          <>
            <b style={{ color: r.prod <= 25 ? "#2e7d32" : "#e04a3a" }}>Production {r.prod} %</b> · Conseil {r.conseil} % · Management {r.mgmt} % · {r.heures} h
          </>
        ) : (
          semaineDerniere ? "Pas encore de semaine complète enregistrée." : "Pas encore d'activité comptée cette semaine."
        )}
      </small>
    </div>
  );
}

/** Portefeuilles de clients par senior / manager / associé, et points individuels. */
export function Portefeuilles() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const resp = responsables(e);
  if (!resp.length) return <p className="vide">Pas encore de senior ou de manager : les clients remontent tous à toi. Promeus ou recrute des seniors pour déléguer.</p>;
  return (
    <div className="portefeuilles">
      <h3 className="titre-section">📂 Portefeuilles clients et points individuels</h3>
      <p className="aide">Chaque client est suivi par un senior, un manager ou un associé. Sa compétence et son moral jouent sur la satisfaction du client ; au-delà de sa capacité, il sature. Un point individuel (1 h de ton temps de management) le remotive et le fait progresser.</p>
      {resp.map((a) => {
        const clients = e.clients.filter((c) => c.manager === a.id);
        const sat = clients.length ? Math.round(clients.reduce((s, c) => s + c.satisfaction, 0) / clients.length) : 0;
        const cap = capacitePortefeuille(a);
        return (
          <div key={a.id} className="slot">
            <span>
              <strong>
                {a.prenom} {a.nom}
              </strong>
              <small>
                {a.poste} · {clients.length}/{cap} clients{clients.length ? ` · satisfaction ${sat}` : ""} · compétence {Math.round(a.competence)} · moral {Math.round(a.moral)}
              </small>
              <span className="jauge-mini">
                <span style={{ width: `${Math.min(100, (clients.length / cap) * 100)}%`, background: clients.length > cap ? "#e04a3a" : "#2f5bea" }} />
              </span>
            </span>
            <button className="bouton petit" onClick={() => agir(pointIndividuel, a.id)}>
              🗣️ Point 1:1
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Bilan 20/80 : part du conseil dans le chiffre d'affaires et délégation de la revue. */
export function Bilan2080() {
  const e = useJeu((s) => s.etat)!;
  const ca = partConseil(e);
  const deleguees = e.compteurs.revuesDeleguees ?? 0;
  const erreurs = e.compteurs.erreursDeleguees ?? 0;
  return (
    <div className="bilan-2080">
      <h3 className="titre-section">⚖️ Associée 20/80</h3>
      <p className="aide">Objectif : 20 % de ton temps en production au plus, 80 % en conseil et management.</p>
      <h4>Ton temps cette semaine</h4>
      <Barre2080 />
      <h4>La semaine dernière</h4>
      <Barre2080 semaineDerniere />
      <div className="kpis petits">
        <div className="kpi">
          <span>Conseil dans le CA (mois dernier)</span>
          <strong>{ca.pct} %</strong>
        </div>
        <div className="kpi">
          <span>Revues déléguées</span>
          <strong>{deleguees}</strong>
        </div>
        <div className="kpi">
          <span>Erreurs passées à travers</span>
          <strong className={erreurs ? "alerte" : ""}>
            {erreurs} {deleguees ? `(${Math.round((erreurs / deleguees) * 100)} %)` : ""}
          </strong>
        </div>
      </div>
      <p className="aide">
        Missions de conseil vendues : {e.compteurs.ventesConseil ?? 0} · semaines 20/80 réussies : {e.compteurs.semaines2080 ?? 0}. Les erreurs passent quand tes réviseurs sont peu compétents ou fatigués : forme tes seniors et fais des points individuels.
      </p>
    </div>
  );
}

/** Sur la fiche client : manager responsable et vente de missions de conseil. */
export function ConseilClient({ id }: { id: string }) {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [idx, setIdx] = useState(0);
  const [premium, setPremium] = useState(false);
  const c = e.clients.find((x) => x.id === id);
  if (!c) return null;
  const jour = Math.floor(e.minute / 1440);
  const attente = (e.compteurs[`vente:${c.id}`] ?? -99) > jour - 30;
  const m = MISSIONS_CONSEIL[idx];
  return (
    <div className="conseil-client">
      <label className="ligne-logiciel">
        <span>📂 Suivi par</span>
        <select value={c.manager ?? ""} onChange={(ev) => agir(changerManager, c.id, ev.target.value)}>
          {!c.manager && <option value="">Personne (toi)</option>}
          {responsables(e).map((a) => (
            <option key={a.id} value={a.id}>
              {a.prenom} {a.nom} ({a.poste})
            </option>
          ))}
        </select>
      </label>
      <h4>💼 Proposer une mission de conseil</h4>
      <div className="vente">
        <select value={idx} onChange={(ev) => setIdx(Number(ev.target.value))}>
          {MISSIONS_CONSEIL.map((x, i) => (
            <option key={x.nom} value={i}>
              {x.nom} ({Math.round(x.honoraires).toLocaleString("fr-FR")} €)
            </option>
          ))}
        </select>
        <label className="case-reglage">
          <input type="checkbox" checked={premium} onChange={(ev) => setPremium(ev.target.checked)} /> Version premium (+30 %)
        </label>
        <button className="bouton principal-btn petit" disabled={attente} onClick={() => agir(proposerMission, c.id, idx, premium)}>
          {attente ? "Déjà sollicité ce mois-ci" : `Proposer (${Math.round(chanceVente(e, c, premium) * 100)} % de chances)`}
        </button>
      </div>
      <small className="aide">{m.chaine ? "Mission experte : elle se déroule en plusieurs étapes, dans tes décisions." : "Mission réalisée par ton équipe une fois signée."}</small>
      <h4>📈 Abonnement de conseil {c.abonnement ? `: ${ABONNEMENTS[c.abonnement - 1].nom} (${ABONNEMENTS[c.abonnement - 1].prix.toLocaleString("fr-FR")} € / mois)` : ""}</h4>
      <div className="abonnements">
        {ABONNEMENTS.map((a, i) => (
          <button key={a.nom} className={`abonnement ${c.abonnement === i + 1 ? "actif" : ""}`} disabled={(c.abonnement ?? 0) >= i + 1} onClick={() => agir(proposerAbonnement, c.id, i)} title={a.detail}>
            <strong>{a.nom}</strong>
            <small>{a.prix.toLocaleString("fr-FR")} € / mois</small>
            <em>{(c.abonnement ?? 0) >= i + 1 ? "Souscrit" : `${Math.round(chanceAbonnement(e, c, i) * 100)} % de chances`}</em>
          </button>
        ))}
      </div>
      <small className="aide">Les abonnés « Stratégie » et « Direction financière » te sollicitent pour des comités stratégiques : tes recommandations font leur satisfaction… et leur bouche-à-oreille.</small>
    </div>
  );
}

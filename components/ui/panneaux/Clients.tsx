"use client";

import { useState } from "react";
import { dateCourte, jourDe } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { NOMS_PHASES, type Etat } from "@/lib/types";
import { euros } from "../textes";
import { controleDe } from "@/lib/vie4";
import { fixerTarif } from "@/lib/vie5";

// Portefeuille clients : fiche vivante de chaque client (historique,
// humeur, dossiers, impayés) pour voir venir les départs.

const TAILLE = ["", "TPE", "PME", "ETI"];

function factures(e: Etat, clientId: string) {
  return (e.factures ?? []).filter((x) => x.client === clientId && x.payee === null).reduce((s, x) => s + x.montant, 0);
}

export default function Clients() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [tri, setTri] = useState<"risque" | "honoraires" | "nom">("risque");
  const c = e.clients.find((x) => x.id === ouvert);
  if (c) return <FicheClient id={c.id} retour={() => setOuvert(null)} />;
  const liste = [...e.clients].sort((a, b) => (tri === "risque" ? a.satisfaction - b.satisfaction : tri === "honoraires" ? b.forfait - a.forfait : a.nom.localeCompare(b.nom)));
  const total = e.clients.reduce((s, x) => s + x.forfait, 0);
  const aRisque = e.clients.filter((x) => x.satisfaction < 40).length;
  return (
    <div>
      <div className="kpis petits">
        <div className="kpi">
          <span>Clients</span>
          <strong>{e.clients.length}</strong>
        </div>
        <div className="kpi">
          <span>Honoraires / mois</span>
          <strong>{euros(total)}</strong>
        </div>
        <div className="kpi">
          <span>Risque de départ</span>
          <strong className={aRisque ? "alerte" : ""}>{aRisque}</strong>
        </div>
      </div>
      <div className="tarifs">
        <label>
          <span>
            💶 Tes tarifs : <strong>{e.compteurs.tarif ?? 100} %</strong> du prix du marché
          </span>
          <input type="range" min={80} max={130} step={5} value={e.compteurs.tarif ?? 100} onChange={(ev) => agir(fixerTarif, Number(ev.target.value))} />
        </label>
        <small>Plus cher : meilleures marges sur les nouveaux clients, mais la satisfaction baisse et tu gagnes moins d&apos;appels d&apos;offres. Moins cher : l&apos;inverse.</small>
      </div>
      <div className="onglets">
        <button className={tri === "risque" ? "actif" : ""} onClick={() => setTri("risque")}>
          ⚠️ Les plus fragiles
        </button>
        <button className={tri === "honoraires" ? "actif" : ""} onClick={() => setTri("honoraires")}>
          💶 Les plus gros
        </button>
        <button className={tri === "nom" ? "actif" : ""} onClick={() => setTri("nom")}>
          A → Z
        </button>
      </div>
      <ul className="liste-clients">
        {liste.map((x) => (
          <li key={x.id}>
            <button onClick={() => setOuvert(x.id)}>
              <span className="nom">
                <strong>{x.nom}</strong>
                <small>
                  {x.secteur} · {TAILLE[x.taille ?? 1]}
                </small>
              </span>
              <span className="sat">
                <span className="jauge">
                  <span style={{ width: `${x.satisfaction}%`, background: x.satisfaction < 40 ? "#e04a3a" : x.satisfaction < 60 ? "#f2a541" : "#43a047" }} />
                </span>
                {x.satisfaction < 40 && <em>⚠️ risque de départ</em>}
              </span>
              <span className="forfait">{euros(x.forfait)}/mois</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FicheClient({ id, retour }: { id: string; retour: () => void }) {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const c = e.clients.find((x) => x.id === id)!;
  const jour = jourDe(e.minute);
  const dossiers = e.dossiers.filter((d) => d.client === id).sort((a, b) => (a.phase === 5 ? 1 : 0) - (b.phase === 5 ? 1 : 0) || a.echeance - b.echeance);
  const journal = e.journal.filter((j) => j.texte.includes(c.nom)).slice(0, 8);
  const impayes = factures(e, id);
  const heures = dossiers.reduce((s, d) => s + (d.heures ?? 0), 0);
  const debut = dossiers.length ? Math.min(...dossiers.map((d) => d.cree)) : jour;
  const encaisse = dossiers.filter((d) => d.phase === 5).reduce((s, d) => s + d.honoraires, 0) + c.forfait * Math.max(1, (jour - debut) / 30.4);
  const rentabilite = heures ? Math.round((encaisse / (heures * 32)) * 100) : null;
  const humeur = c.satisfaction > 75 ? "😄 Ravi" : c.satisfaction > 55 ? "🙂 Satisfait" : c.satisfaction > 40 ? "😐 Mitigé" : "😠 Mécontent";
  return (
    <div className="fiche-client">
      <button className="lien" onClick={retour}>
        ← Tous les clients
      </button>
      <h3>{c.nom}</h3>
      <p className="aide">
        {c.dirigeant} · {c.secteur} · {TAILLE[c.taille ?? 1]} · « {c.trait} »
      </p>
      <div className="kpis petits">
        <div className="kpi">
          <span>Humeur</span>
          <strong>{humeur}</strong>
        </div>
        <div className="kpi">
          <span>Forfait</span>
          <strong>{euros(c.forfait)}</strong>
        </div>
        <div className="kpi">
          <span>Rentabilité</span>
          <strong className={rentabilite !== null && rentabilite < 100 ? "alerte" : ""}>{rentabilite === null ? "—" : `${rentabilite} %`}</strong>
        </div>
        <div className="kpi">
          <span>Impayés</span>
          <strong className={impayes ? "alerte" : ""}>{euros(impayes)}</strong>
        </div>
      </div>
      {controleDe(e, id) && <p className="verdict">🔍 Contrôle fiscal en cours : étape {Math.min(4, controleDe(e, id)!.etape + 1)} sur 4.</p>}
      <div className="actions-client">
        <button
          className="bouton"
          onClick={() =>
            agir((et: Etat) => {
              const x = et.clients.find((y) => y.id === id)!;
              x.satisfaction = Math.min(100, x.satisfaction + 6);
              et.compteurs.formeToi = Math.max(0, (et.compteurs.formeToi ?? 100) - 4);
              x.historique = [{ jour, texte: "Appel de courtoisie de l'associée." }, ...(x.historique ?? [])].slice(0, 30);
              return null;
            })
          }
        >
          📞 Appel de courtoisie
        </button>
        <button
          className="bouton"
          onClick={() =>
            agir((et: Etat) => {
              const x = et.clients.find((y) => y.id === id)!;
              x.forfait = Math.round((x.forfait * 1.05) / 50) * 50;
              x.satisfaction = Math.max(0, x.satisfaction - 7);
              x.historique = [{ jour, texte: "Forfait revalorisé de 5 %." }, ...(x.historique ?? [])].slice(0, 30);
              return null;
            })
          }
        >
          💶 Revaloriser le forfait (+5 %)
        </button>
      </div>
      <h4>Dossiers</h4>
      {!dossiers.length && <p className="vide">Aucun dossier.</p>}
      <ul className="mini-liste">
        {dossiers.slice(0, 8).map((d) => (
          <li key={d.id}>
            <span>{d.titre}</span>
            <small>
              {NOMS_PHASES[d.phase as 1]} · échéance {dateCourte(d.echeance)}
              {d.phase < 5 && d.echeance < jour ? " · ⏰ en retard" : ""}
            </small>
          </li>
        ))}
      </ul>
      <h4>Historique</h4>
      <ul className="mini-liste">
        {(c.historique ?? []).map((h, i) => (
          <li key={`h${i}`}>
            <span>{h.texte}</span>
            <small>{dateCourte(h.jour)}</small>
          </li>
        ))}
        {journal.map((j, i) => (
          <li key={`j${i}`}>
            <span>{j.texte}</span>
            <small>{dateCourte(j.jour)}</small>
          </li>
        ))}
        {!c.historique?.length && !journal.length && <li className="vide">Rien de notable pour l&apos;instant.</li>}
      </ul>
    </div>
  );
}

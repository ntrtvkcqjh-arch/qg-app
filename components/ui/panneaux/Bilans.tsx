"use client";

import { dateCourte } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import { euros } from "../textes";

export default function Bilans() {
  const e = useJeu((s) => s.etat)!;
  const periodes = [{ ...e.periode, moral: Math.round(e.moodGlobal), label: `${e.periode.label} (en cours)` }, ...e.bilans];
  const histo = [...periodes].slice(0, 10).reverse();
  const max = Math.max(1, ...histo.flatMap((p) => [p.ca, p.charges]));
  const echeances = e.echeances.filter((x) => x.resolue);

  return (
    <div>
      <div className="kpis-bilan">
        <div>
          <span>Trésorerie</span>
          <strong>{euros(e.tresorerie)}</strong>
        </div>
        <div>
          <span>Dossiers livrés</span>
          <strong>{e.compteurs.livres ?? 0}</strong>
        </div>
        <div>
          <span>Échéances gagnées</span>
          <strong>
            {echeances.filter((x) => x.resultat === "victoire").length}/{echeances.length}
          </strong>
        </div>
        <div>
          <span>Clients</span>
          <strong>{e.clients.length}</strong>
        </div>
      </div>

      <h3 className="titre-section">Produits et charges par semaine</h3>
      <div className="graphique" role="img" aria-label="Produits et charges des dix dernières semaines">
        {histo.map((p, i) => (
          <div key={i} className="colonne" title={`${p.label} : ${euros(p.ca)} encaissés, ${euros(p.charges)} de charges`}>
            <div className="barres">
              <div className="barre ca" style={{ height: `${(p.ca / max) * 100}%` }} />
              <div className="barre charges" style={{ height: `${(p.charges / max) * 100}%` }} />
            </div>
            <span>{dateCourte(p.debut)}</span>
          </div>
        ))}
      </div>
      <div className="legende">
        <span>
          <i className="ca" /> Encaissements
        </span>
        <span>
          <i className="charges" /> Charges
        </span>
      </div>

      <h3 className="titre-section">Bilans hebdomadaires</h3>
      <table className="tableau">
        <thead>
          <tr>
            <th>Semaine</th>
            <th>Encaissé</th>
            <th>Charges</th>
            <th>Livrés</th>
            <th>Boss</th>
            <th>Mood</th>
            <th>QCM</th>
          </tr>
        </thead>
        <tbody>
          {periodes.map((p, i) => (
            <tr key={i}>
              <td>{p.label}</td>
              <td>{euros(p.ca)}</td>
              <td>{euros(p.charges)}</td>
              <td>{p.livres}</td>
              <td>
                {p.echeancesGagnees}✔ {p.echeancesPerdues > 0 && <span className="rouge-t">{p.echeancesPerdues}✘</span>}
              </td>
              <td>{p.moral}</td>
              <td>{p.qcm ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="titre-section">Échéances</h3>
      <div className="liste-echeances">
        {e.echeances.slice(0, 30).map((x) => (
          <div key={x.id} className={`echeance ${x.resultat ?? ""}`}>
            <span>{dateCourte(x.jour)}</span>
            <strong>{x.nom}</strong>
            <em>{x.resultat === "victoire" ? "🏆 Gagnée" : x.resultat === "defaite" ? "💥 Perdue" : "À venir"}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

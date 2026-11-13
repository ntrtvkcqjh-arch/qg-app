"use client";

import { dateCourte, jourDe } from "@/lib/calendrier";
import { caAnnuel, dso, relancer } from "@/lib/ext";
import { useJeu } from "@/lib/store";
import { euros } from "../textes";

const COUT_HORAIRE = 32; // coût horaire chargé moyen d'un collaborateur (€)

/** Rentabilité par client, factures et classement des cabinets. */
export default function Finances() {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const jour = jourDe(e.minute);
  const ouvertes = e.factures.filter((f) => f.payee === null).sort((a, b) => a.emise - b.emise);
  const enRetard = ouvertes.filter((f) => f.echeance < jour);
  const encours = ouvertes.reduce((s, f) => s + f.montant, 0);

  const rentabilite = e.clients
    .map((c) => {
      const ds = e.dossiers.filter((d) => d.client === c.id);
      const heures = ds.reduce((s, d) => s + (d.heures ?? 0), 0);
      // Honoraires : dossiers livrés + forfaits mensuels encaissés depuis le début des dossiers suivis.
      const debut = ds.length ? Math.min(...ds.map((d) => d.cree)) : jour;
      const mois = Math.max(1, (jour - debut) / 30.4);
      const honoraires = ds.filter((d) => d.phase === 5).reduce((s, d) => s + d.honoraires, 0) + c.forfait * mois;
      const cout = heures * COUT_HORAIRE;
      return { c, heures, honoraires, taux: heures ? honoraires / heures : 0, marge: honoraires - cout };
    })
    .filter((x) => x.heures > 0)
    .sort((a, b) => a.taux - b.taux);

  const notreCa = caAnnuel(e);
  const classement = [
    ...e.concurrents.map((c) => ({ id: c.id, nom: c.nom, sigle: c.sigle, couleur: c.couleur, ca: c.ca, effectif: c.effectif, rep: c.reputation, nous: false })),
    { id: "nous", nom: e.nomCabinet, sigle: "EZ", couleur: "#2f5bea", ca: notreCa, effectif: e.agents.length + 1, rep: Math.round(e.reputation), nous: true },
  ].sort((a, b) => b.ca - a.ca);

  return (
    <div>
      <h3 className="titre-section">Facturation et recouvrement</h3>
      <div className="kpis-bilan">
        <div>
          <span>Factures en attente</span>
          <strong>{euros(encours)}</strong>
        </div>
        <div>
          <span>Dont en retard</span>
          <strong className={enRetard.length ? "alerte" : ""}>{enRetard.length}</strong>
        </div>
        <div>
          <span>Âge moyen des impayés</span>
          <strong>{dso(e)} j</strong>
        </div>
        <div>
          <span>Factures émises</span>
          <strong>{e.factures.length}</strong>
        </div>
      </div>
      <p className="aide">Chaque dossier livré donne lieu à une facture payable à 30 jours. Certains clients paient vite, d&apos;autres traînent : relance-les (ça les agace un peu).</p>
      <table className="tableau">
        <thead>
          <tr>
            <th>Facture</th>
            <th>Montant</th>
            <th>Émise</th>
            <th>Échéance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ouvertes.slice(0, 12).map((f) => (
            <tr key={f.id}>
              <td>{f.libelle}</td>
              <td>{euros(f.montant)}</td>
              <td>{dateCourte(f.emise)}</td>
              <td className={f.echeance < jour ? "rouge-t" : ""}>{dateCourte(f.echeance)}</td>
              <td>
                <button className="bouton petit" onClick={() => agir(relancer, f.id)}>
                  Relancer{f.relances ? ` (${f.relances})` : ""}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!ouvertes.length && <p className="vide">Aucune facture en attente.</p>}

      <h3 className="titre-section">Rentabilité par client (feuilles de temps)</h3>
      <p className="aide">Temps passé par l&apos;équipe comparé aux honoraires (forfaits mensuels + dossiers livrés). Un taux horaire bas = client à renégocier.</p>
      <table className="tableau">
        <thead>
          <tr>
            <th>Client</th>
            <th>Heures</th>
            <th>Honoraires</th>
            <th>Taux horaire</th>
            <th>Marge</th>
          </tr>
        </thead>
        <tbody>
          {rentabilite.map((r) => (
            <tr key={r.c.id}>
              <td>{r.c.nom}</td>
              <td>{Math.round(r.heures)} h</td>
              <td>{euros(r.honoraires)}</td>
              <td className={r.taux < 60 ? "rouge-t" : r.taux > 110 ? "vert-t" : ""}>{Math.round(r.taux)} €/h</td>
              <td className={r.marge < 0 ? "rouge-t" : ""}>{euros(r.marge)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="titre-section">Classement des cabinets de la ville</h3>
      <p className="aide">Cabinets concurrents fictifs. Ils débauchent, démarchent tes clients et répondent aux mêmes appels d&apos;offres.</p>
      <div className="classement">
        {classement.map((c, i) => (
          <div key={c.id} className={`rang ${c.nous ? "nous" : ""}`}>
            <span className="position">{i + 1}</span>
            <span className="logo-cabinet" style={{ background: c.couleur, color: c.couleur === "#ffd400" ? "#111" : "#fff" }}>
              {c.sigle}
            </span>
            <span className="nom-cabinet">{c.nom}</span>
            <span>{euros(c.ca)}</span>
            <small>
              {c.effectif} pers. · réputation {c.rep}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

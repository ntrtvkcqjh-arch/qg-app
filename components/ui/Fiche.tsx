"use client";

import { useState } from "react";
import { dateCourte } from "@/lib/calendrier";
import { LIBELLE_FILIERE, LIBELLE_PERSO } from "@/lib/data/equipe";
import { augmenter, envoyerEnFormation, imposerRepos, licencier } from "@/lib/moteur";
import { PIECE_ACTIVITE, pieceParId } from "@/lib/plan";
import { useJeu, type Panneau } from "@/lib/store";
import { NOMS_PHASES } from "@/lib/types";
import { LIBELLE_ACTIVITE, euros } from "./textes";

export default function Fiche() {
  const id = useJeu((s) => s.selectionAgent);
  const piece = useJeu((s) => s.selectionPiece);
  if (id) return <FicheAgent id={id} />;
  if (piece) return <FichePiece />;
  return null;
}

function Jauge({ label, v, inverse = false }: { label: string; v: number; inverse?: boolean }) {
  const bon = inverse ? 100 - v : v;
  const c = bon > 60 ? "vert" : bon > 35 ? "orange" : "rouge";
  return (
    <div className="jauge-ligne">
      <span>{label}</span>
      <div className="jauge">
        <div className={c} style={{ width: `${v}%` }} />
      </div>
      <strong>{Math.round(v)}</strong>
    </div>
  );
}

function FicheAgent({ id }: { id: string }) {
  const e = useJeu((s) => s.etat)!;
  const agir = useJeu((s) => s.agir);
  const fermer = useJeu((s) => s.selectionner);
  const [confirmer, setConfirmer] = useState(false);
  const a = e.agents.find((x) => x.id === id);
  if (!a) return null;
  const dossiers = e.dossiers.filter((d) => d.agent === a.id && d.phase < 5).sort((p, q) => p.echeance - q.echeance);
  const relations = e.relations.filter((r) => r.a === a.id || r.b === a.id);
  const nom = (x: string) => e.agents.find((y) => y.id === x)?.prenom ?? "?";
  const lieu = pieceParId(PIECE_ACTIVITE[a.activite])?.nom ?? "Hors du cabinet";

  return (
    <aside className="fiche">
      <div className="fiche-tete">
        <span className="avatar grand" style={{ background: a.couleur }}>
          {a.prenom[0]}
          {a.nom[0]}
        </span>
        <div>
          <small>{a.poste}</small>
          <h2>
            {a.prenom} {a.nom}
          </h2>
          <span className={`statut s-${a.activite}`}>
            {LIBELLE_ACTIVITE[a.activite]} · {lieu}
          </span>
        </div>
        <button className="fermer" onClick={() => fermer(null)} aria-label="Fermer">
          ×
        </button>
      </div>
      {a.bulle && <p className="citation">« {a.bulle} »</p>}
      <div className="tags">
        <span>{LIBELLE_FILIERE[a.filiere]}</span>
        <span>{LIBELLE_PERSO[a.personnalite]}</span>
        {a.clan && <span>Clan : {a.clan}</span>}
        <span>{euros(a.salaire)} brut</span>
      </div>
      <div className="jauges">
        <Jauge label="Compétence" v={a.competence} />
        <Jauge label="Confiance" v={a.confiance} />
        <Jauge label="Moral" v={a.moral} />
        <Jauge label="Stress" v={a.stress} inverse />
        <Jauge label="Fatigue" v={a.fatigue} inverse />
      </div>
      {relations.length > 0 && (
        <div className="bloc">
          <h4>Relations</h4>
          {relations.map((r, i) => {
            const autre = r.a === a.id ? r.b : r.a;
            const sens = r.type === "mentorat" ? (r.a === a.id ? `mentor de ${nom(autre)}` : `mentoré·e par ${nom(autre)}`) : r.type === "rivalite" ? `rivalité avec ${nom(autre)}` : `ami·e de ${nom(autre)}`;
            return (
              <div key={i} className={`relation r-${r.type}`}>
                {r.type === "rivalite" ? "⚡" : r.type === "mentorat" ? "🎓" : "🤝"} {sens}
              </div>
            );
          })}
        </div>
      )}
      <div className="bloc">
        <h4>Dossiers ({dossiers.length})</h4>
        {dossiers.length === 0 && <p className="vide">Aucun dossier en cours.</p>}
        {dossiers.slice(0, 6).map((d) => (
          <div key={d.id} className="mini-dossier">
            <span className="titre">{d.titre}</span>
            <span className={`phase p${d.phase}`}>
              {NOMS_PHASES[d.phase]} {d.phase < 5 && `${Math.round(d.progression)}%`}
            </span>
            <small>
              {d.bloque ? `⛔ ${d.bloque}` : `échéance ${dateCourte(d.echeance)}`}
            </small>
          </div>
        ))}
      </div>
      <div className="actions">
        <button className="bouton" onClick={() => agir(augmenter, a.id)}>
          +100 € de salaire
        </button>
        <button className="bouton" onClick={() => agir(envoyerEnFormation, a.id)}>
          Formation (1 PA, 600 €)
        </button>
        <button className="bouton" onClick={() => agir(imposerRepos, a.id)}>
          2 jours de repos
        </button>
        {!confirmer ? (
          <button className="bouton danger" onClick={() => setConfirmer(true)}>
            Se séparer de {a.prenom}…
          </button>
        ) : (
          <button
            className="bouton danger plein"
            onClick={() => {
              agir(licencier, a.id);
              setConfirmer(false);
            }}
          >
            Confirmer (1 PA, {euros(a.salaire * 2)})
          </button>
        )}
      </div>
    </aside>
  );
}

const RACCOURCIS: Record<string, { label: string; panneau: Panneau }> = {
  associee: { label: "Ouvrir la messagerie", panneau: "messages" },
  formation: { label: "Aller en formation DEC", panneau: "formation" },
  archives: { label: "Voir les dossiers", panneau: "dossiers" },
  reunion: { label: "Voir les dilemmes et messages", panneau: "messages" },
  cafe: { label: "Lire le journal du cabinet", panneau: "journal" },
  accueil: { label: "Recruter / voir l'équipe", panneau: "equipe" },
  openspace: { label: "Voir les dossiers", panneau: "dossiers" },
};

function FichePiece() {
  const e = useJeu((s) => s.etat)!;
  const id = useJeu((s) => s.selectionPiece)!;
  const fermer = useJeu((s) => s.selectionnerPiece);
  const ouvrir = useJeu((s) => s.ouvrir);
  const selectionner = useJeu((s) => s.selectionner);
  const p = pieceParId(id);
  if (!p) return null;
  const ici = e.agents.filter((a) => PIECE_ACTIVITE[a.activite] === id);
  const r = RACCOURCIS[id];
  return (
    <aside className="fiche">
      <div className="fiche-tete">
        <div>
          <small>Espace</small>
          <h2>{p.nom}</h2>
        </div>
        <button className="fermer" onClick={() => fermer(null)} aria-label="Fermer">
          ×
        </button>
      </div>
      <p className="description">{p.description}</p>
      <div className="bloc">
        <h4>Ici en ce moment ({ici.length})</h4>
        {ici.length === 0 && <p className="vide">Personne.</p>}
        {ici.map((a) => (
          <button key={a.id} className="ligne-agent" onClick={() => selectionner(a.id)}>
            <span className="avatar" style={{ background: a.couleur }}>
              {a.prenom[0]}
              {a.nom[0]}
            </span>
            <span className="qui">
              <strong>{a.prenom}</strong>
              <small>{a.bulle ?? a.poste}</small>
            </span>
          </button>
        ))}
      </div>
      {r && (
        <button className="bouton principal-btn" onClick={() => ouvrir(r.panneau)}>
          {r.label}
        </button>
      )}
    </aside>
  );
}

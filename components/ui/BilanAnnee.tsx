"use client";

import { useEffect, useState } from "react";
import { anneeDe, jourDe, moisDe } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";
import type { Etat } from "@/lib/types";

// Bilan de l'année façon « Wrapped » : une série de cartes animées sur
// l'année écoulée du cabinet.

type Carte = { fond: string; sur: string; grand: string; sous: string };

function cartes(e: Etat): { annee: number; liste: Carte[] } {
  const jour = jourDe(e.minute);
  const annee = moisDe(jour) <= 1 ? anneeDe(jour) - 1 : anneeDe(jour);
  const periodes = [...e.bilans, e.periode].filter((b) => anneeDe(b.debut) === annee);
  const ca = periodes.reduce((s, b) => s + b.ca, 0);
  const livres = periodes.reduce((s, b) => s + b.livres, 0);
  const victoires = periodes.reduce((s, b) => s + b.echeancesGagnees, 0);
  const recrues = e.agents.filter((a) => anneeDe(a.embauche) === annee).length;
  const metier = e.agents.filter((a) => ["expertise", "fiscal", "social", "juridique", "audit"].includes(a.filiere));
  const star = [...metier].sort((a, b) => b.competence + b.confiance - (a.competence + a.confiance))[0];
  const fidele = [...e.clients].sort((a, b) => b.satisfaction - a.satisfaction)[0];
  const galere = e.journal.find((j) => j.ton === "mal" && anneeDe(j.jour) === annee);
  const souvenirs = (e.souvenirs ?? []).filter((s) => anneeDe(s.jour) === annee);
  const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
  return {
    annee,
    liste: [
      { fond: "linear-gradient(135deg,#2f5bea,#8e44ad)", sur: `${e.nomCabinet}`, grand: `Ton année ${annee}`, sous: "Prête à revivre les moments forts ? 🎬" },
      { fond: "linear-gradient(135deg,#17a398,#2f5bea)", sur: "Dossiers livrés", grand: `${livres}`, sous: `${victoires} échéances fiscales remportées · ${euros(ca)} de chiffre d'affaires` },
      { fond: "linear-gradient(135deg,#f2a541,#e4572e)", sur: "L'équipe", grand: `${e.agents.length} personnes`, sous: `${recrues} recrue${recrues > 1 ? "s" : ""} cette année${e.promotions?.length ? ` · ${e.promotions.filter((p) => anneeDe(p.jour) === annee).length} promotion(s)` : ""}` },
      { fond: "linear-gradient(135deg,#43a047,#17a398)", sur: "Collaborateur de l'année", grand: star ? `${star.prenom} ${star.nom}` : "—", sous: star ? `${star.poste} · compétence ${Math.round(star.competence)} · confiance ${Math.round(star.confiance)}` : "" },
      { fond: "linear-gradient(135deg,#e91e63,#f2a541)", sur: "Client le plus fidèle", grand: fidele ? fidele.nom : "—", sous: fidele ? `${fidele.dirigeant} · satisfaction ${Math.round(fidele.satisfaction)}/100` : "" },
      { fond: "linear-gradient(135deg,#3d405b,#1d2240)", sur: "La plus grosse galère", grand: "😅", sous: galere ? galere.texte : "Aucune ! Année parfaite." },
      { fond: "linear-gradient(135deg,#8e44ad,#e91e63)", sur: "L'album de l'année", grand: souvenirs.length ? souvenirs.slice(0, 4).map((s) => s.emoji).join(" ") : "📸", sous: souvenirs.length ? souvenirs.slice(0, 3).map((s) => s.titre).join(" · ") : "Prends des photos du cabinet pour remplir l'album !" },
      { fond: "linear-gradient(135deg,#2f5bea,#17a398)", sur: "Merci !", grand: "🥂", sous: `Rendez-vous l'année prochaine. Classement régional actuel : ${e.compteurs.rangRegional ?? "?"}ᵉ.` },
    ],
  };
}

export default function BilanAnnee() {
  const ouvert = useJeu((s) => s.bilanAnnee);
  const setOuvert = useJeu((s) => s.setBilanAnnee);
  const e = useJeu((s) => s.etat);
  const agir = useJeu((s) => s.agir);
  const [i, setI] = useState(0);
  const jour = e ? jourDe(e.minute) : 0;
  const aVoir = !!e && moisDe(jour) === 1 && e.compteurs.wrappedVu !== anneeDe(jour) && e.bilans.length > 20;

  // Début janvier : le bilan de l'année s'ouvre tout seul, une fois.
  useEffect(() => {
    if (!aVoir) return;
    agir((x: Etat) => {
      x.compteurs.wrappedVu = anneeDe(jourDe(x.minute));
      return null;
    });
    setOuvert(true);
  }, [aVoir, agir, setOuvert]);

  if (!ouvert || !e) return null;
  const { liste } = cartes(e);
  const c = liste[i];
  const fermer = () => {
    setI(0);
    setOuvert(false);
  };
  return (
    <div className="voile" onClick={fermer}>
      <div key={i} className="wrapped" style={{ background: c.fond }} onClick={(ev) => ev.stopPropagation()}>
        <div className="progression-wrapped">
          {liste.map((_, k) => (
            <span key={k} className={k <= i ? "vu" : ""} />
          ))}
        </div>
        <small>{c.sur}</small>
        <h2>{c.grand}</h2>
        <p>{c.sous}</p>
        <div className="pied-wrapped">
          {i > 0 && (
            <button className="bouton" onClick={() => setI(i - 1)}>
              ←
            </button>
          )}
          <button className="bouton principal-btn" onClick={() => (i < liste.length - 1 ? setI(i + 1) : fermer())}>
            {i < liste.length - 1 ? "Suivant →" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}

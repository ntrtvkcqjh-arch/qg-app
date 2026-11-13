"use client";

import { useState } from "react";
import { useJeu } from "@/lib/store";
import type { Difficulte } from "@/lib/types";

const NIVEAUX: { id: Difficulte; nom: string; texte: string }[] = [
  { id: "facile", nom: "Facile", texte: "4 PA par jour, 40 000 € de trésorerie, peu d'imprévus." },
  { id: "normal", nom: "Normal", texte: "3 PA par jour, 25 000 € de trésorerie. L'expérience prévue." },
  { id: "expert", nom: "Expert", texte: "3 PA, 15 000 €, plus d'imprévus et des pénalités plus lourdes." },
];

export default function NouvellePartie() {
  const nouvelle = useJeu((s) => s.nouvelle);
  const [nom, setNom] = useState("Cabinet EZ");
  const [niveau, setNiveau] = useState<Difficulte>("normal");

  return (
    <div className="accueil-jeu">
      <div className="carte-accueil">
        <div className="logo">EZ</div>
        <h1>Cabinet EZ</h1>
        <p className="sous-titre">
          Tu es l&apos;associée d&apos;un cabinet d&apos;expertise comptable. Ton équipe travaille en temps réel, même
          quand l&apos;app est fermée. Gère les dossiers, les humeurs, les échéances… et prépare ton DEC en jouant.
        </p>
        <label className="champ">
          <span>Nom du cabinet</span>
          <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={40} />
        </label>
        <div className="niveaux">
          {NIVEAUX.map((n) => (
            <button key={n.id} className={`niveau ${niveau === n.id ? "actif" : ""}`} onClick={() => setNiveau(n.id)}>
              <strong>{n.nom}</strong>
              <span>{n.texte}</span>
            </button>
          ))}
        </div>
        <button className="bouton principal-btn" onClick={() => nouvelle(niveau, nom.trim() || "Cabinet EZ")}>
          Ouvrir le cabinet
        </button>
        <p className="note">La partie est sauvegardée dans ce navigateur. 1 seconde réelle = 1 minute au cabinet.</p>
      </div>
    </div>
  );
}

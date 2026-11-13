"use client";

import { useState } from "react";
import { useJeu } from "@/lib/store";
import type { Difficulte, ModeDepart } from "@/lib/types";

const NIVEAUX: { id: Difficulte; nom: string; texte: string }[] = [
  { id: "facile", nom: "Facile", texte: "4 PA par jour, 40 000 € de trésorerie, peu d'imprévus." },
  { id: "normal", nom: "Normal", texte: "3 PA par jour, 25 000 € de trésorerie. L'expérience prévue." },
  { id: "expert", nom: "Expert", texte: "3 PA, 15 000 €, plus d'imprévus et des pénalités plus lourdes." },
];

const MODES: { id: ModeDepart; nom: string; texte: string }[] = [
  { id: "creation", nom: "Création", texte: "Tu pars de zéro salarié avec 3 petits clients. Tu fais tout toi-même, puis tu recrutes au fil des dossiers." },
  { id: "reprise", nom: "Reprise", texte: "Tu reprends un cabinet existant : 7 collaborateurs, 10 clients, en pleine saison des bilans." },
];

export default function NouvellePartie() {
  const nouvelle = useJeu((s) => s.nouvelle);
  const [nom, setNom] = useState("Cabinet EZ");
  const [niveau, setNiveau] = useState<Difficulte>("normal");
  const [mode, setMode] = useState<ModeDepart>("creation");
  const [budget, setBudget] = useState<"normal" | "dix-millions">("normal");

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
        <span className="libelle">Départ</span>
        <div className="niveaux deux">
          {MODES.map((m) => (
            <button key={m.id} className={`niveau ${mode === m.id ? "actif" : ""}`} onClick={() => setMode(m.id)}>
              <strong>{m.nom}</strong>
              <span>{m.texte}</span>
            </button>
          ))}
        </div>
        <span className="libelle">Trésorerie de départ</span>
        <div className="niveaux deux">
          <button className={`niveau ${budget === "normal" ? "actif" : ""}`} onClick={() => setBudget("normal")}>
            <strong>Selon la difficulté</strong>
            <span>De 15 000 à 40 000 € : chaque euro compte.</span>
          </button>
          <button className={`niveau ${budget === "dix-millions" ? "actif" : ""}`} onClick={() => setBudget("dix-millions")}>
            <strong>10 000 000 €</strong>
            <span>Reprise avec un trésor de guerre : agrandis, recrute et rachète sans compter.</span>
          </button>
        </div>
        <span className="libelle">Difficulté</span>
        <div className="niveaux">
          {NIVEAUX.map((n) => (
            <button key={n.id} className={`niveau ${niveau === n.id ? "actif" : ""}`} onClick={() => setNiveau(n.id)}>
              <strong>{n.nom}</strong>
              <span>{n.texte}</span>
            </button>
          ))}
        </div>
        <button className="bouton principal-btn" onClick={() => nouvelle(niveau, nom.trim() || "Cabinet EZ", mode, budget === "dix-millions" ? 10_000_000 : undefined)}>
          Ouvrir le cabinet
        </button>
        <p className="note">La partie est sauvegardée dans ce navigateur. 1 seconde réelle = 1 minute au cabinet.</p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useJeu } from "@/lib/store";
import type { Candidat, Etat } from "@/lib/types";

// Entretien d'embauche : tu poses 3 questions ; les réponses révèlent la
// compétence réelle, parfois loin de ce qu'annonce le CV.

const QUESTIONS: { q: string; bonne: string; moyenne: string; faible: string }[] = [
  { q: "Racontez-moi un bilan que vous avez fait de A à Z.", bonne: "Détaille la révision par cycles, les points d'audit et la discussion avec le client sur les provisions.", moyenne: "Décrit la saisie et la liasse, mais reste flou sur la révision.", faible: "Parle surtout de saisie et confond bilan et liasse fiscale." },
  { q: "Un client vous demande d'antidater une facture. Que faites-vous ?", bonne: "Refus net, rappel des risques et proposition d'une solution conforme.", moyenne: "Hésite, puis propose d'en parler à son manager.", faible: "« Si ça arrange le client, pourquoi pas… »" },
  { q: "Comment organisez-vous votre période fiscale ?", bonne: "Rétroplanning par échéance, priorisation des dossiers à risque, points hebdo avec l'équipe.", moyenne: "Travaille dans l'ordre d'arrivée, avec quelques nocturnes.", faible: "Découvre les échéances au fur et à mesure." },
  { q: "Quelle est la différence entre taux de marge et taux de marque ?", bonne: "Réponse exacte avec un exemple chiffré.", moyenne: "Inverse d'abord, puis se corrige.", faible: "Ne sait pas." },
  { q: "Pourquoi voulez-vous quitter votre cabinet actuel ?", bonne: "Envie de responsabilités et de missions de conseil, sans critiquer son employeur.", moyenne: "Évoque surtout le salaire.", faible: "Critique longuement son manager actuel." },
  { q: "Quel outil maîtrisez-vous le mieux ?", bonne: "Excel avancé, logiciel de production et premières automatisations.", moyenne: "Le logiciel de production, un peu d'Excel.", faible: "« Je m'adapte à tout » sans exemple concret." },
];

const reponse = (c: Candidat, i: number) => {
  const v = c.vraie ?? c.competence;
  const seuil = 40 + ((c.id.charCodeAt(c.id.length - 1) + i * 7) % 35);
  const q = QUESTIONS[i];
  return v >= seuil + 10 ? { t: q.bonne, n: 2 } : v >= seuil - 10 ? { t: q.moyenne, n: 1 } : { t: q.faible, n: 0 };
};

function evaluer(e: Etat, id: string): string | null {
  const c = e.candidats.find((x) => x.id === id);
  if (!c) return "Candidat introuvable.";
  const v = c.vraie ?? c.competence;
  c.evalue = Math.max(10, Math.min(95, v + Math.round((Math.random() - 0.5) * 8)));
  return null;
}

export default function Entretien({ c, fin }: { c: Candidat; fin: () => void }) {
  const agir = useJeu((s) => s.agir);
  const [posees, setPosees] = useState<number[]>([]);
  const finie = posees.length >= 3;
  return (
    <div className="entretien">
      <strong>
        🎤 Entretien avec {c.prenom} {c.nom}
      </strong>
      <small>Choisis 3 questions. Le CV annonce une compétence de {c.competence}.</small>
      <ul>
        {posees.map((i) => (
          <li key={i}>
            <b>{QUESTIONS[i].q}</b>
            <span>{reponse(c, i).t}</span>
          </li>
        ))}
      </ul>
      {!finie && (
        <div className="questions">
          {QUESTIONS.map((q, i) =>
            posees.includes(i) ? null : (
              <button
                key={i}
                className="option"
                onClick={() => {
                  const p = [...posees, i];
                  setPosees(p);
                  if (p.length === 3) agir(evaluer, c.id);
                }}
              >
                <span>{q.q}</span>
              </button>
            ),
          )}
        </div>
      )}
      {finie && (
        <button className="bouton" onClick={fin}>
          Terminer l&apos;entretien
        </button>
      )}
    </div>
  );
}

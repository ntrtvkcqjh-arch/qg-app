"use client";

import { useEffect } from "react";
import { jourDe } from "@/lib/calendrier";
import { useJeu, type Panneau } from "@/lib/store";
import type { Etat } from "@/lib/types";

// Tutoriel guidé : Maître Garnier, associé fondateur honoraire, présente
// chaque partie du jeu au bon moment.

const ETAPES: { panneau: Panneau; titre: string; texte: string }[] = [
  { panneau: "cabinet", titre: "Bienvenue au cabinet !", texte: "Je suis Maître Garnier, j'ai fondé ce cabinet il y a trente ans. Voici ton campus en 3D : choisis l'étage à gauche, double-clique sur une pièce pour zoomer, clique sur un collaborateur pour ouvrir sa fiche." },
  { panneau: "cabinet", titre: "Tes décisions", texte: "Les décisions arrivent en fenêtres : validations de révision façon DEC, demandes de l'équipe, crises… La fenêtre se ferme seule quand tu réponds. « Plus tard » les range derrière la cloche en bas de l'écran." },
  { panneau: "demandes", titre: "Les demandes", texte: "Prospects et clients t'écrivent ou passent à l'accueil. Accepte les missions qui te rapportent, mais vérifie toujours l'identité des nouveaux clients (lutte anti-blanchiment)." },
  { panneau: "dossiers", titre: "Les dossiers", texte: "Chaque dossier avance seul de la collecte à la révision. À la fin, c'est toi qui valides : question de contrôle ou feuille de révision où tu dois repérer les anomalies." },
  { panneau: "clients", titre: "Tes clients", texte: "La fiche de chaque client montre son humeur, sa rentabilité et son historique. Règle aussi tes tarifs ici : trop cher, ils partent ; pas assez, tes marges fondent." },
  { panneau: "agenda", titre: "Ton agenda", texte: "Organise ta semaine en glissant les rendez-vous. Au-delà de 5 créneaux par jour, ta forme baisse. Et pose des vacances de temps en temps !" },
  { panneau: "equipe", titre: "Ton équipe", texte: "Recrute (avec un entretien, les CV enjolivent parfois), forme, promeus… Surveille le stress et le moral : un collaborateur épuisé finit en arrêt." },
  { panneau: "locaux", titre: "Les locaux", texte: "Agrandis le campus, embauche les services (accueil, cafétéria…), choisis tes logiciels et ouvre des agences dans d'autres villes." },
  { panneau: "bilans", titre: "Les bilans", texte: "Chiffre d'affaires, rentabilité par client, classement régional face aux concurrents… et le bilan de l'année en janvier." },
  { panneau: "memoire", titre: "Ton DEC", texte: "Avance ton mémoire avec ton directeur, puis passe la soutenance devant le jury pour devenir experte-comptable diplômée." },
  { panneau: "cabinet", titre: "Réunions et timelapse", texte: "Le bouton 🎙️ lance une réunion live avec tes managers ; ⏩ fait défiler la journée ; 📸 prend une photo pour l'album." },
  { panneau: "reglages", titre: "Délégation et sauvegardes", texte: "Dans les réglages, tu peux déléguer certains thèmes, lancer des scénarios et garder plusieurs parties. Bonne chance, associée !" },
];

export const tutorielActif = (e: Etat | null) => !!e && e.compteurs.tuto !== undefined && e.compteurs.tuto < 99;

export default function Tutoriel() {
  const e = useJeu((s) => s.etat);
  const agir = useJeu((s) => s.agir);
  const ouvrir = useJeu((s) => s.ouvrir);
  const nouvelle = !!e && e.compteurs.tuto === undefined && e.bilans.length === 0 && jourDe(e.minute) < 2;

  // Nouvelle partie : le tutoriel démarre tout seul.
  useEffect(() => {
    if (nouvelle)
      agir((x: Etat) => {
        x.compteurs.tuto = 0;
        return null;
      });
  }, [nouvelle, agir]);

  if (!tutorielActif(e)) return null;
  const n = e!.compteurs.tuto!;
  const et = ETAPES[n];
  if (!et) return null;
  const aller = (k: number) => {
    agir((x: Etat) => {
      x.compteurs.tuto = k >= ETAPES.length ? 99 : k;
      return null;
    });
    if (ETAPES[k]) ouvrir(ETAPES[k].panneau);
  };
  return (
    <div className="tutoriel">
      <span className="avatar" style={{ background: "#3d405b" }}>
        MG
      </span>
      <div>
        <small>
          Maître Garnier · {n + 1} / {ETAPES.length}
        </small>
        <strong>{et.titre}</strong>
        <p>{et.texte}</p>
        <div className="actions">
          <button className="lien" onClick={() => aller(99)}>
            Passer le tutoriel
          </button>
          {n > 0 && (
            <button className="bouton petit" onClick={() => aller(n - 1)}>
              ←
            </button>
          )}
          <button className="bouton principal-btn petit" onClick={() => aller(n + 1)}>
            {n + 1 < ETAPES.length ? "Suivant →" : "C'est parti !"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useJeu } from "@/lib/store";
import { tutorielActif } from "./Tutoriel";
import { jourDe, minuteDuJour } from "@/lib/calendrier";
import type { Message } from "@/lib/types";
import { Detail } from "./panneaux/Messages";
import { estDelegue } from "@/lib/vie5";

// Fenêtre de décision : remplace la messagerie. Chaque décision (validation
// de mission avec sa question DEC, dilemme, appel, demande de l'équipe,
// information) s'affiche ici, une à la fois.

const aTraiter = (m: Message) => m.statut === "attente" || (m.statut === "info" && !m.lu);
const priorite = (m: Message) => (m.theme === "validation" ? 3.5 : m.niveau);

// Mode zen : au plus une ouverture automatique toutes les 2 heures de jeu (120 s),
// sauf urgence (niveau 4-5). Le reste attend dans la cloche.
const ECART_ZEN = 120_000;

export default function Decisions() {
  const messages = useJeu((s) => s.etat?.messages);
  const zen = useJeu((s) => s.etat?.compteurs.popupsTous !== 1);
  const etat = useJeu((s) => s.etat);
  const courantId = useJeu((s) => s.messageOuvert);
  const ouvrirMessage = useJeu((s) => s.ouvrirMessage);
  const notifier = useJeu((s) => s.notifier);
  const reunion = useJeu((s) => s.reunionOuverte || s.timelapse || s.bilanAnnee || tutorielActif(s.etat) || (!!s.etat && s.etat.compteurs.matinVu !== jourDe(s.etat.minute) && minuteDuJour(s.etat.minute) >= 480 && minuteDuJour(s.etat.minute) <= 720));
  const [masque, setMasque] = useState(false);
  const pauseJusqua = useRef(0);
  const prochaineAuto = useRef(0);
  const vus = useRef(new Set<string>());
  const [, setTic] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTic((x) => x + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const file = (messages ?? []).filter((m) => aTraiter(m) && !(zen && m.statut === "info") && !(etat && estDelegue(etat, m))).sort((a, b) => priorite(b) - priorite(a) || a.jour * 1440 + a.minute - (b.jour * 1440 + b.minute));
  const courant = messages?.find((m) => m.id === courantId) ?? null;

  // Une nouvelle décision importante rouvre la fenêtre.
  useEffect(() => {
    const nouvelles = file.filter((m) => !vus.current.has(m.id));
    for (const m of nouvelles) vus.current.add(m.id);
    if (!zen && nouvelles.some((m) => m.niveau >= 3 || m.theme === "validation")) setMasque(false);
  }, [file, zen]);

  // Ouvre automatiquement la première décision en attente (après une courte pause).
  // En zen : seulement l'important, et pas plus d'une fois toutes les 2 heures de jeu.
  useEffect(() => {
    if (reunion || courant || !file.length || Date.now() < pauseJusqua.current) return;
    if (!zen) {
      if (!masque) ouvrirMessage(file[0].id);
      return;
    }
    const urgent = file.find((m) => m.niveau >= 4 && m.statut === "attente");
    const important = file.find((m) => m.statut === "attente" && (m.niveau >= 3 || m.theme === "validation"));
    const cible = urgent ?? (!masque && Date.now() > prochaineAuto.current ? important : undefined);
    if (!cible) return;
    prochaineAuto.current = Date.now() + ECART_ZEN;
    ouvrirMessage(cible.id);
  });

  // Une fois la réponse donnée, la fenêtre se ferme toute seule et le
  // résultat (avec la correction pour les questions DEC) s'affiche en bandeau.
  const statut = courant?.statut;
  useEffect(() => {
    if (!courant || statut !== "repondu") return;
    let texte = "✔ Décision enregistrée.";
    if (courant.cas) {
      const bon = courant.reponse === courant.cas.choix[courant.cas.bonne];
      const attendu = courant.cas.saisie ? `${courant.cas.saisie.reponse.toLocaleString("fr-FR")} ${courant.cas.saisie.unite}`.trim() : courant.cas.choix[courant.cas.bonne];
      texte = `${bon ? "✔ Bonne réponse" : `✘ Raté — la bonne réponse : ${attendu}`}. ${courant.cas.explication}${bon ? "" : " 🔁 Cette notion reviendra dans quelques jours ; la fiche est dans Mon DEC."}`;
    } else if (courant.revue) {
      texte = courant.reponse ?? texte;
    } else if (courant.dilemme) {
      const opt = courant.dilemme.options.find((o) => o.label === courant.reponse);
      if (opt?.resultat) texte = `✔ ${opt.resultat}`;
    }
    notifier(texte);
    ouvrirMessage(null);
    pauseJusqua.current = Date.now() + 1800;
  }, [courant, statut, notifier, ouvrirMessage]);

  if (!messages || reunion) return null;
  const reste = file.filter((m) => m.id !== courant?.id);
  const ici = file.findIndex((m) => m.id === courant?.id);
  const suivante = (ici >= 0 ? file[ici + 1] : null) ?? reste[0] ?? null;

  if (!courant) {
    if (!file.length) return null;
    return (
      <button
        className="cloche-decisions"
        onClick={() => {
          setMasque(false);
          ouvrirMessage(file[0].id);
        }}
      >
        {zen ? "📬" : "🔔"} {file.length} décision{file.length > 1 ? "s" : ""} en attente
      </button>
    );
  }

  const traite = !aTraiter(courant) || (courant.statut === "info" && courant.lu);
  return (
    <div className="voile">
      <div className="modale large decision">
        <div className="entete-decision">
          <span className="pastille-decision">{courant.revue ? "🔎 Revue de dossier" : courant.theme === "validation" ? "🎓 Contrôle DEC" : courant.dilemme ? "⚖️ Décision" : courant.canal === "appel" ? "📞 Appel" : courant.statut === "info" ? "ℹ️ Information" : "💬 Demande"}</span>
          <small>{reste.length ? `encore ${reste.length} après celle-ci` : "dernière décision"}</small>
        </div>
        <Detail key={courant.id} m={courant} />
        <div className="pied-decision">
          <button
            className="bouton"
            onClick={() => {
              setMasque(true);
              setTimeout(() => setMasque(false), 3 * ECART_ZEN);
              ouvrirMessage(null);
            }}
          >
            Plus tard
          </button>
          <button className={`bouton ${traite ? "principal-btn" : ""}`} onClick={() => ouvrirMessage(suivante?.id ?? null)}>
            {reste.length ? "Décision suivante →" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}

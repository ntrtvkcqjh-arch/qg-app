"use client";

import { useEffect, useRef, useState } from "react";
import { useJeu } from "@/lib/store";
import type { Message } from "@/lib/types";
import { Detail } from "./panneaux/Messages";

// Fenêtre de décision : remplace la messagerie. Chaque décision (validation
// de mission avec sa question DEC, dilemme, appel, demande de l'équipe,
// information) s'affiche ici, une à la fois.

const aTraiter = (m: Message) => m.statut === "attente" || (m.statut === "info" && !m.lu);
const priorite = (m: Message) => (m.theme === "validation" ? 3.5 : m.niveau);

export default function Decisions() {
  const messages = useJeu((s) => s.etat?.messages);
  const courantId = useJeu((s) => s.messageOuvert);
  const ouvrirMessage = useJeu((s) => s.ouvrirMessage);
  const notifier = useJeu((s) => s.notifier);
  const reunion = useJeu((s) => s.reunionOuverte);
  const [masque, setMasque] = useState(false);
  const pauseJusqua = useRef(0);
  const vus = useRef(new Set<string>());

  const file = (messages ?? []).filter(aTraiter).sort((a, b) => priorite(b) - priorite(a) || a.jour * 1440 + a.minute - (b.jour * 1440 + b.minute));
  const courant = messages?.find((m) => m.id === courantId) ?? null;

  // Une nouvelle décision importante rouvre la fenêtre.
  useEffect(() => {
    const nouvelles = file.filter((m) => !vus.current.has(m.id));
    for (const m of nouvelles) vus.current.add(m.id);
    if (nouvelles.some((m) => m.niveau >= 3 || m.theme === "validation")) setMasque(false);
  }, [file]);

  // Ouvre automatiquement la première décision en attente (après une courte pause).
  useEffect(() => {
    if (!reunion && !masque && !courant && file.length && Date.now() > pauseJusqua.current) ouvrirMessage(file[0].id);
  }, [reunion, masque, courant, file, ouvrirMessage]);

  // Une fois la réponse donnée, la fenêtre se ferme toute seule et le
  // résultat (avec la correction pour les questions DEC) s'affiche en bandeau.
  const statut = courant?.statut;
  useEffect(() => {
    if (!courant || statut !== "repondu") return;
    let texte = "✔ Décision enregistrée.";
    if (courant.cas) {
      const bon = courant.reponse === courant.cas.choix[courant.cas.bonne];
      texte = `${bon ? "✔ Bonne réponse" : `✘ Raté — la bonne réponse : ${courant.cas.choix[courant.cas.bonne]}`}. ${courant.cas.explication}`;
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
        🔔 {file.length} décision{file.length > 1 ? "s" : ""} en attente
      </button>
    );
  }

  const traite = !aTraiter(courant) || (courant.statut === "info" && courant.lu);
  return (
    <div className="voile">
      <div className="modale large decision">
        <div className="entete-decision">
          <span className="pastille-decision">{courant.theme === "validation" ? "🎓 Contrôle DEC" : courant.dilemme ? "⚖️ Décision" : courant.canal === "appel" ? "📞 Appel" : courant.statut === "info" ? "ℹ️ Information" : "💬 Demande"}</span>
          <small>{reste.length ? `encore ${reste.length} après celle-ci` : "dernière décision"}</small>
        </div>
        <Detail key={courant.id} m={courant} />
        <div className="pied-decision">
          <button
            className="bouton"
            onClick={() => {
              setMasque(true);
              ouvrirMessage(null);
            }}
          >
            Plus tard
          </button>
          <button className={`bouton ${traite ? "principal-btn" : ""}`} onClick={() => ouvrirMessage(reste[0]?.id ?? null)}>
            {reste.length ? "Décision suivante →" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}

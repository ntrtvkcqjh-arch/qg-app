"use client";

import { useJeu } from "@/lib/store";
import Messages from "./panneaux/Messages";
import Dossiers from "./panneaux/Dossiers";
import Equipe from "./panneaux/Equipe";
import Formation from "./panneaux/Formation";
import Bilans from "./panneaux/Bilans";
import Badges from "./panneaux/Badges";
import JournalPanneau from "./panneaux/Journal";

const TITRES = {
  messages: "Messagerie",
  dossiers: "Dossiers",
  equipe: "Équipe & RH",
  formation: "Formation DEC",
  bilans: "Bilans",
  badges: "Badges",
  journal: "Journal du cabinet",
  cabinet: "",
} as const;

export default function Tiroir() {
  const panneau = useJeu((s) => s.panneau);
  const ouvrir = useJeu((s) => s.ouvrir);
  return (
    <section className="tiroir">
      <div className="tiroir-tete">
        <h2>{TITRES[panneau]}</h2>
        <button className="fermer" onClick={() => ouvrir("cabinet")} aria-label="Fermer">
          ×
        </button>
      </div>
      <div className="tiroir-corps">
        {panneau === "messages" && <Messages />}
        {panneau === "dossiers" && <Dossiers />}
        {panneau === "equipe" && <Equipe />}
        {panneau === "formation" && <Formation />}
        {panneau === "bilans" && <Bilans />}
        {panneau === "badges" && <Badges />}
        {panneau === "journal" && <JournalPanneau />}
      </div>
    </section>
  );
}

"use client";

import { useJeu, type Panneau } from "@/lib/store";

const ENTREES: { id: Panneau; icone: string; label: string }[] = [
  { id: "cabinet", icone: "🏢", label: "Cabinet" },
  { id: "messages", icone: "✉️", label: "Messages" },
  { id: "demandes", icone: "📥", label: "Demandes" },
  { id: "dossiers", icone: "🗂️", label: "Dossiers" },
  { id: "equipe", icone: "👥", label: "Équipe & RH" },
  { id: "locaux", icone: "🏗️", label: "Locaux" },
  { id: "formation", icone: "🎓", label: "Formation DEC" },
  { id: "bilans", icone: "📊", label: "Bilans" },
  { id: "badges", icone: "🏅", label: "Badges" },
  { id: "journal", icone: "📰", label: "Journal" },
];

export default function Menu() {
  const panneau = useJeu((s) => s.panneau);
  const ouvrir = useJeu((s) => s.ouvrir);
  const nonLus = useJeu((s) => s.etat?.messages.filter((m) => !m.lu).length ?? 0);
  const qcm = useJeu((s) => s.etat?.qcmDisponible ?? false);
  const demandes = useJeu((s) => s.etat?.propositions.length ?? 0);

  return (
    <nav className="menu">
      <div className="menu-logo">EZ</div>
      {ENTREES.map((x) => (
        <button key={x.id} className={panneau === x.id ? "actif" : ""} onClick={() => ouvrir(x.id)} title={x.label}>
          <span className="icone">{x.icone}</span>
          <span className="label">{x.label}</span>
          {x.id === "messages" && nonLus > 0 && <span className="badge-num">{nonLus}</span>}
          {x.id === "formation" && qcm && <span className="badge-num point" />}
          {x.id === "demandes" && demandes > 0 && <span className="badge-num">{demandes}</span>}
        </button>
      ))}
    </nav>
  );
}

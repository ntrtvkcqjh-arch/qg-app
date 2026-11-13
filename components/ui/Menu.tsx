"use client";

import { useJeu, type Panneau } from "@/lib/store";

const ENTREES: { id: Panneau; icone: string; label: string }[] = [
  { id: "cabinet", icone: "🏢", label: "Cabinet" },
  { id: "messages", icone: "✉️", label: "Messages" },
  { id: "dossiers", icone: "🗂️", label: "Dossiers" },
  { id: "equipe", icone: "👥", label: "Équipe & RH" },
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

  return (
    <nav className="menu">
      <div className="menu-logo">EZ</div>
      {ENTREES.map((x) => (
        <button key={x.id} className={panneau === x.id ? "actif" : ""} onClick={() => ouvrir(x.id)} title={x.label}>
          <span className="icone">{x.icone}</span>
          <span className="label">{x.label}</span>
          {x.id === "messages" && nonLus > 0 && <span className="badge-num">{nonLus}</span>}
          {x.id === "formation" && qcm && <span className="badge-num point" />}
        </button>
      ))}
    </nav>
  );
}

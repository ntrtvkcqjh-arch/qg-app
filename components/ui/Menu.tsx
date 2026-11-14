"use client";

import { useJeu, type Panneau } from "@/lib/store";

const ENTREES: { id: Panneau; icone: string; label: string }[] = [
  { id: "cabinet", icone: "🏢", label: "Cabinet" },
  { id: "demandes", icone: "📥", label: "Demandes" },
  { id: "dossiers", icone: "🗂️", label: "Dossiers" },
  { id: "clients", icone: "🤝", label: "Clients" },
  { id: "equipe", icone: "👥", label: "Équipe & RH" },
  { id: "locaux", icone: "🏗️", label: "Locaux" },
  { id: "bilans", icone: "📊", label: "Bilans" },
  { id: "memoire", icone: "🎓", label: "Mon DEC" },
  { id: "badges", icone: "🏅", label: "Badges" },
  { id: "journal", icone: "📰", label: "Journal" },
  { id: "reglages", icone: "⚙️", label: "Réglages" },
];

export default function Menu() {
  const panneau = useJeu((s) => s.panneau);
  const ouvrir = useJeu((s) => s.ouvrir);
  const demandes = useJeu((s) => s.etat?.propositions.length ?? 0);

  return (
    <nav className="menu">
      <div className="menu-logo">EZ</div>
      {ENTREES.map((x) => (
        <button key={x.id} className={panneau === x.id ? "actif" : ""} onClick={() => ouvrir(x.id)} title={x.label}>
          <span className="icone">{x.icone}</span>
          <span className="label">{x.label}</span>
          {x.id === "demandes" && demandes > 0 && <span className="badge-num">{demandes}</span>}
        </button>
      ))}
    </nav>
  );
}

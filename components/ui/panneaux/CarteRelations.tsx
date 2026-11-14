"use client";

import { useJeu } from "@/lib/store";

// Carte des relations : qui s'entend avec qui (amitiés, couples, mentorats,
// rivalités). Les personnes sont placées en cercle, les liens colorés.

const STYLE = {
  amitie: { c: "#43a047", l: "Amitié", e: "🤝" },
  couple: { c: "#e91e63", l: "Couple", e: "💕" },
  mentorat: { c: "#2f5bea", l: "Mentorat", e: "🎓" },
  rivalite: { c: "#e04a3a", l: "Rivalité", e: "⚡" },
} as const;

export default function CarteRelations() {
  const e = useJeu((s) => s.etat)!;
  const selectionner = useJeu((s) => s.selectionner);
  const ids = new Set(e.relations.flatMap((r) => [r.a, r.b]));
  const gens = e.agents.filter((a) => ids.has(a.id)).slice(0, 36);
  if (!gens.length) return <p className="vide">Pas encore de relations marquantes : elles naissent au fil des pauses et des dossiers.</p>;
  const R = 150;
  const pos = new Map(gens.map((a, i) => [a.id, { x: 180 + R * Math.cos((i / gens.length) * Math.PI * 2), y: 180 + R * Math.sin((i / gens.length) * Math.PI * 2) }]));
  return (
    <div className="carte-relations">
      <svg viewBox="0 0 360 360" role="img" aria-label="Carte des relations entre collaborateurs">
        {e.relations.map((r, i) => {
          const a = pos.get(r.a);
          const b = pos.get(r.b);
          if (!a || !b) return null;
          const st = STYLE[r.type];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={st.c} strokeWidth={1 + r.intensite / 40} strokeDasharray={r.type === "rivalite" ? "5 4" : undefined} opacity={0.75} />;
        })}
        {gens.map((a) => {
          const p = pos.get(a.id)!;
          return (
            <g key={a.id} onClick={() => selectionner(a.id)} style={{ cursor: "pointer" }}>
              <circle cx={p.x} cy={p.y} r={13} fill={a.couleur} stroke="#fff" strokeWidth={2} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff">
                {a.prenom.slice(0, 3)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="legende">
        {Object.values(STYLE).map((s) => (
          <span key={s.l}>
            <i style={{ background: s.c }} /> {s.e} {s.l}
          </span>
        ))}
      </div>
    </div>
  );
}

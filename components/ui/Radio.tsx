"use client";

import { heure } from "@/lib/calendrier";
import { useJeu } from "@/lib/store";

/** Radio du cabinet : les dernières nouvelles défilent en bas de l'écran. */
export default function Radio() {
  const infos = useJeu((s) => (s.etat?.journal ?? []).slice(0, 8).map((j) => `${heure(j.minute)} · ${j.texte}`).join("      ✦      "));
  if (!infos) return null;
  return (
    <div className="radio" aria-label="Radio du cabinet">
      <span className="radio-titre">📻 Radio EZ</span>
      <div className="radio-fil">
        <span key={infos}>{infos}</span>
      </div>
    </div>
  );
}

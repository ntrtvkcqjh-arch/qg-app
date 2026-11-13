"use client";

import { useEffect, useRef, useState } from "react";
import { useJeu } from "@/lib/store";

// Le téléphone sonne quand un client appelle. Décrocher ouvre l'appel ;
// laisser sonner l'envoie sur la messagerie vocale (il reste à traiter).

function sonnerie(ctx: AudioContext) {
  for (const t of [0, 0.25]) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.2);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + t);
    o.stop(ctx.currentTime + t + 0.22);
  }
}

export default function Telephone() {
  const appel = useJeu((s) => {
    const e = s.etat;
    if (!e) return null;
    return e.messages.find((m) => m.canal === "appel" && m.statut === "attente" && !m.lu && e.minute - (m.jour * 1440 + (m.minute % 1440)) < 45) ?? null;
  });
  const sons = useJeu((s) => !!s.etat?.sons);
  const ouvrirMessage = useJeu((s) => s.ouvrirMessage);
  const [ignores, setIgnores] = useState<string[]>([]);
  const ctx = useRef<AudioContext | null>(null);
  const actif = appel && !ignores.includes(appel.id) ? appel : null;

  useEffect(() => {
    if (!actif || !sons) return;
    ctx.current ??= new AudioContext();
    const c = ctx.current;
    sonnerie(c);
    const id = setInterval(() => sonnerie(c), 1800);
    return () => clearInterval(id);
  }, [actif, sons]);

  if (!actif) return null;
  const qui = actif.sujet.replace(/ est furieux| : avis de vérification fiscale/, "").replace(/^Nouveau prospect$/, "Un prospect");
  return (
    <div className="telephone" role="alertdialog" aria-label="Appel entrant">
      <span className="combine">📞</span>
      <div>
        <small>Appel entrant</small>
        <strong>{qui}</strong>
      </div>
      <button className="bouton principal-btn petit" onClick={() => ouvrirMessage(actif.id)}>
        Décrocher
      </button>
      <button className="bouton petit" onClick={() => setIgnores([...ignores, actif.id])}>
        Messagerie
      </button>
    </div>
  );
}

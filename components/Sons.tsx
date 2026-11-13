"use client";

import { useEffect, useRef } from "react";
import { useJeu } from "@/lib/store";

// Ambiance sonore générée par le navigateur (Web Audio), sans fichier :
// claviers, machine à café quand quelqu'un part en pause, imprimante.

function bruit(ctx: AudioContext, duree: number, frequence: number, volume: number) {
  const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duree)), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filtre = ctx.createBiquadFilter();
  filtre.type = "bandpass";
  filtre.frequency.value = frequence;
  const g = ctx.createGain();
  g.gain.value = volume;
  src.connect(filtre).connect(g).connect(ctx.destination);
  src.start();
}

function bip(ctx: AudioContext, f: number, duree: number, volume: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = f;
  g.gain.setValueAtTime(volume, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duree);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + duree);
}

export default function Sons() {
  const actif = useJeu((s) => !!s.etat?.sons && (s.etat?.vitesse ?? 0) > 0);
  const ctxRef = useRef<AudioContext | null>(null);
  const pauses = useRef(0);

  useEffect(() => {
    if (!actif) return;
    ctxRef.current ??= new AudioContext();
    const ctx = ctxRef.current;
    void ctx.resume();
    const clavier = setInterval(() => {
      const e = useJeu.getState().etat;
      if (!e) return;
      const n = e.agents.filter((a) => a.activite === "travaille").length;
      for (let i = 0; i < Math.min(n, 4); i++) if (Math.random() < 0.5) setTimeout(() => bruit(ctx, 0.03, 2500 + Math.random() * 1500, 0.05), Math.random() * 400);
      const p = e.agents.filter((a) => a.activite === "pause").length;
      if (p > pauses.current) bruit(ctx, 1.2, 400, 0.04); // machine à café
      pauses.current = p;
      if (Math.random() < 0.02) {
        bip(ctx, 880, 0.12, 0.03); // imprimante
        setTimeout(() => bruit(ctx, 0.8, 1200, 0.03), 150);
      }
    }, 450);
    return () => clearInterval(clavier);
  }, [actif]);

  return null;
}

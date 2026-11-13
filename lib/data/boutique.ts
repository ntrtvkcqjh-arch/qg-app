import type { PieceId } from "@/lib/types";

// Mobilier qui a un effet réel sur la simulation.

export type Article = { id: string; nom: string; prix: number; piece: PieceId; icone: string; effet: string };

export const BOUTIQUE: Article[] = [
  { id: "canape", nom: "Canapé lounge", prix: 1500, piece: "cafe", icone: "🛋️", effet: "Les pauses font baisser le stress deux fois plus vite." },
  { id: "cafe_premium", nom: "Machine à café premium", prix: 900, piece: "cafe", icone: "☕", effet: "Les pauses récupèrent davantage de fatigue." },
  { id: "babyfoot", nom: "Baby-foot", prix: 1200, piece: "cafe", icone: "⚽", effet: "Moral en hausse… productivité un peu en baisse (–3 %)." },
  { id: "visio", nom: "Écran de visio", prix: 2000, piece: "reunion", icone: "🖥️", effet: "Réunions 40 % plus courtes." },
  { id: "mur_vegetal", nom: "Mur végétal", prix: 800, piece: "openspace", icone: "🌿", effet: "Moral de l'équipe légèrement en hausse." },
  { id: "imprimante", nom: "Scanner-imprimante pro", prix: 1800, piece: "openspace", icone: "🖨️", effet: "Collecte et saisie 8 % plus rapides." },
  { id: "clim", nom: "Climatisation", prix: 2500, piece: "openspace", icone: "❄️", effet: "Plus de stress dû à la chaleur en juillet-août." },
  { id: "assis_debout", nom: "Bureaux assis-debout", prix: 3000, piece: "openspace", icone: "🧍", effet: "La fatigue monte 15 % moins vite." },
  { id: "biblio", nom: "Bibliothèque technique", prix: 1500, piece: "archives", icone: "📚", effet: "Les collaborateurs progressent plus vite en compétence." },
];

export const article = (id: string) => BOUTIQUE.find((a) => a.id === id);

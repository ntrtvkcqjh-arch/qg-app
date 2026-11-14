// Tableau de bord vivant de chaque client : chiffre d'affaires, marge,
// trésorerie et délai de paiement de ses clients évoluent chaque mois.
// Des signaux faibles apparaissent : à toi de les repérer avant la crise.

import { jourDe } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { clamp, log, pick, rnd, uid } from "@/lib/moteur";
import { temps } from "@/lib/associe2080";
import type { Client, Etat } from "@/lib/types";

export type TypeSignal = "marge" | "treso" | "dso" | "ca";

export const INDICATEURS: { id: TypeSignal; nom: string; unite: string; bon: "haut" | "bas" }[] = [
  { id: "ca", nom: "Chiffre d'affaires", unite: "k€/mois", bon: "haut" },
  { id: "marge", nom: "Marge nette", unite: "%", bon: "haut" },
  { id: "treso", nom: "Trésorerie", unite: "k€", bon: "haut" },
  { id: "dso", nom: "Délai clients", unite: "jours", bon: "bas" },
];

const MISSION_SIGNAL: Record<TypeSignal, { titre: string; h: number; texte: string }> = {
  marge: { titre: "Stratégie de prix et analyse des marges", h: 5000, texte: "la marge s'érode depuis plusieurs mois" },
  treso: { titre: "Prévisionnel de trésorerie et plan de financement", h: 4500, texte: "la trésorerie fond" },
  dso: { titre: "Mise en place du recouvrement clients", h: 3500, texte: "ses propres clients paient de plus en plus tard" },
  ca: { titre: "Diagnostic commercial et plan de relance", h: 4000, texte: "le chiffre d'affaires recule" },
};

const suivi = (c: Client) => !c.mission;

function initialiser(c: Client) {
  const ca = Math.round(c.forfait * 0.035 * (0.85 + rnd() * 0.3));
  const marge = Math.round(8 + rnd() * 12);
  const treso = Math.round(ca * (0.8 + rnd() * 0.6));
  const dso = Math.round(35 + rnd() * 20);
  c.kpi = { ca: [], marge: [], treso: [], dso: [] };
  // 6 mois d'historique pour que les courbes aient du sens dès le départ.
  for (let i = 0; i < 6; i++) pousser(c, ca * (1 + (rnd() - 0.5) * 0.06), marge + (rnd() - 0.5), treso * (1 + (rnd() - 0.5) * 0.1), dso + (rnd() - 0.5) * 4);
}

function pousser(c: Client, ca: number, marge: number, treso: number, dso: number) {
  const k = c.kpi!;
  k.ca.push(Math.max(1, Math.round(ca)));
  k.marge.push(Math.round(marge * 10) / 10);
  k.treso.push(Math.round(treso));
  k.dso.push(Math.max(10, Math.round(dso)));
  for (const t of ["ca", "marge", "treso", "dso"] as const) if (k[t].length > 12) k[t].shift();
}

const dernier = (t: number[]) => t[t.length - 1];

/** Chaque début de mois : les indicateurs bougent, un signal faible peut naître. */
export function moisTableauxBord(e: Etat) {
  const jour = jourDe(e.minute);
  for (const c of e.clients.filter(suivi)) {
    if (!c.kpi) {
      initialiser(c);
      continue;
    }
    const k = c.kpi;
    let ca = dernier(k.ca) * (1 + (rnd() - 0.48) * 0.05);
    let marge = dernier(k.marge) + (rnd() - 0.5) * 0.8;
    let treso = dernier(k.treso) * (1 + (rnd() - 0.45) * 0.08);
    let dso = dernier(k.dso) + (rnd() - 0.5) * 3;
    const s = c.signal;
    if (s && !s.repere) {
      // Le signal faible s'aggrave tant que personne ne réagit.
      if (s.type === "marge") marge -= 1.4 + rnd();
      if (s.type === "treso") treso *= 0.72;
      if (s.type === "dso") dso += 7 + rnd() * 5;
      if (s.type === "ca") ca *= 0.93;
      if (s.type !== "treso" && rnd() < 0.5) treso *= 0.92;
    } else if ((c.redressement ?? 0) > 0) {
      // Après ton alerte, les indicateurs se redressent.
      c.redressement = (c.redressement ?? 1) - 1;
      marge += 0.8;
      treso *= 1.12;
      dso -= 4;
      ca *= 1.03;
    } else if (rnd() < 0.08) {
      c.signal = { type: pick(["marge", "treso", "dso", "ca"] as TypeSignal[]), depuis: jour };
    }
    pousser(c, ca, Math.max(-15, Math.min(35, marge)), Math.max(-50, treso), Math.min(120, dso));
  }
}

/** Équipe chaque client suivi d'un tableau de bord (au chargement et chaque jour). */
export function equiperTableaux(e: Etat) {
  for (const c of e.clients) if (suivi(c) && !c.kpi) initialiser(c);
}

/** Chaque jour : nouveaux clients équipés d'un tableau de bord ; un signal ignoré trop longtemps devient une crise. */
export function jourTableauxBord(e: Etat, jour: number) {
  equiperTableaux(e);
  for (const c of e.clients) {
    const s = c.signal;
    if (!s || s.repere || jour - s.depuis < 75) continue;
    c.signal = undefined;
    c.satisfaction = clamp(c.satisfaction - 12);
    e.compteurs.signauxRates = (e.compteurs.signauxRates ?? 0) + 1;
    messageSpecial(e, "cabinet", 4, `🆘 ${c.dirigeant} (${c.nom}) est en difficulté`, `« ${MISSION_SIGNAL[s.type].texte.charAt(0).toUpperCase() + MISSION_SIGNAL[s.type].texte.slice(1)} et personne au cabinet ne m'a alerté. Vous avez pourtant mes chiffres tous les mois ! » Le signal était visible dans son tableau de bord depuis plus de deux mois.`, `client:${c.id}|agent:`, {}, [
      { label: "Reconnaître le manque de suivi et proposer un plan d'urgence", cout: 0, effets: { satisfactionClient: 6 }, resultat: "Le client apprécie ta franchise, mais il s'en souviendra." },
      { label: "Rappeler que le conseil n'est pas dans la lettre de mission", cout: 0, effets: { satisfactionClient: -6 }, resultat: "Juridiquement exact, commercialement désastreux." },
    ]);
  }
}

/** Tu repères un signal et tu alertes le dirigeant. */
export function alerterDirigeant(e: Etat, clientId: string): string | null {
  const c = e.clients.find((x) => x.id === clientId);
  if (!c) return null;
  const jour = jourDe(e.minute);
  if ((c.alerte ?? -99) > jour - 20) return `Tu as déjà appelé ${c.dirigeant} il y a moins de 20 jours.`;
  c.alerte = jour;
  temps(e, "conseil", 0.5);
  const s = c.signal;
  if (!s || s.repere) {
    c.satisfaction = clamp(c.satisfaction - 3);
    log(e, `📞 Fausse alerte chez ${c.nom} : ${c.dirigeant} ne voit pas où est le problème. Regarde la tendance sur plusieurs mois, pas un seul chiffre.`, "mal");
    return null;
  }
  s.repere = true;
  c.redressement = 4;
  c.satisfaction = clamp(c.satisfaction + 8);
  e.reputation = clamp(e.reputation + 1);
  e.compteurs.signauxReperes = (e.compteurs.signauxReperes ?? 0) + 1;
  const m = MISSION_SIGNAL[s.type];
  const precoce = jour - s.depuis < 40;
  e.propositions.push({
    id: uid(e, "p"),
    origine: "client",
    clientId: c.id,
    nouveau: null,
    titre: `${c.nom} : ${m.titre.toLowerCase()}`,
    description: `Tu as repéré que ${m.texte}. ${c.dirigeant} te remercie${precoce ? " d'avoir vu venir le problème si tôt" : ""} et te demande de l'accompagner.`,
    missions: [{ type: "conseil", titre: `${m.titre} — ${c.nom}`, honoraires: Math.round((m.h * (precoce ? 1.2 : 1)) / 50) * 50, delai: 15 }],
    forfait: 0,
    difficulte: 2,
    risque: null,
    recue: jour,
    expire: jour + 10,
  });
  log(e, `🔎 Bien vu : ${m.texte} chez ${c.nom}. ${c.dirigeant} te confie une mission (voir Demandes).`, "bien");
  // Le signal disparaît une fois traité.
  c.signal = undefined;
  return null;
}

/** Tendance sur 3 mois, en % (ou en points pour la marge, en jours pour le délai). */
export function tendance(c: Client, t: TypeSignal): number {
  const v = c.kpi?.[t] ?? [];
  if (v.length < 4) return 0;
  const a = v[v.length - 4];
  const b = dernier(v);
  if (t === "marge" || t === "dso") return Math.round((b - a) * 10) / 10;
  return a ? Math.round(((b - a) / Math.abs(a)) * 100) : 0;
}

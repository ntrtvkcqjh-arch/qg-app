// Mode « associée 20/80 » : tu passes 20 % de ton temps en production et
// 80 % en conseil et management.
// - La revue de production est déléguée aux seniors et managers ; tu ne vois
//   que les dossiers à enjeu et quelques contrôles par sondage.
// - Chaque client est suivi par un manager (portefeuille).
// - Tu vends des missions de conseil, et tes managers te signalent des opportunités.
// - Tes indicateurs : répartition de ton temps et part du conseil dans le chiffre d'affaires.

import { dateDe, jourDe, minuteDuJour } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { lancerChaine } from "@/lib/chaines";
import { clamp, creerDossier, dire, log, pick, repartir, rnd, validerDossier } from "@/lib/moteur";
import { gradeDe } from "@/lib/vie3";
import type { Agent, Client, Dossier, Etat, OptionDilemme } from "@/lib/types";

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const METIERS = ["expertise", "fiscal", "social", "juridique", "audit"];
const presente = (a: Agent) => !["absent", "conge", "malade"].includes(a.activite);

// ---------- 1. ton temps ----------

export type Categorie = "prod" | "conseil" | "mgmt";

/** Ajoute du temps (en heures) à la catégorie de la semaine en cours. */
export function temps(e: Etat, cat: Categorie, h: number) {
  e.compteurs[`t_${cat}`] = (e.compteurs[`t_${cat}`] ?? 0) + h;
}

export function repartitionTemps(e: Etat, semaineDerniere = false) {
  const p = semaineDerniere ? "s_" : "t_";
  const prod = e.compteurs[`${p}prod`] ?? 0;
  const conseil = e.compteurs[`${p}conseil`] ?? 0;
  const mgmt = e.compteurs[`${p}mgmt`] ?? 0;
  const total = prod + conseil + mgmt;
  const pct = (x: number) => (total ? Math.round((x / total) * 100) : 0);
  return { prod: pct(prod), conseil: pct(conseil), mgmt: pct(mgmt), heures: Math.round(total) };
}

/** Lundi : bilan de la semaine écoulée, bonus si l'objectif 20/80 est tenu. */
function bilanSemaine(e: Etat) {
  const r = repartitionTemps(e);
  if (r.heures >= 6) {
    if (r.prod <= 25) {
      e.compteurs.formeToi = clamp((e.compteurs.formeToi ?? 100) + 10);
      e.reputation = clamp(e.reputation + 1);
      e.compteurs.semaines2080 = (e.compteurs.semaines2080 ?? 0) + 1;
      log(e, `⚖️ Semaine d'associée réussie : ${r.prod} % de production, ${r.conseil} % de conseil, ${r.mgmt} % de management. Tu as tenu ton rôle de dirigeante !`, "bien");
    } else log(e, `⚖️ Semaine trop opérationnelle : ${r.prod} % de ton temps en production. Délègue davantage à tes managers.`, "mal");
  }
  for (const c of ["prod", "conseil", "mgmt"]) {
    e.compteurs[`s_${c}`] = e.compteurs[`t_${c}`] ?? 0;
    e.compteurs[`t_${c}`] = 0;
  }
}

// ---------- 2. délégation de la revue ----------

/** Dossier à enjeu : il remonte toujours à l'associée. */
export function aEnjeu(e: Etat, d: Dossier) {
  if (["audit", "juridique", "conseil"].includes(d.type)) return true;
  const c = e.clients.find((x) => x.id === d.client);
  return (d.type === "bilan" || d.type === "liasse") && !!c && (c.forfait >= 4500 || (c.taille ?? 1) >= 2);
}

/** Senior ou manager le mieux placé pour revoir un dossier. */
export function reviseur(e: Etat, d: Dossier): Agent | null {
  const poss = e.agents.filter((a) => METIERS.includes(a.filiere) && gradeDe(a) >= 3 && presente(a) && a.id !== d.agent);
  if (!poss.length) return null;
  const auteur = e.agents.find((a) => a.id === d.agent);
  return [...poss].sort((a, b) => Number(b.filiere === auteur?.filiere) - Number(a.filiere === auteur?.filiere) || b.competence - a.competence)[0];
}

const FAUTES = [
  "Charges constatées d'avance oubliées à la clôture.",
  "TVA déduite sur une dépense non déductible.",
  "Facture de l'exercice suivant comptabilisée dans l'exercice.",
  "Créance douteuse non dépréciée.",
  "Écart de rapprochement bancaire non justifié.",
  "Prime de fin d'année non provisionnée.",
];

/**
 * Oriente la validation d'un dossier en fin de révision : vers toi (dossier
 * à enjeu ou contrôle par sondage) ou vers un senior / manager.
 * Renvoie le motif si c'est toi qui valides, sinon null.
 */
export function orienterValidation(e: Etat, d: Dossier): "toi" | "enjeu" | "sondage" | null {
  if (e.compteurs.revueToutes) return "toi";
  if (aEnjeu(e, d)) return "enjeu";
  const jour = jourDe(e.minute);
  if (e.compteurs.sondageJour !== jour) {
    e.compteurs.sondageJour = jour;
    e.compteurs.sondages = 0;
  }
  if ((e.compteurs.sondages ?? 0) < 3 && rnd() < 0.3) {
    e.compteurs.sondages = (e.compteurs.sondages ?? 0) + 1;
    return "sondage";
  }
  const r = reviseur(e, d);
  if (!r) return "toi";
  // Revue déléguée : la qualité dépend du réviseur.
  validerDossier(e, d.id);
  r.fatigue = clamp(r.fatigue + 1.5);
  e.compteurs.revuesDeleguees = (e.compteurs.revuesDeleguees ?? 0) + 1;
  const risque = clamp((88 - r.competence) / 140, 0.02, 0.35) * (r.fatigue > 70 ? 1.4 : 1);
  if (rnd() < risque) {
    e.compteurs.erreursDeleguees = (e.compteurs.erreursDeleguees ?? 0) + 1;
    const c = e.clients.find((x) => x.id === d.client);
    e.risquesRC ??= [];
    e.risquesRC.push({ jour: jour + 60 + Math.floor(rnd() * 180), client: c?.nom ?? "un client", montant: Math.round((2000 + rnd() * 9000) / 100) * 100, faute: `${pick(FAUTES)} (revue déléguée à ${r.prenom})` });
  }
  if (rnd() < 0.15) dire(e, r, "Revue faite, je signe ✔", 25);
  return null;
}

// ---------- 3. portefeuilles par manager ----------

export const capacitePortefeuille = (a: Agent) => (a.filiere === "associe" ? 30 : gradeDe(a) >= 4 ? 20 : 12);

export function responsables(e: Etat) {
  return e.agents.filter((a) => (METIERS.includes(a.filiere) && gradeDe(a) >= 3) || a.filiere === "associe");
}

function assignerPortefeuilles(e: Etat) {
  const resp = responsables(e);
  if (!resp.length) return;
  const charge = new Map(resp.map((a) => [a.id, e.clients.filter((c) => c.manager === a.id).length]));
  for (const c of e.clients) {
    if (c.manager && charge.has(c.manager)) continue;
    const libre = [...resp].sort((a, b) => (charge.get(a.id)! / capacitePortefeuille(a)) - (charge.get(b.id)! / capacitePortefeuille(b)))[0];
    c.manager = libre.id;
    charge.set(libre.id, charge.get(libre.id)! + 1);
  }
}

export function changerManager(e: Etat, clientId: string, agentId: string): string | null {
  const c = e.clients.find((x) => x.id === clientId);
  const a = e.agents.find((x) => x.id === agentId);
  if (!c || !a) return null;
  c.manager = a.id;
  c.satisfaction = clamp(c.satisfaction - 2); // un changement d'interlocuteur se gère
  temps(e, "mgmt", 0.3);
  return null;
}

function moisPortefeuilles(e: Etat) {
  for (const a of responsables(e)) {
    const clients = e.clients.filter((c) => c.manager === a.id);
    const surcharge = clients.length > capacitePortefeuille(a);
    for (const c of clients) c.satisfaction = clamp(c.satisfaction + clamp((a.competence - 65) / 15 + (a.moral - 60) / 40, -3, 3) - (surcharge ? 2 : 0));
    if (surcharge) {
      a.stress = clamp(a.stress + 8);
      log(e, `📂 ${a.prenom} suit ${clients.length} clients (capacité ${capacitePortefeuille(a)}) : son portefeuille déborde.`, "mal");
    }
  }
}

/** Point individuel avec un manager : coaching, priorités, reconnaissance. */
export function pointIndividuel(e: Etat, agentId: string): string | null {
  const a = e.agents.find((x) => x.id === agentId);
  if (!a) return null;
  const jour = jourDe(e.minute);
  if ((e.compteurs[`oneone:${a.id}`] ?? -99) > jour - 10) return `Tu as déjà fait un point avec ${a.prenom} il y a moins de 10 jours.`;
  e.compteurs[`oneone:${a.id}`] = jour;
  a.moral = clamp(a.moral + 8);
  a.confiance = clamp(a.confiance + 6);
  a.stress = clamp(a.stress - 6);
  a.competence = clamp(a.competence + 0.6, 0, 95);
  temps(e, "mgmt", 1);
  dire(e, a, "Merci pour ce point, j'y vois plus clair !", 40);
  log(e, `🗣️ Point individuel avec ${a.prenom} : priorités clarifiées, moral en hausse.`, "bien");
  return null;
}

// ---------- 4. vente de conseil ----------

export const MISSIONS_CONSEIL = [
  { nom: "Prévisionnel et dossier bancaire", honoraires: 2400, chaine: null },
  { nom: "Optimisation de la rémunération du dirigeant", honoraires: 1800, chaine: null },
  { nom: "Tableau de bord mensuel", honoraires: 2000, chaine: null },
  { nom: "Évaluation de l'entreprise", honoraires: 6000, chaine: "evaluation" },
  { nom: "Montage d'une holding", honoraires: 5000, chaine: "holding" },
  { nom: "Préparation de la transmission", honoraires: 7000, chaine: "transmission" },
  { nom: "Implantation à l'international", honoraires: 6500, chaine: "international" },
  { nom: "Audit social et contrats de travail", honoraires: 1500, chaine: "contrat" },
] as const;

export function chanceVente(e: Etat, c: Client, premium: boolean) {
  const tarif = (e.compteurs.tarif ?? 100) / 100;
  return clamp(0.25 + c.satisfaction / 250 + ((c.taille ?? 1) - 1) * 0.08 + (c.manager ? 0.05 : 0) - (premium ? 0.15 : 0) - (tarif - 1) * 0.5, 0.05, 0.9);
}

export function proposerMission(e: Etat, clientId: string, idx: number, premium: boolean): string | null {
  const c = e.clients.find((x) => x.id === clientId);
  const m = MISSIONS_CONSEIL[idx];
  if (!c || !m) return null;
  const jour = jourDe(e.minute);
  if ((e.compteurs[`vente:${c.id}`] ?? -99) > jour - 30) return `${c.nom} a déjà reçu une proposition ce mois-ci.`;
  e.compteurs[`vente:${c.id}`] = jour;
  temps(e, "conseil", 1);
  const honoraires = Math.round((m.honoraires * (premium ? 1.3 : 1)) / 50) * 50;
  if (rnd() < chanceVente(e, c, premium)) {
    if (m.chaine && !lancerChaine(e, m.chaine, { client: c.id })) {
      // mission experte en étapes : honoraires réglés à la fin du cas
    } else {
      const d = creerDossier(e, c, "conseil", jour + 15, jour, `${m.nom} — ${c.nom}`);
      d.honoraires = honoraires;
      repartir(e);
    }
    e.compteurs.ventesConseil = (e.compteurs.ventesConseil ?? 0) + 1;
    c.historique = [{ jour, texte: `Mission de conseil signée : ${m.nom} (${euros(honoraires)}).` }, ...(c.historique ?? [])].slice(0, 30);
    log(e, `🤝 ${c.dirigeant} signe : ${m.nom} pour ${euros(honoraires)} !`, "bien");
  } else {
    if (premium) c.satisfaction = clamp(c.satisfaction - 2);
    log(e, `🤝 ${c.dirigeant} décline ta proposition (${m.nom}) pour le moment.`, "neutre");
  }
  return null;
}

/** Chaque mois, tes managers repèrent des opportunités de conseil. */
function opportunites(e: Etat) {
  const cibles = e.clients.filter((c) => c.satisfaction > 55 && (e.compteurs[`vente:${c.id}`] ?? -99) < jourDe(e.minute) - 30);
  for (let k = 0; k < 2 && cibles.length; k++) {
    const c = cibles.splice(Math.floor(rnd() * cibles.length), 1)[0];
    const idx = (c.taille ?? 1) >= 2 ? pick([3, 4, 5, 6]) : pick([0, 1, 2, 7]);
    const m = MISSIONS_CONSEIL[idx];
    const resp = e.agents.find((a) => a.id === c.manager);
    const raisons = [`${c.nom} veut investir et doit convaincre sa banque`, `${c.dirigeant} se paie mal et paie trop d'impôts`, `${c.nom} pilote à l'aveugle, sans indicateurs mensuels`, `${c.nom} a beaucoup grandi`, `${c.dirigeant} réfléchit à sa stratégie patrimoniale`, `${c.dirigeant} pense à sa retraite`, `${c.nom} a des clients à l'étranger`, `${c.nom} embauche beaucoup`];
    messageSpecial(e, resp?.id ?? "cabinet", 3, `💡 Opportunité de conseil : ${c.nom}`, `${resp ? `${resp.prenom}, qui suit ce client : ` : ""}« ${raisons[idx]}. On pourrait lui proposer : ${m.nom} (environ ${euros(m.honoraires)}). » Chance de signature estimée : ${Math.round(chanceVente(e, c, false) * 100)} %.`, `client:${c.id}|agent:${resp?.id ?? ""}`, {}, [
      { label: `Proposer la mission (${euros(m.honoraires)})`, cout: 0, effets: {}, resultat: "Proposition envoyée.", action: "vie", code: `opp:${c.id}:${idx}:0` } as OptionDilemme,
      { label: `Proposer une version premium (${euros(m.honoraires * 1.3)}, plus risqué)`, cout: 0, effets: {}, resultat: "Proposition envoyée.", action: "vie", code: `opp:${c.id}:${idx}:1` } as OptionDilemme,
      { label: "Pas maintenant", cout: 0, effets: {}, resultat: "On en reparlera.", action: "vie", code: "opp:non" } as OptionDilemme,
    ]);
  }
}

// ---------- 5. chiffre d'affaires : conseil ou production ----------

export function noterCa(e: Etat, d: Dossier) {
  const cle = ["conseil", "juridique", "audit"].includes(d.type) ? "caConseilMois" : "caProdMois";
  e.compteurs[cle] = (e.compteurs[cle] ?? 0) + d.honoraires;
}

export function partConseil(e: Etat, moisDernier = true) {
  const c = e.compteurs[moisDernier ? "caConseilDernier" : "caConseilMois"] ?? 0;
  const p = e.compteurs[moisDernier ? "caProdDernier" : "caProdMois"] ?? 0;
  return { conseil: c, production: p, pct: c + p ? Math.round((c / (c + p)) * 100) : 0 };
}

function moisCa(e: Etat) {
  const forfaits = e.clients.reduce((s, c) => s + c.forfait, 0);
  e.compteurs.caProdDernier = (e.compteurs.caProdMois ?? 0) + forfaits;
  e.compteurs.caConseilDernier = e.compteurs.caConseilMois ?? 0;
  e.compteurs.caProdMois = 0;
  e.compteurs.caConseilMois = 0;
}

// ---------- hooks ----------

export function debutJournee2080(e: Etat, jour: number, premierDuMois: boolean) {
  assignerPortefeuilles(e);
  if (dateDe(jour).getUTCDay() === 1) bilanSemaine(e);
  // Ta journée d'agenda est comptée par type de créneau.
  if (premierDuMois && jour > 0) {
    moisPortefeuilles(e);
    moisCa(e);
    opportunites(e);
  }
}

/** Chaque quart d'heure : le temps que tu passes toi-même sur un dossier. */
export function quart2080(e: Etat) {
  const m = minuteDuJour(e.minute);
  if (e.travailToi && m >= 9 * 60 && m < 18 * 60) temps(e, "prod", 0.25);
}

export function actionOpportunite(e: Etat, code: string): boolean {
  const [type, cid, idx, premium] = code.split(":");
  if (type !== "opp") return false;
  if (cid === "non") return true;
  proposerMission(e, cid, Number(idx), premium === "1");
  return true;
}

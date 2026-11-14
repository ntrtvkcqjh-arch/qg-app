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
import { jourTableauxBord, moisTableauxBord } from "@/lib/tableauBord";
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
  { nom: "Prévisionnel et dossier bancaire", honoraires: 4500, chaine: null },
  { nom: "Optimisation de la rémunération du dirigeant", honoraires: 3500, chaine: null },
  { nom: "Mise en place du contrôle de gestion", honoraires: 6000, chaine: null },
  { nom: "Évaluation de l'entreprise", honoraires: 12000, chaine: "evaluation" },
  { nom: "Montage d'une holding", honoraires: 9000, chaine: "holding" },
  { nom: "Préparation de la transmission", honoraires: 15000, chaine: "transmission" },
  { nom: "Implantation à l'international", honoraires: 12000, chaine: "international" },
  { nom: "Audit social et contrats de travail", honoraires: 3000, chaine: "contrat" },
  { nom: "Stratégie de prix et de marges", honoraires: 5000, chaine: null },
  { nom: "Accompagnement à la levée de fonds", honoraires: 18000, chaine: null },
  { nom: "Restructuration financière", honoraires: 14000, chaine: "procedure" },
  { nom: "Diagnostic RSE et préparation au reporting de durabilité", honoraires: 8000, chaine: null },
  { nom: "Pacte d'associés et gouvernance", honoraires: 4000, chaine: null },
] as const;

/** Abonnements de conseil : honoraires récurrents, en plus du forfait de production. */
export const ABONNEMENTS = [
  { nom: "Pilotage", prix: 700, detail: "Tableau de bord mensuel et point trimestriel avec le dirigeant." },
  { nom: "Stratégie", prix: 1800, detail: "Pilotage + prévisionnel annuel + comité stratégique trimestriel." },
  { nom: "Direction financière externalisée", prix: 4000, detail: "Directeur financier à temps partagé : trésorerie, banques, reporting, investisseurs." },
] as const;

export function chanceAbonnement(e: Etat, c: Client, idx: number) {
  const tarif = (e.compteurs.tarif ?? 100) / 100;
  const taille = c.taille ?? 1;
  return clamp(0.2 + c.satisfaction / 200 + (taille - 1) * 0.12 + (c.manager ? 0.05 : 0) - idx * 0.12 + (idx === 2 && taille < 2 ? -0.2 : 0) - (tarif - 1) * 0.5, 0.05, 0.85);
}

export function proposerAbonnement(e: Etat, clientId: string, idx: number): string | null {
  const c = e.clients.find((x) => x.id === clientId);
  const a = ABONNEMENTS[idx];
  if (!c || !a) return null;
  if (c.mission === "cac") return `Impossible : tu es commissaire aux comptes de ${c.nom}. L'indépendance interdit de lui vendre du conseil.`;
  const jour = jourDe(e.minute);
  if ((c.abonnement ?? 0) > idx) return `${c.nom} a déjà un abonnement de niveau supérieur.`;
  if ((e.compteurs[`abo:${c.id}`] ?? -99) > jour - 30) return `${c.nom} a déjà reçu une proposition d'abonnement ce mois-ci.`;
  e.compteurs[`abo:${c.id}`] = jour;
  temps(e, "conseil", 1);
  if (rnd() < chanceAbonnement(e, c, idx)) {
    c.abonnement = idx + 1;
    c.satisfaction = clamp(c.satisfaction + 5);
    c.historique = [{ jour, texte: `Abonnement de conseil « ${a.nom} » signé (${euros(a.prix)} par mois).` }, ...(c.historique ?? [])].slice(0, 30);
    log(e, `📈 ${c.dirigeant} souscrit l'abonnement de conseil « ${a.nom} » : ${euros(a.prix)} de plus chaque mois.`, "bien");
  } else log(e, `📈 ${c.dirigeant} n'est pas prêt·e pour l'abonnement « ${a.nom} ».`, "neutre");
  return null;
}

function moisAbonnements(e: Etat) {
  let total = 0;
  for (const c of e.clients) {
    if (!c.abonnement) continue;
    if (c.satisfaction < 30 && rnd() < 0.35) {
      log(e, `📉 ${c.nom} résilie son abonnement de conseil : satisfaction trop basse.`, "mal");
      c.abonnement = 0;
      continue;
    }
    const prix = ABONNEMENTS[c.abonnement - 1].prix;
    total += prix;
    c.satisfaction = clamp(c.satisfaction + 1.5);
    temps(e, "conseil", 0.25 * c.abonnement);
  }
  if (total) {
    e.tresorerie += total;
    e.periode.ca += total;
    e.compteurs.caConseilMois = (e.compteurs.caConseilMois ?? 0) + total;
  }
}

// ---------- comités stratégiques ----------

const SITUATIONS: { titre: string; texte: string; options: [string, number][] }[] = [
  { titre: "Trésorerie tendue", texte: "Le dirigeant s'inquiète : trésorerie au plus bas alors que l'activité progresse. Le BFR a explosé (clients à 75 jours).", options: [["Réduire le BFR : relances systématiques, acomptes à la commande, affacturage sur les gros clients", 2], ["Souscrire un prêt de 5 ans pour combler le trou", 0], ["Baisser les prix pour vendre plus", -1]] },
  { titre: "Croissance rapide", texte: "Le chiffre d'affaires double, mais la marge baisse et l'équipe est débordée.", options: [["Prévisionnel à 18 mois, plan de recrutement financé et suivi mensuel de la marge par activité", 2], ["Accepter toutes les commandes sans rien changer", -1], ["Geler la croissance", 0]] },
  { titre: "Marges en baisse", texte: "Les matières premières ont augmenté de 12 % et les prix de vente n'ont pas bougé.", options: [["Analyser la marge par produit, revaloriser les prix ciblés et renégocier les achats", 2], ["Augmenter tous les prix de 12 % d'un coup", 0], ["Ne rien faire, ça va passer", -2]] },
  { titre: "Investissement", texte: "Le dirigeant veut acheter une machine de 300 000 € qui doit faire gagner 20 % de productivité.", options: [["Étudier la rentabilité (VAN, délai de récupération), comparer crédit-bail et emprunt, vérifier les aides", 2], ["L'acheter comptant sur la trésorerie", -1], ["Attendre deux ans", 0]] },
  { titre: "Dépendance client", texte: "Un seul client représente 45 % du chiffre d'affaires.", options: [["Plan commercial de diversification avec un objectif de 25 % maximum par client en 2 ans", 2], ["Signer un contrat d'exclusivité avec ce client", -1], ["Ignorer, tant qu'il paie", -1]] },
  { titre: "Rémunération du dirigeant", texte: "Le dirigeant se verse un petit salaire et beaucoup de dividendes ; il n'a presque pas de droits à la retraite.", options: [["Simulation globale salaire / dividendes / épargne retraite selon son statut et ses objectifs", 2], ["Tout en dividendes, c'est moins taxé", -1], ["Tout en salaire", 0]] },
  { titre: "Succession", texte: "Le dirigeant a 60 ans et aucun successeur identifié.", options: [["Démarrer maintenant : diagnostic de transmissibilité, évaluation, pistes familiale, interne et externe", 2], ["On verra à 65 ans", -1], ["Vendre au premier acheteur", -1]] },
  { titre: "Levée de fonds", texte: "Une start-up cliente veut lever 2 M€ auprès d'investisseurs.", options: [["Business plan solide, data room prête, valorisation argumentée et pacte d'associés préparé", 2], ["Envoyer le bilan à des investisseurs au hasard", -1], ["Accepter la première offre", -1]] },
];

function comitesStrategiques(e: Etat) {
  const abonnes = e.clients.filter((c) => (c.abonnement ?? 0) >= 2 && c.mission !== "cac");
  for (const c of abonnes.sort(() => rnd() - 0.5).slice(0, 2)) {
    const s = pick(SITUATIONS);
    const ordre = s.options.map((_, i) => i).sort(() => rnd() - 0.5);
    messageSpecial(e, c.manager ?? "cabinet", 3, `📈 Comité stratégique avec ${c.dirigeant} (${c.nom}) — ${s.titre}`, `${s.texte} Quelle recommandation portes-tu ?`, `client:${c.id}|agent:`, {}, ordre.map((i) => ({ label: s.options[i][0], cout: 0, effets: {}, resultat: "Recommandation présentée.", action: "vie", code: `comite:${c.id}:${s.options[i][1]}` }) as OptionDilemme));
  }
}

export function actionComite(e: Etat, code: string): boolean {
  const [type, cid, score] = code.split(":");
  if (type !== "comite") return false;
  const c = e.clients.find((x) => x.id === cid);
  const n = Number(score);
  temps(e, "conseil", 1.5);
  if (c) {
    c.satisfaction = clamp(c.satisfaction + (n >= 2 ? 8 : n >= 0 ? 1 : -6));
    if (n >= 2 && rnd() < 0.35) {
      e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 1;
      log(e, `🗣️ Ravi de ta recommandation, ${c.dirigeant} recommande le cabinet à deux chefs d'entreprise de son réseau.`, "bien");
    }
    if (n >= 2) e.niveauDec = clamp(e.niveauDec + 1);
  }
  return true;
}

export function chanceVente(e: Etat, c: Client, premium: boolean) {
  const tarif = (e.compteurs.tarif ?? 100) / 100;
  return clamp(0.25 + c.satisfaction / 250 + ((c.taille ?? 1) - 1) * 0.08 + (c.manager ? 0.05 : 0) - (premium ? 0.15 : 0) - (tarif - 1) * 0.5, 0.05, 0.9);
}

export function proposerMission(e: Etat, clientId: string, idx: number, premium: boolean): string | null {
  const c = e.clients.find((x) => x.id === clientId);
  const m = MISSIONS_CONSEIL[idx];
  if (!c || !m) return null;
  if (c.mission === "cac") return `Impossible : tu es commissaire aux comptes de ${c.nom}. L'indépendance interdit de lui vendre du conseil.`;
  const jour = jourDe(e.minute);
  if ((e.compteurs[`vente:${c.id}`] ?? -99) > jour - 30) return `${c.nom} a déjà reçu une proposition ce mois-ci.`;
  e.compteurs[`vente:${c.id}`] = jour;
  temps(e, "conseil", 1);
  const honoraires = Math.round((m.honoraires * (premium ? 1.3 : 1)) / 50) * 50;
  if (rnd() < chanceVente(e, c, premium)) {
    if (m.chaine && !lancerChaine(e, m.chaine, { client: c.id, montant: honoraires })) {
      // Mission experte en étapes : les honoraires sont versés à la fin du cas.
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
  const cibles = e.clients.filter((c) => c.mission !== "cac" && c.satisfaction > 55 && (e.compteurs[`vente:${c.id}`] ?? -99) < jourDe(e.minute) - 30);
  for (let k = 0; k < 4 && cibles.length; k++) {
    const c = cibles.splice(Math.floor(rnd() * cibles.length), 1)[0];
    const idx = (c.taille ?? 1) >= 2 ? pick([3, 4, 5, 6, 9, 10, 11]) : pick([0, 1, 2, 7, 8, 12]);
    const m = MISSIONS_CONSEIL[idx];
    const resp = e.agents.find((a) => a.id === c.manager);
    const raisons = [`${c.nom} veut investir et doit convaincre sa banque`, `${c.dirigeant} se paie mal et paie trop d'impôts`, `${c.nom} pilote à l'aveugle, sans contrôle de gestion`, `${c.nom} a beaucoup grandi`, `${c.dirigeant} réfléchit à sa stratégie patrimoniale`, `${c.dirigeant} pense à sa retraite`, `${c.nom} a des clients à l'étranger`, `${c.nom} embauche beaucoup`, `les marges de ${c.nom} fondent`, `${c.nom} cherche des investisseurs`, `${c.nom} accumule les dettes`, `les clients de ${c.nom} demandent sa démarche RSE`, `les associés de ${c.nom} ne sont pas d'accord sur la stratégie`];
    messageSpecial(e, resp?.id ?? "cabinet", 3, `💡 Opportunité de conseil : ${c.nom}`, `${resp ? `${resp.prenom}, qui suit ce client : ` : ""}« ${raisons[idx]}. On pourrait lui proposer : ${m.nom} (environ ${euros(m.honoraires)}). » Chance de signature estimée : ${Math.round(chanceVente(e, c, false) * 100)} %.`, `client:${c.id}|agent:${resp?.id ?? ""}`, {}, [
      { label: `Proposer la mission (${euros(m.honoraires)})`, cout: 0, effets: {}, resultat: "Proposition envoyée.", action: "vie", code: `opp:${c.id}:${idx}:0` } as OptionDilemme,
      { label: `Proposer une version premium (${euros(m.honoraires * 1.3)}, plus risqué)`, cout: 0, effets: {}, resultat: "Proposition envoyée.", action: "vie", code: `opp:${c.id}:${idx}:1` } as OptionDilemme,
      { label: "Pas maintenant", cout: 0, effets: {}, resultat: "On en reparlera.", action: "vie", code: "opp:non" } as OptionDilemme,
    ]);
  }
}

// ---------- 5. chiffre d'affaires : conseil ou production ----------

export function noterCa(e: Etat, d: Dossier) {
  const conseil = ["conseil", "juridique", "audit"].includes(d.type);
  const cle = conseil ? "caConseilMois" : "caProdMois";
  e.compteurs[cle] = (e.compteurs[cle] ?? 0) + d.honoraires;
  if (d.type === "conseil") {
    const c = e.clients.find((x) => x.id === d.client);
    if (c && c.satisfaction > 65 && rnd() < 0.3) {
      e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 1;
      log(e, `🗣️ Bouche-à-oreille : ${c.dirigeant} parle de votre mission de conseil autour de lui.`, "bien");
    }
  }
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
  jourTableauxBord(e, jour);
  // Ta journée d'agenda est comptée par type de créneau.
  if (premierDuMois && jour > 0) {
    moisPortefeuilles(e);
    moisCa(e);
    moisAbonnements(e);
    moisTableauxBord(e);
    opportunites(e);
    comitesStrategiques(e);
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

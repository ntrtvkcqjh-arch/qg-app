// Moteur de simulation de Cabinet EZ. Fonctions pures qui modifient en place
// une copie de l'état. Aucun appel réseau : tout est calculé ici.

import {
  DEBUT_JOURNEE,
  FIN_JOURNEE,
  MINUTES_PAR_JOUR,
  dateCourte,
  estOuvre,
  jourDe,
  jourDeLaDate,
  joursOuvresEntre,
  minuteDuJour,
  moisDe,
  anneeDe,
  ouvreOuApres,
  prochainJourOuvre,
  dateDe,
} from "@/lib/calendrier";
import { CLIENTS_CREATION, CLIENTS_INITIAUX, CHEVEUX, COULEURS, EQUIPE_INITIALE, NOMS, PEAUX, PERSONNALITES, POSTES as POSTES_RH, PRENOMS, RELATIONS_INITIALES } from "@/lib/data/equipe";
import { DILEMMES } from "@/lib/data/dilemmes";
import { BADGES } from "@/lib/data/formation";
import { MODELES } from "@/lib/data/messages";
import { MAX_POSTES } from "@/lib/plan";
import type { Agent, BilanPeriode, Candidat, Client, Difficulte, Dossier, Effets, Etat, Filiere, Journal, Message, ModeDepart, Niveau, TypeMission } from "@/lib/types";

// ---------- réglages ----------

export const REGLAGES: Record<Difficulte, { pa: number; evenements: number; vitesse: number; penalites: number; tresorerie: number }> = {
  facile: { pa: 4, evenements: 0.7, vitesse: 1.15, penalites: 0.7, tresorerie: 40000 },
  normal: { pa: 3, evenements: 1, vitesse: 1, penalites: 1, tresorerie: 25000 },
  expert: { pa: 3, evenements: 1.4, vitesse: 0.9, penalites: 1.4, tresorerie: 15000 },
};

const VITESSE_TYPE: Record<TypeMission, number> = { tva: 3.2, paie: 4, bilan: 0.4, liasse: 0.8, juridique: 1.6, conseil: 1.2 };
const FILIERES_TYPE: Record<TypeMission, string[]> = {
  tva: ["fiscal", "expertise"],
  paie: ["social"],
  bilan: ["expertise", "fiscal"],
  liasse: ["fiscal", "expertise"],
  juridique: ["juridique"],
  conseil: ["fiscal", "juridique", "expertise"],
};
const LOYER = 3500;
const CHARGES_FIXES = 600;

export const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const rnd = () => Math.random();
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}
const uid = (e: Etat, p: string) => `${p}${++e.seq}`;
export const jourActuel = (e: Etat) => jourDe(e.minute);

// ---------- création ----------

function nouvellePeriode(jour: number): BilanPeriode {
  return { label: `Semaine du ${dateCourte(jour)}`, debut: jour, ca: 0, charges: 0, livres: 0, echeancesGagnees: 0, echeancesPerdues: 0, moral: 0, qcm: null };
}

export function nouvellePartie(difficulte: Difficulte, nomCabinet: string, mode: ModeDepart = "reprise"): Etat {
  const r = REGLAGES[difficulte];
  const creation = mode === "creation";
  const e: Etat = {
    version: 1,
    nomCabinet,
    difficulte,
    mode,
    loyer: creation ? 1200 : LOYER,
    travailToi: null,
    minute: DEBUT_JOURNEE,
    vitesse: 1,
    pa: r.pa,
    paMax: r.pa,
    gratuitsUtilises: 0,
    tresorerie: creation ? Math.round(r.tresorerie * 0.8) : r.tresorerie,
    reputation: creation ? 40 : 60,
    moodGlobal: 62,
    niveauDec: 20,
    agents: (creation ? [] : EQUIPE_INITIALE).map((a) => ({
      ...a,
      stress: 25 + Math.round(rnd() * 15),
      fatigue: 15 + Math.round(rnd() * 15),
      moral: 60 + Math.round(rnd() * 15),
      activite: "absent",
      activiteJusqua: 0,
      absentJusquau: 0,
      embauche: -200,
      bulle: null,
      bulleJusqua: 0,
    })),
    anciens: [],
    relations: creation ? [] : RELATIONS_INITIALES.map((x) => ({ ...x })),
    clients: CLIENTS_INITIAUX.filter((c) => !creation || CLIENTS_CREATION.includes(c.id)).map((c) => ({ ...c })),
    dossiers: [],
    messages: [],
    differes: [],
    echeances: [],
    journal: [],
    badges: [],
    candidats: [],
    bilans: [],
    periode: nouvellePeriode(0),
    qcm: [],
    oraux: [],
    qcmDisponible: true,
    bossActif: null,
    absence: null,
    derniereVisite: Date.now(),
    compteurs: {},
    seq: 0,
  };

  // Échéances de l'année : TVA (24), DSN (15), liasse, approbation des comptes.
  for (let i = 0; i < 12; i++) {
    const mois = ((2 + i) % 12) + 1;
    const annee = 2026 + Math.floor((2 + i) / 12);
    e.echeances.push({ id: `tva-${annee}-${mois}`, nom: `TVA de ${nomMois(mois)}`, type: "tva", jour: ouvreOuApres(jourDeLaDate(annee, mois, 24)), annoncee: false, resolue: false });
    e.echeances.push({ id: `dsn-${annee}-${mois}`, nom: `DSN de ${nomMois(mois)}`, type: "paie", jour: ouvreOuApres(jourDeLaDate(annee, mois, 15)), annoncee: false, resolue: false });
  }
  e.echeances.push({ id: "liasse-2026", nom: "Liasse fiscale IS", type: "bilan", jour: ouvreOuApres(jourDeLaDate(2026, 5, 20)), annoncee: false, resolue: false });
  e.echeances.push({ id: "ag-2026", nom: "Approbation des comptes", type: "juridique", jour: ouvreOuApres(jourDeLaDate(2026, 6, 30)), annoncee: false, resolue: false });
  e.echeances.sort((a, b) => a.jour - b.jour);

  // Bilans 2025 de tous les clients, déjà plus ou moins avancés.
  const liasse = e.echeances.find((x) => x.id === "liasse-2026")!.jour;
  const avance: [number, number][] = [[2, 40], [1, 70], [1, 20], [2, 10], [1, 0], [3, 30], [1, 50], [1, 0], [2, 60], [1, 10]];
  e.clients.forEach((c, i) => {
    const d = creerDossier(e, c, "bilan", liasse, 0);
    d.phase = avance[i][0] as Dossier["phase"];
    d.progression = avance[i][1];
  });
  dossiersDuMois(e, 0);
  repartir(e);
  e.candidats = creation ? candidatsDeDepart(e) : genererCandidats(e);
  log(e, `Bienvenue chez ${nomCabinet} ! Saison des bilans : la liasse fiscale tombe le ${dateCourte(liasse)}.`, "neutre");
  if (creation)
    log(e, "Tu démarres seule avec trois petits clients. Tu traites les dossiers toi-même depuis ton bureau ; recrute au fur et à mesure que la charge augmente.", "neutre");
  return e;
}

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const nomMois = (m: number) => MOIS[m - 1];

function honorairesPour(type: TypeMission, c: Client): number {
  const base = { tva: 250, paie: 350, bilan: 1500 + c.forfait * 0.8, liasse: 800, juridique: 700, conseil: 1800 }[type];
  return Math.round(base / 50) * 50;
}

function creerDossier(e: Etat, c: Client, type: TypeMission, echeance: number, jour: number, titre?: string): Dossier {
  const noms: Record<TypeMission, string> = { tva: "TVA", paie: "Paie", bilan: "Bilan 2025", liasse: "Liasse", juridique: "AG d'approbation", conseil: "Mission de conseil" };
  const d: Dossier = {
    id: uid(e, "d"),
    client: c.id,
    titre: titre ?? `${noms[type]} — ${c.nom}`,
    type,
    phase: 1,
    progression: 0,
    agent: null,
    echeance,
    honoraires: honorairesPour(type, c),
    difficulte: type === "bilan" ? 2 + (hash(c.id) % 3) : 1 + (hash(c.id + type) % 2),
    bloque: null,
    cree: jour,
    livre: null,
  };
  e.dossiers.push(d);
  return d;
}

function dossiersDuMois(e: Etat, jour: number) {
  const m = moisDe(jour);
  const a = anneeDe(jour);
  for (const c of e.clients) {
    if (c.tvaMensuelle) creerDossier(e, c, "tva", ouvreOuApres(jourDeLaDate(a, m, 24)), jour, `TVA ${nomMois(m)} — ${c.nom}`);
    if (c.paie) creerDossier(e, c, "paie", ouvreOuApres(jourDeLaDate(a, m, 15)), jour, `Paie & DSN ${nomMois(m)} — ${c.nom}`);
  }
}

/** Les agents se répartissent seuls les dossiers sans responsable. */
export function repartir(e: Etat) {
  const libres = e.dossiers.filter((d) => !d.agent && d.phase < 5).sort((a, b) => a.echeance - b.echeance);
  for (const d of libres) {
    const candidats = e.agents.filter((a) => FILIERES_TYPE[d.type].includes(a.filiere));
    const pool = candidats.length ? candidats : e.agents.filter((a) => a.filiere !== "rh");
    if (!pool.length) continue; // personne : c'est toi qui le traites
    const charge = (a: Agent) => e.dossiers.filter((x) => x.agent === a.id && x.phase < 5).reduce((s, x) => s + (x.type === "bilan" ? 3 : 1), 0);
    pool.sort((a, b) => charge(a) - charge(b) || b.competence - a.competence);
    d.agent = pool[0].id;
  }
}

export const aUnRH = (e: Etat) => e.agents.some((a) => a.filiere === "rh");

function candidatPour(e: Etat, p: (typeof POSTES_RH)[number]): Candidat {
  const bonus = aUnRH(e) ? 6 : 0;
  return {
    id: uid(e, "c"),
    prenom: pick(PRENOMS),
    nom: pick(NOMS),
    poste: p.poste,
    filiere: p.filiere,
    personnalite: pick(PERSONNALITES),
    competence: Math.min(95, Math.round(p.comp[0] + rnd() * (p.comp[1] - p.comp[0])) + bonus),
    salaire: Math.round((p.salaire[0] + rnd() * (p.salaire[1] - p.salaire[0])) / 50) * 50,
  };
}

function candidatsDeDepart(e: Etat): Candidat[] {
  return ["Assistant comptable", "Gestionnaire de paie", "Collaborateur confirmé", "Responsable RH"].map((nom) => candidatPour(e, POSTES_RH.find((p) => p.poste === nom)!));
}

export function genererCandidats(e: Etat): Candidat[] {
  // On propose en priorité les métiers qui manquent au regard des dossiers.
  const manques = besoins(e).filter((b) => b.ratio > 1).map((b) => b.filiere);
  const n = aUnRH(e) ? 5 : 3;
  return Array.from({ length: n }, (_, i) => {
    const cible = manques[i] ? POSTES_RH.filter((p) => p.filiere === manques[i]) : [];
    return candidatPour(e, cible.length ? pick(cible) : pick(POSTES_RH));
  });
}

/** Charge de travail par métier, comparée à la capacité de l'équipe. */
export function besoins(e: Etat): { filiere: Filiere; charge: number; capacite: number; ratio: number }[] {
  const principal: Record<TypeMission, Filiere> = { tva: "fiscal", paie: "social", bilan: "expertise", liasse: "fiscal", juridique: "juridique", conseil: "fiscal" };
  const res = (["expertise", "fiscal", "social", "juridique"] as Filiere[]).map((f) => {
    const charge = e.dossiers.filter((d) => d.phase < 5 && principal[d.type] === f).reduce((s, d) => s + (d.type === "bilan" ? 3 : 1), 0);
    const capacite = e.agents.filter((a) => a.filiere === f || (f === "fiscal" && a.filiere === "expertise") || (f === "expertise" && a.filiere === "fiscal")).length * 5;
    return { filiere: f, charge, capacite, ratio: capacite ? charge / capacite : charge > 0 ? 9 : 0 };
  });
  return res;
}

// ---------- journal, messages, effets ----------

export function log(e: Etat, texte: string, ton: Journal["ton"] = "neutre") {
  const entree = { jour: jourDe(e.minute), minute: e.minute, texte, ton };
  e.journal.unshift(entree);
  if (e.journal.length > 200) e.journal.length = 200;
  if (e.absence) e.absence.evenements.push(entree);
}

const nomAgent = (e: Etat, id: string | null | undefined) => {
  const a = e.agents.find((x) => x.id === id);
  return a ? a.prenom : "quelqu'un";
};
const nomClient = (e: Etat, id: string | null | undefined) => e.clients.find((x) => x.id === id)?.nom ?? "un client";

function remplir(t: string, vars: Record<string, string>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

function envoyer(
  e: Etat,
  theme: string,
  de: string,
  vars: Record<string, string>,
  extra: Partial<Message> = {},
): Message | null {
  const m = MODELES[theme];
  if (!m) return null;
  const enAttente = e.messages.filter((x) => x.statut === "attente").length;
  if (enAttente >= 14 && m.niveau < 4) return null;
  const agent = e.agents.find((a) => a.id === de);
  const variantes = (agent && m.parPerso?.[agent.personnalite]) || m.textes;
  const jour = jourDe(e.minute);
  const niveau = (extra.niveau ?? m.niveau) as Niveau;
  const msg: Message = {
    id: uid(e, "m"),
    de,
    niveau,
    sujet: remplir(m.sujet, vars),
    texte: remplir(pick(variantes), vars),
    jour,
    minute: e.minute,
    lu: false,
    statut: niveau === 1 ? "info" : "attente",
    expire: ajouterJoursOuvres(jour, niveau >= 5 ? 1 : 3),
    theme,
    ...extra,
  };
  e.messages.unshift(msg);
  if (e.messages.length > 150) e.messages.length = 150;
  if (agent) dire(e, agent, niveau >= 4 ? "Il faut que je te parle…" : "Je t'ai écrit !");
  return msg;
}

function ajouterJoursOuvres(jour: number, n: number) {
  let j = jour;
  for (let i = 0; i < n; i++) j = prochainJourOuvre(j);
  return j;
}

function dire(e: Etat, a: Agent, texte: string, duree = 40) {
  a.bulle = texte;
  a.bulleJusqua = e.minute + duree;
}

function messageEnAttente(e: Etat, theme: string, de?: string, dossier?: string) {
  return e.messages.some((m) => m.statut === "attente" && m.theme === theme && (!de || m.de === de) && (!dossier || m.dossier === dossier));
}
function dernierMessage(e: Etat, theme: string, de?: string) {
  const m = e.messages.find((x) => x.theme === theme && (!de || x.de === de));
  return m ? m.jour : -999;
}

export function appliquerEffets(e: Etat, eff: Effets, ctx: { agent?: string; client?: string; dossier?: string }) {
  if (eff.tresorerie) {
    e.tresorerie += eff.tresorerie;
    if (eff.tresorerie > 0) e.periode.ca += eff.tresorerie;
    else e.periode.charges -= eff.tresorerie;
  }
  if (eff.reputation) e.reputation = clamp(e.reputation + eff.reputation);
  for (const a of e.agents) {
    if (eff.moralEquipe) a.moral = clamp(a.moral + eff.moralEquipe);
    if (eff.stressEquipe) a.stress = clamp(a.stress + eff.stressEquipe);
    if (eff.confianceEquipe) a.confiance = clamp(a.confiance + eff.confianceEquipe);
  }
  const ag = e.agents.find((a) => a.id === ctx.agent);
  if (ag) {
    if (eff.confianceAgent) ag.confiance = clamp(ag.confiance + eff.confianceAgent);
    if (eff.stressAgent) ag.stress = clamp(ag.stress + eff.stressAgent);
    if (eff.competenceAgent) ag.competence = clamp(ag.competence + eff.competenceAgent);
  }
  const cl = e.clients.find((c) => c.id === ctx.client);
  if (cl && eff.satisfactionClient) cl.satisfaction = clamp(cl.satisfaction + eff.satisfactionClient);
  const d = e.dossiers.find((x) => x.id === ctx.dossier);
  if (d && eff.progression) avancerDossier(e, d, eff.progression);
}

// ---------- coûts en PA ----------

export function coutMessage(e: Etat, niveau: Niveau): number {
  if (niveau <= 2) return e.gratuitsUtilises < 3 ? 0 : 1;
  if (niveau === 5) return 2;
  return 1;
}

function payer(e: Etat, cout: number, niveau?: Niveau): boolean {
  if (e.pa < cout) return false;
  e.pa -= cout;
  if (niveau && niveau <= 2 && cout === 0) e.gratuitsUtilises++;
  return true;
}

// ---------- dossiers ----------

function avancerDossier(e: Etat, d: Dossier, points: number) {
  let reste = points;
  while (reste > 0 && d.phase < 5) {
    if (d.phase === 3 && d.progression >= 100) return; // attend ta validation
    const besoin = 100 - d.progression;
    if (reste < besoin) {
      d.progression += reste;
      return;
    }
    reste -= besoin;
    d.progression = 100;
    finDePhase(e, d);
    if (d.phase === 3 && d.progression >= 100) return;
  }
}

function finDePhase(e: Etat, d: Dossier) {
  const ag = e.agents.find((a) => a.id === d.agent);
  if (d.phase < 3) {
    d.phase = (d.phase + 1) as Dossier["phase"];
    d.progression = 0;
    if (ag && rnd() < 0.3) dire(e, ag, d.phase === 2 ? "Collecte finie ✔" : "Saisie terminée ✔");
  } else if (d.phase === 3) {
    d.progression = 100;
    if (!ag) {
      // Tu as traité ce dossier toi-même : tu le valides directement.
      d.phase = 4;
      d.progression = 0;
      return;
    }
    if (!messageEnAttente(e, "revision", undefined, d.id) && ag) {
      envoyer(e, "revision", ag.id, { dossier: d.titre, client: nomClient(e, d.client) }, { dossier: d.id });
    }
  } else if (d.phase === 4) {
    livrer(e, d);
  }
}

export function validerDossier(e: Etat, id: string): boolean {
  const d = e.dossiers.find((x) => x.id === id);
  if (!d || d.phase !== 3 || d.progression < 100) return false;
  d.phase = 4;
  d.progression = 0;
  for (const m of e.messages) if (m.theme === "revision" && m.dossier === id && m.statut === "attente") m.statut = "repondu";
  const ag = e.agents.find((a) => a.id === d.agent);
  if (ag) {
    ag.confiance = clamp(ag.confiance + 1);
    dire(e, ag, "Validé, je finalise !");
  }
  return true;
}

function livrer(e: Etat, d: Dossier) {
  const jour = jourDe(e.minute);
  d.phase = 5;
  d.progression = 100;
  d.livre = jour;
  e.tresorerie += d.honoraires;
  e.periode.ca += d.honoraires;
  e.periode.livres++;
  inc(e, "livres");
  const c = e.clients.find((x) => x.id === d.client);
  if (c) c.satisfaction = clamp(c.satisfaction + (jour <= d.echeance ? 4 : -6));
  log(e, `📦 ${d.titre} livré par ${nomAgent(e, d.agent)} (+${d.honoraires.toLocaleString("fr-FR")} €).`, "bien");
  // Un bilan livré déclenche l'AG d'approbation des comptes.
  if (d.type === "bilan" && c) {
    const ag = e.echeances.find((x) => x.id === "ag-2026");
    if (ag && !ag.resolue) creerDossier(e, c, "juridique", ag.jour, jour);
    repartir(e);
  }
}

function inc(e: Etat, k: string, n = 1) {
  e.compteurs[k] = (e.compteurs[k] ?? 0) + n;
}

/** Travail restant (en points) avant qu'un dossier soit validé (phase 4). */
export function resteAvantValidation(d: Dossier): number {
  if (d.phase >= 4) return 0;
  return (3 - d.phase) * 100 + (100 - d.progression) + 40;
}

// ---------- horaires des agents ----------

function horaires(a: Agent, jour: number) {
  const h = hash(a.id + ":" + jour);
  const decal = { anxieux: -20, perfectionniste: -15, ambitieux: -10, loyal: -5, sociable: 0, rebelle: 10, nonchalant: 25 }[a.personnalite];
  const arrivee = 8 * 60 + 15 + (h % 45) + decal;
  const depart = 18 * 60 + ((h >> 4) % 75) + (a.personnalite === "ambitieux" || a.personnalite === "perfectionniste" ? 20 : 0) + (a.stress > 70 ? 15 : 0);
  const dejeuner = 12 * 60 + 15 + ((h >> 8) % 45);
  return { arrivee, depart: Math.min(depart, FIN_JOURNEE - 5), dejeuner };
}

// ---------- boucle ----------

/** Avance la simulation de `minutes` minutes de temps de travail. */
export function avancer(e: Etat, minutes: number) {
  for (let i = 0; i < minutes; i++) {
    e.minute++;
    const m = minuteDuJour(e.minute);
    if (m >= FIN_JOURNEE) {
      finJournee(e);
      const j = prochainJourOuvre(jourDe(e.minute));
      e.minute = j * 1440 + DEBUT_JOURNEE;
      debutJournee(e);
      continue;
    }
    if (m % 15 === 0) quart(e);
  }
}

function debutJournee(e: Etat) {
  const jour = jourDe(e.minute);
  const r = REGLAGES[e.difficulte];
  e.pa = e.paMax = r.pa;
  e.gratuitsUtilises = 0;
  const lundi = dateDe(jour).getUTCDay() === 1;

  for (const a of e.agents) {
    const nuit = lundi ? 15 : 9;
    a.fatigue = clamp(a.fatigue - nuit);
    a.stress = clamp(a.stress - (lundi ? 10 : 3));
    a.bulle = null;
    if ((a.activite === "conge" || a.activite === "malade") && jour >= a.absentJusquau) {
      log(e, `${a.prenom} est de retour ${a.activite === "conge" ? "de congés" : "après son arrêt maladie"}.`);
      a.activite = "absent";
    } else if (a.activite !== "conge" && a.activite !== "malade") {
      a.activite = "absent";
      a.activiteJusqua = 0;
    }
  }

  // Début de mois : salaires, loyer, forfaits, nouveaux dossiers.
  const premierOuvreDuMois = (() => {
    let j = jour - 1;
    while (j >= 0 && !estOuvre(j)) j--;
    return j < 0 || moisDe(j) !== moisDe(jour);
  })();
  if (premierOuvreDuMois && jour > 0) {
    const salaires = e.agents.reduce((s, a) => s + a.salaire * 1.45, 0);
    const charges = Math.round(salaires + (e.loyer ?? LOYER) + CHARGES_FIXES);
    const forfaits = e.clients.reduce((s, c) => s + Math.round(c.forfait * (c.satisfaction < 35 ? 0.6 : 1)), 0);
    e.tresorerie += forfaits - charges;
    e.periode.ca += forfaits;
    e.periode.charges += charges;
    log(e, `Début de mois : ${forfaits.toLocaleString("fr-FR")} € de forfaits encaissés, ${charges.toLocaleString("fr-FR")} € de salaires et charges payés.`, forfaits >= charges ? "bien" : "mal");
    dossiersDuMois(e, jour);
    repartir(e);
  }

  // Nouvelle semaine : bilan de la semaine passée, QCM, candidats.
  if (lundi && jour > 0) {
    e.periode.moral = Math.round(e.moodGlobal);
    e.bilans.unshift(e.periode);
    if (e.bilans.length > 60) e.bilans.length = 60;
    e.periode = nouvellePeriode(jour);
    e.qcmDisponible = true;
    e.candidats = genererCandidats(e);
  }

  // Conséquences différées.
  for (const c of e.differes.filter((x) => x.jour <= jour)) {
    appliquerEffets(e, c.effets, c);
    const negatif = Object.values(c.effets).some((v) => typeof v === "number" && v < 0) && !Object.values(c.effets).some((v) => typeof v === "number" && v > 0);
    log(e, `⏳ ${c.texte}`, negatif ? "mal" : "bien");
  }
  e.differes = e.differes.filter((x) => x.jour > jour);

  // Échéances : annonce 5 jours ouvrés avant, combat le jour J.
  for (const ec of e.echeances) {
    if (ec.resolue) continue;
    const dans = joursOuvresEntre(jour, ec.jour);
    if (!ec.annoncee && dans <= 5 && dans > 0) {
      ec.annoncee = true;
      const lies = dossiersEcheance(e, ec.id);
      const enRetard = lies.filter((d) => d.phase < 4).length;
      e.messages.unshift({
        id: uid(e, "m"),
        de: "cabinet",
        niveau: 4,
        sujet: `⚔️ Boss en approche : ${ec.nom} le ${dateCourte(ec.jour)}`,
        texte: `${lies.length} dossier(s) concerné(s), dont ${enRetard} pas encore validé(s). Le jour J, chaque dossier non validé entraîne une pénalité pour le client et pour ta réputation. Valide les révisions à temps !`,
        jour,
        minute: e.minute,
        lu: false,
        statut: "info",
        expire: ec.jour,
        theme: "echeance",
      });
    }
    if (ec.jour === jour) {
      const lies = dossiersEcheance(e, ec.id).filter((d) => d.phase < 4);
      if (!lies.length) {
        ec.resolue = true;
        ec.resultat = "victoire";
        e.periode.echeancesGagnees++;
        log(e, `🏆 ${ec.nom} : tous les dossiers étaient prêts. Victoire sans combat !`, "bien");
        gagnerBadgeEcheance(e, ec.type);
      } else {
        e.bossActif = ec.id;
        ec.pvMax = lies.reduce((s, d) => s + resteAvantValidation(d), 0);
        log(e, `⚔️ Jour de Boss Fight : ${ec.nom}. ${lies.length} dossier(s) à valider avant 19h30.`, "mal");
      }
    }
  }
  verifierBadges(e);
}

export function dossiersEcheance(e: Etat, echeanceId: string): Dossier[] {
  const ec = e.echeances.find((x) => x.id === echeanceId);
  if (!ec) return [];
  return e.dossiers.filter((d) => d.type === ec.type && d.echeance === ec.jour);
}

function gagnerBadgeEcheance(e: Etat, type: TypeMission) {
  const id = { tva: "boss_tva", paie: "boss_dsn", bilan: "boss_liasse", juridique: "boss_ag" }[type as "tva"];
  if (id) donnerBadge(e, id);
  e.reputation = clamp(e.reputation + 2);
}

function finJournee(e: Etat) {
  const jour = jourDe(e.minute);
  const r = REGLAGES[e.difficulte];

  // Résolution du Boss Fight.
  if (e.bossActif) {
    const ec = e.echeances.find((x) => x.id === e.bossActif)!;
    const rates = dossiersEcheance(e, ec.id).filter((d) => d.phase < 4);
    ec.resolue = true;
    if (!rates.length) {
      ec.resultat = "victoire";
      e.periode.echeancesGagnees++;
      log(e, `🏆 Boss vaincu : ${ec.nom} ! Tous les dossiers ont été déposés à temps.`, "bien");
      gagnerBadgeEcheance(e, ec.type);
      for (const a of e.agents) a.moral = clamp(a.moral + 6);
    } else {
      ec.resultat = "defaite";
      e.periode.echeancesPerdues++;
      let penalite = 0;
      for (const d of rates) {
        const p = Math.round(d.honoraires * 0.25 * r.penalites);
        penalite += p;
        const c = e.clients.find((x) => x.id === d.client);
        if (c) c.satisfaction = clamp(c.satisfaction - 18 * r.penalites);
        d.echeance = ajouterJoursOuvres(jour, 5); // dépôt tardif
      }
      e.tresorerie -= penalite;
      e.periode.charges += penalite;
      e.reputation = clamp(e.reputation - 3 * rates.length * r.penalites);
      log(e, `💥 ${ec.nom} : ${rates.length} dossier(s) en retard. Majorations prises en charge par le cabinet : ${penalite.toLocaleString("fr-FR")} €.`, "mal");
      for (const a of e.agents) a.moral = clamp(a.moral - 5);
    }
    e.bossActif = null;
  }

  // Messages ignorés.
  for (const m of e.messages) {
    if (m.statut !== "attente" || m.expire > jour) continue;
    m.statut = "ignore";
    inc(e, "ignores");
    ignorer(e, m);
  }

  // Clients qui partent.
  for (const c of [...e.clients]) {
    if (c.satisfaction < 18) {
      e.clients = e.clients.filter((x) => x.id !== c.id);
      e.dossiers = e.dossiers.filter((d) => d.client !== c.id || d.phase === 5);
      e.reputation = clamp(e.reputation - 6);
      log(e, `🚪 ${c.nom} quitte le cabinet. Trop d'insatisfaction.`, "mal");
    }
  }

  // Dossiers sans échéance de boss mais en retard.
  for (const d of e.dossiers) {
    if (d.phase < 5 && d.echeance < jour && !e.echeances.some((ec) => ec.type === d.type && ec.jour === d.echeance)) {
      const c = e.clients.find((x) => x.id === d.client);
      if (c) c.satisfaction = clamp(c.satisfaction - 2);
    }
  }

  // Débloquer automatiquement les pièces manquantes après 3 jours.
  for (const d of e.dossiers) if (d.bloque && rnd() < 0.3) d.bloque = null;

  verifierBadges(e);
}

function ignorer(e: Etat, m: Message) {
  const a = e.agents.find((x) => x.id === m.de);
  if (a) a.confiance = clamp(a.confiance - 3 * m.niveau);
  const c = e.clients.find((x) => m.sujet.includes(x.nom));
  switch (m.theme) {
    case "demission":
      if (a) depart(e, a, "a démissionné faute de réponse");
      break;
    case "controle":
    case "client_colere":
      if (c) c.satisfaction = clamp(c.satisfaction - 15);
      e.reputation = clamp(e.reputation - 4);
      break;
    case "conge":
      if (a) a.moral = clamp(a.moral - 10);
      break;
    case "dilemme": {
      // l'option la moins coûteuse est appliquée par défaut
      const opt = m.dilemme?.options.reduce((x, y) => (y.cout < x.cout ? y : x));
      if (opt) appliquerOption(e, m, opt);
      log(e, `Dilemme « ${m.dilemme?.titre} » laissé sans réponse : l'équipe a improvisé.`, "mal");
      break;
    }
  }
  if (a) log(e, `${a.prenom} attendait une réponse à « ${m.sujet} ». Confiance en baisse.`, "mal");
}

function depart(e: Etat, a: Agent, raison: string) {
  e.agents = e.agents.filter((x) => x.id !== a.id);
  e.anciens.push({ prenom: a.prenom, nom: a.nom, depart: jourDe(e.minute), raison });
  for (const d of e.dossiers) if (d.agent === a.id && d.phase < 5) d.agent = null;
  e.relations = e.relations.filter((r) => r.a !== a.id && r.b !== a.id);
  for (const x of e.agents) x.moral = clamp(x.moral - 6);
  log(e, `👋 ${a.prenom} ${a.nom} ${raison}.`, "mal");
  repartir(e);
}

function quart(e: Etat) {
  const jour = jourDe(e.minute);
  const m = minuteDuJour(e.minute);
  const r = REGLAGES[e.difficulte];
  const rush = e.compteurs.rushJour === jour;

  for (const a of e.agents) {
    if (a.bulle && a.bulleJusqua < e.minute) a.bulle = null;
    if (a.activite === "conge" || a.activite === "malade") continue;
    const h = horaires(a, jour);

    if (m < h.arrivee || m >= h.depart) {
      if (a.activite !== "absent" && m >= h.depart) {
        a.activite = "absent";
        if (rnd() < 0.5) dire(e, a, pick(["À demain !", "Bonne soirée", "Je file !"]), 20);
      }
      continue;
    }
    if (a.activite === "absent") {
      a.activite = "travaille";
      if (rnd() < 0.4) dire(e, a, pick(["Bonjour !", "Café d'abord…", "C'est parti"]), 25);
    }

    // Activité ponctuelle en cours ?
    if (a.activite !== "travaille" && a.activiteJusqua > e.minute) {
      if (a.activite === "pause") {
        a.stress = clamp(a.stress - 1);
        a.fatigue = clamp(a.fatigue - 0.6);
      }
      if (a.activite === "formation") a.competence = clamp(a.competence + 0.25, 0, 95);
      continue;
    }

    // Choisir l'activité.
    if (m >= h.dejeuner && m < h.dejeuner + 60) {
      a.activite = "pause";
      a.activiteJusqua = e.minute + (h.dejeuner + 60 - m);
      continue;
    }
    const x = rnd();
    if ((a.stress > 65 && x < 0.12) || x < 0.025) {
      a.activite = "pause";
      a.activiteJusqua = e.minute + 15 + Math.floor(rnd() * 20);
      dire(e, a, a.stress > 65 ? "Besoin d'un café…" : "Petite pause", 20);
      continue;
    }
    if (x < 0.055) {
      const autres = e.agents.filter((b) => b.id !== a.id && b.activite === "travaille");
      if (autres.length) {
        const b = pick(autres);
        a.activite = b.activite = "reunion";
        a.activiteJusqua = b.activiteJusqua = e.minute + 30 + Math.floor(rnd() * 30);
        dire(e, a, `Point avec ${b.prenom}`, 25);
        continue;
      }
    }
    const dossiers = e.dossiers
      .filter((d) => d.agent === a.id && d.phase < 5 && !d.bloque && !(d.phase === 3 && d.progression >= 100))
      .sort((p, q) => p.echeance - q.echeance);
    const d = dossiers[0];
    if (d && d.phase === 1 && x < 0.085) {
      a.activite = "archives";
      a.activiteJusqua = e.minute + 30;
      dire(e, a, "Je cherche les pièces", 25);
      continue;
    }

    a.activite = "travaille";
    a.activiteJusqua = 0;
    if (a.filiere === "rh") {
      if (rnd() < 0.05) dire(e, a, pick(["Je trie les CV", "Entretien à 15h", "Je prépare la paie RH", "Onboarding en cours"]), 30);
      continue;
    }
    if (!d) {
      if (rnd() < 0.08) dire(e, a, "Plus rien sur mon bureau !", 30);
      continue;
    }
    // Avancement du dossier.
    let v = 2.8 * (a.competence / 60) * (1 - a.fatigue / 160) * (1 - Math.max(0, a.stress - 70) / 90) * VITESSE_TYPE[d.type] * r.vitesse / Math.sqrt(d.difficulte);
    if (rush) v *= 1.8;
    // mentorat
    const mentor = e.relations.find((rel) => rel.type === "mentorat" && rel.b === a.id);
    if (mentor && e.agents.find((b) => b.id === mentor.a)?.activite === "travaille") {
      a.competence = clamp(a.competence + 0.03, 0, 92);
      v *= 1.08;
    }
    avancerDossier(e, d, v);
    if (rnd() < 0.03) dire(e, a, pick([`Je suis sur ${nomClient(e, d.client)}`, "Ça avance", "Rapprochement en cours", "Je lettre les comptes"]), 25);
    // Pièces manquantes
    if (d.phase === 1 && !d.bloque && rnd() < 0.006 * r.evenements) {
      d.bloque = "Pièces manquantes";
      if (!messageEnAttente(e, "pieces", a.id)) envoyer(e, "pieces", a.id, { client: nomClient(e, d.client), dossier: d.titre }, { dossier: d.id });
    }
  }

  // Toi : tu traites toi-même les dossiers sans responsable (ou que tu t'es attribués).
  e.travailToi = null;
  if (m >= 9 * 60 && m < 18 * 60 + 30) {
    const miens = e.dossiers
      .filter((d) => (d.agent === null || d.agent === "toi") && d.phase < 5 && !d.bloque)
      .sort((p, q) => p.echeance - q.echeance);
    const d = miens[0];
    if (d) {
      e.travailToi = d.id;
      const v = 2.8 * 0.75 * VITESSE_TYPE[d.type] * r.vitesse * (rush ? 1.5 : 1) / Math.sqrt(d.difficulte);
      avancerDossier(e, d, v);
      if (d.phase === 1 && !d.bloque && rnd() < 0.003 * r.evenements) d.bloque = "Pièces manquantes";
    }
  }

  // Évolution du stress, de la fatigue, du moral.
  const prochains = jour + 7;
  for (const a of e.agents) {
    if (a.activite === "absent" || a.activite === "conge" || a.activite === "malade") continue;
    if (a.activite === "travaille" || a.activite === "reunion") a.fatigue = clamp(a.fatigue + 0.38 + (rush ? 0.3 : 0) + (a.stress > 60 ? 0.15 : 0));
    const urgents = e.dossiers.filter((d) => d.agent === a.id && d.phase < 4 && d.echeance <= prochains).length;
    const rivalProche = e.relations.some((rel) => {
      if (rel.type !== "rivalite") return false;
      const autre = rel.a === a.id ? rel.b : rel.b === a.id ? rel.a : null;
      const b = autre && e.agents.find((x) => x.id === autre);
      return b && b.activite === a.activite;
    });
    const charge = e.dossiers.filter((d) => d.agent === a.id && d.phase < 5).reduce((s, d) => s + (d.type === "bilan" ? 2 : 1), 0);
    const cible = clamp(20 + charge * 5 + urgents * 10 + (a.fatigue - 40) * 0.3 + (rivalProche ? 8 : 0) + (a.personnalite === "anxieux" ? 10 : 0) - (a.personnalite === "nonchalant" ? 10 : 0) + (rush ? 15 : 0));
    a.stress = clamp(a.stress + (cible - a.stress) * 0.06);
    const cibleMoral = clamp((aUnRH(e) ? 62 : 58) + (a.confiance - 50) * 0.3 - (a.stress - 35) * 0.5 - (a.fatigue - 35) * 0.4 + (e.moodGlobal - 50) * 0.1);
    a.moral = clamp(a.moral + (cibleMoral - a.moral) * 0.03);
  }
  if (e.agents.length) {
    const moy = e.agents.reduce((s, a) => s + a.moral, 0) / e.agents.length;
    e.moodGlobal = clamp(e.moodGlobal + (moy - e.moodGlobal) * 0.02);
  }

  evenements(e, r.evenements);
}

function evenements(e: Etat, f: number) {
  const jour = jourDe(e.minute);
  const presents = e.agents.filter((a) => a.activite !== "absent" && a.activite !== "conge" && a.activite !== "malade");
  const m = minuteDuJour(e.minute);
  if (m < 9 * 60 || m > 18 * 60 + 30) return; // le cabinet est fermé
  const quiPrevient = () => (presents.length ? pick(presents).id : "cabinet");

  for (const a of presents) {
    if (a.filiere === "rh") continue;
    const sesDossiers = e.dossiers.filter((d) => d.agent === a.id && d.phase < 5);
    const unDossier = sesDossiers[0];
    if (a.competence < 62 && unDossier && rnd() < 0.006 * f && !messageEnAttente(e, "conseil_tech", a.id))
      envoyer(e, "conseil_tech", a.id, { dossier: unDossier.titre });
    const urgents = sesDossiers.filter((d) => d.echeance <= jour + 7 && d.phase < 4).length;
    if (urgents >= 3 && a.stress > 60 && jour - dernierMessage(e, "surcharge", a.id) > 5 && rnd() < 0.02 * f)
      envoyer(e, "surcharge", a.id, { jours: String(urgents), collegue: autreAgent(e, a.id) });
    if (unDossier && rnd() < 0.0012 * f * (a.fatigue / 50) && jour - dernierMessage(e, "erreur", a.id) > 6)
      envoyer(e, "erreur", a.id, { dossier: unDossier.titre }, { dossier: unDossier.id });
    if (a.fatigue > 78 && !messageEnAttente(e, "conge", a.id) && jour - dernierMessage(e, "conge", a.id) > 8 && rnd() < 0.02)
      envoyer(e, "conge", a.id, { collegue: autreAgent(e, a.id) });
    if (jour - a.embauche > 25 && jour - dernierMessage(e, "augmentation", a.id) > 25 && rnd() < 0.0012 * (a.personnalite === "ambitieux" ? 3 : 1))
      envoyer(e, "augmentation", a.id, {});
    if (a.moral < 28 && a.confiance < 40 && !messageEnAttente(e, "demission", a.id) && jour - dernierMessage(e, "demission", a.id) > 10 && rnd() < 0.02)
      envoyer(e, "demission", a.id, {});
    if (a.confiance > 68 && unDossier && rnd() < 0.002) envoyer(e, "merci", a.id, { dossier: unDossier.titre });
    if (a.fatigue > 92 && rnd() < 0.015) {
      a.activite = "malade";
      a.absentJusquau = ajouterJoursOuvres(jour, 2);
      a.fatigue = 40;
      log(e, `🤒 ${a.prenom} est en arrêt maladie pour deux jours (épuisement).`, "mal");
    }
  }

  // Conflits entre rivaux présents dans la même pièce.
  for (const rel of e.relations.filter((x) => x.type === "rivalite" && x.intensite > 45)) {
    const a = presents.find((x) => x.id === rel.a);
    const b = presents.find((x) => x.id === rel.b);
    if (a && b && a.activite === b.activite && rnd() < 0.006 * f && jour - dernierMessage(e, "conflit") > 4) {
      envoyer(e, "conflit", a.id, { collegue: b.prenom });
      rel.intensite = clamp(rel.intensite + 5);
    }
  }

  // Rumeurs à la machine à café.
  const cafe = presents.filter((a) => a.activite === "pause");
  if (cafe.length >= 2 && rnd() < 0.02 * f) {
    const a = cafe[0];
    envoyer(e, "rumeur", a.id, { collegue: cafe[1].prenom });
  }

  // Clients.
  for (const c of e.clients) {
    if (c.satisfaction < 45 && rnd() < 0.004 * f && !messageEnAttente(e, "client_colere") && jour - dernierMessage(e, "client_colere") > 3) {
      const d = e.dossiers.find((x) => x.client === c.id && x.phase < 5);
      envoyer(e, "client_colere", quiPrevient(), { client: c.nom, dossier: d?.titre ?? "ses dossiers" });
    }
  }
  if (rnd() < 0.0007 * f && e.clients.length && !messageEnAttente(e, "controle")) {
    const c = pick(e.clients);
    envoyer(e, "controle", "cabinet", { client: c.nom });
  }
  const appelProspect = e.mode === "creation" && e.clients.length < 8 ? 0.005 : 0.0018;
  if (rnd() < appelProspect && e.reputation > 35 && !messageEnAttente(e, "prospect") && e.clients.length < 16) {
    const p = pick(PROSPECTS.filter((x) => !e.clients.some((c) => c.nom === x.nom)) || []);
    if (p) envoyer(e, "prospect", quiPrevient(), { client: p.nom });
  }
  // Dilemmes.
  if (rnd() < 0.0055 * f && !messageEnAttente(e, "dilemme") && jour - dernierMessage(e, "dilemme") >= 2) {
    lancerDilemme(e);
  }
}

function autreAgent(e: Etat, id: string) {
  const autres = e.agents.filter((a) => a.id !== id);
  return autres.length ? pick(autres).prenom : "quelqu'un";
}

const PROSPECTS: Omit<Client, "id">[] = [
  { nom: "Fromagerie Lucas", dirigeant: "Lucas Bernard", secteur: "Commerce alimentaire", trait: "parle de ses fromages pendant des heures", satisfaction: 70, forfait: 1200, tvaMensuelle: true, paie: false },
  { nom: "Studio Pixel", dirigeant: "Jade Morel", secteur: "Agence web", trait: "factures en anglais, devis en emojis", satisfaction: 70, forfait: 1700, tvaMensuelle: true, paie: true },
  { nom: "Cabinet Kiné Rives", dirigeant: "Olivier Rives", secteur: "Profession libérale", trait: "BNC, recettes-dépenses et beaucoup de questions", satisfaction: 70, forfait: 900, tvaMensuelle: false, paie: false },
  { nom: "Hôtel des Alpes", dirigeant: "Martine Giraud", secteur: "Hôtellerie", trait: "saisonnalité extrême, extras à déclarer", satisfaction: 70, forfait: 2600, tvaMensuelle: true, paie: true },
  { nom: "GreenWatt", dirigeant: "Samir Haddad", secteur: "Installateur solaire", trait: "croissance de 200 % et zéro process", satisfaction: 70, forfait: 2200, tvaMensuelle: true, paie: true },
  { nom: "Librairie Les Mots", dirigeant: "Paul Lenoir", secteur: "Librairie", trait: "romantique, marges minuscules", satisfaction: 70, forfait: 800, tvaMensuelle: false, paie: true },
];

function lancerDilemme(e: Etat) {
  const modele = pick(DILEMMES);
  const c = e.clients.length ? pick(e.clients) : null;
  const a = e.agents.length ? pick(e.agents) : null;
  const vars = { client: c?.nom ?? "un client", agent: a?.prenom ?? "un collaborateur" };
  const f = (t: string) => remplir(t, vars);
  const jour = jourDe(e.minute);
  e.messages.unshift({
    id: uid(e, "m"),
    de: "cabinet",
    niveau: 4,
    sujet: `Dilemme : ${modele.titre}`,
    texte: f(modele.texte),
    jour,
    minute: e.minute,
    lu: false,
    statut: "attente",
    expire: ajouterJoursOuvres(jour, 2),
    theme: "dilemme",
    dossier: c ? `client:${c.id}|agent:${a?.id ?? ""}` : undefined,
    dilemme: {
      titre: modele.titre,
      options: modele.options.map((o) => ({
        ...o,
        label: f(o.label),
        resultat: f(o.resultat),
        differe: o.differe ? { ...o.differe, texte: f(o.differe.texte) } : undefined,
      })),
    },
  });
}

function ctxDilemme(m: Message) {
  const [cl, ag] = (m.dossier ?? "").split("|");
  return { client: cl?.replace("client:", "") || undefined, agent: ag?.replace("agent:", "") || undefined };
}

function appliquerOption(e: Etat, m: Message, opt: NonNullable<Message["dilemme"]>["options"][number]) {
  const ctx = ctxDilemme(m);
  appliquerEffets(e, opt.effets, ctx);
  if (opt.differe) e.differes.push({ jour: ajouterJoursOuvres(jourDe(e.minute), opt.differe.delai), effets: opt.differe.effets, texte: opt.differe.texte, ...ctx });
}

export function choisirDilemme(e: Etat, msgId: string, index: number): string | null {
  const m = e.messages.find((x) => x.id === msgId);
  if (!m || !m.dilemme || m.statut !== "attente") return "Ce dilemme n'est plus d'actualité.";
  const opt = m.dilemme.options[index];
  if (e.pa < opt.cout) return `Il te faut ${opt.cout} PA.`;
  e.pa -= opt.cout;
  appliquerOption(e, m, opt);
  m.statut = "repondu";
  m.reponse = opt.label;
  if (index === 0) inc(e, "integre");
  log(e, `⚖️ ${m.dilemme.titre} : ${opt.resultat}`, "neutre");
  verifierBadges(e);
  return null;
}

// ---------- Ghost Writer ----------

export type Style = "standard" | "ferme" | "pedagogue";

export function repondre(e: Etat, msgId: string, style: Style, texte: string): string | null {
  const m = e.messages.find((x) => x.id === msgId);
  if (!m || (m.statut !== "attente" && m.statut !== "info")) return "Ce message n'attend plus de réponse.";
  const cout = coutMessage(e, m.niveau);
  if (!payer(e, cout, m.niveau)) return `Il te faut ${cout} PA pour répondre.`;
  m.statut = "repondu";
  m.reponse = texte;
  inc(e, style);

  const a = e.agents.find((x) => x.id === m.de);
  const sensible = a && (a.personnalite === "anxieux" || a.personnalite === "rebelle" || a.personnalite === "perfectionniste");
  if (a) {
    if (style === "standard") {
      a.confiance = clamp(a.confiance + 2);
      a.stress = clamp(a.stress - 3);
    } else if (style === "ferme") {
      a.confiance = clamp(a.confiance + (sensible ? -6 : 1));
      a.stress = clamp(a.stress + (a.personnalite === "anxieux" ? 12 : 5));
      if (a.personnalite === "nonchalant") a.competence = clamp(a.competence + 1);
    } else {
      a.confiance = clamp(a.confiance + 4);
      a.stress = clamp(a.stress - 4);
      a.competence = clamp(a.competence + (a.personnalite === "ambitieux" || a.personnalite === "perfectionniste" ? 3 : 2), 0, 95);
    }
    a.moral = clamp(a.moral + 2);
    dire(e, a, style === "ferme" ? "Bien reçu." : "Merci pour ta réponse !", 30);
  }
  const d = e.dossiers.find((x) => x.id === m.dossier);
  const c = e.clients.find((x) => m.sujet.includes(x.nom) || m.texte.includes(x.nom));

  switch (m.theme) {
    case "pieces":
      if (d) d.bloque = null;
      if (c && style === "ferme") c.satisfaction = clamp(c.satisfaction - 4);
      break;
    case "revision":
      if (d) validerDossier(e, d.id);
      break;
    case "surcharge":
      if (a && style !== "ferme") {
        const sien = e.dossiers.filter((x) => x.agent === a.id && x.phase < 4).sort((p, q) => q.echeance - p.echeance)[0];
        if (sien) {
          sien.agent = null;
          repartir(e);
          if (sien.agent === a.id) {
            const autre = e.agents.filter((x) => x.id !== a.id).sort((p, q) => p.stress - q.stress)[0];
            if (autre) sien.agent = autre.id;
          }
          log(e, `${sien.titre} passe de ${a.prenom} à ${nomAgent(e, sien.agent)}.`);
        }
        a.stress = clamp(a.stress - 10);
      }
      break;
    case "erreur":
      if (a && style === "ferme" && sensible) a.stress = clamp(a.stress + 8);
      if (a && style === "pedagogue") a.competence = clamp(a.competence + 2, 0, 95);
      break;
    case "conflit": {
      const rel = e.relations.find((r) => r.type === "rivalite" && (r.a === m.de || r.b === m.de));
      if (rel) rel.intensite = clamp(rel.intensite - (style === "pedagogue" ? 18 : style === "standard" ? 8 : 12));
      break;
    }
    case "client_colere":
    case "controle":
      if (c) c.satisfaction = clamp(c.satisfaction + (style === "pedagogue" ? 15 : style === "standard" ? 10 : -2));
      if (m.theme === "controle" && c) {
        const nd = creerDossier(e, c, "conseil", ajouterJoursOuvres(jourDe(e.minute), 15), jourDe(e.minute), `Assistance contrôle fiscal — ${c.nom}`);
        nd.honoraires = 3000;
        repartir(e);
        log(e, `Mission d'assistance au contrôle fiscal ouverte pour ${c.nom}.`, "bien");
      }
      break;
    case "conge":
      if (a) {
        if (style === "ferme") {
          a.moral = clamp(a.moral - 10);
          a.confiance = clamp(a.confiance - 5);
        } else {
          a.activite = "conge";
          a.absentJusquau = ajouterJoursOuvres(jourDe(e.minute), 3);
          a.fatigue = 5;
          a.stress = clamp(a.stress - 20);
          a.moral = clamp(a.moral + 15);
          log(e, `🌴 ${a.prenom} part trois jours en congés.`);
        }
      }
      break;
    case "augmentation":
      if (a) {
        if (style === "ferme") {
          a.confiance = clamp(a.confiance - 10);
          a.moral = clamp(a.moral - (a.personnalite === "ambitieux" ? 18 : 8));
        } else {
          a.salaire += style === "standard" ? 150 : 100;
          a.confiance = clamp(a.confiance + 8);
          a.moral = clamp(a.moral + 10);
          log(e, `💶 ${a.prenom} est augmenté·e (${a.salaire.toLocaleString("fr-FR")} € brut).`);
        }
      }
      break;
    case "demission":
      if (a) {
        if (style === "ferme" && (a.personnalite === "rebelle" || a.personnalite === "ambitieux")) depart(e, a, "a démissionné après votre échange");
        else {
          a.confiance = clamp(a.confiance + (style === "pedagogue" ? 25 : 15));
          a.moral = clamp(a.moral + 20);
          log(e, `${a.prenom} a décidé de rester.`, "bien");
        }
      }
      break;
    case "prospect": {
      const p = PROSPECTS.find((x) => m.texte.includes(x.nom));
      if (p) {
        const nc: Client = { ...p, id: uid(e, "cl"), satisfaction: style === "pedagogue" ? 80 : style === "ferme" ? 55 : 70, forfait: Math.round(p.forfait * (style === "ferme" ? 1.25 : 1)) };
        e.clients.push(nc);
        const nd = creerDossier(e, nc, "conseil", ajouterJoursOuvres(jourDe(e.minute), 12), jourDe(e.minute), `Reprise du dossier — ${nc.nom}`);
        nd.honoraires = 1500;
        const liasse = e.echeances.find((x) => x.id === "liasse-2026");
        if (liasse && !liasse.resolue && liasse.jour > jourDe(e.minute) + 10) creerDossier(e, nc, "bilan", liasse.jour, jourDe(e.minute));
        repartir(e);
        log(e, `🤝 Nouveau client : ${nc.nom} (${nc.forfait.toLocaleString("fr-FR")} €/mois).`, "bien");
        e.reputation = clamp(e.reputation + 1);
      }
      break;
    }
  }
  verifierBadges(e);
  return null;
}

/** Les trois versions proposées par le Ghost Writer, à partir de ton ébauche. */
export function versionsGhostWriter(e: Etat, m: Message, brouillon: string): Record<Style, string> {
  const a = e.agents.find((x) => x.id === m.de);
  const prenom = a ? a.prenom : m.de === "cabinet" ? "l'équipe" : "";
  const coeur = brouillon.trim() ? brouillon.trim().replace(/\s+$/, "").replace(/([^.!?])$/, "$1.") : "";
  const conseil = MODELES[m.theme]?.conseil ?? "";
  const S = (s: string) => s.replace(/\s+/g, " ").trim();
  const intentions: Record<string, Record<Style, string>> = {
    pieces: { standard: "Relance-les une dernière fois, je les appelle aussi de mon côté.", ferme: "Envoie-leur une relance écrite avec un délai de 48 heures et mets-moi en copie.", pedagogue: "Profite-en pour leur envoyer la liste type des pièces attendues, ça servira pour l'an prochain." },
    revision: { standard: "C'est validé, tu peux finaliser.", ferme: "Je valide. Finalise aujourd'hui, l'échéance approche.", pedagogue: "Je valide. Avant de finaliser, revérifie les variations significatives N/N-1 : c'est ce qu'un réviseur regarde en premier." },
    surcharge: { standard: "Je réattribue un de tes dossiers pour te soulager.", ferme: "On garde la répartition, concentre-toi sur les échéances les plus proches.", pedagogue: "On va prioriser ensemble et je confie un dossier à quelqu'un d'autre." },
    erreur: { standard: "Merci de me l'avoir dit tout de suite. On prévient le client ensemble.", ferme: "Ça ne doit pas se reproduire. Ajoute un contrôle sur ce point dans ta check-list.", pedagogue: "Merci pour ta transparence. Voyons ensemble comment l'éviter à l'avenir." },
    conflit: { standard: "Je vais vous voir tous les deux pour clarifier qui fait quoi.", ferme: "Je ne veux plus de tensions dans l'open space. On se voit tous les trois demain.", pedagogue: "On va poser une règle claire de répartition des dossiers, ça évitera ce genre de malentendu." },
    client_colere: { standard: "Je le rappelle aujourd'hui.", ferme: "Je le rappelle et je lui redis ce que prévoit la lettre de mission.", pedagogue: "Je le rappelle et je lui propose un calendrier écrit." },
    conge: { standard: "Accordé, profite bien.", ferme: "Pas maintenant, on en reparle après l'échéance.", pedagogue: "Accordé. Laisse une note de passation à jour." },
    augmentation: { standard: "Tu le mérites : je t'accorde une augmentation.", ferme: "Ce n'est pas possible pour le moment.", pedagogue: "Je t'accorde une augmentation et on fixe ensemble des objectifs de progression." },
    conseil_tech: { standard: "Oui, c'est bon.", ferme: "Oui. Vérifie seul·e ce genre de point la prochaine fois.", pedagogue: "Oui, et voici pourquoi :" },
    demission: { standard: "Je ne veux pas te perdre. Parlons-en demain.", ferme: "Si c'est ta décision, je la respecterai.", pedagogue: "Merci de ta franchise. Parlons de ta charge, de tes perspectives et de ce qui te ferait rester." },
    controle: { standard: "Je l'appelle dans l'heure.", ferme: "Qu'il ne réponde à rien sans nous. Je prends la main.", pedagogue: "Je l'appelle et je lui explique le déroulé d'une vérification." },
    prospect: { standard: "Oui, prépare la lettre de mission.", ferme: "D'accord, mais avec un forfait majoré : ce dossier sera lourd.", pedagogue: "Oui. Fais d'abord les vérifications d'identité et contacte le confrère précédent." },
    rumeur: { standard: "Merci de me tenir au courant.", ferme: "Je ne veux pas de rumeurs, on en parle en réunion.", pedagogue: "Merci. On fera un point d'équipe pour que chacun puisse s'exprimer." },
    merci: { standard: "Avec plaisir !", ferme: "Merci. On continue sur ce rythme.", pedagogue: "Avec plaisir, et bravo pour le travail." },
  };
  const it = intentions[m.theme] ?? { standard: "Bien noté.", ferme: "Bien noté, je compte sur toi.", pedagogue: "Bien noté. Prenons le temps d'en parler." };
  const salut = prenom ? `${prenom}, ` : "";
  return {
    standard: S(`Bonjour ${salut}${coeur} ${it.standard} Merci.`),
    ferme: S(`${salut}${coeur} ${it.ferme}`),
    pedagogue: S(`${salut}${coeur} ${it.pedagogue} ${conseil}`),
  };
}

// ---------- actions de l'associée ----------

export function actionBoss(e: Etat, action: "rush" | "renfort"): string | null {
  if (!e.bossActif) return "Pas de combat en cours.";
  if (e.pa < 1) return "Plus de PA aujourd'hui.";
  const jour = jourDe(e.minute);
  if (action === "rush") {
    if (e.compteurs.rushJour === jour) return "Le rush est déjà lancé.";
    e.pa -= 1;
    e.compteurs.rushJour = jour;
    for (const a of e.agents) {
      a.stress = clamp(a.stress + 12);
      dire(e, a, "On s'y met tous !", 40);
    }
    log(e, "🔥 Rush collectif : toute l'équipe accélère (et stresse).");
  } else {
    const lies = dossiersEcheance(e, e.bossActif).filter((d) => d.phase < 4).sort((p, q) => resteAvantValidation(q) - resteAvantValidation(p));
    if (!lies.length) return "Tout est déjà prêt.";
    e.pa -= 1;
    avancerDossier(e, lies[0], 90);
    log(e, `💪 Tu mets la main à la pâte sur ${lies[0].titre}.`);
  }
  return null;
}

export function recruter(e: Etat, candidatId: string): string | null {
  const c = e.candidats.find((x) => x.id === candidatId);
  if (!c) return "Candidat introuvable.";
  if (e.agents.length >= MAX_POSTES) return "Plus de bureau libre dans l'open space.";
  if (e.pa < 1) return "Il te faut 1 PA.";
  const frais = fraisRecrutement(e);
  if (e.tresorerie < frais) return `Trésorerie insuffisante (${frais.toLocaleString("fr-FR")} € de frais).`;
  e.pa -= 1;
  e.tresorerie -= frais;
  e.periode.charges += frais;
  const occupes = new Set(e.agents.map((a) => a.bureau));
  let bureau = 0;
  while (occupes.has(bureau)) bureau++;
  const jour = jourDe(e.minute);
  e.agents.push({
    id: uid(e, "a"),
    prenom: c.prenom,
    nom: c.nom,
    poste: c.poste,
    filiere: c.filiere,
    personnalite: c.personnalite,
    couleur: pick(COULEURS),
    cheveux: pick(CHEVEUX),
    peau: pick(PEAUX),
    bureau,
    competence: c.competence,
    stress: 20,
    fatigue: 10,
    confiance: 55,
    moral: 72,
    salaire: c.salaire,
    activite: "absent",
    activiteJusqua: 0,
    absentJusquau: 0,
    embauche: jour,
    clan: null,
    bulle: null,
    bulleJusqua: 0,
  });
  e.candidats = e.candidats.filter((x) => x.id !== candidatId);
  inc(e, "recrutements");
  log(e, `🤝 ${c.prenom} ${c.nom} rejoint le cabinet comme ${c.poste.toLowerCase()}.`, "bien");
  repartir(e);
  verifierBadges(e);
  return null;
}

export const fraisRecrutement = (e: Etat) => (aUnRH(e) ? 1000 : 2000);

export function publierAnnonce(e: Etat): string | null {
  if (e.pa < 1) return "Il te faut 1 PA.";
  if (e.tresorerie < 300) return "Trésorerie insuffisante (300 €).";
  e.pa -= 1;
  e.tresorerie -= 300;
  e.periode.charges += 300;
  e.candidats = genererCandidats(e);
  log(e, "📢 Annonce publiée : de nouveaux candidats se présentent.");
  return null;
}

export function licencier(e: Etat, agentId: string): string | null {
  const a = e.agents.find((x) => x.id === agentId);
  if (!a) return "Introuvable.";
  if (e.pa < 1) return "Il te faut 1 PA.";
  e.pa -= 1;
  const indemnite = a.salaire * 2;
  e.tresorerie -= indemnite;
  e.periode.charges += indemnite;
  depart(e, a, `quitte le cabinet (rupture, ${indemnite.toLocaleString("fr-FR")} € d'indemnités)`);
  for (const x of e.agents) x.confiance = clamp(x.confiance - 4);
  return null;
}

export function augmenter(e: Etat, agentId: string): string | null {
  const a = e.agents.find((x) => x.id === agentId);
  if (!a) return "Introuvable.";
  a.salaire += 100;
  a.moral = clamp(a.moral + 8);
  a.confiance = clamp(a.confiance + 5);
  dire(e, a, "Oh, merci !", 40);
  log(e, `💶 ${a.prenom} est augmenté·e de 100 € (${a.salaire.toLocaleString("fr-FR")} € brut).`);
  return null;
}

export function envoyerEnFormation(e: Etat, agentId: string): string | null {
  const a = e.agents.find((x) => x.id === agentId);
  if (!a) return "Introuvable.";
  if (a.activite === "absent" || a.activite === "conge" || a.activite === "malade") return `${a.prenom} n'est pas au cabinet.`;
  if (e.pa < 1) return "Il te faut 1 PA.";
  if (e.tresorerie < 600) return "Trésorerie insuffisante (600 €).";
  e.pa -= 1;
  e.tresorerie -= 600;
  e.periode.charges += 600;
  a.activite = "formation";
  a.activiteJusqua = jourDe(e.minute) * 1440 + 17 * 60 + 30;
  a.competence = clamp(a.competence + 4, 0, 95);
  a.moral = clamp(a.moral + 5);
  dire(e, a, "En formation !", 40);
  log(e, `🎓 ${a.prenom} part en formation pour le reste de la journée.`);
  return null;
}

export function imposerRepos(e: Etat, agentId: string): string | null {
  const a = e.agents.find((x) => x.id === agentId);
  if (!a) return "Introuvable.";
  a.activite = "conge";
  a.absentJusquau = ajouterJoursOuvres(jourDe(e.minute), 2);
  a.fatigue = 5;
  a.stress = clamp(a.stress - 25);
  a.moral = clamp(a.moral + 10);
  log(e, `🌴 Tu envoies ${a.prenom} se reposer deux jours.`);
  return null;
}

export function reassigner(e: Etat, dossierId: string, agentId: string) {
  const d = e.dossiers.find((x) => x.id === dossierId);
  if (d) d.agent = agentId === "toi" ? "toi" : agentId;
}

export function enregistrerQcm(e: Etat, score: number, total: number) {
  const semaine = Math.floor(jourDe(e.minute) / 7);
  e.qcm.push({ semaine, score, total });
  e.qcmDisponible = false;
  e.periode.qcm = score;
  e.niveauDec = clamp(e.niveauDec * 0.7 + (score / total) * 100 * 0.3);
  if (score / total >= 0.7) for (const a of e.agents) a.moral = clamp(a.moral + 3);
  log(e, `📝 QCM blanc : ${score}/${total}.`, score / total >= 0.7 ? "bien" : "mal");
  verifierBadges(e);
}

export function enregistrerOral(e: Etat, score: number, question: string) {
  e.oraux.unshift({ jour: jourDe(e.minute), score, question });
  e.niveauDec = clamp(e.niveauDec * 0.8 + score * 0.2);
  log(e, `🎤 Oral blanc : ${score} %.`, score >= 60 ? "bien" : "mal");
  verifierBadges(e);
}

// ---------- badges ----------

function donnerBadge(e: Etat, id: string) {
  if (e.badges.some((b) => b.id === id)) return;
  e.badges.push({ id, jour: jourDe(e.minute) });
  const b = BADGES.find((x) => x.id === id);
  if (b) log(e, `${b.icone} Badge débloqué : ${b.nom} !`, "bien");
}

export function verifierBadges(e: Etat) {
  const k = e.compteurs;
  if ((k.livres ?? 0) >= 1) donnerBadge(e, "premier_livre");
  if ((k.livres ?? 0) >= 10) donnerBadge(e, "marathon");
  if (e.qcm.some((q) => q.score === q.total)) donnerBadge(e, "qcm_parfait");
  if (e.qcm.length >= 5) donnerBadge(e, "qcm_5");
  if (e.oraux.some((o) => o.score >= 80)) donnerBadge(e, "oral_80");
  if ((k.recrutements ?? 0) >= 1) donnerBadge(e, "recrutement");
  if ((k.pedagogue ?? 0) >= 5) donnerBadge(e, "pedagogue");
  if ((k.ferme ?? 0) >= 5) donnerBadge(e, "ferme");
  if (e.moodGlobal >= 80) donnerBadge(e, "zen");
  if (e.tresorerie >= 60000) donnerBadge(e, "tresor");
  if (e.reputation >= 85) donnerBadge(e, "reputation");
  if ((k.integre ?? 0) >= 3) donnerBadge(e, "integre");
}

// ---------- absence ----------

/** Rattrape le temps écoulé pendant que l'app était fermée (1 s réelle = 1 min simulée). */
export function rattraper(e: Etat, maintenant: number) {
  const secondes = Math.floor((maintenant - e.derniereVisite) / 1000);
  e.derniereVisite = maintenant;
  if (e.vitesse === 0 || secondes < 120) return;
  const minutes = Math.min(secondes, MINUTES_PAR_JOUR * 3);
  const avant = {
    messages: new Set(e.messages.map((m) => m.id)),
    phases: new Map(e.dossiers.map((d) => [d.id, d.phase])),
  };
  e.absence = { depuis: e.minute, evenements: [] };
  avancer(e, minutes);
  // Récapitulatif chiffré en tête du résumé.
  const nouveaux = e.messages.filter((m) => !avant.messages.has(m.id));
  const urgents = nouveaux.filter((m) => m.statut === "attente" && m.niveau >= 4).length;
  const avances = e.dossiers.filter((d) => (avant.phases.get(d.id) ?? 0) < d.phase && d.phase < 5).length;
  const aValider = e.dossiers.filter((d) => d.phase === 3 && d.progression >= 100).length;
  const recap: Journal[] = [];
  const ici = { jour: jourDe(e.minute), minute: e.minute };
  if (nouveaux.length) recap.push({ ...ici, texte: `✉️ ${nouveaux.length} nouveau(x) message(s)${urgents ? `, dont ${urgents} urgent(s) (N4/N5)` : ""}.`, ton: urgents ? "mal" : "neutre" });
  if (avances) recap.push({ ...ici, texte: `🗂️ ${avances} dossier(s) ont avancé d'une phase.`, ton: "bien" });
  if (aValider) recap.push({ ...ici, texte: `✔ ${aValider} révision(s) attendent ta validation.`, ton: "neutre" });
  e.absence.evenements.unshift(...recap);
}

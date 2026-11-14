// Quatrième vague : lettre de mission et litiges d'honoraires, contrôle
// fiscal d'un client en plusieurs étapes, logiciels du cabinet, clôture des
// comptes du cabinet, objectifs et primes, retraite d'un associé, mentorat
// inversé, événements de la ville et agenda de la semaine.

import { anneeDe, dateDe, jourDe, jourDeLaDate, moisDe } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { SANS_POSTE, clamp, depart, dire, log, pick, rnd, uid } from "@/lib/moteur";
import { souvenir } from "@/lib/vie2";
import { gradeDe, noterClient } from "@/lib/vie3";
import type { Agent, Client, Etat, Message, OptionDilemme } from "@/lib/types";

const opt = (label: string, code: string, effets: OptionDilemme["effets"] = {}, resultat = "C'est noté."): OptionDilemme => ({ label, cout: 0, effets, resultat, action: "vie", code });
const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const metier = (a: Agent) => ["expertise", "fiscal", "social", "juridique", "audit"].includes(a.filiere);
const jourSemaine = (jour: number) => dateDe(jour).getUTCDay();

// ---------- 1. lettre de mission ----------

export function lettreDeMission(e: Etat, c: Client) {
  const t = (e.compteurs.tarif ?? 100) / 100;
  if (t !== 1) c.forfait = Math.round((c.forfait * t) / 50) * 50;
  messageSpecial(e, "cabinet", 3, `✍️ Lettre de mission — ${c.nom}`, `${c.dirigeant} est prêt·e à signer. Comment rédiges-tu la lettre de mission (${euros(c.forfait)} / mois) ?`, `client:${c.id}|agent:`, {}, [
    opt("Lettre sur mesure : périmètre détaillé, répartition des tâches, révision annuelle des honoraires, travaux exceptionnels facturés à part", "lm:complete", {}, "Lettre signée : tout est clair pour les deux parties."),
    opt("Modèle standard du logiciel, sans l'adapter", "lm:standard", {}, "Signée en deux minutes."),
    opt("Pas de lettre : on se fait confiance", "lm:aucune", { reputation: -2 }, "Le code de déontologie impose pourtant une lettre de mission…"),
  ]);
}

function litiges(e: Etat, jour: number) {
  const l = (e.litiges ?? []).find((x) => x.jour <= jour);
  if (!l) return;
  e.litiges = (e.litiges ?? []).filter((x) => x !== l);
  const c = e.clients.find((x) => x.id === l.client);
  if (!c) return;
  messageSpecial(e, "cabinet", 4, `💢 Litige d'honoraires avec ${c.nom}`, `${c.dirigeant} refuse de payer ${euros(l.montant)} de travaux exceptionnels (bilan prévisionnel, assistance à un contrôle URSSAF) : « Pour moi, c'était compris dans le forfait ! » La lettre de mission ne le précisait pas.`, `client:${c.id}|agent:`, { montant: l.montant }, [
    opt("Saisir la commission de conciliation de l'Ordre", "litige:ordre", {}, "Le dossier part en conciliation."),
    opt("Faire un avoir de 50 %", "litige:moitie", { satisfactionClient: 4 }, "Le client accepte le compromis."),
    opt("Abandonner la créance", "litige:abandon", { satisfactionClient: 8 }, "Le client est soulagé, toi un peu moins."),
  ]);
}

// ---------- 2. contrôle fiscal d'un client ----------

type EtapeControle = { titre: string; texte: (c: Client, rappel: number) => string; options: [string, number][] };

const ETAPES_CONTROLE: EtapeControle[] = [
  {
    titre: "Avis de vérification de comptabilité",
    texte: (c) => `${c.dirigeant} t'appelle, paniqué·e : ${c.nom} vient de recevoir un avis de vérification de comptabilité portant sur les trois derniers exercices. La première intervention est prévue dans 15 jours.`,
    options: [
      ["Rassurer le client, lui remettre la charte des droits et obligations du contribuable vérifié et préparer le FEC", 2],
      ["Envoyer dès maintenant toutes les pièces comptables au vérificateur", -1],
      ["Demander un report de la visite sans motif particulier", 0],
    ],
  },
  {
    titre: "Première intervention sur place",
    texte: (c) => `Le vérificateur arrive chez ${c.nom} pour la première intervention. Il demande le fichier des écritures comptables (FEC).`,
    options: [
      ["Remettre le FEC dès le début des opérations et assister le dirigeant à chaque entretien", 2],
      ["Laisser le dirigeant seul avec le vérificateur pour ne pas l'intimider", -1],
      ["Refuser de remettre le FEC tant que le vérificateur n'a pas tout expliqué", -2],
    ],
  },
  {
    titre: "Proposition de rectification",
    texte: (c, r) => `L'administration adresse à ${c.nom} une proposition de rectification : ${euros(r)} de rappels de TVA et d'IS, avec une majoration de 40 % pour manquement délibéré.`,
    options: [
      ["Répondre point par point dans les 30 jours (prorogeables de 30 jours sur demande) et contester la majoration de 40 %", 2],
      ["Tout accepter pour en finir vite", 0],
      ["Ne pas répondre : on verra bien", -2],
    ],
  },
  {
    titre: "Réponse de l'administration",
    texte: (c) => `Le vérificateur maintient une partie des rectifications dans sa réponse aux observations de ${c.nom}. Il reste un désaccord de fond.`,
    options: [
      ["Demander un recours hiérarchique, puis l'interlocuteur départemental", 2],
      ["Saisir directement le tribunal administratif", -1],
      ["Laisser tomber et payer", 0],
    ],
  },
];

function lancerControles(e: Etat, jour: number) {
  e.controles ??= [];
  for (const k of e.controles.filter((x) => x.prochain <= jour)) {
    const c = e.clients.find((x) => x.id === k.client);
    const et = ETAPES_CONTROLE[k.etape];
    if (!c || !et) {
      e.controles = e.controles.filter((x) => x !== k);
      continue;
    }
    k.prochain = 99999; // en attente de ta décision
    messageSpecial(e, "cabinet", 4, `🔍 Contrôle fiscal ${c.nom} — ${et.titre}`, et.texte(c, k.rappel), `client:${c.id}|agent:`, {}, et.options.map(([label], i) => opt(label, `cf:${k.id}:${i}`, {}, "Décision transmise au client.")));
  }
}

function nouveauControle(e: Etat, jour: number) {
  if (e.clients.length < 4 || rnd() > 0.12 || (e.controles ?? []).length) return;
  const c = pick(e.clients);
  e.controles ??= [];
  e.controles.push({ id: uid(e, "cf"), client: c.id, etape: 0, prochain: jour, score: 0, rappel: Math.round((c.forfait * 12 * (0.8 + rnd())) / 100) * 100 });
  noterClient(c, jour, "Avis de vérification de comptabilité reçu.");
}

function etapeControle(e: Etat, id: string, choix: number) {
  const k = (e.controles ?? []).find((x) => x.id === id);
  if (!k) return;
  const c = e.clients.find((x) => x.id === k.client);
  k.score += ETAPES_CONTROLE[k.etape].options[choix]?.[1] ?? 0;
  const abandon = (k.etape === 2 && choix !== 0) || (k.etape === 3 && choix === 2);
  k.etape++;
  const jour = jourDe(e.minute);
  if (k.etape < ETAPES_CONTROLE.length && !abandon) {
    k.prochain = jour + 8 + Math.floor(rnd() * 12);
    return;
  }
  e.controles = (e.controles ?? []).filter((x) => x !== k);
  if (!c) return;
  const reduction = clamp(k.score * 0.1, -0.3, 0.75);
  const final = Math.round((k.rappel * (1 - reduction)) / 100) * 100;
  c.satisfaction = clamp(c.satisfaction + (k.score >= 6 ? 18 : k.score >= 3 ? 6 : -15));
  e.tresorerie += 1800; // assistance au contrôle facturée
  e.niveauDec = clamp(e.niveauDec + Math.max(0, k.score / 2));
  noterClient(c, jour, `Fin du contrôle fiscal : ${euros(final)} de rappels au lieu de ${euros(k.rappel)}.`);
  log(e, `🔍 Contrôle fiscal de ${c.nom} terminé : ${euros(final)} de rappels (proposition initiale ${euros(k.rappel)}). ${k.score >= 6 ? "Défense exemplaire !" : k.score >= 3 ? "Défense correcte." : "Le client te reproche ta stratégie."}`, k.score >= 3 ? "bien" : "mal");
  if (k.score >= 7) souvenir(e, "🔍", `Contrôle fiscal gagné pour ${c.nom}`);
}

// ---------- 3. logiciels du cabinet ----------

export const LOGICIELS = {
  production: [
    { nom: "Tableur et logiciel basique", prix: 0, gain: 1 },
    { nom: "Logiciel cloud de production", prix: 35, gain: 1.06 },
    { nom: "Suite experte avec saisie automatisée par IA", prix: 60, gain: 1.12 },
  ],
  paie: [
    { nom: "Paie sur tableur", prix: 0, gain: 1 },
    { nom: "Logiciel de paie standard", prix: 20, gain: 1.05 },
    { nom: "Logiciel de paie expert (DSN intégrée)", prix: 40, gain: 1.1 },
  ],
  pdp: [
    { nom: "Aucune plateforme", prix: 0, gain: 1 },
    { nom: "Plateforme agréée standard", prix: 300, gain: 1 },
    { nom: "Plateforme agréée premium + e-reporting", prix: 700, gain: 1.03 },
  ],
} as const;
export type TypeLogiciel = keyof typeof LOGICIELS;

export function changerLogiciel(e: Etat, type: TypeLogiciel, niveau: number): string | null {
  e.logiciels ??= { production: 0, paie: 0, pdp: 0, migrationJusqua: 0 };
  if (e.logiciels[type] === niveau) return null;
  e.logiciels[type] = niveau;
  if (type !== "pdp") e.logiciels.migrationJusqua = jourDe(e.minute) + 20;
  e.tresorerie -= type === "pdp" ? 1500 : 3000;
  log(e, `💻 Nouveau logiciel : ${LOGICIELS[type][niveau].nom}.${type !== "pdp" ? " Migration en cours : trois semaines de rodage." : ""}`, "neutre");
  return null;
}

/** Productivité liée aux outils (et aux périodes de migration, pannes, mentorat). */
export function facteurOutils(e: Etat, a: Agent) {
  const l = e.logiciels;
  const jour = jourDe(e.minute);
  let f = 1;
  if (l) {
    f *= a.filiere === "social" ? LOGICIELS.paie[l.paie].gain : LOGICIELS.production[l.production].gain;
    if (l.migrationJusqua > jour) f *= 0.85;
  }
  if (e.compteurs.panneLogicielJour === jour) f *= 0.6;
  if ((e.compteurs[`outil:${a.filiere}`] ?? 0) > jour) f *= 1.08;
  return f;
}

function moisLogiciels(e: Etat, jour: number) {
  const l = (e.logiciels ??= { production: 0, paie: 0, pdp: 0, migrationJusqua: 0 });
  const n = e.agents.filter(metier).length;
  e.tresorerie -= LOGICIELS.production[l.production].prix * n + LOGICIELS.paie[l.paie].prix * Math.max(1, e.agents.filter((a) => a.filiere === "social").length) + LOGICIELS.pdp[l.pdp].prix;
  if (l.production > 0 && rnd() < 0.05) {
    e.compteurs.panneLogicielJour = jour + 1 + Math.floor(rnd() * 10);
    log(e, "💻 Le support annonce une maintenance du logiciel de production dans quelques jours : prévoir une journée au ralenti.", "neutre");
  }
  if (l.pdp === 0 && jour >= jourDeLaDate(2026, 9, 1)) {
    for (const c of e.clients) c.satisfaction = clamp(c.satisfaction - 2);
    log(e, "📨 Sans plateforme de facturation électronique agréée, le cabinet ne peut pas accompagner ses clients dans la réception obligatoire des factures électroniques (depuis le 1er septembre 2026). Va dans Locaux > Logiciels.", "mal");
  }
}

// ---------- 4. clôture des comptes du cabinet ----------

function clotureCabinet(e: Etat, jour: number) {
  if (moisDe(jour) !== 1 || e.compteurs.clotureAnnee === anneeDe(jour) || jour < 300) return;
  e.compteurs.clotureAnnee = anneeDe(jour);
  const an = anneeDe(jour) - 1;
  const periodes = e.bilans.filter((b) => anneeDe(b.debut) === an);
  const resultat = Math.round(periodes.reduce((s, b) => s + b.ca - b.charges, 0));
  if (resultat <= 0) {
    log(e, `📒 Comptes ${an} du cabinet : perte de ${euros(-resultat)}. Pas d'IS ni de dividendes cette année.`, "mal");
    return;
  }
  const is = Math.round(Math.min(resultat, 42500) * 0.15 + Math.max(0, resultat - 42500) * 0.25);
  const net = resultat - is;
  const associes = e.agents.filter((a) => a.filiere === "associe");
  messageSpecial(e, "cabinet", 4, `📒 Comptes ${an} du cabinet`, `Tes propres comptes sont clos : résultat avant impôt ${euros(resultat)}, IS ${euros(is)} (15 % jusqu'à 42 500 €, 25 % au-delà), résultat net ${euros(net)}. ${associes.length ? `Tes ${associes.length} associé·s attendent la décision de l'AG : certains veulent investir, d'autres des dividendes (flat tax de 31,4 % en 2026).` : "Que décides-tu en AG ?"}`, "client:|agent:", { net }, [
    opt("Tout mettre en réserves pour investir", "cloture:0", {}, "Le cabinet renforce ses fonds propres."),
    opt(`Distribuer 50 % en dividendes (${euros(net * 0.5)})`, "cloture:0.5", {}, "Compromis voté en AG."),
    opt(`Distribuer 100 % (${euros(net)})`, "cloture:1", {}, "Les associés sont ravis, la trésorerie beaucoup moins."),
  ]);
}

// ---------- 5. objectifs et primes ----------

function objectifs(e: Etat, jour: number) {
  const n = e.agents.filter(metier).length;
  if (n < 4) return;
  if (moisDe(jour) === 1 && e.compteurs.objectifsAnnee !== anneeDe(jour)) {
    e.compteurs.objectifsAnnee = anneeDe(jour);
    messageSpecial(e, "cabinet", 3, "🎯 Objectifs et rémunération variable de l'année", `Quel système de prime pour les ${n} collaborateurs cette année ? Budget indicatif : 5 % de la masse salariale.`, "client:|agent:", {}, [
      opt("Objectifs individuels (heures facturables, qualité, formation)", "objectifs:1", {}, "Chacun connaît ses objectifs. La compétition est lancée."),
      opt("Objectif collectif du cabinet, prime égale pour tous", "objectifs:2", { moralEquipe: 3 }, "Esprit d'équipe renforcé."),
      opt("Pas de variable, salaires fixes", "objectifs:3", {}, "Simple, mais moins motivant."),
    ]);
  }
  if (moisDe(jour) === 12 && e.compteurs.primesAnnee !== anneeDe(jour) && e.compteurs.objectifs) {
    e.compteurs.primesAnnee = anneeDe(jour);
    const equipe = e.agents.filter(metier);
    const masse = equipe.reduce((s, a) => s + a.salaire, 0);
    if (e.compteurs.objectifs === 1) {
      const tries = [...equipe].sort((a, b) => b.competence + b.confiance - (a.competence + a.confiance));
      const tiers = Math.ceil(tries.length / 3);
      tries.forEach((a, i) => {
        a.moral = clamp(a.moral + (i < tiers ? 14 : i < tiers * 2 ? 2 : -8));
      });
      e.tresorerie -= masse * 0.05 * 1.45;
      const r = tries.slice(-2);
      if (r.length === 2) e.relations.push({ a: r[0].id, b: tries[0].id, type: "rivalite", intensite: 40 });
      log(e, `💶 Primes individuelles versées : ${tries[0]?.prenom ?? "?"} décroche la plus grosse. Quelques grincements de dents chez les autres.`, "neutre");
    } else if (e.compteurs.objectifs === 2) {
      for (const a of equipe) a.moral = clamp(a.moral + 7);
      e.tresorerie -= masse * 0.05 * 1.45;
      log(e, "💶 Prime collective versée à toute l'équipe : ambiance au beau fixe.", "bien");
    }
  }
}

// ---------- 6. retraite d'un associé ----------

function retraiteAssocie(e: Etat, jour: number) {
  const associes = e.agents.filter((a) => a.filiere === "associe");
  const prevue = associes.find((a) => (e.compteurs[`retraite:${a.id}`] ?? 0) > 0);
  if (prevue && e.compteurs[`retraite:${prevue.id}`] <= jour) {
    const choix = e.compteurs[`retraiteChoix:${prevue.id}`] ?? 0;
    const succ = e.agents.find((x) => e.compteurs[`successeur:${x.id}`] === 1);
    delete e.compteurs[`retraite:${prevue.id}`];
    if (choix === 1 && succ) {
      delete e.compteurs[`successeur:${succ.id}`];
      succ.filiere = "associe";
      succ.associeDe = prevue.associeDe;
      succ.poste = prevue.poste;
      succ.bureau = SANS_POSTE;
      succ.salaire += 1500;
      succ.moral = clamp(succ.moral + 20);
      log(e, `🤝 ${succ.prenom} succède à ${prevue.prenom} comme ${succ.poste}.`, "bien");
      souvenir(e, "🤝", `${succ.prenom} devient associé·e`);
    }
    for (const c of e.clients) c.satisfaction = clamp(c.satisfaction - (choix === 1 ? 2 : choix === 2 ? 1 : 6));
    depart(e, prevue, "part à la retraite après une belle carrière");
    souvenir(e, "🥂", `Départ en retraite de ${prevue.prenom}`);
    return;
  }
  if (prevue || associes.length < 2 || rnd() > 0.03) return;
  const a = pick(associes);
  const manager = e.agents.filter((x) => metier(x) && gradeDe(x) >= 4).sort((x, y) => y.competence - x.competence)[0];
  e.compteurs[`retraite:${a.id}`] = jour + 120;
  messageSpecial(e, a.id, 4, `🧓 ${a.prenom} prépare son départ en retraite`, `${a.prenom} (${a.poste}) t'annonce son départ en retraite dans 4 mois. Il faut racheter ses parts, désigner un successeur et rassurer ses clients.`, `client:|agent:${a.id}`, { manager: manager?.id ?? "" }, [
    ...(manager ? [opt(`Successeur interne : ${manager.prenom} (${manager.poste}) devient associé·e`, "retraite:1", {}, `${manager.prenom} est ravi·e et commence la passation.`)] : []),
    opt("Racheter ses parts avec le cabinet (120 000 €) et faire une tournée des clients", "retraite:2", { tresorerie: -120000 }, "Les clients sont rassurés par ta visite."),
    opt("Laisser ses parts aux autres associés, sans passation particulière", "retraite:3", {}, "Les clients s'inquiètent un peu."),
  ]);
}

// ---------- 7. mentorat inversé ----------

const OUTILS = ["l'IA générative pour les notes de synthèse", "Excel avancé et Power Query", "la plateforme de facturation électronique", "les tableaux de bord Power BI", "l'automatisation des relances clients"];

function mentoratInverse(e: Etat) {
  const juniors = e.agents.filter((a) => metier(a) && gradeDe(a) <= 1 && a.competence > 40);
  if (!juniors.length || rnd() > 0.25) return;
  const a = pick(juniors);
  const outil = pick(OUTILS);
  messageSpecial(e, a.id, 2, `💡 ${a.prenom} propose de te former`, `${a.prenom} (${a.poste}) maîtrise ${outil} et propose de te former, toi et son pôle, pendant deux pauses déjeuner.`, `client:|agent:${a.id}`, { filiere: a.filiere }, [
    opt("Avec plaisir, on bloque deux créneaux", "mentorat_oui", { confianceAgent: 12 }, `${a.prenom} est très fier·e. Le pôle gagne en efficacité.`),
    opt("Pas le temps en ce moment", "mentorat_non", { confianceAgent: -5 }, "Dommage, l'idée était bonne."),
  ]);
}

// ---------- 8. événements de la ville ----------

function ville(e: Etat, jour: number) {
  const m = moisDe(jour);
  const an = anneeDe(jour);
  if (m === 3 && an % 6 === 2 && e.compteurs.municipales !== an) {
    e.compteurs.municipales = an;
    e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 1;
    log(e, "🗳️ Élections municipales : la nouvelle équipe lance un plan d'aide aux commerces et des marchés publics. De nouvelles entreprises vont chercher un expert-comptable.", "bien");
    return;
  }
  if (rnd() > 0.3) return;
  const ev = pick([
    () => {
      log(e, "🏃 Marathon de la ville ce dimanche : rues bloquées, et la moitié de l'équipe est inscrite. Courbatures lundi !", "neutre");
      for (const a of e.agents) if (rnd() < 0.4) a.fatigue = clamp(a.fatigue + 10);
      for (const a of e.agents) a.moral = clamp(a.moral + 2);
    },
    () => {
      e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 1;
      log(e, "🛍️ Grande braderie : le cabinet tient un stand « Créer son entreprise ». Quelques porteurs de projet repartent avec ta carte.", "bien");
    },
    () => {
      for (const a of e.agents) a.moral = clamp(a.moral + 3);
      log(e, "🏛️ Nuit des musées : sortie culturelle de l'équipe après le travail.", "bien");
    },
    () => {
      e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 1;
      log(e, "🚀 Salon des entrepreneurs au palais des congrès : le cabinet anime une conférence sur la facture électronique.", "bien");
    },
  ]);
  ev();
}

// ---------- 9. agenda de la semaine ----------

export const CRENEAUX = ["9h", "10h", "11h", "14h", "15h", "16h", "17h", "18h"];
export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
export type TypeBloc = "rdv" | "reunion" | "signature" | "banque" | "production";
export const STYLE_BLOC: Record<TypeBloc, { emoji: string; couleur: string; nom: string }> = {
  rdv: { emoji: "🤝", couleur: "#2f5bea", nom: "Rendez-vous client" },
  reunion: { emoji: "🎙️", couleur: "#8e44ad", nom: "Réunion" },
  signature: { emoji: "✍️", couleur: "#17a398", nom: "Signature" },
  banque: { emoji: "🏦", couleur: "#f2a541", nom: "Point banque" },
  production: { emoji: "🧠", couleur: "#43a047", nom: "Production" },
};

const lundiDe = (jour: number) => jour - ((jourSemaine(jour) + 6) % 7);

export function genererAgenda(e: Etat, jour: number) {
  const lundi = lundiDe(jour);
  if (e.agenda?.semaine === lundi) return;
  const blocs: NonNullable<Etat["agenda"]>["blocs"] = [];
  const libre = (j: number, c: number) => !blocs.some((b) => b.jour === j && b.creneau === c);
  const poser = (type: TypeBloc, titre: string, ref?: string, j0?: number, c0?: number) => {
    for (let t = 0; t < 30; t++) {
      const j = j0 ?? Math.floor(rnd() * 5);
      const c = c0 ?? Math.floor(rnd() * CRENEAUX.length);
      if (libre(j, c)) {
        blocs.push({ id: uid(e, "b"), jour: j, creneau: c, type, titre, ref });
        return;
      }
    }
  };
  poser("reunion", "Réunion des managers", undefined, 0, 1);
  for (const c of [...e.clients].sort(() => rnd() - 0.5).slice(0, 3 + Math.floor(rnd() * 3))) poser("rdv", c.nom, c.id);
  poser("signature", "Signature des liasses");
  poser("signature", "Lettres de mission");
  poser("banque", "Point avec le banquier");
  e.agenda = { semaine: lundi, blocs };
}

export function deplacerBloc(e: Etat, id: string, j: number, c: number): string | null {
  const b = e.agenda?.blocs.find((x) => x.id === id);
  if (!b) return null;
  const autre = e.agenda!.blocs.find((x) => x.jour === j && x.creneau === c);
  if (autre) {
    autre.jour = b.jour;
    autre.creneau = b.creneau;
  }
  b.jour = j;
  b.creneau = c;
  return null;
}

export function ajouterProduction(e: Etat, j: number, c: number): string | null {
  if (!e.agenda) genererAgenda(e, jourDe(e.minute));
  if (e.agenda!.blocs.some((x) => x.jour === j && x.creneau === c)) return "Créneau déjà pris.";
  e.agenda!.blocs.push({ id: uid(e, "b"), jour: j, creneau: c, type: "production", titre: "Bloc de production" });
  return null;
}

export function retirerBloc(e: Etat, id: string): string | null {
  if (!e.agenda) return null;
  const b = e.agenda.blocs.find((x) => x.id === id);
  if (b?.type === "rdv") {
    const c = e.clients.find((x) => x.id === b.ref);
    if (c) c.satisfaction = clamp(c.satisfaction - 3);
  }
  e.agenda.blocs = e.agenda.blocs.filter((x) => x.id !== id);
  return null;
}

/** Le soir : bilan de ta journée d'agenda. */
function journeeAgenda(e: Etat, jour: number) {
  genererAgenda(e, jour);
  const veille = jour - 1;
  const idx = (jourSemaine(veille) + 6) % 7;
  if (idx > 4 || !e.agenda || lundiDe(veille) !== e.agenda.semaine) return;
  const blocs = e.agenda.blocs.filter((b) => b.jour === idx);
  if (!blocs.length) return;
  for (const b of blocs) {
    if (b.type === "rdv") {
      const c = e.clients.find((x) => x.id === b.ref);
      if (c) c.satisfaction = clamp(c.satisfaction + 4);
    }
    if (b.type === "production") {
      const d = e.dossiers.find((x) => x.id === e.travailToi) ?? e.dossiers.filter((x) => x.phase < 4 && x.echeance < jour + 5).sort((a, b2) => a.echeance - b2.echeance)[0];
      if (d) d.progression = Math.min(100, d.progression + 15);
    }
  }
  const n = blocs.length;
  e.compteurs.formeToi = clamp((e.compteurs.formeToi ?? 100) - Math.max(0, n - 5) * 7 + (n <= 3 ? 4 : 0));
  if (n >= 7) log(e, `📅 Journée surbookée hier (${n} créneaux) : tu finis lessivée.`, "mal");
}

// ---------- hooks ----------

export function debutJourneeVie4(e: Etat, jour: number, premierDuMois: boolean) {
  litiges(e, jour);
  lancerControles(e, jour);
  journeeAgenda(e, jour);
  if (premierDuMois && jour > 0) {
    nouveauControle(e, jour);
    moisLogiciels(e, jour);
    clotureCabinet(e, jour);
    objectifs(e, jour);
    retraiteAssocie(e, jour);
    mentoratInverse(e);
    ville(e, jour);
  }
}

export function actionVie4(e: Etat, code: string, m: Message): boolean {
  const [type, p1, p2] = code.split(":");
  const [cl, ag] = (m.dossier ?? "").split("|");
  const a = e.agents.find((x) => x.id === ag?.replace("agent:", ""));
  const c = e.clients.find((x) => x.id === cl?.replace("client:", ""));
  const jour = jourDe(e.minute);
  switch (type) {
    case "lm":
      if (c) {
        if (p1 === "complete") c.forfait = Math.round((c.forfait * 1.05) / 50) * 50;
        const proba = p1 === "complete" ? 0 : p1 === "standard" ? 0.35 : 0.65;
        if (rnd() < proba) {
          e.litiges ??= [];
          e.litiges.push({ jour: jour + 60 + Math.floor(rnd() * 140), client: c.id, montant: Math.round((800 + rnd() * 3000) / 50) * 50 });
        }
        noterClient(c, jour, p1 === "complete" ? "Lettre de mission sur mesure signée." : p1 === "standard" ? "Lettre de mission standard signée." : "Pas de lettre de mission.");
      }
      return true;
    case "litige": {
      const montant = Number(m.payload?.montant ?? 1000);
      if (p1 === "ordre") {
        if (rnd() < 0.6) {
          e.tresorerie += montant;
          log(e, `💢 Conciliation de l'Ordre : ${c?.nom ?? "le client"} règle les ${euros(montant)}.`, "bien");
        } else {
          e.tresorerie += montant * 0.3;
          if (c) c.satisfaction = clamp(c.satisfaction - 10);
          log(e, `💢 Conciliation difficile avec ${c?.nom ?? "le client"} : tu ne récupères que 30 %.`, "mal");
        }
      } else if (p1 === "moitie") e.tresorerie += montant * 0.5;
      return true;
    }
    case "cf":
      etapeControle(e, p1, Number(p2));
      return true;
    case "cloture": {
      const part = Number(p1);
      const net = Number(m.payload?.net ?? 0);
      e.tresorerie -= net * part;
      for (const x of e.agents.filter((y) => y.filiere === "associe")) {
        const veutDividendes = x.personnalite !== "ambitieux";
        x.confiance = clamp(x.confiance + (veutDividendes ? (part >= 0.5 ? 6 : -6) : part === 0 ? 6 : -4));
      }
      if (part === 0) e.reputation = clamp(e.reputation + 1);
      return true;
    }
    case "objectifs":
      e.compteurs.objectifs = Number(p1);
      return true;
    case "retraite": {
      const id = a?.id;
      if (!id) return true;
      e.compteurs[`retraiteChoix:${id}`] = Number(p1);
      const manager = String(m.payload?.manager ?? "");
      if (p1 === "1" && manager) e.compteurs[`successeur:${manager}`] = 1;
      return true;
    }
    case "mentorat_oui": {
      const f = String(m.payload?.filiere ?? a?.filiere ?? "expertise");
      e.compteurs[`outil:${f}`] = jour + 90;
      if (a) dire(e, a, "Je prépare mes slides !", 40);
      return true;
    }
    case "mentorat_non":
      return true;
  }
  return false;
}

/** Utilisé par la fiche : le contrôle fiscal en cours d'un client. */
export const controleDe = (e: Etat, clientId: string) => (e.controles ?? []).find((k) => k.client === clientId);

// Sixième vague : fréquence des événements, objectifs de partie et écran de
// victoire, succès cachés, bac à sable, conjoncture économique, partenaires
// prescripteurs, coworking, risques du cabinet, tenues, mobilité, mentor de
// l'année et comptes simplifiés d'un client.

import { anneeDe, dateDe, jourDe, moisDe } from "@/lib/calendrier";
import { BADGES } from "@/lib/data/formation";
import { clamp, dire, donnerBadge, hash, log, rnd } from "@/lib/moteur";
import { classement } from "@/lib/vie3";
import { souvenir } from "@/lib/vie2";
import type { Agent, Client, Etat } from "@/lib/types";

const metier = (a: Agent) => ["expertise", "fiscal", "social", "juridique", "audit"].includes(a.filiere);
const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

// ---------- 1. objectifs de partie ----------

export const OBJECTIFS = [
  { id: "n1", nom: "N°1 de la région", texte: "Prendre la tête du classement régional en moins de 5 ans.", delai: 5 * 365 },
  { id: "ca", nom: "10 millions de chiffre d'affaires", texte: "Atteindre 10 M€ de chiffre d'affaires annuel.", delai: 8 * 365 },
  { id: "dec", nom: "Experte-comptable", texte: "Réussir la soutenance de ton mémoire en moins de 3 ans.", delai: 3 * 365 },
  { id: "conseil", nom: "Cabinet de conseil", texte: "Faire du conseil 40 % de ton chiffre d'affaires mensuel.", delai: 4 * 365 },
  { id: "equipe", nom: "Le campus des 200", texte: "Réunir 200 personnes (siège et agences) avec un moral moyen au-dessus de 65.", delai: 6 * 365 },
] as const;

export function choisirObjectif(e: Etat, id: string): string | null {
  e.compteurs.objectif = OBJECTIFS.findIndex((o) => o.id === id) + 1;
  e.compteurs.objectifDebut = jourDe(e.minute);
  delete e.compteurs.victoire;
  delete e.compteurs.defaite;
  return null;
}

export function progressionObjectif(e: Etat) {
  const i = (e.compteurs.objectif ?? 0) - 1;
  const o = OBJECTIFS[i];
  if (!o) return null;
  const jour = jourDe(e.minute);
  const restant = o.delai - (jour - (e.compteurs.objectifDebut ?? 0));
  let pct = 0;
  let detail = "";
  if (o.id === "n1") {
    const rang = classement(e).findIndex((l) => l.moi) + 1;
    pct = rang === 1 ? 100 : Math.max(0, 100 - (rang - 1) * 15);
    detail = `${rang}ᵉ du classement`;
  } else if (o.id === "ca") {
    const ca = e.clients.reduce((s, c) => s + c.forfait, 0) * 12 + (e.agences ?? []).reduce((s, a) => s + a.caMois * 12, 0);
    pct = Math.min(100, (ca / 10_000_000) * 100);
    detail = `${euros(ca)} / an`;
  } else if (o.id === "dec") {
    pct = e.compteurs.diplomee ? 100 : e.memoire.soutenu ? 80 : (e.memoire.etape / 6) * 70;
    detail = e.compteurs.diplomee ? "Diplômée !" : `Mémoire : étape ${e.memoire.etape}`;
  } else if (o.id === "conseil") {
    const c = e.compteurs.caConseilDernier ?? 0;
    const p = e.compteurs.caProdDernier ?? 0;
    const part = c + p ? (c / (c + p)) * 100 : 0;
    pct = Math.min(100, (part / 40) * 100);
    detail = `${Math.round(part)} % du CA en conseil`;
  } else {
    const n = e.agents.length + (e.agences ?? []).reduce((s, a) => s + a.effectif, 0);
    const moral = e.agents.reduce((s, a) => s + a.moral, 0) / Math.max(1, e.agents.length);
    pct = Math.min(100, (n / 200) * (moral >= 65 ? 100 : 90));
    detail = `${n} personnes · moral ${Math.round(moral)}`;
  }
  return { ...o, pct: Math.round(pct), detail, restant };
}

function verifierObjectif(e: Etat) {
  const p = progressionObjectif(e);
  if (!p || e.compteurs.victoire || e.compteurs.defaite) return;
  if (p.pct >= 100) {
    e.compteurs.victoire = jourDe(e.minute);
    souvenir(e, "🏆", `Objectif atteint : ${p.nom}`);
    log(e, `🏆 VICTOIRE : objectif « ${p.nom} » atteint !`, "bien");
  } else if (p.restant <= 0) {
    e.compteurs.defaite = jourDe(e.minute);
    log(e, `⌛ L'objectif « ${p.nom} » n'est pas atteint dans les temps. Tu peux continuer ta partie ou choisir un nouvel objectif.`, "mal");
  }
}

// ---------- 2. succès cachés ----------

type Succes = { id: string; nom: string; icone: string; description: string; test: (e: Etat) => boolean };
const nb = (e: Etat, k: string) => e.compteurs[k] ?? 0;

export const SUCCES: Succes[] = [
  { id: "s_10clients", nom: "Portefeuille solide", icone: "📈", description: "Avoir 10 clients", test: (e) => e.clients.length >= 10 },
  { id: "s_50clients", nom: "Cabinet qui compte", icone: "🏢", description: "Avoir 50 clients", test: (e) => e.clients.length >= 50 },
  { id: "s_25agents", nom: "Belle équipe", icone: "👥", description: "Réunir 25 collaborateurs", test: (e) => e.agents.length >= 25 },
  { id: "s_100agents", nom: "Campus géant", icone: "🏙️", description: "Réunir 100 collaborateurs", test: (e) => e.agents.length >= 100 },
  { id: "s_million", nom: "Premier million", icone: "💰", description: "Dépasser 1 M€ de trésorerie", test: (e) => e.tresorerie >= 1_000_000 },
  { id: "s_moral90", nom: "Bonheur au travail", icone: "😄", description: "Moral moyen au-dessus de 90", test: (e) => e.agents.length >= 5 && e.agents.reduce((s, a) => s + a.moral, 0) / e.agents.length >= 90 },
  { id: "s_zero_stress", nom: "Zen", icone: "🧘", description: "Stress moyen sous 20 avec au moins 10 personnes", test: (e) => e.agents.length >= 10 && e.agents.reduce((s, a) => s + a.stress, 0) / e.agents.length < 20 },
  { id: "s_reput90", nom: "Réputation en or", icone: "⭐", description: "Réputation de 90 ou plus", test: (e) => e.reputation >= 90 },
  { id: "s_3managers", nom: "Pépinière de talents", icone: "🌱", description: "Promouvoir 3 managers", test: (e) => (e.promotions ?? []).filter((p) => /manager/i.test(p.poste)).length >= 3 },
  { id: "s_10promos", nom: "Ascenseur social", icone: "🛗", description: "10 promotions", test: (e) => (e.promotions ?? []).length >= 10 },
  { id: "s_agence", nom: "Conquête", icone: "🗺️", description: "Ouvrir une agence", test: (e) => (e.agences ?? []).length >= 1 },
  { id: "s_3agences", nom: "Réseau national", icone: "🇫🇷", description: "Ouvrir 3 agences", test: (e) => (e.agences ?? []).length >= 3 },
  { id: "s_label", nom: "Qualité certifiée", icone: "🏅", description: "Obtenir le label qualité", test: (e) => !!e.compteurs.label },
  { id: "s_creche", nom: "Cabinet familial", icone: "🧸", description: "Ouvrir la crèche", test: (e) => !!e.compteurs.creche },
  { id: "s_cyber", nom: "Bouclier", icone: "🛡️", description: "Former l'équipe à la cybersécurité ou repousser une attaque", test: (e) => nb(e, "cyber") >= 2 },
  { id: "s_defis10", nom: "Inarrêtable", icone: "🔥", description: "Réussir 10 défis de la semaine", test: (e) => nb(e, "defis") >= 10 },
  { id: "s_reunions", nom: "Manager né", icone: "🎙️", description: "Animer 10 réunions de managers", test: (e) => nb(e, "reunions") >= 10 },
  { id: "s_cas50", nom: "Machine à réviser", icone: "🧮", description: "Réussir 50 contrôles et cas pratiques", test: (e) => nb(e, "cas_ok") >= 50 },
  { id: "s_livres100", nom: "Centurion", icone: "💯", description: "Livrer 100 dossiers", test: (e) => nb(e, "livres") >= 100 },
  { id: "s_livres500", nom: "Usine à bilans", icone: "🏭", description: "Livrer 500 dossiers", test: (e) => nb(e, "livres") >= 500 },
  { id: "s_photos", nom: "Photographe", icone: "📸", description: "Prendre 5 photos du cabinet", test: (e) => (e.souvenirs ?? []).filter((s) => s.emoji === "📸").length >= 5 },
  { id: "s_album", nom: "Mémoire vive", icone: "📚", description: "30 souvenirs dans l'album", test: (e) => (e.souvenirs ?? []).length >= 30 },
  { id: "s_vacances", nom: "Équilibre", icone: "🏖️", description: "Poser des vacances", test: (e) => e.compteurs.dernieresVacances !== undefined },
  { id: "s_forme", nom: "Pleine forme", icone: "🔋", description: "Finir une journée avec 100 de forme et 5 décisions prises", test: (e) => (e.compteurs.formeToi ?? 100) >= 100 && e.messages.filter((m) => m.statut === "repondu" && m.jour === jourDe(e.minute)).length >= 5 },
  { id: "s_partenaires", nom: "Carnet d'adresses", icone: "🤝", description: "Trois partenaires au-dessus de 70 de relation", test: (e) => ["banque", "notaire", "avocat"].every((p) => nb(e, `part_${p}`) >= 70) },
  { id: "s_recession", nom: "Tempête traversée", icone: "⛈️", description: "Traverser une récession sans perdre de client", test: (e) => nb(e, "recessionsTraversees") >= 1 },
  { id: "s_tarif", nom: "Haut de gamme", icone: "💎", description: "Garder des tarifs à 120 % et une satisfaction moyenne de 70", test: (e) => nb(e, "tarif") >= 120 && e.clients.length >= 5 && e.clients.reduce((s, c) => s + c.satisfaction, 0) / e.clients.length >= 70 },
  { id: "s_examen", nom: "Prête pour le DEC", icone: "📝", description: "Obtenir 16/20 à l'examen blanc", test: (e) => nb(e, "examenMeilleur") >= 16 },
  { id: "s_mentor", nom: "Transmission", icone: "🎗️", description: "Élire un mentor de l'année", test: (e) => nb(e, "mentorAnnee") > 0 },
  { id: "s_conseil20", nom: "Conseil de confiance", icone: "💼", description: "Le conseil dépasse 20 % du chiffre d'affaires d'un mois", test: (e) => { const c = e.compteurs.caConseilDernier ?? 0; const p = e.compteurs.caProdDernier ?? 0; return c + p > 0 && c / (c + p) >= 0.2; } },
  { id: "s_abonnes10", nom: "Partenaire des dirigeants", icone: "📈", description: "10 clients abonnés au conseil", test: (e) => e.clients.filter((c) => c.abonnement).length >= 10 },
  { id: "s_daf", nom: "DAF externalisée", icone: "🏦", description: "Signer une direction financière externalisée", test: (e) => e.clients.some((c) => c.abonnement === 3) },
  { id: "s_victoire", nom: "Mission accomplie", icone: "👑", description: "Atteindre un objectif de partie", test: (e) => !!e.compteurs.victoire },
];
for (const s of SUCCES) if (!BADGES.some((b) => b.id === s.id)) BADGES.push({ id: s.id, nom: s.nom, description: s.description, icone: s.icone });

function verifierSucces(e: Etat) {
  for (const s of SUCCES) if (!e.badges.some((b) => b.id === s.id) && s.test(e)) donnerBadge(e, s.id);
}

// ---------- 3. conjoncture ----------

export const CONJONCTURES = [
  { nom: "Économie stable", emoji: "🌤️", texte: "Activité normale." },
  { nom: "Croissance", emoji: "📈", texte: "Les créations d'entreprises explosent : plus de prospects." },
  { nom: "Récession", emoji: "🌧️", texte: "Défaillances en hausse, clients sous pression sur les honoraires." },
  { nom: "Inflation", emoji: "🔥", texte: "Les salariés réclament des hausses de salaire, les clients rognent sur les honoraires." },
];

function conjoncture(e: Etat, jour: number) {
  if ([1, 4, 7, 10].includes(moisDe(jour))) {
    const avant = e.compteurs.conjoncture ?? 0;
    const r = rnd();
    const nouvelle = r < 0.45 ? 0 : r < 0.72 ? 1 : r < 0.86 ? 2 : 3;
    if (avant === 2 && nouvelle !== 2 && nb(e, "clientsAvantRecession") && e.clients.length >= nb(e, "clientsAvantRecession")) e.compteurs.recessionsTraversees = nb(e, "recessionsTraversees") + 1;
    if (nouvelle === 2 && avant !== 2) e.compteurs.clientsAvantRecession = e.clients.length;
    e.compteurs.conjoncture = nouvelle;
    if (nouvelle !== avant) log(e, `${CONJONCTURES[nouvelle].emoji} Conjoncture : ${CONJONCTURES[nouvelle].nom}. ${CONJONCTURES[nouvelle].texte}`, nouvelle === 1 ? "bien" : nouvelle === 0 ? "neutre" : "mal");
  }
  const c = e.compteurs.conjoncture ?? 0;
  if (c === 1) e.compteurs.reseauBoost = nb(e, "reseauBoost") + 1;
  if (c === 2) for (const x of e.clients) x.satisfaction = clamp(x.satisfaction - 2);
  if (c === 3) for (const a of e.agents) a.moral = clamp(a.moral - 2);
}

// ---------- 4. partenaires prescripteurs ----------

export const PARTENAIRES = [
  { id: "banque", nom: "Banque Régionale du Littoral", role: "Banquier d'affaires", emoji: "🏦" },
  { id: "notaire", nom: "Office notarial Delacroix", role: "Notaire", emoji: "📜" },
  { id: "avocat", nom: "Cabinet Varin Avocats", role: "Avocat d'affaires", emoji: "⚖️" },
];

export function soignerPartenaire(e: Etat, id: string, action: "dejeuner" | "dossier"): string | null {
  const k = `part_${id}`;
  if (action === "dejeuner") {
    if (e.tresorerie < 150) return "Trésorerie insuffisante.";
    e.tresorerie -= 150;
    e.compteurs[k] = clamp((e.compteurs[k] ?? 30) + 12);
    e.compteurs.formeToi = clamp((e.compteurs.formeToi ?? 100) - 3);
  } else {
    if (!e.clients.length) return "Il te faut des clients à recommander.";
    e.compteurs[k] = clamp((e.compteurs[k] ?? 30) + 8);
    log(e, `🤝 Tu recommandes un client à ${PARTENAIRES.find((p) => p.id === id)?.nom}. Il s'en souviendra.`, "neutre");
  }
  return null;
}

function moisPartenaires(e: Etat) {
  for (const p of PARTENAIRES) {
    const k = `part_${p.id}`;
    const v = e.compteurs[k] ?? 30;
    if (v >= 60 && rnd() < (v - 40) / 100) {
      e.compteurs.reseauBoost = nb(e, "reseauBoost") + 2;
      log(e, `${p.emoji} ${p.nom} t'envoie un nouveau client potentiel.`, "bien");
    }
    e.compteurs[k] = clamp(v - 4);
  }
}

// ---------- 5. coworking, mobilité, tenues ----------

export function basculer(e: Etat, cle: "coworking" | "mobilite", v: boolean): string | null {
  if (v && cle === "coworking" && e.tresorerie < 2000) return "Trésorerie insuffisante.";
  e.compteurs[cle] = v ? 1 : 0;
  log(e, cle === "coworking" ? (v ? "🏙️ Un espace de coworking en centre-ville accueille désormais tes rendez-vous clients." : "🏙️ Fin du coworking.") : v ? "🚲 Forfait mobilités durables mis en place : vélos de fonction et covoiturage." : "🚲 Fin du forfait mobilités.", "neutre");
  return null;
}

export function fixerDressCode(e: Etat, v: number): string | null {
  e.compteurs.dresscode = v;
  return null;
}

/** Tenue du jour : vendredi décontracté ou tous les jours selon le dress code. */
export function tenueDecontractee(e: Etat) {
  const d = e.compteurs.dresscode ?? 0;
  return d === 2 || (d === 1 && dateDe(jourDe(e.minute)).getUTCDay() === 5);
}

function moisServices(e: Etat) {
  if (e.compteurs.coworking) e.tresorerie -= 2000;
  if (e.compteurs.mobilite) {
    e.tresorerie -= 25 * e.agents.length;
    for (const a of e.agents) a.moral = clamp(a.moral + 1);
  }
  const d = e.compteurs.dresscode ?? 0;
  if (d > 0) for (const a of e.agents) a.moral = clamp(a.moral + d);
  if (e.compteurs.hommeCle) e.tresorerie -= 250;
}

// ---------- 6. risques du cabinet ----------

export function risquesCabinet(e: Etat) {
  const ca = e.clients.reduce((s, c) => s + c.forfait, 0) || 1;
  const top = [...e.clients].sort((a, b) => b.forfait - a.forfait)[0];
  const part = top ? (top.forfait / ca) * 100 : 0;
  const associes = e.agents.filter((a) => a.filiere === "associe").length;
  const niveau = (v: number) => (v >= 2 ? "élevé" : v >= 1 ? "moyen" : "faible");
  return [
    { nom: "Dépendance à un client", niveau: niveau(part > 20 ? 2 : part > 10 ? 1 : 0), detail: top ? `${top.nom} pèse ${Math.round(part)} % des honoraires.` : "Pas de client." },
    { nom: "Homme-clé (toi)", niveau: niveau(e.compteurs.hommeCle ? 0 : associes >= 2 ? 1 : 2), detail: e.compteurs.hommeCle ? "Assurance homme-clé souscrite." : associes >= 2 ? "Des associés peuvent te remplacer." : "Le cabinet repose sur toi seule." },
    { nom: "Cybersécurité", niveau: niveau((e.compteurs.cyber ?? 0) >= 2 ? 0 : (e.logiciels?.production ?? 0) > 0 ? 1 : 2), detail: (e.compteurs.cyber ?? 0) >= 2 ? "Équipe formée, sauvegardes hors ligne." : "Équipe non formée au phishing." },
    { nom: "Responsabilité professionnelle", niveau: niveau((e.risquesRC ?? []).length >= 2 ? 2 : (e.risquesRC ?? []).length ? 1 : 0), detail: `${(e.risquesRC ?? []).length} erreur(s) passée(s) inaperçue(s).` },
    { nom: "Juridique et litiges", niveau: niveau((e.litiges ?? []).length >= 2 ? 2 : (e.litiges ?? []).length ? 1 : 0), detail: `${(e.litiges ?? []).length} litige(s) d'honoraires à venir.` },
    { nom: "Ressources humaines", niveau: niveau(e.agents.length && e.agents.reduce((s, a) => s + a.stress, 0) / e.agents.length > 60 ? 2 : e.agents.some((a) => a.burnout) ? 1 : 0), detail: "Stress, épuisement et départs." },
  ];
}

// ---------- 7. mentor de l'année ----------

function mentorAnnee(e: Etat, jour: number) {
  if (moisDe(jour) !== 12 || e.compteurs.mentorAnnee === anneeDe(jour)) return;
  const tuteurs = e.agents.filter((a) => metier(a) && e.agents.some((x) => x.parrain === a.id));
  const candidats = tuteurs.length ? tuteurs : e.agents.filter((a) => metier(a) && /senior|manager/i.test(a.poste));
  if (!candidats.length) return;
  e.compteurs.mentorAnnee = anneeDe(jour);
  const elu = [...candidats].sort((a, b) => b.confiance + b.competence - (a.confiance + a.competence))[0];
  elu.moral = clamp(elu.moral + 15);
  elu.confiance = clamp(elu.confiance + 10);
  for (const a of e.agents) a.moral = clamp(a.moral + 2);
  dire(e, elu, "Merci à tous, ça me touche !", 60);
  log(e, `🎗️ Cérémonie : ${elu.prenom} ${elu.nom} est élu·e mentor de l'année par ses collègues.`, "bien");
  souvenir(e, "🎗️", `${elu.prenom}, mentor de l'année ${anneeDe(jour)}`);
}

// ---------- 8. comptes simplifiés d'un client (consultation) ----------

export function comptesClient(c: Client) {
  const k = hash(c.id + c.nom);
  const ca = Math.round((c.forfait * 12 * (25 + (k % 30))) / 1000) * 1000;
  const achats = Math.round(ca * (0.3 + (k % 20) / 100));
  const personnel = Math.round(ca * (0.25 + (k % 15) / 100));
  const externes = Math.round(ca * 0.12);
  const amort = Math.round(ca * 0.04);
  const rex = ca - achats - personnel - externes - amort;
  const fin = -Math.round(ca * 0.01);
  const is = Math.max(0, Math.round(Math.min(rex + fin, 42500) * 0.15 + Math.max(0, rex + fin - 42500) * 0.25));
  const net = rex + fin - is;
  const immo = Math.round(ca * 0.3);
  const stocks = Math.round(ca * 0.08);
  const creances = Math.round((ca * 1.2 * 45) / 365);
  const treso = Math.round(ca * 0.1);
  const capitaux = Math.round(ca * 0.25) + net;
  const emprunts = Math.round(ca * 0.15);
  const dettes = immo + stocks + creances + treso - capitaux - emprunts;
  return {
    resultat: [
      ["Chiffre d'affaires", ca],
      ["Achats consommés", -achats],
      ["Charges de personnel", -personnel],
      ["Charges externes", -externes],
      ["Dotations aux amortissements", -amort],
      ["Résultat d'exploitation", rex],
      ["Résultat financier", fin],
      ["Impôt sur les sociétés", -is],
      ["Résultat net", net],
    ] as [string, number][],
    actif: [
      ["Immobilisations nettes", immo],
      ["Stocks", stocks],
      ["Créances clients", creances],
      ["Trésorerie", treso],
    ] as [string, number][],
    passif: [
      ["Capitaux propres", capitaux],
      ["Emprunts", emprunts],
      ["Dettes fournisseurs, fiscales et sociales", dettes],
    ] as [string, number][],
    ratios: [
      ["Taux de marge d'exploitation", `${Math.round((rex / ca) * 100)} %`],
      ["Délai clients", `${Math.round((creances / (ca * 1.2)) * 365)} jours`],
      ["Autonomie financière", `${Math.round((capitaux / (capitaux + emprunts + dettes)) * 100)} %`],
    ] as [string, string][],
  };
}

// ---------- hooks ----------

export function debutJourneeVie6(e: Etat, jour: number, premierDuMois: boolean) {
  if (e.compteurs.bacasable && e.tresorerie < 100_000_000) e.tresorerie = 1_000_000_000;
  verifierSucces(e);
  verifierObjectif(e);
  if (premierDuMois && jour > 0) {
    conjoncture(e, jour);
    moisPartenaires(e);
    moisServices(e);
    mentorAnnee(e, jour);
  }
}

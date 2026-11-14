// Troisième vague : carrières (Stagiaire → Assistant → Confirmé → Senior →
// Manager), alternants, burn-out, revue de dossier interactive, mise en
// cause de responsabilité (RC Pro), clients qui grandissent, saison fiscale,
// agences, classement régional et soutenance du mémoire devant le jury.

import { anneeDe, dateDe, jourDe, minuteDuJour, moisDe } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { ajouterCarnet, ajouterJoursOuvres, bureauPour, clamp, depart, dire, donnerBadge, hash, log, pick, rnd, uid, validerDossier } from "@/lib/moteur";
import { CHEVEUX, COULEURS, NOMS, PEAUX, PERSONNALITES, PRENOMS } from "@/lib/data/equipe";
import { souvenir } from "@/lib/vie2";
import type { Agent, Client, Dossier, Etat, Filiere, LigneRevue, Message, OptionDilemme } from "@/lib/types";

const opt = (label: string, code: string, effets: OptionDilemme["effets"] = {}, resultat = "C'est noté."): OptionDilemme => ({ label, cout: 0, effets, resultat, action: "vie", code });
const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const metier = (a: Agent) => ["expertise", "fiscal", "social", "juridique", "audit"].includes(a.filiere);

// ---------- 1. carrières ----------

export const ECHELLE: Record<string, string[]> = {
  expertise: ["Stagiaire", "Assistant comptable", "Collaborateur confirmé", "Senior", "Manager"],
  fiscal: ["Stagiaire fiscal", "Fiscaliste junior", "Collaborateur confirmé", "Senior fiscal", "Manager fiscal"],
  social: ["Stagiaire paie", "Assistant paie", "Gestionnaire de paie", "Senior paie", "Manager social"],
  juridique: ["Stagiaire juriste", "Juriste junior", "Juriste", "Juriste senior", "Manager juridique"],
  audit: ["Stagiaire audit", "Auditeur junior", "Auditeur", "Auditeur senior", "Manager audit"],
};
const SEUIL = [0, 45, 60, 72, 82];
const HAUSSE = [0, 700, 600, 600, 700];
export const NOMS_GRADES = ["Stagiaire", "Assistant", "Confirmé", "Senior", "Manager"];

export function gradeDe(a: Agent): number {
  const ech = ECHELLE[a.filiere];
  const i = ech ? ech.indexOf(a.poste) : -1;
  if (i >= 0) return i;
  const p = a.poste.toLowerCase();
  if (/stagiaire|alternant/.test(p)) return 0;
  if (/assistant|junior/.test(p)) return 1;
  if (/senior|chef de mission|cheffe de mission/.test(p)) return 3;
  if (/manager/.test(p)) return 4;
  return 2;
}

function promouvoir(e: Agent, etat: Etat) {
  const g = gradeDe(e);
  const ech = ECHELLE[e.filiere];
  if (!ech || g >= 4) return;
  e.poste = ech[g + 1];
  e.salaire += HAUSSE[g + 1];
  e.moral = clamp(e.moral + 15);
  e.confiance = clamp(e.confiance + 8);
  e.ecole = undefined;
  etat.promotions ??= [];
  etat.promotions.unshift({ jour: jourDe(etat.minute), prenom: e.prenom, nom: e.nom, poste: e.poste, couleur: e.couleur });
  if (etat.promotions.length > 60) etat.promotions.length = 60;
  log(etat, `🎉 ${e.prenom} ${e.nom} est promu·e ${e.poste} (+${HAUSSE[g + 1]} € brut). Sa photo rejoint le mur des promotions.`, "bien");
  dire(etat, e, "Merci, je ne te décevrai pas !", 60);
  if (g + 1 === 4) souvenir(etat, "🏅", `${e.prenom} devient ${e.poste}`);
}

function demandesPromotion(e: Etat, jour: number) {
  const prets = e.agents.filter((a) => metier(a) && !a.ecole && gradeDe(a) < 4 && a.competence >= SEUIL[gradeDe(a) + 1] && jour - a.embauche >= 120 && (e.compteurs[`promo:${a.id}`] ?? 0) <= jour);
  for (const a of prets.slice(0, 2)) {
    const g = gradeDe(a);
    const vers = ECHELLE[a.filiere][g + 1];
    e.compteurs[`promo:${a.id}`] = jour + 180;
    messageSpecial(e, a.id, 3, `📈 ${a.prenom} demande à passer ${vers}`, `${a.prenom} (${a.poste}, compétence ${Math.round(a.competence)}/100, ${Math.round((jour - a.embauche) / 30)} mois de maison) estime avoir le niveau pour passer ${vers}. Sa ou son manager confirme la qualité de son travail.`, `client:|agent:${a.id}`, {}, [
      opt(`Promouvoir ${vers} (+${HAUSSE[g + 1]} € brut / mois)`, "promo_oui", {}, "Promotion annoncée à toute l'équipe."),
      opt("Fixer des objectifs et revoir dans 6 mois", "promo_attendre", { confianceAgent: -3 }, "Ok, mais il ou elle attend des objectifs clairs."),
      opt("Refuser pour l'instant", "promo_non", { confianceAgent: -12, moralEquipe: -2 }, "La déception se lit sur son visage."),
    ]);
  }
}

/** Anciennes sauvegardes : « Chef de mission » devient « Senior ». */
export function migrerCarriere(e: Etat) {
  for (const a of e.agents) if (/^chef(fe)? de mission$/i.test(a.poste)) a.poste = "Senior";
  for (const c of e.candidats) if (/^chef(fe)? de mission$/i.test(c.poste)) c.poste = "Senior";
}

// ---------- 2. stagiaires et alternants ----------

const ECOLES = ["DCG — lycée Montaigne", "DSCG — IAE", "Master CCA — université", "Bachelor comptabilité — école de commerce", "DSCG — Intec"];

function rentreeAlternants(e: Etat, jour: number) {
  if (moisDe(jour) !== 9 || e.compteurs.alternantsAnnee === anneeDe(jour)) return;
  const tuteurs = e.agents.filter((a) => metier(a) && gradeDe(a) >= 3);
  if (!tuteurs.length) return;
  e.compteurs.alternantsAnnee = anneeDe(jour);
  messageSpecial(e, "cabinet", 3, "🎒 Rentrée des alternants", `Les écoles t'envoient des candidatures d'alternants (DCG, DSCG, master CCA). Un alternant coûte environ 1 200 € brut par mois, alterne école et cabinet, et a besoin d'un tuteur senior. Combien en accueilles-tu ?`, "client:|agent:", {}, [
    opt("Deux alternants, avec un tuteur chacun", "alternants:2", {}, "Ils arrivent lundi avec leur planning d'alternance."),
    opt("Un seul alternant", "alternants:1", {}, "Bienvenue à la nouvelle recrue."),
    opt("Aucun cette année", "alternants:0", {}, "Pas d'alternant cette année."),
  ]);
}

function accueillirAlternants(e: Etat, n: number) {
  const jour = jourDe(e.minute);
  const tuteurs = e.agents.filter((a) => metier(a) && gradeDe(a) >= 3).sort((a, b) => b.competence - a.competence);
  for (let i = 0; i < n; i++) {
    const filiere: Filiere = pick(["expertise", "expertise", "fiscal", "social", "audit"]);
    const bureau = bureauPour(e, filiere);
    if (bureau < 0) {
      log(e, "🎒 Plus de bureau libre pour accueillir un alternant : agrandis tes locaux.", "mal");
      return;
    }
    const prenom = pick(PRENOMS);
    const tuteur = tuteurs[i % Math.max(1, tuteurs.length)];
    e.agents.push({
      id: uid(e, "a"),
      prenom,
      nom: pick(NOMS),
      poste: ECHELLE[filiere][0].replace("Stagiaire", "Alternant"),
      filiere,
      personnalite: pick(PERSONNALITES),
      couleur: pick(COULEURS),
      cheveux: pick(CHEVEUX),
      peau: pick(PEAUX),
      bureau,
      competence: 28 + Math.round(rnd() * 10),
      stress: 15,
      fatigue: 0,
      moral: 85,
      confiance: 70,
      salaire: 1200,
      activite: "absent",
      activiteJusqua: 0,
      absentJusquau: 0,
      embauche: jour,
      bulle: null,
      bulleJusqua: 0,
      clan: null,
      ecole: pick(ECOLES),
      parrain: tuteur?.id,
    } as Agent);
    log(e, `🎒 ${prenom} rejoint le cabinet en alternance${tuteur ? `, tutoré·e par ${tuteur.prenom}` : ""}.`, "bien");
  }
}

function suiviAlternants(e: Etat, jour: number) {
  const alternants = e.agents.filter((a) => a.ecole);
  if (moisDe(jour) === 2 && e.compteurs.evalAlternants !== anneeDe(jour) && alternants.length) {
    e.compteurs.evalAlternants = anneeDe(jour);
    const a = alternants[0];
    messageSpecial(e, a.id, 2, `📝 L'école de ${a.prenom} demande l'évaluation du tuteur`, `${a.ecole} demande la grille d'évaluation de mi-parcours de ${a.prenom} (compétence ${Math.round(a.competence)}/100).`, `client:|agent:${a.id}`, {}, [
      opt("Évaluation honnête avec axes de progrès", "eval_honnete", { competenceAgent: 4, confianceAgent: 3 }, "L'école salue la qualité du suivi."),
      opt("Évaluation élogieuse pour lui faire plaisir", "eval_eloge", { confianceAgent: 6 }, "Content·e, mais sans piste pour progresser."),
    ]);
  }
  if (moisDe(jour) === 8 && e.compteurs.finAlternance !== anneeDe(jour) && alternants.length) {
    e.compteurs.finAlternance = anneeDe(jour);
    for (const a of alternants) {
      const note = Math.min(19, Math.round(8 + a.competence / 8));
      messageSpecial(e, a.id, 3, `🎓 Fin d'alternance de ${a.prenom}`, `${a.prenom} termine son alternance (${a.ecole}) avec ${note}/20. L'embaucher en CDI comme ${ECHELLE[a.filiere]?.[1] ?? "assistant"} (2 200 € brut) ?`, `client:|agent:${a.id}`, {}, [
        opt("Proposer un CDI", "alternant_cdi", {}, `${a.prenom} accepte avec le sourire !`),
        opt("Ne pas garder", "alternant_fin", {}, `${a.prenom} part vers d'autres horizons.`),
      ]);
    }
  }
}

// ---------- 3. burn-out et mi-temps thérapeutique ----------

function burnout(e: Etat, jour: number) {
  for (const a of e.agents) {
    if (a.burnout === "arret" && a.activite !== "malade" && jour >= a.absentJusquau) {
      a.burnout = "repris";
      messageSpecial(e, a.id, 4, `🩺 Retour de ${a.prenom} après son arrêt`, `Le médecin du travail a vu ${a.prenom}. Il préconise une reprise progressive. Comment organises-tu son retour ?`, `client:|agent:${a.id}`, {}, [
        opt("Mi-temps thérapeutique pendant 3 mois", "mitemps", { confianceAgent: 15, stressAgent: -20 }, "Retour en douceur, le pôle se réorganise."),
        opt("Reprise à temps plein", "reprise_plein", { stressAgent: 10 }, "Retour direct… espérons que ça tienne."),
        opt("Proposer une rupture conventionnelle", "rupture", { moralEquipe: -6 }, "L'équipe vit mal ce départ."),
      ]);
      continue;
    }
    if (!metier(a) || a.burnout || a.activite === "malade" || a.stress < 92 || a.fatigue < 80 || rnd() > 0.2) continue;
    a.burnout = "arret";
    a.activite = "malade";
    a.absentJusquau = ajouterJoursOuvres(jour, 20);
    for (const d of e.dossiers) if (d.agent === a.id && d.phase < 5) d.agent = null;
    log(e, `🩺 ${a.prenom} est en arrêt pour épuisement professionnel (4 semaines). Ses dossiers sont à réattribuer.`, "mal");
    for (const x of e.agents) x.moral = clamp(x.moral - 4);
  }
}

/** Coefficient de productivité individuel (mi-temps thérapeutique). */
export const facteurAgent = (e: Etat, a: Agent) => (a.miTempsJusquau && a.miTempsJusquau > jourDe(e.minute) ? 0.5 : 1);

// ---------- 4. revue de dossier interactive ----------

const NORMALES: [string, string, number, number][] = [
  ["607", "Achats de marchandises", 40000, 180000],
  ["6411", "Salaires bruts", 60000, 240000],
  ["613", "Loyer des locaux (12 mois)", 12000, 36000],
  ["6811", "Dotations aux amortissements", 4000, 25000],
  ["411", "Clients (solde au 31/12)", 15000, 90000],
  ["401", "Fournisseurs (solde au 31/12)", 10000, 60000],
  ["616", "Primes d'assurance", 1500, 8000],
  ["706", "Prestations de services", 120000, 600000],
  ["626", "Frais postaux et télécom", 800, 4000],
  ["44566", "TVA déductible sur ABS", 6000, 30000],
  ["2154", "Matériel industriel", 20000, 120000],
  ["164", "Emprunt bancaire", 30000, 200000],
];

const ANOMALIES: { compte: string; libelle: string; montant: [number, number]; faute: string }[] = [
  { compte: "6063", libelle: "Petit équipement : ordinateur portable du gérant", montant: [1600, 2400], faute: "Un ordinateur à plus de 500 € HT est une immobilisation (2183) à amortir, pas une charge de petit équipement." },
  { compte: "625", libelle: "Réceptions : séjour en Grèce du dirigeant et de sa famille", montant: [3200, 6500], faute: "Dépense personnelle : à imputer en compte courant d'associé, non déductible (risque d'acte anormal de gestion)." },
  { compte: "512", libelle: "Banque : écart non expliqué avec le relevé au 31/12", montant: [1200, 4800], faute: "Tout écart au rapprochement bancaire doit être justifié avant clôture." },
  { compte: "411", libelle: "Client placé en liquidation judiciaire en 2024", montant: [4000, 12000], faute: "Créance irrécouvrable : perte (654) ou à défaut dépréciation à 100 % (491)." },
  { compte: "44566", libelle: "TVA déductible sur l'achat de la voiture de tourisme du gérant", montant: [3000, 7000], faute: "TVA sur véhicule de tourisme non déductible : à réintégrer dans le coût du véhicule." },
  { compte: "6226", libelle: "Honoraires : facture de l'avocat datée du 15 janvier N+1", montant: [1500, 4000], faute: "Séparation des exercices : prestation de N+1, à sortir des charges de l'exercice." },
  { compte: "6411", libelle: "Salaires : prime de fin d'année versée en janvier, non provisionnée", montant: [2500, 9000], faute: "Charge de l'exercice : à constater en charges à payer (4286) avec les charges sociales." },
  { compte: "706", libelle: "Prestations : acompte reçu pour une mission de N+1", montant: [5000, 15000], faute: "Avance client (4191) ou produit constaté d'avance (487) : pas du chiffre d'affaires de l'exercice." },
  { compte: "2154", libelle: "Matériel : machine vendue en juin, toujours à l'actif", montant: [8000, 30000], faute: "Sortie d'immobilisation à constater (675 / 2815) et produit de cession en 775." },
  { compte: "455", libelle: "Compte courant d'associé débiteur (SARL)", montant: [6000, 20000], faute: "Avance d'une SARL à son gérant associé personne physique interdite (art. L223-21) : risque pénal." },
  { compte: "6234", libelle: "Cadeaux clients de 150 € TTC pièce avec TVA récupérée", montant: [900, 3000], faute: "TVA non déductible sur les cadeaux de plus de 73 € TTC par bénéficiaire et par an." },
  { compte: "681", libelle: "Pas de provision malgré un litige prud'homal perdu en 1re instance", montant: [15000, 40000], faute: "Risque probable et estimable : provision pour litige obligatoire (1511)." },
];

const arrondi = (n: number) => Math.round(n / 10) * 10;

/** Construit une feuille de révision avec 2 ou 3 anomalies cachées. */
export function genererRevue(d: Dossier): { lignes: LigneRevue[] } {
  const h = hash(d.id);
  const nb = 2 + (h % 2);
  const anomalies = [...ANOMALIES].sort(() => rnd() - 0.5).slice(0, nb);
  const normales = [...NORMALES].sort(() => rnd() - 0.5).slice(0, 8 - nb);
  const lignes: LigneRevue[] = [
    ...normales.map(([compte, libelle, a, b]) => ({ compte, libelle, montant: arrondi(a + rnd() * (b - a)) })),
    ...anomalies.map((x) => ({ compte: x.compte, libelle: x.libelle, montant: arrondi(x.montant[0] + rnd() * (x.montant[1] - x.montant[0])), anomalie: x.faute })),
  ];
  return { lignes: lignes.sort((a, b) => a.compte.localeCompare(b.compte)) };
}

export function resoudreRevue(e: Etat, msgId: string, coches: number[]): string | null {
  const m = e.messages.find((x) => x.id === msgId);
  if (!m || !m.revue || m.statut !== "attente") return "Cette revue est déjà faite.";
  e.compteurs.formeToi = clamp((e.compteurs.formeToi ?? 100) - 2);
  const lignes = m.revue.lignes;
  const trouvees = lignes.filter((l, i) => l.anomalie && coches.includes(i));
  const ratees = lignes.filter((l, i) => l.anomalie && !coches.includes(i));
  const fausses = coches.filter((i) => !lignes[i]?.anomalie).length;
  const d = e.dossiers.find((x) => x.id === m.dossier);
  const a = e.agents.find((x) => x.id === m.de);
  m.statut = "repondu";
  m.reponse = ratees.length ? `✘ ${trouvees.length}/${trouvees.length + ratees.length} anomalies trouvées. Ratée(s) : ${ratees.map((r) => `${r.compte} — ${r.anomalie}`).join(" ")}` : `✔ Toutes les anomalies trouvées (${trouvees.length})${fausses ? `, mais ${fausses} fausse(s) alerte(s)` : ""}. Revue validée.`;
  if (!d) return null;
  if (fausses > 2) {
    d.progression = 75;
    log(e, `🔎 Revue de ${d.titre} : trop de fausses alertes, ${a?.prenom ?? "l'équipe"} perd une demi-journée à vérifier.`, "mal");
    return null;
  }
  validerDossier(e, d.id);
  e.niveauDec = clamp(e.niveauDec + (ratees.length ? 1 : 3));
  if (a) a.competence = clamp(a.competence + 1, 0, 95);
  if (ratees.length) {
    const c = e.clients.find((x) => x.id === d.client);
    e.risquesRC ??= [];
    for (const r of ratees.filter(() => rnd() < 0.5)) e.risquesRC.push({ jour: jourDe(e.minute) + 40 + Math.floor(rnd() * 200), client: c?.nom ?? "un client", montant: Math.round((r.montant * (1 + rnd())) / 100) * 100, faute: r.anomalie! });
    ajouterCarnet(e, ratees.map((r) => ({ theme: "Révision", question: `${r.compte} — ${r.libelle}`, explication: r.anomalie!, jour: jourDe(e.minute) })));
    log(e, `🔎 Revue de ${d.titre} validée, mais ${ratees.length} anomalie(s) sont passées entre les mailles… Notions ajoutées au carnet.`, "mal");
  } else log(e, `🔎 Revue de ${d.titre} : sans faute, les comptes sont propres.`, "bien");
  return null;
}

// ---------- 5. responsabilité civile professionnelle ----------

function rcPro(e: Etat, jour: number, premierDuMois: boolean) {
  if (premierDuMois) {
    const prime = Math.round((120 + e.clients.length * 6) * (1 + (e.compteurs.rcMajoration ?? 0) / 100));
    e.tresorerie -= prime;
  }
  const r = (e.risquesRC ?? []).find((x) => x.jour <= jour);
  if (!r || jour - (e.compteurs.rcDernier ?? -99) < 30) return;
  e.compteurs.rcDernier = jour;
  e.risquesRC = (e.risquesRC ?? []).filter((x) => x !== r);
  messageSpecial(e, "cabinet", 5, `⚖️ ${r.client} met en cause ta responsabilité`, `L'avocat de ${r.client} t'écrit : une erreur dans les comptes que tu as validés leur a coûté ${euros(r.montant)} (redressement et pénalités). Le point soulevé : ${r.faute}`, "client:|agent:", { montant: r.montant }, [
    opt("Déclarer le sinistre à l'assureur RC Pro (franchise 3 000 €)", "rc_assureur", {}, "L'assureur prend le dossier en main ; ta prime augmentera."),
    opt(`Transiger directement (${euros(r.montant * 0.7)})`, "rc_transiger", {}, "Accord amiable signé, sans bruit."),
    opt("Contester devant le tribunal", "rc_contester", {}, "Le dossier part en justice…"),
  ]);
}

// ---------- 6. clients qui grandissent ----------

export function noterClient(c: Client, jour: number, texte: string) {
  c.historique ??= [];
  c.historique.unshift({ jour, texte });
  if (c.historique.length > 30) c.historique.length = 30;
}

function croissanceClients(e: Etat, jour: number) {
  for (const c of e.clients) {
    c.taille ??= c.forfait > 4500 ? 2 : 1;
    if (c.taille >= 3 || c.satisfaction < 55 || rnd() > 0.035) continue;
    c.taille++;
    c.forfait = Math.round((c.forfait * 1.4) / 50) * 50;
    noterClient(c, jour, c.taille === 2 ? "Devient une PME : nouveaux salariés, forfait revu à la hausse." : "Passe le cap de l'ETI : groupe, filiales, seuils d'audit dépassés.");
    log(e, `📈 ${c.nom} grandit (${c.taille === 2 ? "PME" : "ETI"}) : forfait porté à ${euros(c.forfait)} / mois.`, "bien");
    if (c.taille === 3) {
      messageSpecial(e, "cabinet", 4, `🏛️ ${c.nom} doit nommer un commissaire aux comptes`, `${c.nom} dépasse les seuils de l'audit légal. ${c.dirigeant} te demande d'être son commissaire aux comptes. Rappel : on ne peut pas certifier des comptes que l'on a établis (incompatibilité).`, `client:${c.id}|agent:`, {}, [
        opt("Garder l'expertise et recommander un confrère CAC", "cac_confrere", { reputation: 2 }, "Choix déontologique salué par l'Ordre."),
        opt("Basculer en mission de commissariat aux comptes", "cac_bascule", {}, "Le client passe en mission d'audit."),
        opt("Accepter les deux missions", "cac_les_deux", { reputation: -8 }, "Grave manquement déontologique : incompatibilité."),
      ]);
    }
  }
}

// ---------- 7. saison fiscale ----------

function saisonFiscale(e: Etat, jour: number) {
  const m = moisDe(jour);
  if (m === 4 && e.compteurs.saisonAnnee !== anneeDe(jour)) {
    e.compteurs.saisonAnnee = anneeDe(jour);
    log(e, "📆 Coup d'envoi de la saison fiscale : liasses, IS, AG d'approbation. Deux mois de rush jusqu'à mi-mai.", "neutre");
  }
}

export const enSaisonFiscale = (e: Etat) => {
  const j = jourDe(e.minute);
  const m = moisDe(j);
  return m === 4 || (m === 5 && dateDe(j).getUTCDate() <= 20);
};

/** Chaque quart d'heure : nocturnes et pizzas en pleine saison. */
export function quartVie3(e: Etat) {
  if (!enSaisonFiscale(e) || minuteDuJour(e.minute) !== 20 * 60) return;
  const restent = e.agents.filter((a) => a.activite === "travaille");
  if (restent.length < 3 || e.compteurs.pizzaJour === jourDe(e.minute)) return;
  e.compteurs.pizzaJour = jourDe(e.minute);
  e.tresorerie -= restent.length * 14;
  for (const a of restent) a.moral = clamp(a.moral + 2);
  log(e, `🍕 Nocturne de saison fiscale : pizzas pour les ${restent.length} courageux encore au bureau.`, "neutre");
  dire(e, pick(restent), "🍕 Les pizzas sont là !", 30);
}

// ---------- 8. agences ----------

export const VILLES = [
  { ville: "Lyon", x: 205, y: 205 },
  { ville: "Bordeaux", x: 95, y: 235 },
  { ville: "Lille", x: 170, y: 40 },
  { ville: "Nantes", x: 75, y: 155 },
  { ville: "Marseille", x: 215, y: 275 },
  { ville: "Strasbourg", x: 270, y: 95 },
];
export const COUT_AGENCE = 150000;

export function ouvrirAgence(e: Etat, ville: string, associe: string | null): string | null {
  e.agences ??= [];
  if (e.agences.some((a) => a.ville === ville)) return "Tu as déjà une agence dans cette ville.";
  if (e.tresorerie < COUT_AGENCE) return `Il faut ${euros(COUT_AGENCE)} de trésorerie pour ouvrir une agence.`;
  if (associe && e.agences.some((a) => a.associe === associe)) return "Cet associé dirige déjà une agence.";
  e.tresorerie -= COUT_AGENCE;
  e.agences.push({ id: uid(e, "ag"), ville, ouverture: jourDe(e.minute), associe, clients: 2, effectif: 2, caMois: 0 });
  log(e, `🗺️ Ouverture de l'agence de ${ville} !`, "bien");
  souvenir(e, "🗺️", `Ouverture de l'agence de ${ville}`);
  return null;
}

function moisAgences(e: Etat) {
  for (const ag of e.agences ?? []) {
    const chef = e.agents.find((a) => a.id === ag.associe);
    const croissance = (chef ? 1 + chef.competence / 100 : 0.7) * (0.6 + e.reputation / 100);
    ag.clients = Math.min(60, ag.clients + Math.round(croissance * (1 + rnd() * 2)));
    ag.effectif = Math.max(2, Math.ceil(ag.clients / 4));
    const ca = ag.clients * 2200;
    const charges = ag.effectif * 3200 * 1.45 + 5000;
    ag.caMois = Math.round(ca);
    e.tresorerie += ca - charges;
    e.periode.ca += ca;
  }
  if (e.agences?.length) log(e, `🗺️ Agences : ${e.agences.map((a) => `${a.ville} ${a.clients} clients`).join(", ")}.`, "neutre");
}

// ---------- 9. classement régional ----------

export function classement(e: Etat) {
  const jour = jourDe(e.minute);
  const caMoi = e.clients.reduce((s, c) => s + c.forfait, 0) * 12 + (e.agences ?? []).reduce((s, a) => s + a.caMois * 12, 0);
  const effectif = e.agents.length + (e.agences ?? []).reduce((s, a) => s + a.effectif, 0);
  const satisfaction = e.clients.length ? e.clients.reduce((s, c) => s + c.satisfaction, 0) / e.clients.length : 0;
  const departs = e.anciens.filter((x) => jour - x.depart < 365).length;
  const turnover = effectif ? (departs / effectif) * 100 : 0;
  const lignes = [
    { id: "moi", nom: e.nomCabinet, ca: caMoi, effectif, satisfaction, turnover, reputation: e.reputation, moi: true },
    ...e.concurrents.map((c) => ({ id: c.id, nom: c.nom, ca: c.ca, effectif: c.effectif, satisfaction: 55 + (hash(c.id) % 30), turnover: 8 + (hash(c.id + "t") % 18), reputation: c.reputation, moi: false })),
  ];
  const score = (l: (typeof lignes)[number]) => Math.log10(Math.max(1, l.ca)) * 12 + l.reputation * 0.7 + l.satisfaction * 0.5 - l.turnover * 0.5;
  return lignes.map((l) => ({ ...l, score: score(l) })).sort((a, b) => b.score - a.score);
}

function classementMensuel(e: Etat) {
  const c = classement(e);
  const rang = c.findIndex((l) => l.moi) + 1;
  const avant = e.compteurs.rangRegional ?? rang;
  e.compteurs.rangRegional = rang;
  if (rang !== avant) log(e, `🏆 Classement régional : ${e.nomCabinet} ${rang < avant ? "monte" : "descend"} à la ${rang}${rang === 1 ? "re" : "e"} place.`, rang < avant ? "bien" : "mal");
  if (rang === 1) {
    souvenir(e, "🥇", "N°1 du classement régional");
    donnerBadge(e, "numero1");
  }
}

// ---------- 10. soutenance du mémoire devant le jury ----------

export const JURY: { question: string; choix: string[]; bonne: number; retour: string }[] = [
  { question: "Le président du jury : « En deux phrases, quelle est votre problématique ? »", choix: ["Je relis l'introduction de mon mémoire", "Je formule la problématique et j'explique pourquoi elle intéresse la profession", "Je présente surtout mon cabinet"], bonne: 1, retour: "Le jury attend une problématique claire et son intérêt pour la profession." },
  { question: "Un membre du jury : « Votre outil est-il vraiment utilisable dans un petit cabinet ? »", choix: ["Oui, sans aucune limite", "Je reconnais ses limites et je montre comment l'adapter, avec un exemple chiffré", "Ce n'était pas l'objet du mémoire"], bonne: 1, retour: "Reconnaître les limites et montrer l'opérationnalité rassure le jury." },
  { question: "Question piège : « Votre mémoire a-t-il été influencé par votre employeur ? »", choix: ["Oui, il a tout relu et corrigé", "Je garde mon indépendance de jugement ; mon maître de stage a seulement validé la faisabilité", "Je préfère ne pas répondre"], bonne: 1, retour: "Indépendance et transparence : deux valeurs clés de la profession." },
  { question: "« Quel lien entre votre sujet et la déontologie de l'expert-comptable ? »", choix: ["Aucun", "Je cite les principes concernés (compétence, secret, indépendance) et leur impact concret", "La déontologie concerne seulement les commissaires aux comptes"], bonne: 1, retour: "Il faut toujours raccrocher son sujet au cadre professionnel." },
  { question: "« Si c'était à refaire, que changeriez-vous ? »", choix: ["Rien du tout", "Je cite une amélioration concrète de méthode ou de périmètre", "Je changerais de sujet"], bonne: 1, retour: "Le recul critique est valorisé par le jury." },
];

export function soutenir(e: Etat, reponses: number[]): string | null {
  if (!e.memoire.soutenu) return "Termine d'abord ton mémoire.";
  if (e.compteurs.diplomee) return "Tu es déjà diplômée !";
  const bonnes = reponses.filter((r, i) => r === JURY[i]?.bonne).length;
  const base = e.compteurs.noteMemoire ?? 10;
  const note = Math.max(4, Math.min(19, Math.round(base * 0.5 + bonnes * 2 + (e.niveauDec / 100) * 3 - 1)));
  e.compteurs.noteSoutenance = note;
  if (note >= 10) {
    e.compteurs.diplomee = jourDe(e.minute);
    e.reputation = clamp(e.reputation + 10);
    donnerBadge(e, "diplomee");
    souvenir(e, "🎓", `Diplômée expert-comptable (soutenance ${note}/20)`);
    log(e, `🎓 Soutenance réussie : ${note}/20. Tu es diplômée d'expertise comptable ! L'équipe a préparé du champagne.`, "bien");
    for (const a of e.agents) {
      a.moral = clamp(a.moral + 6);
      a.confiance = clamp(a.confiance + 4);
    }
  } else {
    e.memoire.soutenu = false;
    e.memoire.etape = Math.max(0, e.memoire.etape - 2);
    log(e, `🎓 Soutenance : ${note}/20. Le jury demande de retravailler deux parties du mémoire.`, "mal");
  }
  return null;
}

// ---------- hooks ----------

export function debutJourneeVie3(e: Etat, jour: number, premierDuMois: boolean) {
  burnout(e, jour);
  saisonFiscale(e, jour);
  rcPro(e, jour, premierDuMois);
  if (premierDuMois && jour > 0) {
    demandesPromotion(e, jour);
    rentreeAlternants(e, jour);
    suiviAlternants(e, jour);
    croissanceClients(e, jour);
    moisAgences(e);
    classementMensuel(e);
  }
}

export function actionVie3(e: Etat, code: string, m: Message): boolean {
  const [type, p1] = code.split(":");
  const [cl, ag] = (m.dossier ?? "").split("|");
  const a = e.agents.find((x) => x.id === ag?.replace("agent:", ""));
  const c = e.clients.find((x) => x.id === cl?.replace("client:", ""));
  const jour = jourDe(e.minute);
  switch (type) {
    case "promo_oui":
      if (a) promouvoir(a, e);
      return true;
    case "promo_attendre":
    case "promo_non":
      if (type === "promo_non" && a && a.personnalite === "ambitieux") a.moral = clamp(a.moral - 15);
      return true;
    case "alternants":
      accueillirAlternants(e, Number(p1) || 0);
      return true;
    case "eval_honnete":
    case "eval_eloge":
      return true;
    case "alternant_cdi":
      if (a) {
        a.ecole = undefined;
        a.poste = ECHELLE[a.filiere]?.[1] ?? "Assistant comptable";
        a.salaire = 2200;
        a.moral = clamp(a.moral + 10);
        log(e, `🎓 ${a.prenom} signe son CDI comme ${a.poste} !`, "bien");
      }
      return true;
    case "alternant_fin":
      if (a) depart(e, a, "termine son alternance");
      return true;
    case "mitemps":
      if (a) {
        a.miTempsJusquau = jour + 90;
        a.stress = clamp(a.stress - 20);
      }
      return true;
    case "reprise_plein":
      if (a) a.fatigue = clamp(a.fatigue + 15);
      return true;
    case "rupture":
      if (a) {
        e.tresorerie -= a.salaire * 2;
        depart(e, a, "quitte le cabinet après une rupture conventionnelle");
      }
      return true;
    case "rc_assureur":
      e.tresorerie -= 3000;
      e.compteurs.rcMajoration = (e.compteurs.rcMajoration ?? 0) + 20;
      log(e, "⚖️ Sinistre déclaré : 3 000 € de franchise, prime RC Pro majorée de 20 %.", "mal");
      return true;
    case "rc_transiger": {
      const montant = Number(m.payload?.montant ?? 5000) * 0.7;
      e.tresorerie -= montant;
      log(e, `⚖️ Transaction amiable : ${euros(montant)} versés.`, "mal");
      return true;
    }
    case "rc_contester": {
      const montant = Number(m.payload?.montant ?? 5000);
      if (rnd() < 0.4) log(e, "⚖️ Le tribunal te donne raison : aucune faute retenue.", "bien");
      else {
        e.tresorerie -= montant * 1.4 + 4000;
        e.reputation = clamp(e.reputation - 5);
        log(e, `⚖️ Condamnation : ${euros(montant * 1.4)} plus les frais d'avocat. La presse locale en parle.`, "mal");
      }
      return true;
    }
    case "cac_confrere":
      if (c) noterClient(c, jour, "Commissaire aux comptes : un confrère recommandé par le cabinet.");
      return true;
    case "cac_bascule":
      if (c) {
        c.forfait = Math.round((c.forfait * 0.8) / 50) * 50;
        noterClient(c, jour, "Le cabinet devient son commissaire aux comptes (fin de la mission d'expertise).");
      }
      return true;
    case "cac_les_deux":
      e.compteurs.rcMajoration = (e.compteurs.rcMajoration ?? 0) + 30;
      log(e, "🚫 Incompatibilité : l'Ordre ouvre une procédure disciplinaire.", "mal");
      return true;
  }
  return false;
}

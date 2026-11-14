// Cinquième vague : veille réglementaire, anniversaires, défis de la semaine,
// tournoi interne, personnalités qui évoluent, crèche, astreintes, emploi des
// travailleurs handicapés, vidéo virale, tarifs, vacances et forme de
// l'associée, gestion automatique (mode délégation).

import { anneeDe, dateDe, jourDe, minuteDuJour, moisDe } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { choisirDilemme, clamp, dire, donnerBadge, hash, inc, log, pick, resoudreCas, rnd } from "@/lib/moteur";
import { souvenir } from "@/lib/vie2";
import { gradeDe, resoudreRevue } from "@/lib/vie3";
import type { Agent, Etat, Message, OptionDilemme, Personnalite } from "@/lib/types";

const opt = (label: string, code: string, effets: OptionDilemme["effets"] = {}, resultat = "C'est noté."): OptionDilemme => ({ label, cout: 0, effets, resultat, action: "vie", code });
const metier = (a: Agent) => ["expertise", "fiscal", "social", "juridique", "audit"].includes(a.filiere);
const jourSemaine = (jour: number) => dateDe(jour).getUTCDay();
const NOMS_POLES: Record<string, string> = { expertise: "Expertise", fiscal: "Fiscal", social: "Social", juridique: "Juridique", audit: "Audit" };

// ---------- 1. veille réglementaire ----------

const ACTUS = [
  { titre: "Prélèvement forfaitaire unique à 31,4 %", texte: "La LFSS 2026 porte les prélèvements sociaux sur les revenus du capital à 18,6 % : le PFU passe de 30 % à 31,4 % sur les dividendes perçus depuis le 1er janvier 2026. Les simulations salaire / dividendes des dirigeants sont à refaire." },
  { titre: "Facture électronique : réception obligatoire", texte: "Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques ; l'émission devient obligatoire pour les PME et TPE au 1er septembre 2027. Il faut accompagner chaque client dans le choix de sa plateforme agréée." },
  { titre: "Plafond de la Sécurité sociale 2026", texte: "Le PASS 2026 est de 48 060 € (4 005 € par mois). Il faut mettre à jour les paramètres de paie : tranches de retraite, prévoyance, limites d'exonération." },
  { titre: "LMNP : réintégration des amortissements", texte: "Pour les cessions depuis le 15 février 2025, les amortissements déduits par les loueurs en meublé non professionnels au réel minorent le prix d'acquisition. Les clients concernés doivent être prévenus avant toute vente." },
  { titre: "Meublés de tourisme non classés", texte: "Micro-BIC plafonné à 15 000 € avec un abattement de 30 % pour les meublés de tourisme non classés. Les clients loueurs de courte durée sont à recontacter." },
  { titre: "Franchise en base de TVA maintenue", texte: "La réforme qui prévoyait un seuil unique de 25 000 € est abandonnée : les seuils de 85 000 € (ventes) et 37 500 € (services) restent applicables." },
  { titre: "Index égalité et transparence salariale", texte: "La directive européenne sur la transparence des rémunérations doit être transposée d'ici juin 2026 : fourchettes de salaire dans les offres et droit à l'information des salariés. Les clients employeurs doivent s'y préparer." },
  { titre: "Avantage en nature repas 2026", texte: "L'avantage nourriture est évalué à 5,50 € par repas en 2026 (minimum garanti de 4,25 € dans les hôtels-cafés-restaurants). Les paramètres de paie des clients concernés sont à mettre à jour." },
];

function veille(e: Etat, jour: number) {
  const i = (e.compteurs.veilleIndex ?? 0) % ACTUS.length;
  e.compteurs.veilleIndex = i + 1;
  const a = ACTUS[i];
  messageSpecial(e, "cabinet", 2, `📰 Veille réglementaire : ${a.titre}`, `${a.texte} Comment diffuses-tu l'information ?`, "client:|agent:", { actu: i, jour }, [
    opt("Note de synthèse + formation flash de 30 minutes pour l'équipe (500 €)", "veille:formation", { tresorerie: -500 }, "L'équipe est à jour, et les clients reçoivent une newsletter."),
    opt("Un simple mail à l'équipe", "veille:mail", {}, "L'info est passée… plus ou moins lue."),
    opt("Pas le temps, on verra plus tard", "veille:rien", {}, "L'info n'est pas diffusée."),
  ]);
}

// ---------- 2. anniversaires ----------

function anniversaires(e: Etat, jour: number) {
  const d = dateDe(jour);
  const jda = Math.floor((d.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000);
  const fetes = e.agents.filter((a) => hash(a.id + a.prenom) % 365 === jda);
  if (!fetes.length) return;
  e.compteurs.anniversaireJour = jour;
  for (const a of fetes) {
    a.moral = clamp(a.moral + 12);
    log(e, `🎂 C'est l'anniversaire de ${a.prenom} ! Gâteau à la cafétéria à 16h.`, "bien");
    for (const x of e.agents.filter((y) => y !== a && rnd() < 0.15)) dire(e, x, `Joyeux anniversaire ${a.prenom} ! 🎂`, 40);
  }
}

// ---------- 3. défis de la semaine ----------

export const DEFIS = [
  { nom: "Livrer 8 dossiers cette semaine", compteur: "livres", objectif: 8 },
  { nom: "Réussir 5 contrôles ou cas pratiques", compteur: "cas_ok", objectif: 5 },
  { nom: "Zéro dossier en retard vendredi soir", compteur: "", objectif: 0 },
  { nom: "Moral moyen de l'équipe au-dessus de 70", compteur: "", objectif: 70 },
];

export function etatDefi(e: Etat) {
  const t = e.compteurs.defiType;
  if (t === undefined) return null;
  const d = DEFIS[t];
  const jour = jourDe(e.minute);
  let valeur = 0;
  let reussi = false;
  const taille = e.agents.filter(metier).length;
  const objectif = t === 0 ? Math.max(8, Math.round(taille * 0.7)) : t === 1 ? Math.max(5, Math.round(taille / 6)) : d.objectif;
  if (d.compteur) {
    valeur = (e.compteurs[d.compteur] ?? 0) - (e.compteurs.defiBase ?? 0);
    reussi = valeur >= objectif;
  } else if (t === 2) {
    valeur = e.dossiers.filter((x) => x.phase < 5 && x.echeance < jour).length;
    reussi = valeur === 0;
  } else {
    valeur = Math.round(e.agents.reduce((s, a) => s + a.moral, 0) / Math.max(1, e.agents.length));
    reussi = valeur >= d.objectif;
  }
  const nom = t === 0 ? `Livrer ${objectif} dossiers cette semaine` : t === 1 ? `Réussir ${objectif} contrôles ou cas pratiques` : d.nom;
  return { ...d, nom, objectif, valeur, reussi };
}

function defis(e: Etat) {
  const fin = etatDefi(e);
  if (fin) {
    if (fin.reussi) {
      inc(e, "defis");
      e.reputation = clamp(e.reputation + 1);
      for (const a of e.agents) a.moral = clamp(a.moral + 4);
      log(e, `🏁 Défi réussi : « ${fin.nom} » ! L'équipe fête ça.`, "bien");
      if ((e.compteurs.defis ?? 0) >= 5) donnerBadge(e, "defis");
    } else log(e, `🏁 Défi manqué : « ${fin.nom} ». On retente cette semaine !`, "neutre");
  }
  const t = Math.floor(rnd() * DEFIS.length);
  e.compteurs.defiType = t;
  e.compteurs.defiBase = DEFIS[t].compteur ? (e.compteurs[DEFIS[t].compteur] ?? 0) : 0;
}

// ---------- 4. tournoi interne ----------

function tournoi(e: Etat, jour: number) {
  if (![3, 6, 9, 12].includes(moisDe(jour)) || e.agents.filter(metier).length < 8) return;
  const jeu = pick(["tournoi de babyfoot", "match de foot à 5", "quiz fiscal géant"]);
  messageSpecial(e, "cabinet", 2, `🏆 Proposition de ${jeu} entre pôles`, `Le comité des fêtes propose un ${jeu} entre pôles vendredi soir, avec un trophée à la cafétéria. Budget : 1 500 € (location, buffet, trophée).`, "client:|agent:", {}, [
    opt("Organiser le tournoi", `tournoi:${jeu.split(" ")[1] ?? "jeu"}`, { tresorerie: -1500, moralEquipe: 6, stressEquipe: -6 }, "Les pôles se préparent comme pour une finale de Coupe du monde."),
    opt("Pas cette fois", "tournoi:non", { moralEquipe: -2 }, "Déception au comité des fêtes."),
  ]);
}

// ---------- 5. personnalités qui évoluent ----------

function evolutions(e: Etat) {
  for (const a of e.agents.filter(metier)) {
    let nouvelle: Personnalite | null = null;
    let texte = "";
    if (a.personnalite === "anxieux" && a.stress < 35 && a.moral > 70 && rnd() < 0.3) {
      nouvelle = "loyal";
      texte = `${a.prenom} a pris confiance : plus serein·e, il ou elle devient un pilier de l'équipe.`;
    } else if (a.personnalite === "rebelle" && gradeDe(a) >= 3 && a.confiance > 60 && rnd() < 0.3) {
      nouvelle = "ambitieux";
      texte = `${a.prenom}, l'ancien·ne rebelle, s'est révélé·e leader : il ou elle porte désormais les projets du pôle.`;
    } else if (a.personnalite === "nonchalant" && a.competence > 72 && rnd() < 0.25) {
      nouvelle = "perfectionniste";
      texte = `${a.prenom} s'est pris·e au jeu : plus exigeant·e, ses dossiers sont désormais impeccables.`;
    } else if (a.personnalite === "ambitieux" && a.moral < 30 && rnd() < 0.25) {
      nouvelle = "rebelle";
      texte = `${a.prenom} se sent bloqué·e et commence à contester ouvertement les décisions.`;
    }
    if (nouvelle) {
      a.personnalite = nouvelle;
      log(e, `🌱 Évolution : ${texte}`, nouvelle === "rebelle" ? "mal" : "bien");
    }
  }
}

// ---------- 6. crèche d'entreprise ----------

export function ouvrirCreche(e: Etat): string | null {
  if (e.compteurs.creche) return "La crèche est déjà ouverte.";
  if (e.tresorerie < 40000) return "Il faut 40 000 € pour aménager la crèche.";
  e.tresorerie -= 40000;
  e.compteurs.creche = jourDe(e.minute);
  for (const a of e.agents) a.moral = clamp(a.moral + 5);
  log(e, "🧸 La crèche d'entreprise ouvre au rez-de-chaussée ! Les jeunes parents sont ravis.", "bien");
  souvenir(e, "🧸", "Ouverture de la crèche d'entreprise");
  return null;
}

// ---------- 7. astreintes, emploi des travailleurs handicapés, vidéo virale ----------

function astreintes(e: Etat, jour: number) {
  if (moisDe(jour) !== 4 || e.compteurs.astreintesAnnee === anneeDe(jour) || e.agents.filter(metier).length < 6) return;
  e.compteurs.astreintesAnnee = anneeDe(jour);
  messageSpecial(e, "cabinet", 3, "🌙 Organisation des nocturnes de la saison fiscale", "Pendant la saison fiscale, il faut des collaborateurs présents jusqu'à 21h pour boucler les liasses. Comment organises-tu les astreintes ?", "client:|agent:", {}, [
    opt("Roulement équitable : chacun une soirée par semaine, heures majorées", "astreintes:roulement", { stressEquipe: 4, confianceEquipe: 4 }, "Tout le monde joue le jeu."),
    opt("Volontaires uniquement, avec une prime", "astreintes:volontaires", { tresorerie: -3000, moralEquipe: 3 }, "Les volontaires se bousculent… presque."),
    opt("Les seniors et managers s'en chargent", "astreintes:seniors", {}, "Les seniors grincent des dents."),
  ]);
}

function oeth(e: Etat) {
  if (e.agents.length < 20 || e.compteurs.oeth) return;
  e.compteurs.oeth = 1;
  messageSpecial(e, "cabinet", 3, "♿ Obligation d'emploi des travailleurs handicapés", `Le cabinet dépasse 20 salariés : il doit employer 6 % de travailleurs en situation de handicap, soit ${Math.ceil(e.agents.length * 0.06)} personne(s), ou verser une contribution annuelle. Que fais-tu ?`, "client:|agent:", {}, [
    opt("Recruter avec Cap emploi et aménager les postes (aides de l'Agefiph)", "oeth:recruter", { moralEquipe: 4 }, "Deux recrutements réussis et des postes aménagés."),
    opt("Sous-traiter l'entretien et l'impression à une entreprise adaptée (ESAT)", "oeth:esat", {}, "Une partie de l'obligation est couverte."),
    opt("Payer la contribution", "oeth:payer", { tresorerie: -12000 }, "Obligation remplie… sur le papier."),
  ]);
}

function videoVirale(e: Etat) {
  const jeunes = e.agents.filter((a) => metier(a) && gradeDe(a) <= 1);
  if (!jeunes.length || rnd() > 0.08) return;
  const a = pick(jeunes);
  messageSpecial(e, a.id, 2, `📱 ${a.prenom} veut lancer le compte TikTok du cabinet`, `${a.prenom} propose une série de vidéos « une journée en cabinet d'expertise comptable » pour attirer des candidats. Ça peut faire un buzz… ou un bad buzz.`, `client:|agent:${a.id}`, {}, [
    opt("Go, avec une charte (pas de données clients, ton bienveillant)", "tiktok:charte", { confianceAgent: 8 }, "Le tournage commence !"),
    opt("Go, en toute liberté", "tiktok:libre", { confianceAgent: 10 }, "Le tournage commence…"),
    opt("Non merci", "tiktok:non", { confianceAgent: -5 }, "Dommage, l'idée était bonne."),
  ]);
}

// ---------- 8. tarifs ----------

export const tarif = (e: Etat) => (e.compteurs.tarif ?? 100) / 100;
export function fixerTarif(e: Etat, pct: number): string | null {
  e.compteurs.tarif = Math.max(80, Math.min(130, Math.round(pct)));
  return null;
}

function moisTarifs(e: Etat) {
  const t = tarif(e);
  if (t === 1) return;
  for (const c of e.clients) c.satisfaction = clamp(c.satisfaction - (t - 1) * 8);
}

// ---------- 9. vacances et forme de l'associée ----------

export const enVacances = (e: Etat) => (e.compteurs.vacancesJusqua ?? 0) > jourDe(e.minute);

export function poserVacances(e: Etat): string | null {
  const jour = jourDe(e.minute);
  if (enVacances(e)) return "Tu es déjà en vacances !";
  e.compteurs.vacancesJusqua = jour + 7;
  e.compteurs.dernieresVacances = jour;
  log(e, "🏖️ Tu poses une semaine de vacances. Le cabinet tourne sans toi… les décisions courantes sont gérées par tes associés et managers.", "bien");
  return null;
}

function formeAssociee(e: Etat, jour: number) {
  if (enVacances(e)) {
    e.compteurs.formeToi = clamp((e.compteurs.formeToi ?? 100) + 12);
    return;
  }
  if ((e.compteurs.vacancesJusqua ?? 0) === jour) log(e, "🏖️ Retour de vacances : bronzée et reposée.", "bien");
  const sansVacances = jour - (e.compteurs.dernieresVacances ?? 0);
  if (sansVacances > 180) e.compteurs.formeToi = clamp((e.compteurs.formeToi ?? 100) - 4);
  if ((e.compteurs.formeToi ?? 100) < 15) e.compteurs.formeBasse = (e.compteurs.formeBasse ?? 0) + 1;
  else e.compteurs.formeBasse = 0;
  if ((e.compteurs.formeBasse ?? 0) >= 3) {
    e.compteurs.vacancesJusqua = jour + 14;
    e.compteurs.dernieresVacances = jour;
    e.compteurs.formeBasse = 0;
    for (const c of e.clients) c.satisfaction = clamp(c.satisfaction - 5);
    log(e, "🩺 Épuisement : ton médecin t'arrête deux semaines. Tes associés gèrent le cabinet en ton absence. Pense à poser des vacances !", "mal");
  }
}

// ---------- 10. gestion automatique ----------

const RH = ["promo_", "alternants", "eval_", "alternant_", "mitemps", "mentorat", "essai_", "contre_offre", "motivation", "seminaire", "noel", "nao", "objectifs", "astreintes", "oeth", "tournoi", "tiktok", "conge", "naissance", "veille"];
const FIN = ["cloture", "offre", "rachat", "lm", "investir", "comite", "agenda", "retraite", "rc_", "litige", "cac_"];

/** Résout les décisions courantes des thèmes délégués (ou toutes pendant tes vacances). */
export function gestionAuto(e: Etat) {
  const a = e.auto ?? {};
  const vac = enVacances(e);
  if (!vac && !a.dec && !a.rh && !a.finances) return;
  for (const m of e.messages.filter((x) => x.statut === "attente").slice(0, 6)) {
    if (m.theme === "validation" && (vac || a.dec)) {
      if (m.cas) resoudreCas(e, m.id, rnd() < 0.75 ? m.cas.bonne : (m.cas.bonne + 1) % m.cas.choix.length);
      else if (m.revue) resoudreRevue(e, m.id, m.revue.lignes.map((l, i) => (l.anomalie && rnd() < 0.8 ? i : -1)).filter((i) => i >= 0));
      continue;
    }
    if (!m.dilemme) continue;
    const codes = m.dilemme.options.map((o) => o.code ?? "");
    const theme = codes.some((c) => RH.some((p) => c.startsWith(p))) ? "rh" : codes.some((c) => FIN.some((p) => c.startsWith(p))) ? "finances" : codes.some((c) => c.startsWith("ch:")) ? "dec" : "autre";
    if (!(vac || (theme === "rh" && a.rh) || (theme === "finances" && a.finances) || (theme === "dec" && a.dec))) continue;
    const choix = theme === "dec" ? Math.floor(rnd() * m.dilemme.options.length) : 0;
    choisirDilemme(e, m.id, choix);
  }
}

export function setAuto(e: Etat, cle: "dec" | "rh" | "finances", v: boolean): string | null {
  e.auto = { ...(e.auto ?? {}), [cle]: v };
  return null;
}

// ---------- hooks ----------

export function debutJourneeVie5(e: Etat, jour: number, premierDuMois: boolean) {
  anniversaires(e, jour);
  formeAssociee(e, jour);
  astreintes(e, jour);
  if (jourSemaine(jour) === 1) defis(e);
  if (premierDuMois && jour > 0) {
    veille(e, jour);
    tournoi(e, jour);
    evolutions(e);
    oeth(e);
    videoVirale(e);
    moisTarifs(e);
    if (e.compteurs.creche) {
      e.tresorerie -= 3000;
      for (const a of e.agents) a.moral = clamp(a.moral + 1);
    }
  }
}

export function quartVie5(e: Etat) {
  if (minuteDuJour(e.minute) % 60 === 0) gestionAuto(e);
}

export function actionVie5(e: Etat, code: string, m: Message): boolean {
  const [type, p1] = code.split(":");
  const agentId = (m.dossier ?? "").split("|")[1]?.replace("agent:", "");
  const a = e.agents.find((x) => x.id === agentId);
  switch (type) {
    case "veille":
      if (p1 === "formation") for (const x of e.agents.filter(metier)) x.competence = clamp(x.competence + 1, 0, 95);
      if (p1 === "rien" && rnd() < 0.5) {
        e.risquesRC ??= [];
        e.risquesRC.push({ jour: jourDe(e.minute) + 60 + Math.floor(rnd() * 90), client: pick(e.clients)?.nom ?? "un client", montant: 4000 + Math.round(rnd() * 8000), faute: `Changement réglementaire non appliqué : ${ACTUS[Number(m.payload?.actu ?? 0)]?.titre ?? "nouvelle règle"}.` });
      }
      return true;
    case "tournoi":
      if (p1 !== "non") {
        const poles = Object.keys(NOMS_POLES).filter((f) => e.agents.some((x) => x.filiere === f));
        const gagnant = poles.sort((x, y) => e.agents.filter((z) => z.filiere === y).reduce((s, z) => s + z.moral, 0) * (0.7 + rnd() * 0.6) - e.agents.filter((z) => z.filiere === x).reduce((s, z) => s + z.moral, 0) * (0.7 + rnd() * 0.6))[0];
        if (gagnant) {
          log(e, `🏆 Le pôle ${NOMS_POLES[gagnant]} remporte le tournoi ! Le trophée trône à la cafétéria.`, "bien");
          souvenir(e, "🏆", `Tournoi interne ${anneeDe(jourDe(e.minute))} : victoire du pôle ${NOMS_POLES[gagnant]}`);
        }
      }
      return true;
    case "astreintes":
      if (p1 === "seniors") for (const x of e.agents.filter((y) => metier(y) && gradeDe(y) >= 3)) x.stress = clamp(x.stress + 10);
      return true;
    case "oeth":
      e.compteurs.oeth = 2;
      if (p1 === "recruter") souvenir(e, "♿", "Cabinet engagé pour l'emploi des personnes handicapées");
      return true;
    case "tiktok": {
      if (p1 === "non") return true;
      const buzz = rnd() < (p1 === "charte" ? 0.7 : 0.45);
      if (buzz) {
        e.reputation = clamp(e.reputation + 5);
        e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 1;
        log(e, `📱 La vidéo de ${a?.prenom ?? "l'équipe"} fait 400 000 vues ! Les candidatures affluent.`, "bien");
        souvenir(e, "📱", "Buzz sur TikTok");
      } else {
        e.reputation = clamp(e.reputation - 5);
        log(e, `📱 Bad buzz : une vidéo montre un écran avec le nom d'un client. Il faut la supprimer en urgence.`, "mal");
      }
      return true;
    }
  }
  return false;
}


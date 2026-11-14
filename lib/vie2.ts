// Vie du cabinet, deuxième vague : ta forme et ton agenda, débauchages,
// séminaire annuel, rumeurs, CSE et NAO, appels d'offres, rachat de
// cabinet, météo qui pèse sur le travail, fêtes du calendrier, album.

import { anneeDe, dateDe, jourDe, jourDuMois, minuteDuJour, moisDe } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { clamp, depart, dire, hash, log, pick, rnd, uid } from "@/lib/moteur";
import type { Agent, Client, Etat, Message, OptionDilemme } from "@/lib/types";

const opt = (label: string, code: string, effets: OptionDilemme["effets"] = {}, resultat = "C'est noté."): OptionDilemme => ({ label, cout: 0, effets, resultat, action: "vie", code });
const present = (a: Agent) => !["absent", "conge", "malade", "teletravail"].includes(a.activite);
const metier = (a: Agent) => a.filiere !== "service" && a.filiere !== "associe";
const jourSemaine = (jour: number) => dateDe(jour).getUTCDay();
const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

// ---------- album souvenir ----------

export function souvenir(e: Etat, emoji: string, titre: string) {
  e.souvenirs ??= [];
  if (e.souvenirs.some((s) => s.titre === titre)) return;
  e.souvenirs.unshift({ jour: jourDe(e.minute), emoji, titre });
  if (e.souvenirs.length > 80) e.souvenirs.length = 80;
}

export function prendrePhoto(e: Etat): string | null {
  e.souvenirs ??= [];
  e.souvenirs.unshift({ jour: jourDe(e.minute), emoji: "📸", titre: `Photo du cabinet (${e.agents.length} personnes)` });
  if (e.souvenirs.length > 80) e.souvenirs.length = 80;
  return null;
}

function jalons(e: Etat) {
  if (e.clients.length >= 1) souvenir(e, "🤝", "Premier client");
  for (const n of [10, 25, 50, 100]) if (e.clients.length >= n) souvenir(e, "📈", `${n} clients au portefeuille`);
  for (const n of [10, 50, 100]) if (e.agents.length >= n) souvenir(e, "👥", `${n}ᵉ collaborateur`);
  for (const n of [100_000, 1_000_000, 10_000_000]) if (e.tresorerie >= n) souvenir(e, "💰", `Trésorerie de ${euros(n)}`);
}

// ---------- ta forme ----------

export const forme = (e: Etat) => e.compteurs.formeToi ?? 100;

/** Chaque décision prise te coûte un peu d'énergie. */
export function fatiguerToi(e: Etat, n = 1.2) {
  e.compteurs.formeToi = clamp(forme(e) - n);
}

// ---------- hooks ----------

export function debutJourneeVie2(e: Etat, jour: number, premierDuMois: boolean) {
  // Sommeil et week-end : on récupère.
  e.compteurs.formeToi = clamp(forme(e) + (jourSemaine(jour) === 1 ? 45 : 18));
  jalons(e);
  meteo(e, jour);
  fetes(e, jour);
  agendaDuJour(e, jour);
  if (jourSemaine(jour) === 1) {
    rumeur(e);
    debauchage(e);
  }
  if (premierDuMois && jour > 0) {
    seminaire(e, jour);
    cse(e, jour);
    appelOffres(e, jour);
    rachatCabinet(e, jour);
  }
}

/** Chaque quart d'heure : rester tard te fatigue. */
export function quartVie2(e: Etat) {
  const m = minuteDuJour(e.minute);
  if (m >= 20 * 60) fatiguerToi(e, 0.6);
  if (m === 21 * 60 && forme(e) < 30) log(e, "😴 Tu es épuisée : tes décisions vont s'en ressentir. Passe à demain !", "mal");
}

// ---------- 1. ton agenda du jour ----------

function agendaDuJour(e: Etat, jour: number) {
  if (jourSemaine(jour) === 0 || jourSemaine(jour) === 6 || e.clients.length < 3 || rnd() > 0.3) return;
  const cl = [...e.clients].sort(() => rnd() - 0.5).slice(0, 3);
  const deleguer = e.agents.some((a) => a.filiere === "associe" || Object.values(e.chefsPoles ?? {}).includes(a.id));
  messageSpecial(
    e,
    "cabinet",
    2,
    "📅 Ton agenda du jour",
    `Trois rendez-vous sont calés aujourd'hui : ${cl.map((c) => c.dirigeant).join(", ")}. Plus une signature de lettre de mission et un point banque. Tu ne pourras pas tout faire sans y laisser des plumes.`,
    `client:${cl.map((c) => c.id).join(",")}`,
    {},
    [
      opt("Tout enchaîner moi-même", "agenda_tout", {}, "Journée marathon : les clients sont ravis, toi un peu moins."),
      ...(deleguer ? [opt("Déléguer deux rendez-vous à un associé ou chef de pôle", "agenda_deleguer", { confianceEquipe: 2 }, "Ton équipe apprécie la confiance.")] : []),
      opt("Reporter à la semaine prochaine", "agenda_reporter", {}, "Tu souffles, mais les clients attendent."),
    ],
  );
}

// ---------- 2. débauchage par un concurrent ----------

const RIVAUX = ["Corvane International", "Altéa Conseil", "Nordis Audit", "Cabinet Merlin & Associés"];

function debauchage(e: Etat) {
  const cible = e.agents.filter((a) => metier(a) && a.moral < 50 && a.competence > 55);
  if (!cible.length || rnd() > 0.35) return;
  const a = pick(cible);
  const rival = pick(RIVAUX);
  messageSpecial(
    e,
    a.id,
    4,
    `🎯 ${a.prenom} a une offre de ${rival}`,
    `${a.prenom} t'annonce avoir reçu une offre de ${rival} : +15 % de salaire et un poste de ${/senior/i.test(a.poste) ? "manager" : "senior"}. « Je t'en parle avant de répondre. »`,
    `client:|agent:${a.id}`,
    {},
    [
      opt(`Contre-offre : +10 % (${euros(a.salaire * 0.1)} brut / mois)`, "contre_offre", {}, `${a.prenom} reste, touché·e par le geste.`),
      opt("Entretien de motivation (projets, formation, évolution)", "motivation", {}, "Tu as écouté. Reste à voir si c'est suffisant."),
      opt("Lui souhaiter bonne chance", "laisser_partir", {}, `${a.prenom} accepte l'offre.`),
    ],
  );
}

// ---------- 3. séminaire annuel ----------

function seminaire(e: Etat, jour: number) {
  if (moisDe(jour) !== 9 || e.agents.length < 4 || e.compteurs.seminaireAnnee === anneeDe(jour)) return;
  e.compteurs.seminaireAnnee = anneeDe(jour);
  const n = e.agents.length;
  messageSpecial(e, "cabinet", 3, "🏔️ Séminaire annuel du cabinet", `C'est la rentrée : où emmènes-tu les ${n} collaborateurs pour le séminaire de deux jours ?`, "client:|agent:", {}, [
    opt(`Annecy : rando, lac et ateliers (${euros(n * 450)})`, "seminaire:annecy", { tresorerie: -n * 450, moralEquipe: 10, stressEquipe: -10 }, "Deux jours mémorables au bord du lac."),
    opt(`Barcelone : soleil et soirée sur un rooftop (${euros(n * 900)})`, "seminaire:barcelone", { tresorerie: -n * 900, moralEquipe: 16, stressEquipe: -14, confianceEquipe: 5 }, "Tout le monde en parle encore à la machine à café."),
    opt(`Escape game et dîner en ville (${euros(n * 120)})`, "seminaire:ville", { tresorerie: -n * 120, moralEquipe: 5, stressEquipe: -5 }, "Sympa et efficace."),
    opt("Pas de séminaire cette année", "seminaire:non", { moralEquipe: -6 }, "L'équipe est déçue."),
  ]);
}

// ---------- 4. rumeurs de couloir ----------

const RUMEURS = [
  "le cabinet serait sur le point d'être racheté par un gros réseau",
  "il y aurait des licenciements au prochain trimestre",
  "un associé partirait fonder son propre cabinet",
  "les augmentations seraient gelées cette année",
  "un gros client s'apprêterait à partir",
  "on passerait tous en open space sans bureau attitré",
];

function rumeur(e: Etat) {
  if (e.agents.length < 5 || rnd() > 0.3) return;
  const r = pick(RUMEURS);
  const source = pick(e.agents.filter(metier).length ? e.agents.filter(metier) : e.agents);
  messageSpecial(e, source.id, 3, "🗣️ Une rumeur circule", `${source.prenom} vient te voir, un peu gêné·e : « Il paraît que ${r}… C'est vrai ? Tout le monde en parle à la cafèt'. »`, `client:|agent:${source.id}`, {}, [
    opt("Démentir officiellement par e-mail à toute l'équipe", "rumeur_dementi", { stressEquipe: -6, confianceEquipe: 3 }, "La rumeur s'éteint."),
    opt("Réunion d'équipe transparente sur la stratégie", "rumeur_reunion", { stressEquipe: -10, confianceEquipe: 7, progression: 0 }, "Tout le monde repart rassuré, et avec un cap clair."),
    opt("Laisser courir, ça passera", "rumeur_rien", { stressEquipe: 8, confianceEquipe: -4 }, "La rumeur enfle…"),
  ]);
}

// ---------- 5. CSE et NAO ----------

function cse(e: Etat, jour: number) {
  const n = e.agents.length;
  if (n >= 11 && !e.compteurs.cseElu) {
    e.compteurs.cseElu = jour;
    log(e, `🗳️ Le cabinet atteint ${n} salariés : élections du CSE organisées. Trois élus représentent désormais le personnel.`, "neutre");
    souvenir(e, "🗳️", "Premières élections du CSE");
  }
  if (n >= 50 && moisDe(jour) === 2 && e.compteurs.naoAnnee !== anneeDe(jour)) {
    e.compteurs.naoAnnee = anneeDe(jour);
    const masse = e.agents.reduce((s, a) => s + a.salaire, 0);
    messageSpecial(e, "cabinet", 4, "🤝 Négociation annuelle obligatoire (NAO)", `Les élus du CSE présentent leurs revendications : titres-restaurant à 12 €, 2 jours de télétravail, et une augmentation générale de 3 %. Masse salariale actuelle : ${euros(masse)} brut / mois.`, "client:|agent:", {}, [
      opt(`Tout accepter (≈ ${euros(masse * 0.045 * 12)} / an)`, "nao_tout", { moralEquipe: 14, confianceEquipe: 10 }, "Accord signé dans l'enthousiasme."),
      opt("Compromis : +2 % et titres-restaurant", "nao_compromis", { moralEquipe: 6, confianceEquipe: 4 }, "Accord signé après deux réunions tendues."),
      opt("Procès-verbal de désaccord", "nao_refus", { moralEquipe: -12, confianceEquipe: -10, stressEquipe: 6 }, "Les élus parlent de mouvement social."),
    ]);
  }
}

// ---------- 6. appels d'offres ----------

const OFFRES: Omit<Client, "id" | "satisfaction">[] = [
  { nom: "Groupe Hospitalier Saint-Roch", dirigeant: "Direction financière", secteur: "Santé", trait: "appel d'offres public, cahier des charges de 80 pages", forfait: 14000, tvaMensuelle: true, paie: true },
  { nom: "Mairie de Valbonne-sur-Mer", dirigeant: "Service des marchés", secteur: "Association et secteur public", trait: "marché public, procédure formalisée", forfait: 9000, tvaMensuelle: false, paie: true },
  { nom: "Réseau Boulangeries Dorée (40 points de vente)", dirigeant: "M. Dorée", secteur: "Boulangerie artisanale", trait: "consolidation de 40 sociétés", forfait: 16000, tvaMensuelle: true, paie: true },
  { nom: "Promotion Azur Habitat", dirigeant: "Mme Sallès", secteur: "Promotion immobilière", trait: "TVA immobilière et VEFA", forfait: 12000, tvaMensuelle: true, paie: false },
  { nom: "Transports Lemaire Logistique", dirigeant: "Famille Lemaire", secteur: "Transport routier", trait: "flotte de 120 camions, TICPE", forfait: 15000, tvaMensuelle: true, paie: true },
];

function appelOffres(e: Etat, jour: number) {
  if (e.reputation < 35 || e.clients.length < 5 || rnd() > 0.4) return;
  const o = OFFRES[hash(String(jour)) % OFFRES.length];
  if (e.clients.some((c) => c.nom === o.nom)) return;
  messageSpecial(e, "cabinet", 4, `📑 Appel d'offres : ${o.nom}`, `${o.nom} met trois cabinets en concurrence (dont Corvane International). Honoraires visés : environ ${euros(o.forfait)} par mois. Ils jugeront le prix, l'équipe proposée et le planning. Quelle offre déposes-tu ?`, "client:|agent:", { offre: OFFRES.indexOf(o) }, [
    opt(`Prix agressif (−20 %) : ${euros(o.forfait * 0.8)}`, "offre:0.8", {}, "Offre déposée."),
    opt(`Prix juste : ${euros(o.forfait)}`, "offre:1", {}, "Offre déposée."),
    opt(`Offre premium avec associé dédié : ${euros(o.forfait * 1.25)}`, "offre:1.25", {}, "Offre déposée."),
    opt("Ne pas répondre", "offre:0", {}, "Tu passes ton tour."),
  ]);
}

// ---------- 7. rachat d'un cabinet ----------

function rachatCabinet(e: Etat, jour: number) {
  if (e.tresorerie < 120000 || rnd() > 0.15 || e.compteurs.rachatJour && jour - e.compteurs.rachatJour < 120) return;
  e.compteurs.rachatJour = jour;
  const nb = 3 + (hash(String(jour)) % 4);
  const honoraires = nb * 2600 * 12;
  const prix = Math.round((honoraires * 0.9) / 1000) * 1000;
  messageSpecial(e, "cabinet", 4, "🏢 Un confrère part à la retraite", `Maître Dufresne, expert-comptable depuis 38 ans, te propose de racheter sa clientèle : ${nb} clients, environ ${euros(honoraires)} d'honoraires annuels récurrents. Il en demande ${euros(prix)} (≈ 0,9 an d'honoraires, avec une clause de garantie de chiffre d'affaires).`, "client:|agent:", { nb, prix }, [
    opt(`Accepter à ${euros(prix)}`, "rachat:1", {}, "Protocole signé !"),
    opt(`Négocier à ${euros(prix * 0.8)}`, "rachat:0.8", {}, "Tu fais une contre-proposition."),
    opt("Décliner poliment", "rachat:0", {}, "Il se tournera vers un autre confrère."),
  ]);
}

// ---------- 8. météo ----------

function meteo(e: Etat, jour: number) {
  const mois = moisDe(jour);
  const r = rnd();
  let texte = "";
  if ((mois === 1 || mois === 2 || mois === 12) && r < 0.07) {
    e.meteo = "neige";
    texte = "❄️ Neige sur la ville : routes bloquées, une partie de l'équipe télétravaille.";
  } else if ((mois === 7 || mois === 8) && r < 0.1) {
    e.meteo = "soleil";
    texte = e.compteurs.climPanne === jour ? "🥵 Canicule et clim en panne : la productivité s'effondre." : "🥵 Canicule : 36 °C dehors, l'équipe tourne au ralenti.";
  } else if (r < 0.02) {
    texte = "🚇 Grève des transports : retards en série, certains restent en télétravail.";
  }
  if (!texte) return;
  e.compteurs.meteoMalusJour = jour;
  log(e, texte, "mal");
  if (texte.includes("Neige") || texte.includes("Grève")) for (const a of e.agents.filter((x) => metier(x) && present(x))) if (rnd() < 0.35) a.activite = "teletravail";
}

/** Coefficient de productivité du jour (neige, canicule, grève). */
export const facteurMeteo = (e: Etat) => (e.compteurs.meteoMalusJour === jourDe(e.minute) ? 0.85 : 1);

// ---------- 9. fêtes du calendrier ----------

function fetes(e: Etat, jour: number) {
  const m = moisDe(jour);
  const d = jourDuMois(jour);
  const fete = (cle: string, texte: string, moral: number) => {
    const k = `fete_${cle}`;
    if (e.compteurs[k] === anneeDe(jour)) return;
    e.compteurs[k] = anneeDe(jour);
    log(e, texte, "bien");
    for (const a of e.agents) a.moral = clamp(a.moral + moral);
    const x = e.agents.find(present);
    if (x) dire(e, x, texte.split(" ")[0], 30);
  };
  if (m === 1 && d <= 10 && jourSemaine(jour) >= 1 && jourSemaine(jour) <= 5) fete("galette", "👑 Galette des rois à la cafétéria ! " + (e.agents.length ? `${pick(e.agents).prenom} a eu la fève.` : ""), 3);
  if (m === 2 && d >= 2 && d <= 4) fete("chandeleur", "🥞 Chandeleur : crêpes pour tout le monde au goûter.", 2);
  if (m === 6 && d >= 20 && d <= 22) fete("musique", "🎸 Fête de la musique : l'équipe sort ensemble après le travail.", 3);
  if (m === 10 && d >= 29) fete("halloween", "🎃 Halloween : citrouilles à l'accueil et bonbons sur les bureaux.", 2);
  if (m === 12 && d >= 10 && d <= 16 && e.compteurs.noelAnnee !== anneeDe(jour) && e.agents.length >= 3) {
    e.compteurs.noelAnnee = anneeDe(jour);
    const n = e.agents.length;
    messageSpecial(e, "cabinet", 3, "🎄 Soirée de Noël et Secret Santa", `Le sapin est installé à l'accueil et le Secret Santa est lancé (cadeaux de 20 € tirés au sort). Quelle soirée de fin d'année organises-tu pour les ${n} collaborateurs ?`, "client:|agent:", {}, [
      opt(`Grande soirée dans une salle avec DJ (${euros(n * 85)})`, "noel:grand", { tresorerie: -n * 85, moralEquipe: 14, stressEquipe: -8 }, "Une soirée dont tout le monde se souviendra."),
      opt(`Dîner au restaurant (${euros(n * 45)})`, "noel:diner", { tresorerie: -n * 45, moralEquipe: 8, stressEquipe: -5 }, "Belle soirée conviviale."),
      opt(`Buffet au cabinet (${euros(n * 15)})`, "noel:buffet", { tresorerie: -n * 15, moralEquipe: 4 }, "Simple et sympathique."),
      opt("Pas de soirée cette année", "noel:non", { moralEquipe: -8 }, "Ambiance un peu triste à l'approche des fêtes."),
    ]);
  }
}

// ---------- effets des décisions ----------

export function actionVie2(e: Etat, code: string, m: Message): boolean {
  const [type, p1] = code.split(":");
  const agentId = (m.dossier ?? "").split("|")[1]?.replace("agent:", "");
  const a = e.agents.find((x) => x.id === agentId);
  switch (type) {
    case "agenda_tout": {
      const ids = (m.dossier ?? "").split("|")[0].replace("client:", "").split(",");
      for (const c of e.clients.filter((x) => ids.includes(x.id))) c.satisfaction = clamp(c.satisfaction + 6);
      fatiguerToi(e, 16);
      return true;
    }
    case "agenda_deleguer":
      fatiguerToi(e, 5);
      return true;
    case "agenda_reporter": {
      const ids = (m.dossier ?? "").split("|")[0].replace("client:", "").split(",");
      for (const c of e.clients.filter((x) => ids.includes(x.id))) c.satisfaction = clamp(c.satisfaction - 4);
      e.compteurs.formeToi = clamp(forme(e) + 5);
      return true;
    }
    case "contre_offre":
      if (a) {
        a.salaire = Math.round(a.salaire * 1.1);
        a.moral = clamp(a.moral + 15);
        a.confiance = clamp(a.confiance + 8);
      }
      return true;
    case "motivation":
      if (a) {
        if (rnd() < 0.55) {
          a.moral = clamp(a.moral + 12);
          log(e, `💬 ${a.prenom} décline l'offre concurrente : le projet du cabinet l'a convaincu·e.`, "bien");
        } else depart(e, a, "a accepté l'offre d'un cabinet concurrent");
      }
      return true;
    case "laisser_partir":
      if (a) depart(e, a, "a accepté l'offre d'un cabinet concurrent");
      return true;
    case "seminaire":
      if (p1 !== "non") souvenir(e, "🏔️", `Séminaire ${p1 === "annecy" ? "à Annecy" : p1 === "barcelone" ? "à Barcelone" : "en ville"} ${anneeDe(jourDe(e.minute))}`);
      return true;
    case "rumeur_dementi":
    case "rumeur_reunion":
    case "rumeur_rien":
      return true;
    case "nao_tout":
    case "nao_compromis": {
      const pct = type === "nao_tout" ? 1.03 : 1.02;
      for (const x of e.agents) x.salaire = Math.round(x.salaire * pct);
      log(e, `🤝 NAO : accord signé (+${Math.round((pct - 1) * 100)} % de salaire).`, "bien");
      return true;
    }
    case "nao_refus":
      return true;
    case "offre": {
      const coef = Number(p1);
      if (!coef) return true;
      const o = OFFRES[Number(m.payload?.offre ?? 0)];
      const chance = (coef === 0.8 ? 0.7 : coef === 1 ? 0.45 : 0.22) * (0.6 + e.reputation / 100);
      if (rnd() < chance) {
        e.clients.push({ ...o, id: uid(e, "cl"), satisfaction: 70, forfait: Math.round((o.forfait * coef) / 50) * 50 });
        log(e, `🏆 Appel d'offres gagné : ${o.nom} rejoint le cabinet (${euros(o.forfait * coef)} / mois) !`, "bien");
        souvenir(e, "🏆", `Appel d'offres gagné : ${o.nom}`);
        e.reputation = clamp(e.reputation + 3);
      } else log(e, `📑 Appel d'offres perdu : ${o.nom} a choisi un autre cabinet.`, "mal");
      return true;
    }
    case "rachat": {
      const coef = Number(p1);
      if (!coef) return true;
      const nb = Number(m.payload?.nb ?? 3);
      const prix = Number(m.payload?.prix ?? 10000) * coef;
      if (coef < 1 && rnd() < 0.45) {
        log(e, "🏢 Maître Dufresne refuse ta contre-proposition et vend à un confrère.", "mal");
        return true;
      }
      e.tresorerie -= prix;
      const secteurs = ["Boulangerie artisanale", "Garage automobile", "Profession libérale", "Commerce alimentaire", "Immobilier", "BTP"];
      for (let i = 0; i < nb; i++) {
        const s = secteurs[(hash(m.id) + i) % secteurs.length];
        e.clients.push({ id: uid(e, "cl"), nom: `${s.split(" ")[0]} ${pick(["Martin", "Bernard", "Petit", "Durand", "Leroy", "Moreau"])}`, dirigeant: pick(["M. Martin", "Mme Bernard", "M. Petit", "Mme Durand"]), secteur: s, trait: "client historique de Maître Dufresne, un peu méfiant", satisfaction: 58, forfait: 2600, tvaMensuelle: rnd() < 0.5, paie: rnd() < 0.5 });
      }
      log(e, `🏢 Rachat de la clientèle de Maître Dufresne : ${nb} nouveaux clients pour ${euros(prix)}.`, "bien");
      souvenir(e, "🏢", "Rachat de la clientèle de Maître Dufresne");
      return true;
    }
    case "noel":
      if (p1 !== "non") souvenir(e, "🎄", `Soirée de Noël ${anneeDe(jourDe(e.minute))}`);
      return true;
  }
  return false;
}

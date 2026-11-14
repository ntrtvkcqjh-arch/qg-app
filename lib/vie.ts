// Vie du cabinet : événements de vie, relations, période d'essai, départs,
// pannes, évacuations, livreurs, presse, réseau, clients célèbres,
// rendez-vous clients, imprévus de dossiers et comité des associés.

import { anneeDe, dateDe, jourDe, minuteDuJour, moisDe } from "@/lib/calendrier";
import { CHEVEUX, COULEURS, NOMS, PEAUX, PERSONNALITES, PRENOMS } from "@/lib/data/equipe";
import { initSkills, messageSpecial } from "@/lib/ext";
import {
  SANS_POSTE,
  aService,
  ajouterJoursOuvres,
  ajouterVisiteur,
  clamp,
  depart,
  dire,
  donnerBadge,
  hash,
  inc,
  log,
  pick,
  pieceOuverte,
  repartir,
  rnd,
  uid,
} from "@/lib/moteur";
import type { Agent, Client, Etat, Message, OptionDilemme } from "@/lib/types";
import { actionVie2, debutJourneeVie2, quartVie2, souvenir } from "@/lib/vie2";
import { actionVie3, debutJourneeVie3, quartVie3 } from "@/lib/vie3";

const PRENOMS_F = new Set(["Léa", "Sophie", "Inès", "Nadia", "Camille", "Manon", "Chloé", "Emma", "Sarah", "Amina", "Zoé", "Clara", "Lina", "Jade"]);
const opt = (label: string, code: string, effets: OptionDilemme["effets"] = {}, resultat = "C'est noté."): OptionDilemme => ({ label, cout: 0, effets, resultat, action: "vie", code });
const present = (a: Agent) => !["absent", "conge", "malade", "teletravail"].includes(a.activite);
const metier = (a: Agent) => a.filiere !== "service" && a.filiere !== "associe";

// ---------- hooks ----------

export function debutJourneeVie(e: Etat, jour: number, premierDuMois: boolean) {
  evenementsDeVie(e, jour);
  relationsSpontanees(e);
  periodesEssai(e, jour);
  contratsCourts(e, jour);
  microEvenements(e, jour);
  planifierEvacuation(e, jour);
  livraisons(e);
  debutJourneeVie2(e, jour, premierDuMois);
  debutJourneeVie3(e, jour, premierDuMois);
  if (premierDuMois && jour > 0) {
    presse(e, jour);
    reseau(e, jour);
    comiteAssocies(e, jour);
    imprevusDossiers(e, jour);
    clientCelebre(e, jour);
  }
}

/** Chaque quart d'heure : évacuation en cours, humeurs visibles. */
export function quartVie(e: Etat) {
  quartVie2(e);
  quartVie3(e);
  const jour = jourDe(e.minute);
  const m = minuteDuJour(e.minute);
  if (e.compteurs.evacuationJour === jour && m === e.compteurs.evacuationMinute) {
    const coupure = e.compteurs.evacuationType === 1;
    for (const a of e.agents.filter(present)) {
      a.activite = "evacuation";
      a.activiteJusqua = e.minute + (coupure ? 60 : 40);
    }
    log(e, coupure ? "⚡ Coupure de courant : tout le monde sort prendre l'air en attendant le retour de l'électricité." : "🚨 Alerte incendie : évacuation générale sur le trottoir ! (Fausse alerte : un toast brûlé à la cafétéria.)", "mal");
    for (const d of e.dossiers) if (d.phase < 5 && d.phase > 1 && rnd() < 0.2) d.progression = Math.max(0, d.progression - 5);
  }
  if (e.compteurs.comiteJour === jour && m === 9 * 60) {
    for (const a of e.agents.filter((x) => x.filiere === "associe" && present(x))) {
      a.activite = "reunion";
      a.activiteJusqua = e.minute + 90;
    }
  }
  for (const a of e.agents) {
    if (!present(a) || a.bulle || rnd() > 0.01) continue;
    if ((a.activite === "pause" || a.activite === "dejeuner") && a.moral > 60) dire(e, a, pick(["😂", "Haha, trop drôle !", "Tu connais la dernière ?"]), 15);
    else if (a.moral < 22) dire(e, a, pick(["😢", "Dure journée…", "J'en peux plus"]), 20);
    else if (a.moral > 80 && a.activite === "travaille") dire(e, a, pick(["🙂", "Belle journée !", "J'adore ce dossier"]), 15);
  }
}

// ---------- 1. événements de vie ----------

function evenementsDeVie(e: Etat, jour: number) {
  for (const a of e.agents.filter((x) => metier(x) && present(x) || x.activite === "absent")) {
    if (a.activite === "conge" || a.activite === "malade" || a.remplace || rnd() > 0.0012) continue;
    const x = rnd();
    if (x < 0.25) {
      messageSpecial(e, a.id, 2, `💍 ${a.prenom} se marie !`, `${a.prenom} annonce son mariage samedi prochain et prendra ses 4 jours de congé pour événement familial.`, `client:|agent:${a.id}`, {}, [
        opt("Cagnotte et cadeau de toute l'équipe (200 €)", "conge:4", { tresorerie: -200, confianceAgent: 10, moralEquipe: 3 }, "L'équipe est ravie de participer."),
        opt("Une carte de félicitations", "conge:4", { confianceAgent: 4 }),
        opt("Rien de spécial", "conge:4", { confianceAgent: -4 }),
      ]);
    } else if (x < 0.45) {
      const mere = PRENOMS_F.has(a.prenom);
      const duree = mere ? 80 : 18; // congé maternité ≈ 16 semaines, paternité ≈ 25 jours calendaires
      messageSpecial(e, a.id, 4, `👶 ${a.prenom} attend un heureux événement`, `${a.prenom} part bientôt en congé ${mere ? "maternité (environ 16 semaines)" : "paternité (25 jours)"}. Comment organises-tu son absence ?`, `client:|agent:${a.id}`, { duree }, [
        opt("Recruter un CDD de remplacement", `naissance_cdd:${duree}`, { confianceAgent: 8 }, "Un remplaçant va arriver."),
        opt("Répartir ses dossiers sur l'équipe", `naissance_repartir:${duree}`, { stressEquipe: 6, confianceAgent: 4 }, "L'équipe se serre les coudes."),
        opt("Cadeau de naissance et répartition des dossiers (150 €)", `naissance_repartir:${duree}`, { tresorerie: -150, confianceAgent: 12, stressEquipe: 4, moralEquipe: 3 }, "Un beau geste."),
      ]);
    } else if (x < 0.75) {
      a.activite = "conge";
      a.absentJusquau = ajouterJoursOuvres(jour, 1);
      log(e, `📦 ${a.prenom} déménage aujourd'hui (jour de congé pour déménagement).`);
    } else if (x < 0.85) {
      messageSpecial(e, a.id, 4, `🕊️ ${a.prenom} a perdu un proche`, `${a.prenom} vient de perdre un proche et sera absent·e quelques jours.`, `client:|agent:${a.id}`, {}, [
        opt("Lui laisser une semaine et prendre de ses nouvelles", "conge:5", { confianceAgent: 14, moralEquipe: 2 }, "Ton soutien compte beaucoup."),
        opt("Un message de soutien de l'équipe", "conge:3", { confianceAgent: 6 }),
        opt("Les 3 jours légaux, sans plus", "conge:3", { confianceAgent: -6 }),
      ]);
    }
  }
}

// ---------- 2. relations spontanées ----------

function relationsSpontanees(e: Etat) {
  const gens = e.agents.filter((a) => a.filiere !== "service");
  if (gens.length < 2 || e.relations.length > gens.length * 1.5) return;
  for (let k = 0; k < Math.min(6, Math.ceil(gens.length / 12)); k++) {
    const a = pick(gens);
    const b = pick(gens.filter((x) => x.id !== a.id && (x.filiere === a.filiere || x.personnalite === "sociable" || a.personnalite === "sociable")));
    if (!b) continue;
    const existante = e.relations.find((r) => (r.a === a.id && r.b === b.id) || (r.a === b.id && r.b === a.id));
    if (existante) {
      if (existante.type === "amitie") {
        existante.intensite = clamp(existante.intensite + 4);
        if (existante.intensite > 85 && rnd() < 0.08) {
          existante.type = "couple";
          log(e, `💕 On murmure à la machine à café que ${a.prenom} et ${b.prenom} sortent ensemble…`);
        } else if (rnd() < 0.02) {
          existante.type = "rivalite";
          existante.intensite = 50;
          log(e, `💢 ${a.prenom} et ${b.prenom} se sont brouillés pour une histoire de dossier.`, "mal");
        }
      }
      continue;
    }
    const cle = `aff:${[a.id, b.id].sort().join("|")}`;
    e.compteurs[cle] = (e.compteurs[cle] ?? 0) + 1;
    if (e.compteurs[cle] >= 2 || rnd() < 0.3) {
      e.relations.push({ a: a.id, b: b.id, type: "amitie", intensite: 55 });
      delete e.compteurs[cle];
      log(e, `🤝 ${a.prenom} et ${b.prenom} sont devenus amis : on les voit déjeuner ensemble.`);
    }
  }
}

// ---------- 4. période d'essai ----------

/** À appeler à l'arrivée d'une nouvelle recrue. */
export function nouvelleRecrue(e: Etat, a: Agent) {
  if (a.filiere === "associe" || a.filiere === "service") return;
  const jour = jourDe(e.minute);
  a.essaiJusquau = ajouterJoursOuvres(jour, 40);
  const parrain = e.agents.filter((x) => x.id !== a.id && x.filiere === a.filiere && x.competence >= 60).sort((p, q) => q.competence - p.competence)[0];
  if (parrain) {
    a.parrain = parrain.id;
    a.tuteur ??= parrain.id;
  }
  a.bulle = "Premier jour !";
  a.bulleJusqua = e.minute + 240;
  log(e, `🎒 Premier jour de ${a.prenom} : badge, poste installé${parrain ? ` et visite guidée avec ${parrain.prenom}, son parrain` : ""}. Période d'essai jusqu'au ${dateDe(a.essaiJusquau).toLocaleDateString("fr-FR", { timeZone: "UTC" })}.`);
}

function periodesEssai(e: Etat, jour: number) {
  for (const a of e.agents.filter((x) => x.essaiJusquau === jour)) {
    const avis = a.competence > 60 ? "très bonne" : a.competence > 45 ? "correcte" : "fragile";
    messageSpecial(e, a.id, 4, `📋 Fin de période d'essai : ${a.prenom}`, `La période d'essai de ${a.prenom} (${a.poste.toLowerCase()}) se termine. Son intégration est ${avis} (compétence ${Math.round(a.competence)}, moral ${Math.round(a.moral)}).`, `client:|agent:${a.id}`, {}, [
      opt("Confirmer l'embauche", "essai_ok", { confianceAgent: 12, moralEquipe: 1 }, `${a.prenom} est confirmé·e.`),
      opt("Renouveler la période d'essai", "essai_plus", { confianceAgent: -8, stressAgent: 10 }, "Encore quelques semaines pour se décider."),
      opt("Mettre fin à la période d'essai", "essai_fin", { moralEquipe: -3 }, "Une décision difficile."),
    ]);
  }
}

// ---------- CDD de remplacement ----------

function recruterCdd(e: Etat, absent: Agent, duree: number) {
  const jour = jourDe(e.minute);
  const cdd: Agent = {
    id: uid(e, "a"),
    prenom: pick(PRENOMS),
    nom: pick(NOMS),
    poste: `${absent.poste} (CDD)`,
    filiere: absent.filiere,
    personnalite: pick(PERSONNALITES),
    couleur: pick(COULEURS),
    cheveux: pick(CHEVEUX),
    peau: pick(PEAUX),
    bureau: SANS_POSTE,
    competence: clamp(absent.competence - 8 + rnd() * 10),
    stress: 20,
    fatigue: 10,
    confiance: 55,
    moral: 70,
    salaire: absent.salaire,
    activite: "absent",
    activiteJusqua: 0,
    absentJusquau: 0,
    embauche: jour,
    clan: null,
    bulle: "Premier jour !",
    bulleJusqua: e.minute + 240,
    remplace: absent.id,
    finContrat: ajouterJoursOuvres(jour, duree),
  };
  e.agents.push(cdd);
  cdd.bureau = absent.bureau; // il prend le poste de la personne absente
  initSkills(cdd);
  for (const d of e.dossiers) if (d.agent === absent.id && d.phase < 5) d.agent = cdd.id;
  log(e, `🧳 ${cdd.prenom} ${cdd.nom} arrive en CDD pour remplacer ${absent.prenom}.`, "bien");
}

function contratsCourts(e: Etat, jour: number) {
  for (const a of e.agents.filter((x) => x.finContrat !== undefined && x.finContrat <= jour)) {
    const titulaire = e.agents.find((x) => x.id === a.remplace);
    for (const d of e.dossiers) if (d.agent === a.id && d.phase < 5) d.agent = titulaire?.id ?? null;
    depart(e, a, "termine son CDD de remplacement");
  }
}

// ---------- 5. pots de départ ----------

export function potDeDepart(e: Etat, prenom: string, raison: string) {
  if (/CDD|faute de réponse/.test(raison) || !e.agents.length) return;
  messageSpecial(e, "cabinet", 2, `🥂 Pot de départ de ${prenom}`, `${prenom} quitte le cabinet. L'équipe se demande s'il y aura un pot de départ.`, "client:|agent:", {}, [
    opt("Pot, discours et cadeau collectif (400 €)", "rien", { tresorerie: -400, moralEquipe: 6 }, "Un départ réussi, l'équipe est touchée."),
    opt("Un petit mot de remerciement en réunion", "rien", { moralEquipe: 2 }),
    opt("Rien", "rien", { moralEquipe: -5 }, "L'équipe trouve ça froid."),
  ]);
}

// ---------- 6. micro-événements ----------

function microEvenements(e: Etat, jour: number) {
  if (rnd() > 0.05 || !e.agents.length) return;
  const x = rnd();
  const depanneur = aService(e, "office") || aService(e, "it");
  if (x < 0.4) {
    if (depanneur) return log(e, "☕ La machine à café est tombée en panne… réparée dans l'heure par les services généraux.");
    messageSpecial(e, "cabinet", 2, "☕ La machine à café est en panne", "Drame à la cafétéria : plus de café. Les visages s'allongent.", "client:|agent:", {}, [
      opt("Appeler un réparateur en urgence (150 €)", "rien", { tresorerie: -150, moralEquipe: 1 }, "Le café coule de nouveau."),
      opt("Attendre le passage du technicien la semaine prochaine", "rien", { moralEquipe: -4, stressEquipe: 2 }, "Une semaine sans café…"),
    ]);
  } else if (x < 0.75) {
    if (depanneur) return log(e, "🖨️ L'imprimante s'est bloquée : débloquée par le support.");
    messageSpecial(e, "cabinet", 2, "🖨️ Bourrage géant à l'imprimante", "L'imprimante du plateau refuse d'imprimer les liasses. Tout le monde attend.", "client:|agent:", {}, [
      opt("Faire venir un technicien (120 €)", "rien", { tresorerie: -120 }, "Réparée."),
      opt("Bricoler soi-même", "rien", { stressEquipe: 3 }, "Une heure perdue, mais ça remarche."),
    ]);
  } else if ([6, 7, 8].includes(moisDe(jour))) {
    messageSpecial(e, "cabinet", 2, "🥵 La climatisation a lâché", "Il fait 31 °C dans l'open space. L'équipe souffre.", "client:|agent:", {}, [
      opt("Réparation en urgence (300 €)", "rien", { tresorerie: -300 }, "Fraîcheur retrouvée."),
      opt("Ventilateurs et glaces pour tout le monde (80 €)", "rien", { tresorerie: -80, moralEquipe: 2, stressEquipe: 3 }),
      opt("Patienter", "rien", { moralEquipe: -6, stressEquipe: 6 }),
    ]);
  }
}

// ---------- 7. évacuation / coupure ----------

function planifierEvacuation(e: Etat, jour: number) {
  if (rnd() > 0.006) return;
  e.compteurs.evacuationJour = jour;
  e.compteurs.evacuationMinute = (10 + Math.floor(rnd() * 6)) * 60 + 15 * Math.floor(rnd() * 4);
  e.compteurs.evacuationType = rnd() < 0.5 ? 1 : 0;
}

// ---------- 8. livreurs ----------

function livraisons(e: Etat) {
  if (rnd() < 0.35) {
    ajouterVisiteur(e, pick(["Coursier", "Livreur", "Facteur"]), "livraison");
    if (rnd() < 0.15 && e.clients.length) log(e, `✉️ Recommandé avec accusé de réception de l'administration fiscale pour ${pick(e.clients).nom}.`);
  }
}

// ---------- 9. clients célèbres ----------

const CELEBRES: (Omit<Client, "id" | "satisfaction"> & { accroche: string })[] = [
  { nom: "Maison Varenne", dirigeant: "Chef Hugo Varenne", secteur: "Restaurant étoilé", trait: "perfectionniste, exige une réponse en une heure", forfait: 6500, tvaMensuelle: true, paie: true, accroche: "Le chef deux étoiles de la ville" },
  { nom: "FC Littoral", dirigeant: "Président Marc Aubry", secteur: "Club de football professionnel", trait: "droits d'image, transferts, paie des joueurs", forfait: 9000, tvaMensuelle: true, paie: true, accroche: "Le club de foot de la ville" },
  { nom: "Nébula Robotics", dirigeant: "Dr Léna Fabre", secteur: "Start-up deeptech", trait: "vient de lever 10 M€, veut un reporting investisseurs mensuel", forfait: 7500, tvaMensuelle: true, paie: true, accroche: "La start-up qui fait la une" },
  { nom: "Château Montclair", dirigeant: "Famille Montclair", secteur: "Domaine viticole", trait: "stocks de vin, foncier agricole, transmission familiale", forfait: 5500, tvaMensuelle: true, paie: true, accroche: "Le grand domaine viticole de la région" },
  { nom: "Galerie Orsini", dirigeant: "Bianca Orsini", secteur: "Galerie d'art", trait: "œuvres en dépôt, TVA sur la marge", forfait: 4000, tvaMensuelle: true, paie: false, accroche: "La galerie d'art en vogue" },
];

function clientCelebre(e: Etat, jour: number) {
  if (e.reputation < 65 || rnd() > 0.35) return;
  const libre = CELEBRES.filter((c) => !e.clients.some((x) => x.nom === c.nom) && !e.propositions.some((p) => p.nouveau?.nom === c.nom));
  if (!libre.length) return;
  const c = pick(libre);
  const prop = {
    id: uid(e, "p"),
    origine: "visite" as const,
    clientId: null,
    nouveau: { nom: c.nom, dirigeant: c.dirigeant, secteur: c.secteur, trait: c.trait, satisfaction: 65, forfait: c.forfait, tvaMensuelle: c.tvaMensuelle, paie: c.paie },
    titre: `⭐ ${c.accroche} veut te rencontrer`,
    description: `${c.dirigeant} (${c.secteur.toLowerCase()}) : client prestigieux mais exigeant (« ${c.trait} »). Signer ce client fera parler du cabinet.`,
    missions: [{ type: "conseil" as const, titre: `Reprise du dossier — ${c.nom}`, honoraires: 4000, delai: 10 }],
    forfait: c.forfait,
    difficulte: 4,
    risque: null,
    recue: jour,
    expire: jour + 1,
  };
  e.propositions.push(prop);
  ajouterVisiteur(e, c.dirigeant, prop.id);
  log(e, `⭐ ${c.dirigeant} (${c.nom}) se présente à l'accueil. Un client de prestige !`, "bien");
}

// ---------- 10. presse ----------

function presse(e: Etat, jour: number) {
  if (e.reputation > 75 && rnd() < 0.5) {
    e.reputation = clamp(e.reputation + 2);
    e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 2;
    log(e, `📰 La presse locale consacre un article élogieux au cabinet : « ${pick(["Un cabinet où il fait bon travailler", "L'expertise-comptable version start-up", "Le cabinet qui monte"])} ».`, "bien");
  } else if (e.reputation < 35 && rnd() < 0.4) {
    e.reputation = clamp(e.reputation - 3);
    log(e, "📰 Article critique dans la presse locale : des clients se plaignent de retards. Ta réputation en pâtit.", "mal");
  }
  if (moisDe(jour) === 12 && !e.compteurs[`prix:${anneeDe(jour)}`]) {
    e.compteurs[`prix:${anneeDe(jour)}`] = 1;
    const rivaux = e.concurrents.filter((c) => c.type !== "big4");
    if (e.reputation >= 80 && rivaux.every((c) => e.reputation >= c.reputation)) {
      e.reputation = clamp(e.reputation + 5);
      donnerBadge(e, "prix");
      souvenir(e, "🏆", `Prix du Cabinet de l'année ${anneeDe(jour)}`);
      log(e, `🏆 ${e.nomCabinet} reçoit le prix du « Cabinet de l'année » de la ville !`, "bien");
    }
  }
}

// ---------- 13. vie du réseau ----------

function reseau(e: Etat, jour: number) {
  const mois = moisDe(jour);
  const associe = e.agents.some((a) => a.filiere === "associe");
  if (mois === 10) {
    messageSpecial(e, "cabinet", 3, "🎤 Congrès annuel de l'Ordre", "Le congrès de l'Ordre des experts-comptables a lieu ce mois-ci : conférences, confrères, nouveautés de la profession.", "client:|agent:", {}, [
      opt("S'inscrire et y passer deux jours (1 500 €)", "reseau:3", { tresorerie: -1500, reputation: 3 }, "Tu reviens avec des contacts et des idées."),
      opt("Envoyer un associé", associe ? "reseau:2" : "rien", { tresorerie: -1000, reputation: 1 }),
      opt("Pas cette année", "rien", {}),
    ]);
  } else if (mois === 3) {
    messageSpecial(e, "cabinet", 3, "🏢 Salon des entrepreneurs", "Le grand salon des créateurs et dirigeants d'entreprise ouvre ses portes. Un stand coûte 3 000 €.", "client:|agent:", {}, [
      opt("Prendre un stand avec l'équipe (3 000 €)", "reseau:5", { tresorerie: -3000, reputation: 2 }, "Le stand ne désemplit pas."),
      opt("Y passer en visiteur", "reseau:1", {}),
      opt("Ne pas y aller", "rien", {}),
    ]);
  } else if (rnd() < 0.6) {
    messageSpecial(e, "cabinet", 2, "🥐 Petit-déjeuner de la CCI", "La chambre de commerce organise un petit-déjeuner des dirigeants : l'occasion de rencontrer des prospects.", "client:|agent:", {}, [
      opt("Y aller toi-même", "reseau:2", { reputation: 1 }, "Quelques cartes de visite échangées."),
      opt("Envoyer un associé", associe ? "reseau:2" : "rien", {}),
      opt("Décliner", "rien", {}),
    ]);
  }
}

// ---------- 11. rendez-vous clients ----------

const ARGUMENTS = ["Mettre en avant ton conseil et ta valeur ajoutée", "Insister sur le prix et la simplicité", "Promettre réactivité et disponibilité"];

export function rendezVousClient(e: Etat, c: Client) {
  const pref = hash(c.nom) % 3;
  messageSpecial(e, "cabinet", 3, `🤝 Rendez-vous avec ${c.dirigeant}`, `${c.dirigeant} (${c.nom}) est installé·e en salle de réunion pour son premier rendez-vous. Sur quoi insistes-tu ?`, `client:${c.id}|agent:`, { pref }, ARGUMENTS.map((l, i) => opt(l, `argument:${i}`, {}, "Le rendez-vous se termine.")));
}

// ---------- 12. imprévus dans les dossiers ----------

function imprevusDossiers(e: Etat, jour: number) {
  if (!e.clients.length || rnd() > 0.45) return;
  const c = pick(e.clients);
  const x = rnd();
  const [titre, type, honoraires, texte] =
    x < 0.33
      ? [`Audit de fraude interne — ${c.nom}`, "conseil", 4500, `${c.dirigeant} découvre que son comptable interne détournait des fonds. Il a besoin d'une investigation.`]
      : x < 0.66
        ? [`Assistance contrôle URSSAF — ${c.nom}`, "paie", 2500, `${c.nom} reçoit un avis de contrôle URSSAF et veut être accompagné.`]
        : [`Succession du dirigeant — ${c.nom}`, "juridique", 3000, `Le dirigeant de ${c.nom} est décédé brutalement : transmission des parts, continuité de l'entreprise.`];
  e.propositions.push({
    id: uid(e, "p"),
    origine: "client",
    clientId: c.id,
    nouveau: null,
    titre: `🚨 ${titre}`,
    description: texte,
    missions: [{ type: type as "conseil", titre, honoraires, delai: 12 }],
    forfait: 0,
    difficulte: 4,
    risque: null,
    recue: jour,
    expire: ajouterJoursOuvres(jour, 5),
  });
  log(e, `🚨 Imprévu chez ${c.nom} : ${titre.split(" — ")[0].toLowerCase()}. Une mission urgente t'attend dans les demandes.`, "mal");
}

// ---------- 14. comité des associés ----------

const INVESTISSEMENTS = [
  { nom: "un budget formation pour son pôle", cout: 4000, competence: 3, moral: 4 },
  { nom: "de nouveaux écrans et logiciels", cout: 6000, competence: 1, moral: 6 },
  { nom: "un séminaire de pôle", cout: 3000, competence: 0, moral: 9 },
];

function comiteAssocies(e: Etat, jour: number) {
  const associes = e.agents.filter((a) => a.filiere === "associe" && a.associeDe);
  if (associes.length < 2 || !pieceOuverte(e, "conseil")) return;
  e.compteurs.comiteJour = jour;
  const options = associes.slice(0, 3).map((a) => {
    const inv = INVESTISSEMENTS[hash(a.id + jour) % INVESTISSEMENTS.length];
    return opt(`Approuver ${a.prenom} (pôle ${a.associeDe}) : ${inv.nom} (${inv.cout.toLocaleString("fr-FR")} €)`, `investir:${a.id}:${INVESTISSEMENTS.indexOf(inv)}`, { tresorerie: -inv.cout }, "Investissement voté.");
  });
  options.push(opt("Tout reporter au prochain comité", "comite_refus", {}, "Les associés repartent frustrés."));
  messageSpecial(e, "cabinet", 4, "🏛️ Comité mensuel des associés", "Tes associés sont réunis en salle du conseil. Chacun défend un investissement pour son pôle. Que votes-tu ?", "client:|agent:", {}, options);
}

// ---------- effets des décisions ----------

export function actionVie(e: Etat, code: string, m: Message) {
  if (actionVie2(e, code, m) || actionVie3(e, code, m)) return;
  const [type, p1, p2] = code.split(":");
  const agentId = (m.dossier ?? "").split("|")[1]?.replace("agent:", "");
  const a = e.agents.find((x) => x.id === agentId);
  const jour = jourDe(e.minute);
  switch (type) {
    case "conge":
      if (a) {
        a.activite = "conge";
        a.absentJusquau = ajouterJoursOuvres(jour, Number(p1) || 3);
      }
      break;
    case "naissance_cdd":
    case "naissance_repartir":
      if (a) {
        const duree = Number(p1) || 18;
        a.activite = "conge";
        a.absentJusquau = ajouterJoursOuvres(jour, duree);
        if (type === "naissance_cdd") recruterCdd(e, a, duree);
        else {
          for (const d of e.dossiers) if (d.agent === a.id && d.phase < 5) d.agent = null;
          repartir(e);
        }
        log(e, `👶 ${a.prenom} part en congé de naissance.`);
      }
      break;
    case "essai_ok":
      if (a) {
        a.essaiJusquau = undefined;
        inc(e, "confirmations");
      }
      break;
    case "essai_plus":
      if (a) a.essaiJusquau = ajouterJoursOuvres(jour, 30);
      break;
    case "essai_fin":
      if (a) depart(e, a, "n'est pas confirmé·e à l'issue de la période d'essai");
      break;
    case "reseau":
      e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + (Number(p1) || 1);
      break;
    case "argument": {
      const c = e.clients.find((x) => x.id === (m.dossier ?? "").split("|")[0]?.replace("client:", ""));
      const pref = Number(m.payload?.pref ?? 0);
      if (c) {
        const bon = Number(p1) === pref;
        c.satisfaction = clamp(c.satisfaction + (bon ? 15 : -3));
        if (bon) e.reputation = clamp(e.reputation + 1);
        log(e, bon ? `🤝 Rendez-vous réussi : ${c.dirigeant} repart convaincu·e.` : `🤝 ${c.dirigeant} attendait autre chose de ce rendez-vous.`, bon ? "bien" : "neutre");
      }
      break;
    }
    case "investir": {
      const assoc = e.agents.find((x) => x.id === p1);
      const inv = INVESTISSEMENTS[Number(p2) || 0];
      if (assoc) {
        assoc.confiance = clamp(assoc.confiance + 8);
        for (const x of e.agents.filter((y) => y.filiere === assoc.associeDe)) {
          x.competence = clamp(x.competence + inv.competence, 0, 95);
          x.moral = clamp(x.moral + inv.moral);
        }
        log(e, `🏛️ Comité : investissement du pôle ${assoc.associeDe} approuvé (${inv.nom}).`, "bien");
      }
      break;
    }
    case "comite_refus":
      for (const x of e.agents.filter((y) => y.filiere === "associe")) x.confiance = clamp(x.confiance - 5);
      break;
  }
}

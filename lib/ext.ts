// Extensions de la simulation : horaires et droit du travail, télétravail,
// compétences et formations, DEC et mémoire, pôles, associés, IT,
// concurrents, facturation, entretiens annuels, événements d'équipe.
// Ce module est appelé par moteur.ts à des moments précis (« hooks »).

import { anneeDe, dateCourte, dateDe, jourDe, jourDeLaDate, minuteDuJour, moisDe, ouvreOuApres } from "@/lib/calendrier";
import {
  BONUS_FILIERE,
  COMMENTAIRES_SATISFACTION,
  CONCURRENTS_INITIAUX,
  DOMAINE_MISSION,
  ETAPES_MEMOIRE,
  FORMATIONS,
  LIBELLE_DOMAINE,
  POLES,
  SESSIONS_DEC,
} from "@/lib/data/developpement";
import { PROSPECTS_NOUVEAUX } from "@/lib/data/prospects";
import {
  ajouterJoursOuvres,
  ajouterVisiteur,
  avancerDossier,
  clamp,
  clientDepuis,
  creerDossier,
  depart,
  dire,
  hash,
  inc,
  log,
  pick,
  pieceOuverte,
  repartir,
  rnd,
  uid,
} from "@/lib/moteur";
import type { Agent, Domaine, Dossier, Etat, Facture, Message, OptionDilemme, TypeMission } from "@/lib/types";

const DOMAINES: Domaine[] = ["tva", "is", "paie", "juridique", "revision", "audit", "outils"];

// ---------- initialisation / migration ----------

export function initSkills(a: Agent) {
  if (a.skills) return;
  const s = {} as Record<Domaine, number>;
  const bonus = BONUS_FILIERE[a.filiere] ?? {};
  for (const d of DOMAINES) s[d] = clamp(Math.round(a.competence * 0.85 + (bonus[d] ?? 0) + ((hash(a.id + d) % 11) - 5)), 5, 95);
  a.skills = s;
  a.heuresSemaine ??= 0;
  a.heuresSup ??= 0;
  a.objectif ??= null;
  a.diplome ??= null;
  a.tuteur ??= null;
  a.anniversaire ??= hash(a.id + "anniv") % 365;
}

export function migrerExt(e: Etat) {
  e.politiqueHeures ??= "limitee";
  e.teletravailJours ??= 0;
  e.violations ??= 0;
  e.sessions ??= [];
  e.budgetFormation ??= 6000;
  e.statsThemes ??= {};
  e.dateDec ??= ouvreOuApres(jourDeLaDate(2026, 11, 16));
  e.memoire ??= { sujet: null, etape: 0, qualite: 0, soutenu: false };
  e.chefsPoles ??= {};
  e.concurrents ??= CONCURRENTS_INITIAUX.map((c) => ({ ...c }));
  e.factures ??= [];
  e.entretiensFaits ??= 2025;
  e.avatar ??= { cheveux: "#2a1a12", tenue: "#121a2e", peau: "#e8b894", deco: "#3a2a1d" };
  e.sons ??= false;
  e.meteo ??= "soleil";
  for (const a of e.agents) initSkills(a);
  // Revalorisation des forfaits (équilibrage) : une seule fois par partie.
  if (!e.compteurs.forfaitsRevus) {
    e.compteurs.forfaitsRevus = 1;
    for (const c of e.clients) c.forfait = Math.round((c.forfait * 1.3) / 50) * 50;
  }
}

// ---------- horaires ----------

/** Horaires du jour : arrivée avant 9 h, présence obligatoire jusqu'à 18 h, puis chacun décide. */
export function horairesAgent(e: Etat, a: Agent, jour: number) {
  const h = hash(a.id + ":" + jour);
  const decal = { anxieux: -25, perfectionniste: -20, ambitieux: -15, loyal: -10, sociable: 0, rebelle: 5, nonchalant: 10 }[a.personnalite];
  const arrivee = clamp(8 * 60 + 20 + (h % 35) + decal, 8 * 60, 9 * 60);
  const dejeuner = 12 * 60 + 15 + ((h >> 8) % 45);
  // Envie de rester après 18 h.
  const urgents = e.dossiers.filter((d) => d.agent === a.id && d.phase < 4 && d.echeance <= jour + 3).length;
  let envie = urgents * 0.8 + (a.personnalite === "ambitieux" || a.personnalite === "perfectionniste" ? 1 : 0) + (a.diplome ? 0.5 : 0);
  if (a.personnalite === "nonchalant") envie -= 3;
  if (a.fatigue > 75) envie -= 2.5;
  envie += ((h >> 4) % 10) / 10 - 0.3;
  let heuresEnPlus = clamp(envie * 0.8, 0, 6);
  const plafond = { libre: 6, limitee: 2, interdite: 0.5 }[e.politiqueHeures ?? "libre"];
  heuresEnPlus = Math.min(heuresEnPlus, plafond);
  const depart = Math.min(18 * 60 + ((h >> 6) % 20) + Math.round(heuresEnPlus * 60), 23 * 60 + 55);
  return { arrivee, depart, dejeuner };
}

export function estTeletravail(e: Etat, a: Agent, jour: number) {
  const n = e.teletravailJours ?? 0;
  if (!n || a.filiere === "associe") return false;
  const jds = dateDe(jour).getUTCDay(); // 1 = lundi
  if (jds === 1) return false; // le lundi, tout le monde est au cabinet
  return (hash(a.id + "tt") + jds) % 4 < n;
}

// ---------- vitesse et compétences ----------

export function facteurCompetence(e: Etat, a: Agent, d: Dossier): number {
  const dom = DOMAINE_MISSION[d.type];
  const skill = a.skills?.[dom] ?? a.competence;
  let f = (a.competence * 0.4 + skill * 0.6) / 60;
  f *= 0.92 + (a.skills?.outils ?? 50) / 600; // les outils accélèrent tout
  const chef = e.chefsPoles?.[a.filiere];
  if (chef && chef !== a.id && e.agents.some((x) => x.id === chef && x.activite === "travaille")) f *= 1.05;
  if (e.agents.some((x) => x.tuteur === a.id)) f *= 0.9; // le tuteur consacre du temps à son tutoré
  if (a.activite === "teletravail") f *= 0.95;
  return f;
}

export function progresserSkill(a: Agent, d: Dossier, quantite = 0.012) {
  if (!a.skills) return;
  const dom = DOMAINE_MISSION[d.type];
  a.skills[dom] = clamp(a.skills[dom] + quantite * (a.objectif === dom ? 2 : 1), 0, 98);
}

/** Appelé à chaque quart pour un agent présent (heures, fatigue du soir, tutorat). */
export function quartAgent(e: Etat, a: Agent) {
  const m = minuteDuJour(e.minute);
  const auCabinet = a.activite !== "absent" && a.activite !== "conge" && a.activite !== "malade";
  if (!auCabinet) return;
  if (a.activite !== "pause") a.heuresSemaine = (a.heuresSemaine ?? 0) + 0.25; // la pause déjeuner n'est pas du temps de travail
  if (m >= 18 * 60 + 30) {
    a.heuresSup = (a.heuresSup ?? 0) + 0.25;
    a.fatigue = clamp(a.fatigue + (m >= 21 * 60 ? 0.5 : 0.25));
  }
  if (a.tuteur && a.skills) {
    const t = e.agents.find((x) => x.id === a.tuteur);
    if (t?.skills && t.activite === "travaille") {
      const fort = DOMAINES.reduce((x, y) => (t.skills![y] > t.skills![x] ? y : x));
      a.skills[fort] = clamp(a.skills[fort] + 0.02, 0, t.skills[fort]);
      if (a.diplome) a.diplome.progression = clamp(a.diplome.progression + 0.02);
    }
  }
}

export function noterDepart(e: Etat, a: Agent) {
  a.dernierDepart = e.minute;
}

export function noterArrivee(e: Etat, a: Agent) {
  if (a.dernierDepart && e.minute - a.dernierDepart < 11 * 60 && e.minute - a.dernierDepart > 0) {
    e.violations = (e.violations ?? 0) + 1;
    inc(e, "repos_non_respecte");
  }
}

// ---------- hooks de journée ----------

export function debutJourneeExt(e: Etat, jour: number, lundi: boolean, premierDuMois: boolean) {
  meteoDuJour(e, jour);
  if (lundi && jour > 0) droitDuTravail(e);
  if (premierDuMois && jour > 0) {
    payerHeuresSup(e);
    partAssocies(e);
    concurrentsDuMois(e, jour);
    incidentIT(e);
    if (moisDe(jour) === 1) {
      e.budgetFormation = 6000;
      enqueteSatisfaction(e, jour);
      campagneEntretiens(e, jour);
    }
    if (moisDe(jour) === 2 && e.entretiensFaits < anneeDe(jour)) {
      for (const a of e.agents) a.moral = clamp(a.moral - 5);
      log(e, "Les entretiens annuels n'ont pas eu lieu : l'équipe se sent oubliée.", "mal");
      e.entretiensFaits = anneeDe(jour);
    }
  }
  if (anneeDe(jour) === 2026 && moisDe(jour) === 9 && !e.compteurs.reformeFE) reformeFacturation(e, jour);
  anniversaires(e, jour);
  encaisserFactures(e, jour);
  sessionsDuJour(e, jour);
  for (const a of e.agents) {
    if (a.diplome && a.activite !== "conge") a.diplome.progression = clamp(a.diplome.progression + 0.4);
    if (a.diplome && a.diplome.progression >= 100) examenDiplome(e, a);
  }
}

export function finJourneeExt(e: Etat) {
  const jour = jourDe(e.minute);
  for (const s of e.sessions.filter((x) => x.jour === jour && !x.terminee)) terminerSession(e, s);
  e.sessions = e.sessions.filter((x) => !x.terminee || x.jour > jour - 30);
}

// ---------- droit du travail ----------

function droitDuTravail(e: Etat) {
  const depasses = e.agents.filter((a) => (a.heuresSemaine ?? 0) > 48);
  if (depasses.length) {
    e.violations += depasses.length;
    log(e, `⚠️ ${depasses.map((a) => a.prenom).join(", ")} ${depasses.length > 1 ? "ont" : "a"} dépassé 48 h la semaine dernière (durée maximale hebdomadaire).`, "mal");
  }
  for (const a of e.agents) a.heuresSemaine = 0;
  if (e.violations > 0 && rnd() < Math.min(0.45, e.violations * 0.06)) {
    const amende = Math.min(6000, 300 * e.violations);
    e.tresorerie -= amende;
    e.periode.charges += amende;
    e.reputation = clamp(e.reputation - 5);
    e.messages.unshift({
      id: uid(e, "m"),
      de: "cabinet",
      niveau: 5,
      sujet: "🏛️ Contrôle de l'inspection du travail",
      texte: `L'inspection du travail a relevé ${e.violations} manquement(s) : dépassement de la durée maximale hebdomadaire (48 h) et/ou repos quotidien de 11 heures consécutives non respecté. Amende : ${amende.toLocaleString("fr-FR")} €. Pense à limiter les heures supplémentaires dans les Réglages.`,
      jour: jourDe(e.minute),
      minute: e.minute,
      lu: false,
      statut: "info",
      expire: jourDe(e.minute) + 5,
      theme: "echeance",
    });
    log(e, `🏛️ Inspection du travail : ${amende.toLocaleString("fr-FR")} € d'amende.`, "mal");
    e.violations = 0;
  }
}

function payerHeuresSup(e: Etat) {
  let total = 0;
  for (const a of e.agents) {
    const h = a.heuresSup ?? 0;
    if (h > 0) total += h * (a.salaire / 151.67) * 1.25 * 1.45;
    a.heuresSup = 0;
  }
  if (total > 0) {
    total = Math.round(total);
    e.tresorerie -= total;
    e.periode.charges += total;
    log(e, `⏱️ Heures supplémentaires du mois payées (majorées de 25 %) : ${total.toLocaleString("fr-FR")} €.`);
  }
}

// ---------- télétravail, météo, anniversaires ----------

function meteoDuJour(e: Etat, jour: number) {
  const m = moisDe(jour);
  const x = rnd();
  const hiver = m === 12 || m <= 2;
  const ete = m >= 6 && m <= 8;
  e.meteo = hiver ? (x < 0.2 ? "neige" : x < 0.5 ? "pluie" : x < 0.75 ? "nuages" : "soleil") : ete ? (x < 0.1 ? "pluie" : x < 0.25 ? "nuages" : "soleil") : x < 0.3 ? "pluie" : x < 0.6 ? "nuages" : "soleil";
}

function anniversaires(e: Etat, jour: number) {
  const jdA = Math.floor((Date.UTC(anneeDe(jour), moisDe(jour) - 1, dateDe(jour).getUTCDate()) - Date.UTC(anneeDe(jour), 0, 1)) / 86400000);
  for (const a of e.agents) {
    if (a.anniversaire !== jdA) continue;
    e.messages.unshift({
      id: uid(e, "m"),
      de: "cabinet",
      niveau: 1,
      sujet: `🎂 C'est l'anniversaire de ${a.prenom} !`,
      texte: `${a.prenom} fête son anniversaire aujourd'hui. Toute l'équipe le sait… sauf peut-être toi ?`,
      jour,
      minute: e.minute,
      lu: false,
      statut: "attente",
      expire: jour + 1,
      theme: "anniversaire",
      dossier: `client:|agent:${a.id}`,
      dilemme: {
        titre: `Anniversaire de ${a.prenom}`,
        options: [
          { label: "Gâteau et bougies pour toute l'équipe (60 €)", cout: 0, effets: { tresorerie: -60, confianceAgent: 8, moralEquipe: 4 }, resultat: `${a.prenom} est ému·e.` },
          { label: "Une carte signée par tout le monde", cout: 0, effets: { confianceAgent: 4, moralEquipe: 1 }, resultat: "Petit geste apprécié." },
          { label: "Laisser passer", cout: 0, effets: { confianceAgent: -5 }, resultat: `${a.prenom} a remarqué.` },
        ],
      },
    });
  }
}

export function setPolitiqueHeures(e: Etat, p: Etat["politiqueHeures"]) {
  e.politiqueHeures = p;
  log(e, `Nouvelle règle d'heures supplémentaires : ${p === "libre" ? "libres jusqu'à minuit" : p === "limitee" ? "limitées à 20 h" : "interdites après 18 h 30"}.`);
}

export function setTeletravail(e: Etat, n: 0 | 1 | 2) {
  e.teletravailJours = n;
  for (const a of e.agents) a.moral = clamp(a.moral + (n > 0 ? 4 : -3));
  log(e, n ? `🏠 Télétravail autorisé : ${n} jour(s) par semaine (jamais le lundi).` : "🏠 Télétravail supprimé : retour au cabinet à 100 %.");
}

// ---------- formations ----------

export function planifierSession(e: Etat, formationId: string, jour: number, participants: string[]): string | null {
  const f = FORMATIONS.find((x) => x.id === formationId);
  if (!f) return "Formation inconnue.";
  if (!participants.length) return "Choisis au moins un participant.";
  if (participants.length > 4) return "4 places au maximum dans la salle.";
  if (jour <= jourDe(e.minute)) return "Choisis une date à partir de demain.";
  if (e.sessions.some((s) => s.jour === jour && !s.terminee)) return "La salle est déjà réservée ce jour-là.";
  const brut = f.prix * participants.length;
  const prisEnCharge = Math.min(e.budgetFormation, Math.round(brut * 0.5));
  const reste = brut - prisEnCharge;
  if (e.tresorerie < reste) return "Trésorerie insuffisante.";
  e.budgetFormation -= prisEnCharge;
  e.tresorerie -= reste;
  e.periode.charges += reste;
  e.sessions.push({ id: uid(e, "s"), formation: formationId, jour, participants, terminee: false });
  const noms = participants.map((id) => e.agents.find((a) => a.id === id)?.prenom).filter(Boolean).join(", ");
  log(e, `🎓 Formation « ${f.nom} » planifiée le ${dateCourte(jour)} pour ${noms} (${reste.toLocaleString("fr-FR")} € après prise en charge de ${prisEnCharge.toLocaleString("fr-FR")} €).`);
  return null;
}

/** Le jour J, les participants passent la journée en salle de formation. */
function sessionsDuJour(e: Etat, jour: number) {
  for (const s of e.sessions.filter((x) => x.jour === jour && !x.terminee)) {
    for (const id of s.participants) {
      const a = e.agents.find((x) => x.id === id);
      if (a && a.activite !== "conge" && a.activite !== "malade") {
        a.activite = "formation";
        a.activiteJusqua = jour * 1440 + 17 * 60 + 30;
      }
    }
  }
}

export const sessionDuJour = (e: Etat) => e.sessions?.find((s) => s.jour === jourDe(e.minute) && !s.terminee) ?? null;

function terminerSession(e: Etat, s: Etat["sessions"][number]) {
  const f = FORMATIONS.find((x) => x.id === s.formation)!;
  s.terminee = true;
  for (const id of s.participants) {
    const a = e.agents.find((x) => x.id === id);
    if (!a || !a.skills) continue;
    const gain = f.gain * (a.objectif === f.domaine ? 1.5 : 1) * f.jours;
    a.skills[f.domaine] = clamp(a.skills[f.domaine] + gain, 0, 98);
    a.competence = clamp(a.competence + gain / 4, 0, 95);
    a.moral = clamp(a.moral + 4);
    if (a.diplome) a.diplome.progression = clamp(a.diplome.progression + 6 * f.jours);
    if (f.id === "management") a.confiance = clamp(a.confiance + 3);
  }
  inc(e, "formations");
  log(e, `🎓 Fin de la formation « ${f.nom} » : +${f.gain * f.jours} en ${LIBELLE_DOMAINE[f.domaine]} pour les participants.`, "bien");
}

export function inscrireDiplome(e: Etat, agentId: string): string | null {
  const a = e.agents.find((x) => x.id === agentId);
  if (!a) return "Introuvable.";
  if (a.diplome) return `${a.prenom} prépare déjà le ${a.diplome.nom}.`;
  const dec = /Collaborat|Chef/.test(a.poste);
  if (!dec && !/Stagiaire|Assistant/.test(a.poste)) return "Parcours réservé aux stagiaires, assistants et collaborateurs.";
  const prix = dec ? 3000 : 1500;
  if (e.tresorerie < prix) return "Trésorerie insuffisante.";
  e.tresorerie -= prix;
  e.periode.charges += prix;
  a.diplome = { nom: dec ? "DEC" : "DSCG", progression: 0 };
  a.confiance = clamp(a.confiance + 10);
  a.moral = clamp(a.moral + 8);
  log(e, `📚 ${a.prenom} commence la préparation du ${a.diplome.nom} financée par le cabinet (${prix.toLocaleString("fr-FR")} €).`, "bien");
  return null;
}

function examenDiplome(e: Etat, a: Agent) {
  const d = a.diplome!;
  const moy = a.skills ? Object.values(a.skills).reduce((s, x) => s + x, 0) / 7 : a.competence;
  const reussi = rnd() < moy / 100 + 0.3;
  if (reussi) {
    a.salaire += d.nom === "DEC" ? 600 : 300;
    a.poste = d.nom === "DEC" ? "Expert-comptable salarié" : a.poste.startsWith("Stagiaire") ? "Assistant comptable" : "Collaborateur confirmé";
    a.competence = clamp(a.competence + 6, 0, 95);
    a.confiance = clamp(a.confiance + 12);
    log(e, `🎓 ${a.prenom} a obtenu le ${d.nom} ! Nouveau poste : ${a.poste.toLowerCase()} (${a.salaire.toLocaleString("fr-FR")} € brut).`, "bien");
    a.diplome = null;
    inc(e, "diplomes");
  } else {
    d.progression = 60;
    a.moral = clamp(a.moral - 8);
    log(e, `📚 ${a.prenom} n'a pas validé le ${d.nom} cette fois. Il·elle repartira en préparation.`, "mal");
  }
}

export function designerTuteur(e: Etat, junior: string, tuteur: string | null): string | null {
  const a = e.agents.find((x) => x.id === junior);
  if (!a) return "Introuvable.";
  if (tuteur === junior) return "Impossible d'être son propre tuteur.";
  a.tuteur = tuteur;
  if (tuteur) {
    e.relations = e.relations.filter((r) => !(r.type === "mentorat" && r.b === junior));
    e.relations.push({ a: tuteur, b: junior, type: "mentorat", intensite: 60 });
    log(e, `🤝 ${e.agents.find((x) => x.id === tuteur)?.prenom} devient tuteur·rice de ${a.prenom}.`);
  }
  return null;
}

// ---------- DEC : statistiques, objectif, mémoire ----------

export function enregistrerThemes(e: Etat, resultats: { theme: string; ok: boolean }[]) {
  for (const r of resultats) {
    const s = (e.statsThemes[r.theme] ??= { ok: 0, total: 0 });
    s.total++;
    if (r.ok) s.ok++;
  }
}

export function themesFaibles(e: Etat): string[] {
  return Object.entries(e.statsThemes ?? {})
    .filter(([, s]) => s.total >= 2)
    .sort((a, b) => a[1].ok / a[1].total - b[1].ok / b[1].total)
    .slice(0, 3)
    .map(([t]) => t);
}

export function fixerDateDec(e: Etat, index: number) {
  const s = SESSIONS_DEC[index];
  if (s) e.dateDec = ouvreOuApres(jourDeLaDate(s.annee, s.mois, s.jour));
}

export function choisirSujet(e: Etat, sujet: string) {
  e.memoire = { sujet, etape: 0, qualite: 0, soutenu: false };
  log(e, `📘 Sujet de mémoire choisi : « ${sujet} ».`);
}

export function etapeMemoire(e: Etat, choix: number): string | null {
  const m = e.memoire;
  if (!m.sujet) return "Choisis d'abord un sujet.";
  const et = ETAPES_MEMOIRE[m.etape];
  if (!et) return "Ton mémoire est terminé.";
  if (e.compteurs.memoireJour === jourDe(e.minute)) return "Une étape par jour : reviens demain.";
  if (e.pa < 1) return "Il te faut 1 PA pour travailler sur ton mémoire.";
  e.pa -= 1;
  e.compteurs.memoireJour = jourDe(e.minute);
  const bon = choix === et.bonne;
  m.qualite += bon ? 2 : 0;
  m.etape++;
  e.niveauDec = clamp(e.niveauDec + (bon ? 3 : 1));
  if (m.etape >= ETAPES_MEMOIRE.length) {
    m.soutenu = true;
    const note = Math.round(8 + (m.qualite / (ETAPES_MEMOIRE.length * 2)) * 10);
    e.compteurs.noteMemoire = note;
    log(e, `📘 Soutenance blanche de ton mémoire : ${note}/20.`, note >= 12 ? "bien" : "mal");
  } else log(e, `📘 Mémoire : étape « ${et.titre} » ${bon ? "réussie" : "à retravailler"}.`, bon ? "bien" : "neutre");
  return null;
}

// ---------- pôles et associés ----------

export function nommerChef(e: Etat, filiere: Agent["filiere"], agentId: string | null): string | null {
  const ancien = e.chefsPoles[filiere];
  if (ancien) {
    const a = e.agents.find((x) => x.id === ancien);
    if (a) a.salaire -= 200;
  }
  if (!agentId) {
    delete e.chefsPoles[filiere];
    return null;
  }
  const a = e.agents.find((x) => x.id === agentId);
  if (!a) return "Introuvable.";
  e.chefsPoles[filiere] = agentId;
  a.salaire += 200;
  a.moral = clamp(a.moral + 10);
  a.confiance = clamp(a.confiance + 8);
  const pole = POLES.find((p) => p.filiere === filiere);
  log(e, `⭐ ${a.prenom} est nommé·e chef·fe du ${pole?.nom ?? "pôle"} (+200 € brut).`, "bien");
  // Les rivaux du même pôle le vivent mal.
  for (const r of e.relations.filter((x) => x.type === "rivalite" && (x.a === agentId || x.b === agentId))) {
    const autre = e.agents.find((x) => x.id === (r.a === agentId ? r.b : r.a));
    if (autre && autre.filiere === filiere) autre.moral = clamp(autre.moral - 8);
  }
  return null;
}

export function arriveeAssocie(e: Etat, a: Agent) {
  const libres = PROSPECTS_NOUVEAUX.filter((p) => !p.risque && !e.clients.some((c) => c.nom === p.nom));
  const jour = jourDe(e.minute);
  for (let i = 0; i < 3 && libres.length; i++) {
    const p = libres.splice(Math.floor(rnd() * libres.length), 1)[0];
    const c = clientDepuis(e, p, 78);
    creerDossier(e, c, "conseil", ajouterJoursOuvres(jour, 12), jour, `Reprise du dossier — ${c.nom}`).honoraires = 1200;
  }
  repartir(e);
  log(e, `🤝 ${a.prenom} ${a.nom} devient associé·e et apporte sa clientèle. Il·elle touchera 25 % des bénéfices mensuels.`, "bien");
}

function partAssocies(e: Etat) {
  const associes = e.agents.filter((a) => a.filiere === "associe");
  if (!associes.length) return;
  const derniers = e.bilans.slice(0, 4);
  const resultat = derniers.reduce((s, p) => s + p.ca - p.charges, 0);
  if (resultat <= 0) return;
  const part = Math.round(resultat * 0.25);
  e.tresorerie -= part;
  e.periode.charges += part;
  log(e, `🤝 Quote-part des associés sur le résultat du mois : ${part.toLocaleString("fr-FR")} €.`);
}

function incidentIT(e: Etat) {
  const protege = pieceOuverte(e, "it");
  if (rnd() > (protege ? 0.03 : 0.12)) return;
  const cyber = rnd() < 0.5;
  for (const d of e.dossiers.filter((x) => x.phase < 5)) d.progression = Math.max(0, d.progression - (cyber ? 15 : 8));
  const cout = cyber ? 2500 : 800;
  e.tresorerie -= cout;
  e.periode.charges += cout;
  if (cyber) e.reputation = clamp(e.reputation - 3);
  log(
    e,
    cyber
      ? `🛡️ Cyberattaque (hameçonnage) : une journée de travail perdue et ${cout.toLocaleString("fr-FR")} € d'intervention.${protege ? "" : " Une salle IT limiterait ce risque."}`
      : `💻 Panne du serveur : du travail perdu et ${cout} € de réparation.${protege ? "" : " Une salle IT limiterait ce risque."}`,
    "mal",
  );
}

// ---------- concurrents ----------

function concurrentsDuMois(e: Etat, jour: number) {
  for (const c of e.concurrents) c.ca = Math.round(c.ca * (1 + (rnd() * 0.04 - 0.01)));
  const big = e.concurrents.filter((c) => c.type === "big4");
  // Débauchage
  for (const a of e.agents) {
    if (a.filiere === "associe" || a.competence < 65 || a.confiance > 55) continue;
    const c = pick(e.concurrents.filter((x) => x.type !== "local"));
    if (rnd() > 0.12 * c.agressivite) continue;
    const offre = Math.round((a.salaire * 1.18) / 50) * 50;
    messageSpecial(e, a.id, 5, `🎯 ${c.nom} veut débaucher ${a.prenom}`, `${a.prenom} a reçu une offre de ${c.nom} à ${offre.toLocaleString("fr-FR")} € brut. Il·elle hésite et attend ta réaction.`, `client:|agent:${a.id}`, { concurrent: c.id, offre }, [
      { label: `Contre-offre à ${offre.toLocaleString("fr-FR")} €`, cout: 0, effets: { confianceAgent: 12 }, resultat: `${a.prenom} reste.`, action: "contre_offre" },
      { label: "Entretien pour comprendre ce qui ne va pas", cout: 1, effets: { confianceAgent: 15 }, resultat: "Une vraie discussion.", action: "entretien_retenir" },
      { label: "Le·la laisser partir", cout: 0, effets: {}, resultat: `${a.prenom} rejoint ${c.nom}.`, action: "laisser_partir" },
    ]);
    break;
  }
  // Client approché par un concurrent
  const fragile = e.clients.filter((c) => c.satisfaction < 55);
  if (fragile.length && rnd() < 0.5) {
    const cl = pick(fragile);
    const c = pick(e.concurrents);
    messageSpecial(e, "cabinet", 4, `🎯 ${c.nom} démarche ${cl.nom}`, `${cl.dirigeant} a reçu une proposition de ${c.nom} et hésite à partir.`, `client:${cl.id}|agent:`, { concurrent: c.id }, [
      { label: "Geste commercial (forfait –10 %)", cout: 0, effets: { satisfactionClient: 15 }, resultat: "Le client reste, à moindre marge.", action: "geste_commercial" },
      { label: "Rendez-vous pour présenter ta valeur ajoutée", cout: 1, effets: { satisfactionClient: 20 }, resultat: "Le client est rassuré." },
      { label: "Ne rien faire", cout: 0, effets: {}, resultat: "On verra bien.", action: "perdre_client" },
    ]);
  }
  // Appel d'offres tous les deux mois environ
  if (rnd() < 0.45 && big.length) {
    const c = pick(big);
    const forfait = 3500 + Math.round(rnd() * 3000);
    const nom = pick(["Groupe Hélios Distribution", "Laboratoires Saint-Clair", "Transports Valmont", "Hôtellerie du Lac SAS", "Menuiseries Rouvière"]);
    if (!e.clients.some((x) => x.nom === nom))
      messageSpecial(e, "cabinet", 4, `📑 Appel d'offres : ${nom}`, `${nom} lance un appel d'offres pour sa mission d'expertise (forfait envisagé : ${forfait.toLocaleString("fr-FR")} €/mois). ${c.nom} est sur les rangs. Quel prix proposes-tu ?`, "client:|agent:", { concurrent: c.id, forfait, nom }, [
        { label: "Prix agressif (–20 %)", cout: 1, effets: {}, resultat: "Offre envoyée.", action: "ao_agressif" },
        { label: "Prix de marché", cout: 1, effets: {}, resultat: "Offre envoyée.", action: "ao_standard" },
        { label: "Offre premium (+15 %) avec conseil inclus", cout: 1, effets: {}, resultat: "Offre envoyée.", action: "ao_premium" },
      ]);
  }
  // Petit cabinet à reprendre (rare)
  if (rnd() < 0.1 && e.tresorerie > 20000) {
    const n = 2 + Math.floor(rnd() * 3);
    const prix = Math.round(n * 1500 * 10 / 1000) * 1000;
    messageSpecial(e, "cabinet", 4, "🏪 Un cabinet à reprendre", `Un confrère part à la retraite et cède sa clientèle : ${n} clients fidèles, pour environ ${prix.toLocaleString("fr-FR")} €.`, "client:|agent:", { n, prix }, [
      { label: `Racheter au prix demandé (${prix.toLocaleString("fr-FR")} €)`, cout: 1, effets: {}, resultat: "Affaire conclue.", action: "rachat" },
      { label: "Négocier 15 % de moins", cout: 1, effets: {}, resultat: "Négociation lancée.", action: "rachat_negocie" },
      { label: "Décliner", cout: 0, effets: {}, resultat: "Le cabinet est repris par un concurrent." },
    ]);
  }
  void jour;
}

function messageSpecial(e: Etat, de: string, niveau: 1 | 2 | 3 | 4 | 5, sujet: string, texte: string, dossier: string, payload: Record<string, string | number>, options: OptionDilemme[]) {
  const jour = jourDe(e.minute);
  e.messages.unshift({
    id: uid(e, "m"),
    de,
    niveau,
    sujet,
    texte,
    jour,
    minute: e.minute,
    lu: false,
    statut: "attente",
    expire: ajouterJoursOuvres(jour, 3),
    theme: "special",
    dossier,
    payload,
    dilemme: { titre: sujet, options },
  });
}

/** Effets des options des événements spéciaux (concurrents, rachat…). */
export function actionSpeciale(e: Etat, action: NonNullable<OptionDilemme["action"]>, m: Message) {
  const [cl, ag] = (m.dossier ?? "").split("|");
  const a = e.agents.find((x) => x.id === ag?.replace("agent:", ""));
  const c = e.clients.find((x) => x.id === cl?.replace("client:", ""));
  const p = m.payload ?? {};
  const conc = e.concurrents.find((x) => x.id === p.concurrent);
  const jour = jourDe(e.minute);
  switch (action) {
    case "contre_offre":
      if (a) {
        a.salaire = Number(p.offre) || a.salaire + 300;
        log(e, `💶 ${a.prenom} reste grâce à ta contre-offre (${a.salaire.toLocaleString("fr-FR")} € brut).`);
      }
      return true;
    case "entretien_retenir":
      if (a) {
        if (rnd() < 0.6 + a.confiance / 300) log(e, `${a.prenom} a décidé de rester après votre échange.`, "bien");
        else {
          if (conc) conc.effectif++;
          depart(e, a, `rejoint ${conc?.nom ?? "un concurrent"}`);
        }
      }
      return true;
    case "laisser_partir":
      if (a) {
        if (conc) conc.effectif++;
        depart(e, a, `rejoint ${conc?.nom ?? "un concurrent"}`);
      }
      return true;
    case "geste_commercial":
      if (c) c.forfait = Math.round((c.forfait * 0.9) / 50) * 50;
      return true;
    case "perdre_client":
      if (c && rnd() < 0.5) {
        e.clients = e.clients.filter((x) => x.id !== c.id);
        e.dossiers = e.dossiers.filter((d) => d.client !== c.id || d.phase === 5);
        log(e, `🚪 ${c.nom} part chez ${conc?.nom ?? "un concurrent"}.`, "mal");
      }
      return true;
    case "ao_agressif":
    case "ao_standard":
    case "ao_premium": {
      const mult = action === "ao_agressif" ? 0.8 : action === "ao_premium" ? 1.15 : 1;
      const chance = e.reputation / 100 - (conc ? conc.reputation / 250 : 0.3) + (action === "ao_agressif" ? 0.25 : action === "ao_premium" ? -0.05 : 0.1);
      const nom = String(p.nom ?? "Nouveau client");
      if (rnd() < chance) {
        const forfait = Math.round((Number(p.forfait) * mult) / 50) * 50;
        const nc = { id: uid(e, "cl"), nom, dirigeant: "Direction financière", secteur: "Entreprise de taille moyenne", trait: "exigeante, mais fidèle si on la sert bien", satisfaction: 70, forfait, tvaMensuelle: true, paie: true };
        e.clients.push(nc);
        creerDossier(e, nc, "conseil", ajouterJoursOuvres(jour, 15), jour, `Reprise du dossier — ${nom}`).honoraires = 3000;
        repartir(e);
        e.reputation = clamp(e.reputation + 3);
        log(e, `🏆 Appel d'offres remporté face à ${conc?.nom ?? "la concurrence"} : ${nom} (${forfait.toLocaleString("fr-FR")} €/mois) !`, "bien");
      } else {
        if (conc) conc.ca += Number(p.forfait) * 12;
        log(e, `📑 Appel d'offres ${nom} : ${conc?.nom ?? "un concurrent"} l'emporte.`, "mal");
      }
      return true;
    }
    case "rachat":
    case "rachat_negocie": {
      let prix = Number(p.prix);
      if (action === "rachat_negocie") {
        if (rnd() < 0.5) {
          log(e, "🏪 Le cédant refuse ta négociation et vend à un concurrent.", "mal");
          return true;
        }
        prix = Math.round(prix * 0.85);
      }
      if (e.tresorerie < prix) {
        log(e, "🏪 Trésorerie insuffisante pour racheter le cabinet.", "mal");
        return true;
      }
      e.tresorerie -= prix;
      e.periode.charges += prix;
      const libres = PROSPECTS_NOUVEAUX.filter((x) => !x.risque && !e.clients.some((cc) => cc.nom === x.nom));
      for (let i = 0; i < Number(p.n) && libres.length; i++) {
        const pr = libres.splice(Math.floor(rnd() * libres.length), 1)[0];
        clientDepuis(e, pr, 70);
      }
      repartir(e);
      log(e, `🏪 Rachat conclu pour ${prix.toLocaleString("fr-FR")} € : ${p.n} nouveaux clients rejoignent le cabinet.`, "bien");
      return true;
    }
  }
  return false;
}

/** Ton chiffre d'affaires annualisé (12 dernières semaines × 52/12). */
export function caAnnuel(e: Etat): number {
  const sem = e.bilans.slice(0, 12);
  if (!sem.length) return e.clients.reduce((s, c) => s + c.forfait * 12, 0);
  return Math.round((sem.reduce((s, p) => s + p.ca, 0) / sem.length) * 52);
}

// ---------- facturation ----------

export function facturer(e: Etat, d: Dossier) {
  const jour = jourDe(e.minute);
  const profil = hash(d.client) % 3; // 0 bon payeur, 1 moyen, 2 mauvais
  const delai = [15, 30, 50][profil] + Math.floor(rnd() * [15, 20, 40][profil]);
  const f: Facture = { id: uid(e, "f"), client: d.client, libelle: d.titre, montant: d.honoraires, emise: jour, echeance: jour + 30, prevue: jour + delai, payee: null, relances: 0 };
  e.factures.unshift(f);
  if (e.factures.length > 250) e.factures = e.factures.filter((x) => x.payee === null || x.payee > jour - 120);
}

function encaisserFactures(e: Etat, jour: number) {
  let total = 0;
  for (const f of e.factures) {
    if (f.payee !== null || f.prevue > jour) continue;
    if (!e.clients.some((c) => c.id === f.client)) continue; // client parti : créance perdue
    f.payee = jour;
    total += f.montant;
  }
  if (total) {
    e.tresorerie += total;
    e.periode.ca += total;
  }
}

export function relancer(e: Etat, factureId: string): string | null {
  const f = e.factures.find((x) => x.id === factureId);
  if (!f || f.payee !== null) return "Facture déjà réglée.";
  const jour = jourDe(e.minute);
  if (f.relances && jour - (e.compteurs[`relance:${f.id}`] ?? -99) < 5) return "Tu as déjà relancé récemment.";
  f.relances++;
  e.compteurs[`relance:${f.id}`] = jour;
  f.prevue = Math.max(jour + 2, f.prevue - 12);
  const c = e.clients.find((x) => x.id === f.client);
  if (c) c.satisfaction = clamp(c.satisfaction - 2);
  log(e, `📨 Relance envoyée pour « ${f.libelle} ».`);
  return null;
}

export function dso(e: Etat): number {
  const jour = jourDe(e.minute);
  const ouvertes = e.factures.filter((f) => f.payee === null);
  if (!ouvertes.length) return 0;
  return Math.round(ouvertes.reduce((s, f) => s + (jour - f.emise), 0) / ouvertes.length);
}

// ---------- satisfaction, réforme, entretiens, événements ----------

function enqueteSatisfaction(e: Etat, jour: number) {
  if (!e.clients.length) return;
  const moy = Math.round(e.clients.reduce((s, c) => s + c.satisfaction, 0) / e.clients.length);
  const tri = [...e.clients].sort((a, b) => b.satisfaction - a.satisfaction);
  const lignes = [tri[0], tri[tri.length - 1]].map((c) => {
    const k = c.satisfaction >= 70 ? "haut" : c.satisfaction >= 45 ? "moyen" : "bas";
    return `${c.nom} (${Math.round(c.satisfaction)}/100) : « ${pick(COMMENTAIRES_SATISFACTION[k])} »`;
  });
  e.messages.unshift({
    id: uid(e, "m"),
    de: "cabinet",
    niveau: 2,
    sujet: `📋 Enquête de satisfaction clients ${anneeDe(jour) - 1}`,
    texte: `Satisfaction moyenne : ${moy}/100. Le plus satisfait : ${lignes[0]} Le moins satisfait : ${lignes[1]}`,
    jour,
    minute: e.minute,
    lu: false,
    statut: "info",
    expire: jour + 10,
    theme: "echeance",
  });
}

function reformeFacturation(e: Etat, jour: number) {
  e.compteurs.reformeFE = 1;
  e.messages.unshift({
    id: uid(e, "m"),
    de: "cabinet",
    niveau: 3,
    sujet: "🧾 Réforme de la facturation électronique",
    texte: "Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques ; les grandes entreprises et les ETI doivent aussi les émettre, les PME et micro-entreprises à partir du 1er septembre 2027. Tes clients vont avoir besoin d'accompagnement : des demandes de mission vont arriver.",
    jour,
    minute: e.minute,
    lu: false,
    statut: "info",
    expire: jour + 10,
    theme: "echeance",
  });
  for (const c of e.clients) {
    if (rnd() > 0.45) continue;
    e.propositions.push({
      id: uid(e, "p"),
      origine: "client",
      clientId: c.id,
      nouveau: null,
      titre: `${c.nom} : accompagnement facturation électronique`,
      description: "Choix d'une plateforme agréée, paramétrage, formation des équipes.",
      missions: [{ type: "conseil" as TypeMission, titre: `Facturation électronique — ${c.nom}`, honoraires: 900, delai: 15 }],
      forfait: 0,
      difficulte: 2,
      risque: null,
      recue: jour,
      expire: ajouterJoursOuvres(jour, 8),
    });
  }
  log(e, "🧾 Réforme de la facturation électronique : de nouvelles missions de conseil à saisir.", "bien");
}

function campagneEntretiens(e: Etat, jour: number) {
  if (!e.agents.length) return;
  e.messages.unshift({
    id: uid(e, "m"),
    de: "cabinet",
    niveau: 3,
    sujet: "🗣️ Campagne d'entretiens annuels",
    texte: "C'est le moment des entretiens annuels : fixe un objectif de compétence et une éventuelle augmentation à chaque collaborateur (panneau Équipe & RH). À faire avant fin janvier.",
    jour,
    minute: e.minute,
    lu: false,
    statut: "info",
    expire: jour + 20,
    theme: "echeance",
  });
}

export function validerEntretiens(e: Etat, choix: { agent: string; hausse: number; objectif: Domaine | null }[]): string | null {
  const annee = anneeDe(jourDe(e.minute));
  if (e.entretiensFaits >= annee) return "Les entretiens de cette année sont déjà faits.";
  for (const c of choix) {
    const a = e.agents.find((x) => x.id === c.agent);
    if (!a) continue;
    a.objectif = c.objectif;
    if (c.hausse > 0) a.salaire = Math.round((a.salaire * (1 + c.hausse / 100)) / 10) * 10;
    a.moral = clamp(a.moral + 4 + c.hausse * 2);
    a.confiance = clamp(a.confiance + 3 + c.hausse);
  }
  e.entretiensFaits = annee;
  log(e, "🗣️ Entretiens annuels réalisés : objectifs fixés pour l'année.", "bien");
  return null;
}

export function evenementEquipe(e: Etat, type: "afterwork" | "seminaire"): string | null {
  if (!e.agents.length) return "Personne à inviter pour l'instant.";
  const prix = type === "afterwork" ? 600 : 4000;
  const pa = type === "afterwork" ? 0 : 2;
  if (e.tresorerie < prix) return "Trésorerie insuffisante.";
  if (e.pa < pa) return `Il te faut ${pa} PA.`;
  if (type === "afterwork" && e.compteurs.afterwork === jourDe(e.minute)) return "Un afterwork par jour, ça suffit !";
  e.tresorerie -= prix;
  e.periode.charges += prix;
  e.pa -= pa;
  if (type === "afterwork") {
    e.compteurs.afterwork = jourDe(e.minute);
    for (const a of e.agents) {
      a.moral = clamp(a.moral + 6);
      a.fatigue = clamp(a.fatigue + 2);
    }
    for (const r of e.relations.filter((x) => x.type === "rivalite")) r.intensite = clamp(r.intensite - 5);
    log(e, "🍻 Afterwork d'équipe : les langues se délient.", "bien");
  } else {
    for (const a of e.agents) {
      a.moral = clamp(a.moral + 15);
      a.stress = clamp(a.stress - 15);
      a.competence = clamp(a.competence + 2, 0, 95);
      if (a.activite !== "conge" && a.activite !== "malade") {
        a.activite = "absent";
        a.activiteJusqua = 0;
      }
    }
    for (const r of e.relations.filter((x) => x.type === "rivalite")) r.intensite = clamp(r.intensite - 20);
    e.compteurs.seminaireJour = jourDe(e.minute);
    log(e, "🏔️ Séminaire annuel : journée hors les murs, ateliers et cohésion. Le cabinet est fermé jusqu'à demain.", "bien");
  }
  return null;
}

export function setAvatar(e: Etat, champ: keyof Etat["avatar"], valeur: string) {
  e.avatar = { ...e.avatar, [champ]: valeur };
}

export function setSons(e: Etat, on: boolean) {
  e.sons = on;
}

export { DOMAINES };
void dire;
void avancerDossier;
void ajouterVisiteur;

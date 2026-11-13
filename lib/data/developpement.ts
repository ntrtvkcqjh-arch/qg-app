import type { Concurrent, Domaine, Filiere, TypeMission } from "@/lib/types";

// Formations, concurrents (fictifs), mémoire DEC et réglages divers.

export const LIBELLE_DOMAINE: Record<Domaine, string> = {
  tva: "TVA",
  is: "IS / fiscal",
  paie: "Paie / social",
  juridique: "Juridique",
  revision: "Révision / clôture",
  audit: "Audit",
  outils: "Outils / Excel",
};

export const DOMAINE_MISSION: Record<TypeMission, Domaine> = {
  tva: "tva",
  paie: "paie",
  bilan: "revision",
  liasse: "is",
  juridique: "juridique",
  conseil: "is",
  audit: "audit",
};

/** Points forts de départ selon le métier. */
export const BONUS_FILIERE: Record<Filiere, Partial<Record<Domaine, number>>> = {
  expertise: { revision: 12, tva: 6, outils: 4 },
  fiscal: { is: 14, tva: 10 },
  social: { paie: 22 },
  juridique: { juridique: 22 },
  audit: { audit: 22, revision: 10 },
  rh: { paie: 6, outils: 4 },
  associe: { revision: 10, is: 10, audit: 6, juridique: 6 },
  service: {},
};

export type Formation = { id: string; nom: string; domaine: Domaine; jours: number; prix: number; gain: number; description: string };

export const FORMATIONS: Formation[] = [
  { id: "tva_av", nom: "TVA avancée", domaine: "tva", jours: 1, prix: 450, gain: 8, description: "Autoliquidation, échanges intracommunautaires, prorata de déduction." },
  { id: "cloture", nom: "Clôture et révision des comptes", domaine: "revision", jours: 2, prix: 900, gain: 12, description: "Cut-off, provisions, dossier de travail, approche par cycles." },
  { id: "paie_dsn", nom: "Paie et DSN", domaine: "paie", jours: 1, prix: 500, gain: 10, description: "Bulletins, cotisations, DSN mensuelle et événementielle." },
  { id: "is_liasse", nom: "IS et liasse fiscale", domaine: "is", jours: 1, prix: 500, gain: 9, description: "Passage du résultat comptable au fiscal, réintégrations, déductions." },
  { id: "juridique", nom: "Juridique des sociétés", domaine: "juridique", jours: 1, prix: 450, gain: 9, description: "Approbation des comptes, affectation du résultat, formalités." },
  { id: "audit_nep", nom: "Audit et approche par les risques", domaine: "audit", jours: 2, prix: 1100, gain: 12, description: "Seuil de signification, contrôle interne, procédures analytiques." },
  { id: "outils", nom: "Excel et outils de production", domaine: "outils", jours: 1, prix: 300, gain: 10, description: "Tableaux croisés, imports bancaires, automatisation de la saisie." },
  { id: "management", nom: "Management d'équipe", domaine: "outils", jours: 1, prix: 600, gain: 4, description: "Déléguer, donner du feedback, animer un pôle (utile aux chefs de pôle)." },
];

export const POLES: { filiere: Filiere; nom: string; couleur: string }[] = [
  { filiere: "expertise", nom: "Pôle Expertise", couleur: "#2f5bea" },
  { filiere: "fiscal", nom: "Pôle Fiscal", couleur: "#f2a541" },
  { filiere: "social", nom: "Pôle Social / Paie", couleur: "#17a398" },
  { filiere: "juridique", nom: "Pôle Juridique", couleur: "#8e44ad" },
  { filiere: "audit", nom: "Pôle Audit / CAC", couleur: "#d1495b" },
];

// Concurrents entièrement fictifs (noms et logos inventés).
export const CONCURRENTS_INITIAUX: Concurrent[] = [
  { id: "corvane", nom: "Corvane International", sigle: "CV", couleur: "#ffd400", type: "big4", ca: 48_000_000, reputation: 88, effectif: 420, agressivite: 0.7 },
  { id: "altheris", nom: "Altheris Audit & Conseil", sigle: "AT", couleur: "#e4572e", type: "big4", ca: 41_000_000, reputation: 86, effectif: 380, agressivite: 0.6 },
  { id: "meridian", nom: "Meridian & Cole", sigle: "M&C", couleur: "#0b6e4f", type: "big4", ca: 36_000_000, reputation: 84, effectif: 330, agressivite: 0.55 },
  { id: "lindqvist", nom: "Vasquez Lindqvist", sigle: "VL", couleur: "#1b3a8f", type: "big4", ca: 33_000_000, reputation: 85, effectif: 300, agressivite: 0.6 },
  { id: "noram", nom: "Noram Expertise", sigle: "NE", couleur: "#7b2d8b", type: "reseau", ca: 6_500_000, reputation: 70, effectif: 75, agressivite: 0.8 },
  { id: "berthelot", nom: "Cabinet Berthelot & Fils", sigle: "B&F", couleur: "#6d4c41", type: "local", ca: 900_000, reputation: 62, effectif: 9, agressivite: 0.5 },
];

export const SUJETS_MEMOIRE = [
  "La mission d'accompagnement des TPE dans la facturation électronique",
  "Le pilotage de la rentabilité des missions en cabinet",
  "La lutte contre le blanchiment dans les petits cabinets",
  "L'évaluation des titres de PME dans le cadre d'une transmission",
  "La mission de présentation des comptes des associations",
  "La mise en place d'un tableau de bord de gestion pour les commerçants",
];

export type EtapeMemoire = { titre: string; question: string; choix: string[]; bonne: number; conseil: string };

export const ETAPES_MEMOIRE: EtapeMemoire[] = [
  {
    titre: "Problématique",
    question: "Quelle formulation de problématique est la plus solide ?",
    choix: ["« La facturation électronique »", "« Comment l'expert-comptable peut-il accompagner ses clients TPE dans l'adoption de la facturation électronique ? »", "« Tout savoir sur la réforme »"],
    bonne: 1,
    conseil: "Une problématique est une vraie question, centrée sur le rôle de l'expert-comptable, qui appelle une réponse opérationnelle.",
  },
  {
    titre: "Plan",
    question: "Quel plan convient le mieux à un mémoire professionnel ?",
    choix: ["Un plan en deux parties : diagnostic, puis solution et outil pratique", "Une liste de 12 chapitres thématiques", "Un plan chronologique de l'histoire de la comptabilité"],
    bonne: 0,
    conseil: "Le mémoire doit déboucher sur une démarche ou un outil utilisable par la profession : diagnostic puis solution.",
  },
  {
    titre: "Recherches",
    question: "Comment nourrir ta partie diagnostic ?",
    choix: ["Uniquement des articles de blog", "Textes officiels, doctrine de la profession et entretiens avec des praticiens et clients", "Tes souvenirs de stage"],
    bonne: 1,
    conseil: "Croise les sources : textes, doctrine, retours de terrain. Le jury apprécie les entretiens et les cas réels anonymisés.",
  },
  {
    titre: "Rédaction de la 1re partie",
    question: "Ta première partie fait 45 pages de théorie. Que fais-tu ?",
    choix: ["Je la garde telle quelle", "Je la resserre sur ce qui sert la problématique et je garde de la place pour l'outil", "Je supprime la seconde partie"],
    bonne: 1,
    conseil: "L'équilibre compte : la partie pratique (outil, démarche) est le cœur d'un mémoire d'expertise comptable.",
  },
  {
    titre: "L'outil pratique",
    question: "Ton outil doit être…",
    choix: ["Directement utilisable par un confrère (check-list, tableur, lettre de mission type…)", "Un simple résumé de la loi", "Une bibliographie commentée"],
    bonne: 0,
    conseil: "Le jury évalue l'utilité professionnelle : un confrère doit pouvoir s'en servir dès demain.",
  },
  {
    titre: "Relecture",
    question: "Avant le dépôt, la priorité est…",
    choix: ["Ajouter encore des annexes", "Faire relire par ton maître de stage et un regard extérieur, vérifier la cohérence problématique / conclusion", "Changer de sujet"],
    bonne: 1,
    conseil: "La conclusion doit répondre explicitement à la problématique posée en introduction.",
  },
  {
    titre: "Soutenance blanche",
    question: "Le jury te demande les limites de ton outil. Tu…",
    choix: ["Dis qu'il n'en a pas", "Reconnais ses limites et proposes des pistes d'amélioration", "Changes de sujet"],
    bonne: 1,
    conseil: "Savoir présenter les limites de son travail montre la maturité professionnelle attendue d'un futur expert-comptable.",
  },
];

/** Sessions d'examen proposées pour fixer ton objectif DEC (dates indicatives du jeu). */
export const SESSIONS_DEC = [
  { label: "Session de novembre 2026", annee: 2026, mois: 11, jour: 16 },
  { label: "Session de mai 2027", annee: 2027, mois: 5, jour: 17 },
  { label: "Session de novembre 2027", annee: 2027, mois: 11, jour: 15 },
];

export const COMMENTAIRES_SATISFACTION = {
  haut: ["Réactifs et pédagogues, on se sent accompagnés.", "Toujours disponibles, merci pour les conseils !", "Le meilleur cabinet qu'on ait eu."],
  moyen: ["Correct, mais les délais pourraient être meilleurs.", "On aimerait plus de conseils et moins de relances.", "Bien, sans plus."],
  bas: ["On attend des semaines pour une réponse.", "Trop cher pour ce que c'est.", "On réfléchit à changer de cabinet."],
};

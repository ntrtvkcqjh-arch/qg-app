// Types du jeu Cabinet EZ. Tout l'état tient dans un seul objet `Etat`,
// sauvegardé dans le navigateur (aucun serveur, aucune API).

export type PieceId =
  | "reunion"
  | "archives"
  | "formation"
  | "associee"
  | "accueil"
  | "openspace"
  | "cafe"
  | "dehors";

export type Filiere = "expertise" | "fiscal" | "social" | "juridique" | "rh";

export type Activite =
  | "absent" // pas encore arrivé / parti le soir
  | "travaille"
  | "reunion"
  | "pause"
  | "formation"
  | "archives"
  | "accueil"
  | "conge"
  | "malade";

export type Personnalite =
  | "perfectionniste"
  | "anxieux"
  | "ambitieux"
  | "nonchalant"
  | "sociable"
  | "rebelle"
  | "loyal";

export type Agent = {
  id: string;
  prenom: string;
  nom: string;
  poste: string; // intitulé (Stagiaire, Chef de mission…)
  filiere: Filiere;
  personnalite: Personnalite;
  couleur: string; // couleur de tenue
  cheveux: string;
  peau: string;
  bureau: number; // index du poste dans l'open space
  competence: number; // 0-100
  stress: number; // 0-100
  fatigue: number; // 0-100
  confiance: number; // 0-100 (envers toi)
  moral: number; // 0-100
  salaire: number; // brut mensuel €
  activite: Activite;
  activiteJusqua: number; // minute absolue de fin de l'activité ponctuelle
  absentJusquau: number; // jour (index) de retour si congé/maladie
  embauche: number; // jour d'arrivée
  clan: string | null;
  bulle: string | null;
  bulleJusqua: number;
};

export type Relation = { a: string; b: string; type: "rivalite" | "mentorat" | "amitie"; intensite: number };

export type Phase = 1 | 2 | 3 | 4 | 5;
export const NOMS_PHASES: Record<Phase, string> = {
  1: "Collecte",
  2: "Saisie",
  3: "Révision",
  4: "Validation",
  5: "Livré",
};

export type TypeMission = "bilan" | "tva" | "paie" | "liasse" | "juridique" | "conseil";

export type Dossier = {
  id: string;
  client: string; // id client
  titre: string;
  type: TypeMission;
  phase: Phase;
  progression: number; // 0-100 dans la phase courante
  agent: string | null;
  echeance: number; // jour limite
  honoraires: number;
  difficulte: number; // 1-5
  bloque: string | null; // raison si bloqué (pièces manquantes…)
  cree: number;
  livre: number | null;
};

export type Client = {
  id: string;
  nom: string;
  dirigeant: string;
  secteur: string;
  trait: string; // personnalité dramatique
  satisfaction: number; // 0-100
  forfait: number; // honoraires mensuels récurrents (€)
  tvaMensuelle: boolean;
  paie: boolean;
};

export type Niveau = 1 | 2 | 3 | 4 | 5;

export type OptionDilemme = {
  label: string;
  cout: number; // PA
  effets: Effets;
  differe?: { delai: number; effets: Effets; texte: string };
  resultat: string;
};

export type Effets = {
  tresorerie?: number;
  moralEquipe?: number;
  stressEquipe?: number;
  confianceEquipe?: number;
  satisfactionClient?: number; // client concerné
  confianceAgent?: number; // agent concerné
  stressAgent?: number;
  competenceAgent?: number;
  progression?: number; // dossier concerné
  reputation?: number;
};

export type Message = {
  id: string;
  de: string; // id agent, id client, ou "cabinet"
  niveau: Niveau;
  sujet: string;
  texte: string;
  jour: number;
  minute: number;
  lu: boolean;
  statut: "attente" | "repondu" | "ignore" | "info";
  expire: number; // jour après lequel c'est considéré ignoré
  theme: string; // sert au Ghost Writer (conseil pédagogique)
  dossier?: string;
  dilemme?: { titre: string; options: OptionDilemme[] };
  reponse?: string;
};

export type ConsequenceDifferee = { jour: number; effets: Effets; texte: string; agent?: string; client?: string; dossier?: string };

export type Echeance = {
  id: string;
  nom: string;
  type: TypeMission;
  jour: number;
  annoncee: boolean;
  resolue: boolean;
  resultat?: "victoire" | "defaite";
  pv?: number; // points de vie restants pendant le combat
  pvMax?: number;
};

export type Journal = { jour: number; minute: number; texte: string; ton: "bien" | "mal" | "neutre" };

export type Difficulte = "facile" | "normal" | "expert";
export type ModeDepart = "reprise" | "creation";

export type BilanPeriode = {
  label: string;
  debut: number;
  ca: number;
  charges: number;
  livres: number;
  echeancesGagnees: number;
  echeancesPerdues: number;
  moral: number;
  qcm: number | null;
};

export type Candidat = {
  id: string;
  prenom: string;
  nom: string;
  poste: string;
  filiere: Filiere;
  personnalite: Personnalite;
  competence: number;
  salaire: number;
};

export type Etat = {
  version: 1;
  nomCabinet: string;
  difficulte: Difficulte;
  mode?: ModeDepart; // absent dans les anciennes sauvegardes = reprise
  loyer?: number;
  travailToi?: string | null; // dossier que tu traites toi-même en ce moment
  minute: number; // minute absolue simulée depuis le début (jour*1440 + minute du jour)
  vitesse: 0 | 1 | 3 | 10;
  pa: number;
  paMax: number;
  gratuitsUtilises: number; // N1/N2 gratuits du jour
  tresorerie: number;
  reputation: number; // 0-100
  moodGlobal: number; // 0-100, évolue lentement
  niveauDec: number; // 0-100 progression pédagogique
  agents: Agent[];
  anciens: { prenom: string; nom: string; depart: number; raison: string }[];
  relations: Relation[];
  clients: Client[];
  dossiers: Dossier[];
  messages: Message[];
  differes: ConsequenceDifferee[];
  echeances: Echeance[];
  journal: Journal[];
  badges: { id: string; jour: number }[];
  candidats: Candidat[];
  bilans: BilanPeriode[];
  periode: BilanPeriode; // semaine en cours
  qcm: { semaine: number; score: number; total: number }[];
  oraux: { jour: number; score: number; question: string }[];
  qcmDisponible: boolean;
  bossActif: string | null; // id échéance en combat
  absence: { depuis: number; evenements: Journal[] } | null;
  derniereVisite: number; // timestamp réel (ms)
  compteurs: Record<string, number>; // pour les badges
  seq: number;
};

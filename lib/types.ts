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
  | "detente"
  | "rh"
  | "it"
  | "associes"
  | "annexe"
  | "os_fiscal"
  | "os_social"
  | "os_juridique"
  | "bur_expertise"
  | "bur_fiscal"
  | "bur_social"
  | "bur_juridique"
  | "bur_audit"
  | "bulle1"
  | "bulle2"
  | "bulle3"
  | "reunion2"
  | "conseil"
  | "pressing"
  | "sport"
  | "terrasse"
  | "plateau3"
  | "ext_expertise"
  | "ext_fiscal"
  | "ext_social"
  | "ext_juridique"
  | "ext_audit"
  | "bulle4"
  | "bulle5"
  | "dehors";

export type Filiere = "expertise" | "fiscal" | "social" | "juridique" | "rh" | "audit" | "associe" | "service";

export type TypeService = "accueil" | "cuisine" | "pressing" | "coach" | "menage" | "it" | "office";

export type Activite =
  | "absent" // pas encore arrivé / parti le soir
  | "travaille"
  | "reunion"
  | "pause"
  | "formation"
  | "archives"
  | "accueil"
  | "conge"
  | "malade"
  | "teletravail"
  | "dejeuner"
  | "sport"
  | "evacuation";

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
  poste: string; // intitulé (Stagiaire, Assistant, Confirmé, Senior, Manager…)
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
  // Ajouts (facultatifs pour les anciennes sauvegardes)
  skills?: Record<Domaine, number>; // compétences par domaine 0-100
  heuresSemaine?: number; // heures travaillées cette semaine
  heuresSup?: number; // heures sup du mois à payer
  dernierDepart?: number; // minute absolue du dernier départ (repos 11 h)
  objectif?: Domaine | null; // objectif fixé à l'entretien annuel
  diplome?: { nom: "DSCG" | "DEC"; progression: number } | null;
  tuteur?: string | null; // id du tuteur
  anniversaire?: number; // jour de l'année (0-364)
  service?: TypeService; // personnel des services du campus
  associeDe?: Filiere; // pôle dont l'associé a la charge
  enComite?: boolean; // en réunion live des managers (salle du conseil)
  essaiJusquau?: number; // fin de la période d'essai (jour)
  remplace?: string; // CDD de remplacement : id de la personne remplacée
  finContrat?: number; // CDD : dernier jour
  parrain?: string;
  ecole?: string; // alternant : école et diplôme préparé
  burnout?: "arret" | "repris";
  miTempsJusquau?: number; // mi-temps thérapeutique : jour de fin
};

export type Domaine = "tva" | "is" | "paie" | "juridique" | "revision" | "audit" | "outils";

export type Relation = { a: string; b: string; type: "rivalite" | "mentorat" | "amitie" | "couple"; intensite: number };

export type Phase = 1 | 2 | 3 | 4 | 5;
export const NOMS_PHASES: Record<Phase, string> = {
  1: "Collecte",
  2: "Saisie",
  3: "Révision",
  4: "Validation",
  5: "Livré",
};

export type TypeMission = "bilan" | "tva" | "paie" | "liasse" | "juridique" | "conseil" | "audit";

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
  heures?: number; // temps passé (feuilles de temps)
};

export type Facture = { id: string; client: string; libelle: string; montant: number; emise: number; echeance: number; prevue: number; payee: number | null; relances: number };

export type Concurrent = {
  id: string;
  nom: string;
  sigle: string;
  couleur: string;
  type: "big4" | "reseau" | "local";
  ca: number; // CA annuel (€)
  reputation: number;
  effectif: number;
  agressivite: number; // 0-1
};

export type SessionFormation = { id: string; formation: string; jour: number; participants: string[]; terminee: boolean };

export type Memoire = { sujet: string | null; etape: number; qualite: number; soutenu: boolean };

export type Agence = { id: string; ville: string; ouverture: number; associe: string | null; clients: number; effectif: number; caMois: number };

export type LigneRevue = { compte: string; libelle: string; montant: number; anomalie?: string };

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
  taille?: number; // 1 TPE, 2 PME, 3 ETI (le client grandit)
  historique?: { jour: number; texte: string }[];
};

export type Niveau = 1 | 2 | 3 | 4 | 5;

export type OptionDilemme = {
  label: string;
  cout: number; // PA
  effets: Effets;
  differe?: { delai: number; effets: Effets; texte: string };
  resultat: string;
  code?: string; // paramètre de l'action "vie"
  action?:
    | "promouvoir"
    | "client_part"
    | "client_part_perte"
    | "reconcilier"
    | "mission_conseil"
    | "lcbft_ok"
    | "lcbft_ko"
    | "contre_offre"
    | "entretien_retenir"
    | "laisser_partir"
    | "geste_commercial"
    | "rdv_client"
    | "perdre_client"
    | "ao_agressif"
    | "ao_standard"
    | "ao_premium"
    | "rachat"
    | "rachat_negocie"
    | "diplome_resultat"
    | "vie";
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
  cas?: CasPratique; // cas pratique à résoudre toi-même
  revue?: { lignes: LigneRevue[] }; // feuille de révision : trouver les anomalies
  arc?: { id: string; etape: number }; // étape d'un arc narratif
  payload?: Record<string, string | number>; // données d'un événement spécial
  canal?: "mail" | "appel" | "interne"; // e-mail, appel téléphonique ou message interne
  reponse?: string;
};

export type CasPratique = {
  theme: string;
  enonce: string;
  choix: string[];
  bonne: number;
  explication: string;
};

export type NoteCarnet = { theme: string; question: string; explication: string; jour: number };

export type Visiteur = {
  id: string;
  nom: string;
  couleur: string;
  message: string; // id du message ou de la proposition liée
  etat: "attend" | "reunion" | "part";
  piece?: PieceId; // pièce de rendez-vous (sinon salle de réunion)
  jusqua: number; // minute absolue de fin de l'étape
};

export type Gazette = {
  jour: number;
  titre: string;
  ton: "enjoue" | "neutre" | "sombre";
  une: string;
  chiffres: string[];
  potins: string[];
  humeur: string;
  motDuDec: string;
};

export type ArcEnCours = { id: string; etape: number; prochain: number; ctx: Record<string, string>; choix: number[] };

export type ResultatControle = { jour: number; note: string; points: { label: string; ok: boolean }[]; effet: string };

/** Demande d'un prospect ou d'un client : à accepter ou refuser. */
export type Proposition = {
  id: string;
  origine: "courrier" | "visite" | "client";
  clientId: string | null; // client existant (mission ponctuelle) ou null (nouveau client)
  nouveau: Omit<Client, "id"> | null;
  titre: string;
  description: string;
  missions: { type: TypeMission; titre: string; honoraires: number; delai: number }[];
  forfait: number; // forfait mensuel si nouveau client
  difficulte: number; // 1-5
  risque: string | null; // signal LCB-FT ou client difficile
  recue: number; // jour
  expire: number; // jour
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
  associeDe?: Filiere; // candidat associé : pôle visé
  vraie?: number; // compétence réelle (le CV peut enjoliver)
  evalue?: number; // estimation après entretien
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
  // Ajouts « créatifs » (valeurs par défaut posées par migrer())
  niveauLocaux: number; // 1 à 4
  propositions: Proposition[];
  achats: string[]; // mobilier acheté
  visiteurs: Visiteur[];
  carnet: NoteCarnet[];
  gazettes: Gazette[];
  gazetteNonLue: boolean;
  arcs: ArcEnCours[];
  arcsFinis: string[];
  controleJour: number; // jour du prochain contrôle qualité de l'Ordre
  controleResultat: ResultatControle | null; // affiché une fois
  // Ajouts (posés par migrer())
  politiqueHeures: "libre" | "limitee" | "interdite";
  teletravailJours: 0 | 1 | 2;
  violations: number; // infractions au droit du travail non sanctionnées
  sessions: SessionFormation[];
  budgetFormation: number; // budget annuel restant (€)
  statsThemes: Record<string, { ok: number; total: number }>;
  souvenirs?: { jour: number; emoji: string; titre: string }[]; // album souvenir
  promotions?: { jour: number; prenom: string; nom: string; poste: string; couleur: string }[]; // mur des promotions
  risquesRC?: { jour: number; client: string; montant: number; faute: string }[]; // erreurs non détectées qui ressortiront
  agences?: Agence[];
  chaines?: { id: string; type: string; etape: number; score: number; prochain: number; ctx: { client?: string; agent?: string; montant?: number } }[]; // cas en plusieurs étapes
  litiges?: { jour: number; client: string; montant: number }[];
  auto?: { dec?: boolean; rh?: boolean; finances?: boolean }; // thèmes délégués (gestion automatique) // litiges d'honoraires à venir
  controles?: { id: string; client: string; etape: number; prochain: number; score: number; rappel: number }[]; // contrôles fiscaux de clients
  logiciels?: { production: number; paie: number; pdp: number; migrationJusqua: number };
  agenda?: { semaine: number; blocs: { id: string; jour: number; creneau: number; type: "rdv" | "reunion" | "signature" | "banque" | "production"; titre: string; ref?: string }[] };
  questionsVues?: string[]; // dernières questions DEC posées (évite les répétitions)
  dateDec: number; // jour de l'épreuve écrite visée
  memoire: Memoire;
  chefsPoles: Partial<Record<Filiere, string>>;
  concurrents: Concurrent[];
  factures: Facture[];
  entretiensFaits: number; // année des derniers entretiens annuels
  avatar: { cheveux: string; tenue: string; peau: string; deco: string };
  sons: boolean;
  meteo: "soleil" | "nuages" | "pluie" | "neige";
};

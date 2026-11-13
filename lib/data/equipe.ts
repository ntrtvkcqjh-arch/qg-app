import type { Agent, Client, Filiere, Personnalite, Relation } from "@/lib/types";

type Base = Omit<Agent, "stress" | "fatigue" | "moral" | "activite" | "activiteJusqua" | "absentJusquau" | "embauche" | "bulle" | "bulleJusqua">;

export const EQUIPE_INITIALE: Base[] = [
  { id: "lea", prenom: "Léa", nom: "Marchand", poste: "Cheffe de mission", filiere: "expertise", personnalite: "perfectionniste", couleur: "#2f5bea", cheveux: "#3b2416", peau: "#f1c7a5", bureau: 0, competence: 78, confiance: 62, salaire: 3600, clan: "Les Anciens" },
  { id: "karim", prenom: "Karim", nom: "Benali", poste: "Collaborateur confirmé", filiere: "fiscal", personnalite: "ambitieux", couleur: "#e4572e", cheveux: "#111111", peau: "#c68b5e", bureau: 1, competence: 70, confiance: 55, salaire: 3100, clan: "Les Jeunes Loups" },
  { id: "sophie", prenom: "Sophie", nom: "Garnier", poste: "Gestionnaire de paie", filiere: "social", personnalite: "anxieux", couleur: "#17a398", cheveux: "#c89b5d", peau: "#f6d3b8", bureau: 2, competence: 66, confiance: 58, salaire: 2700, clan: "Les Anciens" },
  { id: "hugo", prenom: "Hugo", nom: "Perrin", poste: "Assistant comptable", filiere: "expertise", personnalite: "nonchalant", couleur: "#f2a541", cheveux: "#6b4423", peau: "#f3cfb3", bureau: 3, competence: 48, confiance: 50, salaire: 2200, clan: null },
  { id: "ines", prenom: "Inès", nom: "Moreau", poste: "Juriste", filiere: "juridique", personnalite: "rebelle", couleur: "#8e44ad", cheveux: "#1d1d1d", peau: "#e0ac85", bureau: 4, competence: 72, confiance: 45, salaire: 3000, clan: "Les Jeunes Loups" },
  { id: "thomas", prenom: "Thomas", nom: "Lefèvre", poste: "Stagiaire", filiere: "expertise", personnalite: "sociable", couleur: "#43aa8b", cheveux: "#a0522d", peau: "#f5d0b5", bureau: 5, competence: 35, confiance: 65, salaire: 1300, clan: null },
  { id: "nadia", prenom: "Nadia", nom: "Roussel", poste: "Collaboratrice confirmée", filiere: "fiscal", personnalite: "loyal", couleur: "#d1495b", cheveux: "#4a2c1d", peau: "#d9a07a", bureau: 6, competence: 74, confiance: 72, salaire: 3200, clan: "Les Anciens" },
];

export const RELATIONS_INITIALES: Relation[] = [
  { a: "karim", b: "nadia", type: "rivalite", intensite: 60 },
  { a: "ines", b: "lea", type: "rivalite", intensite: 45 },
  { a: "lea", b: "thomas", type: "mentorat", intensite: 70 },
  { a: "nadia", b: "hugo", type: "mentorat", intensite: 50 },
  { a: "sophie", b: "nadia", type: "amitie", intensite: 65 },
  { a: "karim", b: "ines", type: "amitie", intensite: 55 },
];

export const CLIENTS_INITIAUX: Client[] = [
  { id: "boulangerie", nom: "Boulangerie Delorme", dirigeant: "Gérard Delorme", secteur: "Boulangerie artisanale", trait: "envoie ses factures dans une boîte à chaussures", satisfaction: 70, forfait: 1800, tvaMensuelle: false, paie: true },
  { id: "startup", nom: "Kleo SAS", dirigeant: "Maxime Vidal", secteur: "Start-up SaaS", trait: "veut tout pour hier et lève des fonds tous les six mois", satisfaction: 65, forfait: 4150, tvaMensuelle: true, paie: false },
  { id: "garage", nom: "Garage Fontaine", dirigeant: "Sylvie Fontaine", secteur: "Garage automobile", trait: "conteste chaque ligne de la facture d'honoraires", satisfaction: 60, forfait: 2350, tvaMensuelle: true, paie: false },
  { id: "resto", nom: "Le Comptoir d'Anna", dirigeant: "Anna Rizzi", secteur: "Restaurant", trait: "paye tout en liquide et oublie de le noter", satisfaction: 68, forfait: 2100, tvaMensuelle: true, paie: true },
  { id: "btp", nom: "Bâtir Plus SARL", dirigeant: "Jean-Marc Costa", secteur: "BTP", trait: "a des chantiers partout et des situations de travaux nulle part", satisfaction: 62, forfait: 3650, tvaMensuelle: true, paie: true },
  { id: "pharma", nom: "Pharmacie du Parc", dirigeant: "Claire Nguyen", secteur: "Pharmacie", trait: "ultra organisée, ne pardonne aucune erreur", satisfaction: 80, forfait: 3400, tvaMensuelle: false, paie: true },
  { id: "immo", nom: "SCI Les Tilleuls", dirigeant: "Famille Berthier", secteur: "Immobilier", trait: "trois frères qui ne se parlent plus", satisfaction: 66, forfait: 1150, tvaMensuelle: false, paie: false },
  { id: "mode", nom: "Atelier Mona", dirigeant: "Mona Ferrand", secteur: "Mode éthique", trait: "influenceuse, poste tout sur Instagram, même ses problèmes de TVA", satisfaction: 72, forfait: 1950, tvaMensuelle: true, paie: false },
  { id: "transport", nom: "TransAlpes", dirigeant: "Didier Rocher", secteur: "Transport routier", trait: "flotte de 40 camions, carburant en pagaille", satisfaction: 64, forfait: 4400, tvaMensuelle: true, paie: true },
  { id: "asso", nom: "Association Sport+", dirigeant: "Hélène Brun", secteur: "Association sportive", trait: "bénévoles adorables, comptabilité créative", satisfaction: 75, forfait: 1050, tvaMensuelle: false, paie: false },
];

// Pour générer des candidats au recrutement.
export const PRENOMS = ["Camille", "Yanis", "Manon", "Lucas", "Chloé", "Mehdi", "Emma", "Nathan", "Sarah", "Julien", "Amina", "Paul", "Zoé", "Rayan", "Clara", "Antoine"];
export const NOMS = ["Laurent", "Faure", "Mercier", "Blanc", "Guerin", "Muller", "Henry", "Roux", "Fournier", "Girard", "Bonnet", "Dupuis", "Lambert", "Fontaine"];
export const POSTES: { poste: string; filiere: Filiere; comp: [number, number]; salaire: [number, number] }[] = [
  { poste: "Stagiaire", filiere: "expertise", comp: [25, 40], salaire: [1200, 1400] },
  { poste: "Assistant comptable", filiere: "expertise", comp: [40, 58], salaire: [2100, 2400] },
  { poste: "Collaborateur confirmé", filiere: "fiscal", comp: [60, 75], salaire: [2900, 3300] },
  { poste: "Gestionnaire de paie", filiere: "social", comp: [55, 72], salaire: [2500, 2900] },
  { poste: "Juriste", filiere: "juridique", comp: [58, 75], salaire: [2800, 3200] },
  { poste: "Chef de mission", filiere: "expertise", comp: [72, 85], salaire: [3500, 4000] },
  { poste: "Responsable RH", filiere: "rh", comp: [55, 75], salaire: [2800, 3300] },
  { poste: "Auditeur", filiere: "audit", comp: [55, 78], salaire: [2900, 3500] },
];

/** Petits clients de départ quand on crée son cabinet à partir de zéro. */
export const CLIENTS_CREATION = ["boulangerie", "immo", "asso"];
export const PERSONNALITES: Personnalite[] = ["perfectionniste", "anxieux", "ambitieux", "nonchalant", "sociable", "rebelle", "loyal"];
export const COULEURS = ["#2f5bea", "#e4572e", "#17a398", "#f2a541", "#8e44ad", "#43aa8b", "#d1495b", "#3d405b", "#ff7f51", "#118ab2"];
export const CHEVEUX = ["#111111", "#3b2416", "#6b4423", "#c89b5d", "#a0522d", "#1d1d1d", "#d4b483"];
export const PEAUX = ["#f1c7a5", "#c68b5e", "#f6d3b8", "#e0ac85", "#d9a07a", "#8d5524", "#f5d0b5"];

export const LIBELLE_PERSO: Record<Personnalite, string> = {
  perfectionniste: "Perfectionniste",
  anxieux: "Anxieux·se",
  ambitieux: "Ambitieux·se",
  nonchalant: "Nonchalant·e",
  sociable: "Sociable",
  rebelle: "Rebelle",
  loyal: "Loyal·e",
};

export const LIBELLE_FILIERE: Record<Filiere, string> = {
  expertise: "Expertise",
  fiscal: "Fiscal",
  social: "Social / paie",
  juridique: "Juridique",
  rh: "Ressources humaines",
  audit: "Audit / CAC",
  associe: "Associé",
};

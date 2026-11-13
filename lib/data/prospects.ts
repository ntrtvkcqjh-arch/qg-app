import type { Client, TypeMission } from "@/lib/types";

// Demandes entrantes : nouveaux clients (par courrier ou en personne) et
// missions ponctuelles demandées par les clients existants.

export type ModeleProspect = Omit<Client, "id" | "satisfaction"> & { risque?: string; difficulte: number };

export const PROSPECTS_NOUVEAUX: ModeleProspect[] = [
  { nom: "Fromagerie Lucas", dirigeant: "Lucas Bernard", secteur: "Commerce alimentaire", trait: "parle de ses fromages pendant des heures", forfait: 1200, tvaMensuelle: true, paie: false, difficulte: 1 },
  { nom: "Studio Pixel", dirigeant: "Jade Morel", secteur: "Agence web", trait: "factures en anglais, devis en emojis", forfait: 1700, tvaMensuelle: true, paie: true, difficulte: 2 },
  { nom: "Cabinet Kiné Rives", dirigeant: "Olivier Rives", secteur: "Profession libérale", trait: "BNC, recettes-dépenses et beaucoup de questions", forfait: 900, tvaMensuelle: false, paie: false, difficulte: 1 },
  { nom: "Hôtel des Alpes", dirigeant: "Martine Giraud", secteur: "Hôtellerie", trait: "saisonnalité extrême, extras à déclarer", forfait: 2600, tvaMensuelle: true, paie: true, difficulte: 3 },
  { nom: "GreenWatt", dirigeant: "Samir Haddad", secteur: "Installateur solaire", trait: "croissance de 200 % et zéro process", forfait: 2200, tvaMensuelle: true, paie: true, difficulte: 3 },
  { nom: "Librairie Les Mots", dirigeant: "Paul Lenoir", secteur: "Librairie", trait: "romantique, marges minuscules", forfait: 800, tvaMensuelle: false, paie: true, difficulte: 1 },
  { nom: "Clinique vétérinaire du Lac", dirigeant: "Dr Agathe Simon", secteur: "Santé animale", trait: "trois associés, trois avis différents", forfait: 2000, tvaMensuelle: true, paie: true, difficulte: 2 },
  { nom: "Brasserie La Mousse", dirigeant: "Théo Gauthier", secteur: "Brasserie artisanale", trait: "droits d'accises et stocks de fûts", forfait: 1600, tvaMensuelle: true, paie: true, difficulte: 3 },
  { nom: "Holding Vasseur", dirigeant: "Henri Vasseur", secteur: "Holding patrimoniale", trait: "intégration fiscale et dividendes", forfait: 2800, tvaMensuelle: false, paie: false, difficulte: 4 },
  { nom: "Négoce Métaux Express", dirigeant: "M. Karev", secteur: "Négoce de métaux", trait: "pressé, paie d'avance en espèces", forfait: 3500, tvaMensuelle: true, paie: false, difficulte: 3, risque: "Paiements en espèces importants et bénéficiaire effectif difficile à identifier." },
  { nom: "SCI Horizon Invest", dirigeant: "Mme Delcourt", secteur: "Immobilier", trait: "associés domiciliés à l'étranger", forfait: 1900, tvaMensuelle: false, paie: false, difficulte: 2, risque: "Chaîne de détention via une société étrangère opaque." },
  { nom: "Food Truck Chez Lina", dirigeant: "Lina Haddad", secteur: "Restauration ambulante", trait: "micro-entreprise qui vient de passer en société", forfait: 700, tvaMensuelle: true, paie: false, difficulte: 1 },
];

export type ModeleMission = { titre: string; type: TypeMission; honoraires: number; delai: number; description: string };

export const MISSIONS_PONCTUELLES: ModeleMission[] = [
  { titre: "Prévisionnel pour un prêt bancaire", type: "conseil", honoraires: 1800, delai: 10, description: "La banque veut un prévisionnel sur 3 ans pour financer un investissement." },
  { titre: "Évaluation des parts sociales", type: "conseil", honoraires: 2500, delai: 15, description: "Un associé veut sortir : il faut évaluer les parts." },
  { titre: "Création d'une filiale", type: "juridique", honoraires: 2000, delai: 12, description: "Statuts, immatriculation et convention de trésorerie." },
  { titre: "Optimisation de la rémunération du dirigeant", type: "conseil", honoraires: 1500, delai: 8, description: "Arbitrage salaire / dividendes pour l'an prochain." },
  { titre: "Dossier de subvention régionale", type: "conseil", honoraires: 1200, delai: 8, description: "Montage du dossier et attestation des dépenses." },
  { titre: "Mise en place d'un tableau de bord mensuel", type: "conseil", honoraires: 1600, delai: 10, description: "Indicateurs de gestion mensuels pour le dirigeant." },
  { titre: "Embauche du premier salarié", type: "paie", honoraires: 900, delai: 6, description: "Contrat, DPAE, mutuelle et première paie." },
];

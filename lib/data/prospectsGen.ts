import type { ModeleProspect } from "@/lib/data/prospects";

// Générateur de prospects variés : secteurs réalistes, noms, dirigeants,
// traits de caractère et forfaits cohérents (forfaits mensuels, en euros).

type Gabarit = { secteur: string; noms: string[]; forfait: [number, number]; tva: number; paie: number; difficulte: number; traits: string[] };

const GABARITS: Gabarit[] = [
  { secteur: "Boulangerie artisanale", noms: ["Boulangerie {n}", "Au Bon Pain {n}", "Fournil {n}"], forfait: [1400, 2200], tva: 0.3, paie: 0.8, difficulte: 1, traits: ["se lève à 4h, répond aux mails à 5h", "trois apprentis et une caisse capricieuse", "veut ouvrir une deuxième boutique"] },
  { secteur: "Restaurant", noms: ["Le Comptoir {n}", "Chez {p}", "Bistrot {n}", "La Table de {p}"], forfait: [1800, 3200], tva: 1, paie: 0.9, difficulte: 2, traits: ["beaucoup d'extras le week-end", "pourboires et titres-restaurant en pagaille", "veut passer en vente à emporter"] },
  { secteur: "BTP", noms: ["{n} Bâtiment", "SARL {n} Rénovation", "{n} Construction"], forfait: [2600, 4800], tva: 1, paie: 0.9, difficulte: 3, traits: ["chantiers partout, situations de travaux nulle part", "sous-traitants à la pelle", "retenues de garantie jamais suivies"] },
  { secteur: "Plombier-chauffagiste", noms: ["{n} Plomberie", "{n} Thermique"], forfait: [1300, 2200], tva: 1, paie: 0.5, difficulte: 2, traits: ["devis sur papier carbone", "veut se lancer dans les pompes à chaleur"] },
  { secteur: "Immobilier", noms: ["SCI {n}", "SCI Les {f}", "{n} Patrimoine"], forfait: [900, 2400], tva: 0.2, paie: 0, difficulte: 2, traits: ["associés en désaccord sur les travaux", "location meublée et location nue mélangées", "veut passer à l'IS"] },
  { secteur: "Agence immobilière", noms: ["{n} Immobilier", "Agence des {f}"], forfait: [1800, 3000], tva: 1, paie: 0.8, difficulte: 2, traits: ["commissions des agents à calculer", "carte professionnelle à renouveler"] },
  { secteur: "Commerce alimentaire", noms: ["Épicerie {n}", "Primeur {n}", "Fromagerie {n}", "Cave {n}"], forfait: [1200, 2200], tva: 0.6, paie: 0.6, difficulte: 1, traits: ["stocks à rallonge", "marges sous pression", "veut vendre en ligne"] },
  { secteur: "Mode et boutique", noms: ["Boutique {p}", "Atelier {n}", "Maison {n}"], forfait: [1200, 2400], tva: 0.7, paie: 0.4, difficulte: 1, traits: ["soldes et démarque inconnue", "influenceuse, tout passe sur Instagram"] },
  { secteur: "Start-up SaaS", noms: ["{t} Labs", "{t}.io", "{t} Tech"], forfait: [2800, 5200], tva: 1, paie: 0.9, difficulte: 3, traits: ["lève des fonds tous les six mois", "CIR et JEI à sécuriser", "veut un reporting investisseurs mensuel"] },
  { secteur: "Agence web", noms: ["Studio {t}", "Agence {t}"], forfait: [1800, 3000], tva: 1, paie: 0.7, difficulte: 2, traits: ["clients à l'étranger, TVA intracommunautaire", "freelances partout"] },
  { secteur: "Profession libérale", noms: ["Cabinet de kiné {n}", "Cabinet d'architecture {n}", "Maître {n}, avocat", "Dr {n}"], forfait: [900, 2000], tva: 0.2, paie: 0.3, difficulte: 1, traits: ["BNC, recettes-dépenses et beaucoup de questions", "veut passer en société d'exercice libéral"] },
  { secteur: "Santé", noms: ["Pharmacie {f}", "Clinique vétérinaire {n}", "Centre dentaire {n}"], forfait: [2200, 4200], tva: 0.6, paie: 0.9, difficulte: 2, traits: ["stocks de médicaments à suivre", "plusieurs associés, plusieurs avis"] },
  { secteur: "Transport routier", noms: ["Transports {n}", "{n} Logistique", "Taxi {n}"], forfait: [1600, 4600], tva: 1, paie: 0.8, difficulte: 2, traits: ["flotte de camions et carburant en pagaille", "remboursement TICPE à suivre"] },
  { secteur: "Garage automobile", noms: ["Garage {n}", "{n} Auto"], forfait: [1600, 2800], tva: 1, paie: 0.7, difficulte: 2, traits: ["pièces détachées en stock partout", "conteste chaque ligne de la facture d'honoraires"] },
  { secteur: "Hôtellerie", noms: ["Hôtel {f}", "Résidence {n}", "Gîtes {n}"], forfait: [2400, 4200], tva: 1, paie: 0.9, difficulte: 3, traits: ["saisonnalité extrême", "taxe de séjour à reverser"] },
  { secteur: "Association sportive", noms: ["Association {n} Sport", "Club {f}"], forfait: [700, 1400], tva: 0.1, paie: 0.4, difficulte: 1, traits: ["bénévoles adorables, comptabilité créative", "subventions à justifier"] },
  { secteur: "Domaine viticole", noms: ["Domaine {n}", "Château {f}"], forfait: [2600, 5000], tva: 1, paie: 0.8, difficulte: 3, traits: ["stocks de vin sur plusieurs millésimes", "transmission familiale en vue"] },
  { secteur: "Industrie", noms: ["{n} Industries", "Ateliers {n}", "{n} Métal"], forfait: [3200, 6000], tva: 1, paie: 1, difficulte: 3, traits: ["coût de revient à fiabiliser", "machines en crédit-bail"] },
  { secteur: "Holding patrimoniale", noms: ["Holding {n}", "{n} Participations"], forfait: [1800, 3800], tva: 0, paie: 0, difficulte: 3, traits: ["régime mère-fille et dividendes", "veut créer une deuxième filiale"] },
  { secteur: "Installateur solaire", noms: ["{t} Solaire", "{n} Énergies"], forfait: [2000, 3400], tva: 1, paie: 0.8, difficulte: 3, traits: ["croissance de 200 % et zéro process", "TVA à 5,5 % et 10 % mélangées"] },
];

const NOMS = ["Martin", "Bernard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Mercier", "Dupont", "Lambert", "Bonnet", "François", "Martinez", "Legrand", "Garnier", "Faure", "Rousseau", "Blanc", "Guerin", "Muller", "Henry", "Roussel", "Nicolas", "Perrin", "Morin", "Mathieu", "Clément", "Gauthier", "Dumont", "Lopez", "Fontaine", "Chevalier", "Robin", "Masson", "Sanchez", "Benali", "Nguyen", "Haddad"];
const PRENOMS = ["Julie", "Thomas", "Sarah", "Karim", "Émilie", "Nicolas", "Inès", "Hugo", "Camille", "Mehdi", "Laura", "Antoine", "Chloé", "Yanis", "Pauline", "Romain", "Amina", "Lucas", "Manon", "Sofiane"];
const FLEURS = ["Lilas", "Tilleuls", "Peupliers", "Glycines", "Mimosas", "Platanes", "Oliviers", "Rosiers"];
const TECH = ["Nova", "Pixel", "Orbit", "Kairos", "Lumen", "Vertex", "Nexo", "Zephyr", "Atlas", "Kumo"];

const RISQUES = [
  "Paiements en espèces importants et bénéficiaire effectif difficile à identifier.",
  "Chaîne de détention via une société étrangère opaque.",
  "Le dirigeant refuse de fournir une pièce d'identité à jour.",
  "Flux financiers incohérents avec l'activité annoncée.",
];

export function prospectAleatoire(r: () => number, pris: Set<string>): ModeleProspect | null {
  for (let essai = 0; essai < 30; essai++) {
    const g = GABARITS[Math.floor(r() * GABARITS.length)];
    const n = NOMS[Math.floor(r() * NOMS.length)];
    const p = PRENOMS[Math.floor(r() * PRENOMS.length)];
    const nom = g.noms[Math.floor(r() * g.noms.length)]
      .replace("{n}", n)
      .replace("{p}", p)
      .replace("{f}", FLEURS[Math.floor(r() * FLEURS.length)])
      .replace("{t}", TECH[Math.floor(r() * TECH.length)]);
    if (pris.has(nom)) continue;
    const forfait = Math.round((g.forfait[0] + r() * (g.forfait[1] - g.forfait[0])) / 50) * 50;
    return {
      nom,
      dirigeant: `${p} ${n}`,
      secteur: g.secteur,
      trait: g.traits[Math.floor(r() * g.traits.length)],
      forfait,
      tvaMensuelle: r() < g.tva,
      paie: r() < g.paie,
      difficulte: g.difficulte,
      ...(r() < 0.06 ? { risque: RISQUES[Math.floor(r() * RISQUES.length)] } : {}),
    };
  }
  return null;
}

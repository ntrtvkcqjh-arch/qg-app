// Questions de calcul « à saisir », comme dans les cas pratiques écrits du
// DEC/DSCG : la réponse est un nombre, avec une tolérance d'arrondi.
// {client} est remplacé par le client du dossier.

import type { Secteur } from "@/lib/data/questionsDec";

export type QuestionCalcul = {
  s?: Secteur[];
  theme: string;
  question: string;
  reponse: number;
  unite: "€" | "%" | "jours" | "";
  tolerance: number;
  explication: string;
};

const c = (s: Secteur[] | undefined, theme: string, question: string, reponse: number, unite: QuestionCalcul["unite"], explication: string, tolerance = unite === "€" ? 1 : 0.5): QuestionCalcul => ({ s, theme, question, reponse, unite, tolerance, explication });

export const CALCULS: QuestionCalcul[] = [
  c(undefined, "TVA", "{client} — ventes du mois 80 000 € HT (TVA 20 %), achats de biens et services 30 000 € HT (TVA 20 %), achat d'une immobilisation 10 000 € HT (TVA 20 %). Montant de la TVA à décaisser ?", 8000, "€", "TVA collectée 16 000 € − TVA déductible (6 000 € sur les achats + 2 000 € sur l'immobilisation) = 8 000 €."),
  c(["transport"], "TVA", "{client} a payé 1 000 € de TVA sur le gazole de ses véhicules de tourisme ce trimestre. Montant de TVA déductible ?", 800, "€", "La TVA sur le gazole et l'essence des véhicules de tourisme est déductible à 80 % : 800 €."),
  c(["immo"], "TVA", "{client}, marchand de biens, a acheté un terrain 180 000 € à un particulier et le revend 270 000 € TTC, TVA sur la marge au taux de 20 %. TVA due ?", 15000, "€", "Marge TTC = 90 000 € ; TVA = 90 000 × 20/120 = 15 000 €."),
  c(undefined, "Immobilisations", "{client} acquiert une machine 36 000 € HT le 1er octobre, amortie en linéaire sur 5 ans (exercice civil). Dotation de l'exercice ?", 1800, "€", "Annuité 7 200 € × 3/12 = 1 800 €."),
  c(undefined, "Immobilisations", "{client} acquiert un matériel 12 000 € HT le 1er mars, amorti en linéaire sur 4 ans (exercice civil). Dotation de l'exercice ?", 2500, "€", "Annuité 3 000 € × 10/12 = 2 500 €."),
  c(["industrie"], "Immobilisations", "{client} achète une machine neuve 20 000 € HT le 1er janvier, amortissement dégressif sur 5 ans. Dotation de la première année ?", 7000, "€", "Taux linéaire 20 % × coefficient 1,75 = 35 % ; 20 000 × 35 % = 7 000 €."),
  c(["transport"], "Fiscal", "{client} achète une voiture de tourisme thermique (140 g CO₂/km) 30 000 € TTC, amortie sur 5 ans en linéaire. Montant de l'amortissement à réintégrer chaque année ?", 4020, "€", "Amortissement 6 000 € − amortissement déductible (9 900 / 5 = 1 980 €) = 4 020 € à réintégrer."),
  c(undefined, "Régularisations", "{client} paie le 1er avril une prime d'assurance annuelle de 2 400 € (exercice civil). Charges constatées d'avance au 31/12 ?", 600, "€", "3 mois (janvier à mars N+1) concernent l'exercice suivant : 2 400 × 3/12 = 600 €."),
  c(["tech"], "Régularisations", "{client} facture le 1er novembre un abonnement annuel de 6 000 € HT. Produits constatés d'avance au 31/12 ?", 5000, "€", "10 mois sur 12 concernent l'exercice suivant : 6 000 × 10/12 = 5 000 €."),
  c(undefined, "IS", "{client}, PME éligible au taux réduit, réalise un bénéfice fiscal de 100 000 €. Montant de l'IS ?", 20750, "€", "42 500 × 15 % = 6 375 € + 57 500 × 25 % = 14 375 € ; total 20 750 €."),
  c(undefined, "Provisions", "{client} détient une créance de 3 600 € TTC (TVA 20 %) sur un client en difficulté ; risque de perte estimé à 40 %. Dépréciation ?", 1200, "€", "Base HT 3 000 € × 40 % = 1 200 €."),
  c(undefined, "Analyse", "{client} : charges fixes 90 000 €, taux de marge sur coûts variables 30 %. Seuil de rentabilité ?", 300000, "€", "90 000 / 0,30 = 300 000 € de chiffre d'affaires."),
  c(["commerce", "resto"], "Analyse", "{client} achète un article 60 € HT et le revend 100 € HT. Taux de marque (en %) ?", 40, "%", "Marge 40 € / prix de vente HT 100 € = 40 %."),
  c(["commerce"], "Analyse", "{client} achète un article 50 € HT et le revend 120 € TTC. Coefficient multiplicateur (prix de vente TTC / coût d'achat HT) ?", 2.4, "", "120 / 50 = 2,4.", 0.01),
  c(undefined, "Analyse", "{client} : créances clients 90 000 € TTC, chiffre d'affaires annuel 1 080 000 € TTC. Délai moyen de paiement clients (année de 360 jours) ?", 30, "jours", "90 000 / 1 080 000 × 360 = 30 jours."),
  c(undefined, "Analyse", "{client} : stocks 40 000 €, créances clients 60 000 €, dettes fournisseurs 35 000 €. Besoin en fonds de roulement d'exploitation ?", 65000, "€", "40 000 + 60 000 − 35 000 = 65 000 €."),
  c(undefined, "Analyse", "{client} : valeur ajoutée 500 000 €, subventions d'exploitation 10 000 €, impôts et taxes 15 000 €, charges de personnel 300 000 €. EBE ?", 195000, "€", "500 000 + 10 000 − 15 000 − 300 000 = 195 000 €."),
  c(undefined, "Analyse", "{client} : résultat net 50 000 €, dotations 30 000 €, reprises 5 000 €, valeur nette comptable des actifs cédés 8 000 €, prix de cession 12 000 €. Capacité d'autofinancement (méthode additive) ?", 71000, "€", "50 000 + 30 000 − 5 000 + 8 000 − 12 000 = 71 000 €."),
  c(undefined, "Social", "Un salarié de {client} a un taux horaire de 15 € et fait 6 heures supplémentaires dans la semaine (majoration légale de 25 %). Montant brut de ces heures ?", 112.5, "€", "15 × 1,25 × 6 = 112,50 €.", 0.5),
  c(undefined, "Social", "{client} licencie (hors faute grave) un salarié ayant 6 ans d'ancienneté et 2 400 € de salaire de référence. Indemnité légale ?", 3600, "€", "1/4 de mois par année jusqu'à 10 ans : 2 400 × 1/4 × 6 = 3 600 €."),
  c(undefined, "Social", "Un salarié de {client} a travaillé 7 mois sur la période de référence. Nombre de jours ouvrables de congés payés acquis ?", 17.5, "jours", "2,5 jours ouvrables par mois : 7 × 2,5 = 17,5 jours."),
  c(["holding"], "IS", "{client} reçoit 200 000 € de dividendes d'une filiale sous le régime mère-fille (hors intégration fiscale). Quote-part de frais et charges réintégrée ?", 10000, "€", "5 % × 200 000 = 10 000 €."),
  c(["holding"], "IS", "{client} cède des titres de participation détenus depuis 3 ans avec une plus-value brute de 150 000 €. Montant imposable au taux normal (quote-part de frais et charges) ?", 18000, "€", "12 % × 150 000 = 18 000 €."),
  c(undefined, "Juridique", "{client} rachète un fonds de commerce 150 000 €. Droits d'enregistrement (0 % jusqu'à 23 000 €, 3 % de 23 000 à 200 000 €) ?", 3810, "€", "(150 000 − 23 000) × 3 % = 3 810 €."),
  c(["asso"], "Fiscal", "Un particulier donne 1 000 € à {client}, association d'intérêt général. Réduction d'impôt sur le revenu ?", 660, "€", "66 % × 1 000 = 660 €, dans la limite de 20 % du revenu imposable."),
];

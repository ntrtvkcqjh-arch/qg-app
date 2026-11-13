import type { CasPratique } from "@/lib/types";

// Cas pratiques chiffrés : un collaborateur bloque, c'est toi qui tranches.
// {client} est remplacé par le client du dossier.

export const CAS: CasPratique[] = [
  {
    theme: "TVA",
    enonce: "{client} — mois en cours : ventes 50 000 € HT (TVA 20 %), achats de biens et services 18 000 € HT (TVA 20 %), achat d'une machine 5 000 € HT (TVA 20 %). Quelle TVA à décaisser ?",
    choix: ["5 400 €", "6 400 €", "10 000 €", "4 600 €"],
    bonne: 0,
    explication: "TVA collectée 10 000 € – TVA déductible (3 600 € sur ABS + 1 000 € sur immobilisation) = 5 400 € à décaisser.",
  },
  {
    theme: "Immobilisations",
    enonce: "{client} achète un utilitaire 24 000 € HT le 1er avril, amorti en linéaire sur 4 ans, exercice civil. Dotation de l'exercice ?",
    choix: ["6 000 €", "4 500 €", "3 000 €", "1 500 €"],
    bonne: 1,
    explication: "Annuité 24 000 / 4 = 6 000 €, prorata 9 mois : 6 000 × 9/12 = 4 500 €.",
  },
  {
    theme: "Régularisations",
    enonce: "{client} paie le 1er décembre un loyer trimestriel de 3 000 € couvrant décembre, janvier et février. Charges constatées d'avance au 31/12 ?",
    choix: ["1 000 €", "2 000 €", "3 000 €", "0 €"],
    bonne: 1,
    explication: "Janvier et février concernent l'exercice suivant : 3 000 × 2/3 = 2 000 € au compte 486.",
  },
  {
    theme: "Régularisations",
    enonce: "{client} recevra en février la facture de son avocat (1 200 € TTC, TVA 20 %) pour une prestation de décembre. Écriture au 31/12 ?",
    choix: ["D 6226 1 000 / D 44586 200 / C 408 1 200", "D 6226 1 200 / C 401 1 200", "D 486 1 000 / C 6226 1 000", "Aucune écriture : pas de facture"],
    bonne: 0,
    explication: "Charge de l'exercice non facturée : facture non parvenue (408), avec la TVA en 44586 (taxes sur factures non parvenues).",
  },
  {
    theme: "Dépréciations",
    enonce: "Un client de {client} doit 6 000 € TTC (TVA 20 %). Perte probable estimée à 40 %. Montant de la dépréciation ?",
    choix: ["2 400 €", "2 000 €", "5 000 €", "6 000 €"],
    bonne: 1,
    explication: "On déprécie le montant HT : 6 000 / 1,2 = 5 000 € × 40 % = 2 000 €.",
  },
  {
    theme: "IS",
    enonce: "{client}, PME éligible au taux réduit, dégage un bénéfice fiscal de 80 000 €. Impôt sur les sociétés ?",
    choix: ["20 000 €", "12 000 €", "15 750 €", "6 375 €"],
    bonne: 2,
    explication: "42 500 × 15 % = 6 375 € + (80 000 – 42 500) × 25 % = 9 375 €, soit 15 750 €.",
  },
  {
    theme: "Fiscal",
    enonce: "Résultat comptable de {client} : 30 000 €. Il inclut 500 € d'amendes pour stationnement de véhicules de la société. Résultat fiscal (hors autres retraitements) ?",
    choix: ["29 500 €", "30 000 €", "30 500 €", "31 000 €"],
    bonne: 2,
    explication: "Les amendes et pénalités ne sont pas déductibles : on les réintègre, 30 000 + 500 = 30 500 €.",
  },
  {
    theme: "Analyse",
    enonce: "{client} achète un article 60 € HT et le revend 100 € HT. Taux de marque et taux de marge ?",
    choix: ["40 % et 66,7 %", "66,7 % et 40 %", "40 % et 40 %", "60 % et 100 %"],
    bonne: 0,
    explication: "Marge 40 €. Taux de marque = 40 / 100 = 40 % ; taux de marge = 40 / 60 ≈ 66,7 %.",
  },
  {
    theme: "Social",
    enonce: "Un salarié de {client} à 35 h, taux horaire 15 €, fait 4 heures supplémentaires dans la semaine (sans accord prévoyant un autre taux). Taux horaire de ces heures ?",
    choix: ["15 €", "18,75 €", "22,50 €", "16,50 €"],
    bonne: 1,
    explication: "À défaut d'accord, les 8 premières heures supplémentaires sont majorées de 25 % : 15 × 1,25 = 18,75 €.",
  },
  {
    theme: "Immobilisations",
    enonce: "{client} cède 4 000 € une machine acquise 10 000 €, amortie à hauteur de 7 000 €. Résultat de cession ?",
    choix: ["Plus-value de 4 000 €", "Moins-value de 6 000 €", "Plus-value de 1 000 €", "Moins-value de 3 000 €"],
    bonne: 2,
    explication: "VNC = 10 000 – 7 000 = 3 000 €. Prix 4 000 – VNC 3 000 = plus-value de 1 000 €.",
  },
  {
    theme: "Juridique",
    enonce: "SARL {client} : capital 50 000 €, capitaux propres après la perte de l'exercice 20 000 €. Que faut-il faire ?",
    choix: ["Rien, le capital est intact", "Consulter les associés dans les 4 mois de l'approbation sur la dissolution anticipée", "Réduire le capital immédiatement", "Déposer le bilan"],
    bonne: 1,
    explication: "Capitaux propres (20 000) < moitié du capital (25 000) : consultation des associés dans les 4 mois suivant l'approbation des comptes.",
  },
  {
    theme: "Analyse",
    enonce: "{client} : charges fixes 30 000 €, taux de marge sur coût variable 40 %. Seuil de rentabilité ?",
    choix: ["12 000 €", "42 000 €", "75 000 €", "50 000 €"],
    bonne: 2,
    explication: "SR = charges fixes / taux de MCV = 30 000 / 0,40 = 75 000 € de chiffre d'affaires.",
  },
  {
    theme: "Analyse",
    enonce: "{client} : stocks 20 000 €, créances clients 30 000 €, dettes fournisseurs 25 000 €. Besoin en fonds de roulement d'exploitation ?",
    choix: ["75 000 €", "25 000 €", "5 000 €", "50 000 €"],
    bonne: 1,
    explication: "BFRE = stocks + créances d'exploitation – dettes d'exploitation = 20 000 + 30 000 – 25 000 = 25 000 €.",
  },
  {
    theme: "Juridique",
    enonce: "SA {client} : capital 100 000 €, réserve légale déjà dotée de 9 000 €, bénéfice 40 000 €. Dotation obligatoire à la réserve légale ?",
    choix: ["2 000 €", "1 000 €", "4 000 €", "0 €"],
    bonne: 1,
    explication: "5 % du bénéfice (2 000 €) jusqu'à ce que la réserve atteigne 10 % du capital (10 000 €) : il ne manque que 1 000 €.",
  },
];

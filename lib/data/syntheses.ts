// Notes de synthèse façon épreuve du DEC : un cas, une recommandation rédigée
// en texte libre. La correction repère les notions clés attendues.

export type Attendu = { notion: string; mots: string[]; pourquoi: string };
export type Synthese = { id: string; theme: string; titre: string; enonce: string; consigne: string; attendus: Attendu[]; corrige: string };

export const SYNTHESES: Synthese[] = [
  {
    id: "remuneration",
    theme: "Fiscal",
    titre: "Se rémunérer : salaire ou dividendes ?",
    enonce:
      "Julie dirige une SARL de conseil (capital 5 000 €, bénéfice avant rémunération 120 000 €). Elle est gérante majoritaire et se demande s'il vaut mieux se verser un salaire ou des dividendes, et si passer en SAS changerait quelque chose.",
    consigne: "Rédige ta note de recommandation à Julie (10 à 15 lignes).",
    attendus: [
      { notion: "Statut social du dirigeant", mots: ["tns", "travailleur non salarie", "assimile salarie", "regime general", "ssi"], pourquoi: "Gérante majoritaire de SARL = TNS ; président de SAS = assimilé salarié, cotisations plus élevées." },
      { notion: "Rémunération déductible du résultat", mots: ["deductible", "charge deductible", "reduit le resultat", "reduit l'is"], pourquoi: "La rémunération est une charge qui diminue l'IS, contrairement aux dividendes." },
      { notion: "Fiscalité des dividendes", mots: ["pfu", "flat tax", "prelevement forfaitaire", "bareme progressif", "abattement de 40"], pourquoi: "Dividendes : prélèvement forfaitaire unique ou option pour le barème avec abattement de 40 %." },
      { notion: "Seuil des 10 % en SARL", mots: ["10 %", "10%", "dix pour cent"], pourquoi: "En SARL, les dividendes du gérant majoritaire au-delà de 10 % du capital, des primes et des comptes courants supportent les cotisations sociales." },
      { notion: "Protection sociale", mots: ["retraite", "prevoyance", "protection sociale", "chomage", "droits"], pourquoi: "Les dividendes n'ouvrent aucun droit à la retraite : il faut un socle de rémunération." },
      { notion: "Simulation chiffrée", mots: ["simulation", "chiffrer", "comparer", "net en poche", "cout global"], pourquoi: "Une recommandation se fonde sur une comparaison chiffrée du net disponible." },
    ],
    corrige:
      "Gérante majoritaire, Julie est TNS : ses cotisations sont plus faibles qu'en SAS (assimilé salarié). Sa rémunération est déductible et réduit l'IS ; les dividendes subissent l'IS puis le PFU (ou le barème après abattement de 40 %). En SARL, la part des dividendes dépassant 10 % du capital, des primes et des comptes courants est soumise aux cotisations sociales, ce qui limite l'intérêt de la distribution avec un capital de 5 000 €. Je recommande un mix : une rémunération suffisante pour valider ses droits retraite et sa prévoyance, le solde laissé en réserve ou distribué après simulation chiffrée du net en poche. Le passage en SAS n'est pertinent que si elle privilégie les dividendes.",
  },
  {
    id: "btp",
    theme: "Analyse",
    titre: "Chantiers à cheval sur deux exercices",
    enonce:
      "Bâtir Plus réalise un chantier de 900 000 € sur 18 mois. Au 31/12, 60 % des coûts sont engagés et le devis révisé prévoit désormais une perte globale de 40 000 €. Le dirigeant veut « ne rien comptabiliser tant que le chantier n'est pas fini ».",
    consigne: "Explique-lui le traitement comptable et les points de vigilance (10 à 15 lignes).",
    attendus: [
      { notion: "Méthode à l'avancement ou à l'achèvement", mots: ["avancement", "achevement"], pourquoi: "Les contrats à long terme se comptabilisent à l'avancement (méthode préférentielle) ou à l'achèvement." },
      { notion: "Perte à terminaison", mots: ["perte a terminaison", "provision pour perte", "provision"], pourquoi: "Une perte probable doit être provisionnée en totalité, quelle que soit la méthode." },
      { notion: "Prudence", mots: ["prudence"], pourquoi: "Le principe de prudence impose de constater la perte dès qu'elle est probable." },
      { notion: "Retenue de garantie", mots: ["retenue de garantie", "5 %", "5%"], pourquoi: "Le client retient souvent 5 % jusqu'à la réception : créance à suivre." },
      { notion: "Autoliquidation de la TVA en sous-traitance", mots: ["autoliquidation", "auto-liquidation"], pourquoi: "En sous-traitance BTP, c'est l'entreprise principale qui autoliquide la TVA." },
      { notion: "Suivi des situations de travaux", mots: ["situation", "suivi de chantier", "budget", "devis revise"], pourquoi: "Un suivi budgétaire par chantier fiabilise l'avancement et la marge." },
    ],
    corrige:
      "Le chantier est un contrat à long terme : il doit être comptabilisé à l'avancement (méthode préférentielle, 60 % des coûts engagés) ou, à défaut, à l'achèvement. Dans tous les cas, le principe de prudence impose de provisionner immédiatement la perte à terminaison de 40 000 € (diminuée de la part déjà constatée à l'avancement). Il faut aussi suivre la retenue de garantie de 5 % jusqu'à la réception, vérifier l'autoliquidation de la TVA pour les sous-traitants, et mettre en place un suivi budgétaire par chantier rapprochant situations de travaux et coûts réels.",
  },
  {
    id: "holding",
    theme: "IS",
    titre: "Créer une holding au-dessus de sa société",
    enonce:
      "Henri détient 100 % d'une SAS industrielle qui distribue 200 000 € de dividendes par an. Il veut créer une holding pour « payer moins d'impôts » et racheter une deuxième société.",
    consigne: "Rédige ta note sur l'intérêt et les conditions de la holding (10 à 15 lignes).",
    attendus: [
      { notion: "Régime mère-fille", mots: ["mere-fille", "mere fille", "societe mere"], pourquoi: "Les dividendes remontent quasiment exonérés d'IS dans la holding." },
      { notion: "Conditions : 5 % et 2 ans", mots: ["5 %", "5%", "deux ans", "2 ans"], pourquoi: "Détention d'au moins 5 % du capital, conservée au moins 2 ans." },
      { notion: "Quote-part de frais et charges", mots: ["quote-part", "quote part", "frais et charges"], pourquoi: "Une quote-part de 5 % des dividendes reste imposable (1 % en intégration fiscale)." },
      { notion: "Intégration fiscale", mots: ["integration fiscale", "95 %", "95%"], pourquoi: "Avec 95 % de détention, les résultats du groupe se compensent." },
      { notion: "Financement de l'acquisition", mots: ["emprunt", "effet de levier", "lbo", "remboursement", "dette"], pourquoi: "Les dividendes remontés remboursent la dette d'acquisition (effet de levier)." },
      { notion: "Substance et abus de droit", mots: ["abus de droit", "substance", "animatrice", "management fees", "convention"], pourquoi: "La holding doit avoir une réalité économique ; les prestations facturées doivent être justifiées." },
    ],
    corrige:
      "Une holding détenant au moins 5 % de la SAS pendant 2 ans bénéficie du régime mère-fille : les dividendes remontent exonérés, sauf une quote-part de frais et charges de 5 % (1 % en intégration fiscale). À 95 % de détention, l'intégration fiscale permet de compenser résultats et déficits. La holding peut s'endetter pour racheter la seconde société et rembourser grâce aux dividendes remontés (effet de levier). L'impôt n'est que différé : il faut une vraie substance (holding animatrice, conventions de prestations justifiées) pour éviter l'abus de droit.",
  },
  {
    id: "tresorerie",
    theme: "Analyse",
    titre: "Trésorerie à sec en fin de mois",
    enonce:
      "Un grossiste alimentaire (CA 3 M€) est rentable mais à découvert chaque fin de mois. Ses clients paient à 75 jours, ses fournisseurs exigent 30 jours, et l'URSSAF vient d'envoyer une mise en demeure.",
    consigne: "Propose un diagnostic et un plan d'action (10 à 15 lignes).",
    attendus: [
      { notion: "Besoin en fonds de roulement", mots: ["bfr", "besoin en fonds de roulement"], pourquoi: "Le problème vient du décalage entre délais clients et fournisseurs." },
      { notion: "Délais de paiement légaux", mots: ["60 jours", "45 jours", "lme", "delais de paiement", "penalites de retard"], pourquoi: "Délais plafonnés à 60 jours (ou 45 jours fin de mois), avec pénalités de retard." },
      { notion: "Prévisionnel de trésorerie", mots: ["previsionnel", "plan de tresorerie", "13 semaines", "budget de tresorerie"], pourquoi: "Un plan de trésorerie à court terme permet d'anticiper les tensions." },
      { notion: "Financement court terme", mots: ["affacturage", "escompte", "dailly", "facilite de caisse", "credit court terme"], pourquoi: "Mobiliser les créances clients finance le BFR." },
      { notion: "Échéancier fiscal et social", mots: ["ccsf", "echeancier", "plan d'apurement", "delai de paiement urssaf"], pourquoi: "La CCSF et l'URSSAF peuvent accorder des délais." },
      { notion: "Prévention des difficultés", mots: ["mandat ad hoc", "conciliation", "prevention", "alerte"], pourquoi: "En cas d'aggravation, les procédures amiables protègent l'entreprise." },
    ],
    corrige:
      "L'entreprise est rentable mais son BFR explose : 75 jours de crédit clients contre 30 jours fournisseurs. Les délais clients dépassent le plafond légal de 60 jours (ou 45 jours fin de mois) : il faut relancer, appliquer les pénalités de retard et renégocier. À court terme, l'affacturage ou la cession Dailly des créances finance le décalage, et un plan de trésorerie sur 13 semaines anticipe les creux. Pour l'URSSAF, demander un échéancier (ou saisir la CCSF pour l'ensemble des dettes publiques). Si la situation s'aggrave, un mandat ad hoc ou une conciliation permet de négocier avec les créanciers en toute confidentialité.",
  },
  {
    id: "transmission",
    theme: "Juridique",
    titre: "Transmettre l'entreprise familiale",
    enonce:
      "Marc, 64 ans, veut transmettre sa société de transport (valeur 2 M€) à ses deux enfants, dont un seul travaille dans l'entreprise, en limitant les droits de donation.",
    consigne: "Rédige ta note de stratégie de transmission (10 à 15 lignes).",
    attendus: [
      { notion: "Pacte Dutreil", mots: ["dutreil"], pourquoi: "Exonération de 75 % de la valeur des titres transmis." },
      { notion: "Engagements de conservation", mots: ["engagement collectif", "engagement individuel", "engagement de conservation", "2 ans", "4 ans"], pourquoi: "Engagement collectif puis individuel de conservation des titres, et fonction de direction exercée par un héritier (durées à vérifier selon la dernière loi de finances)." },
      { notion: "Abattement en ligne directe", mots: ["100 000", "abattement", "15 ans"], pourquoi: "100 000 € par parent et par enfant, renouvelable tous les 15 ans." },
      { notion: "Donation-partage et équité", mots: ["donation-partage", "donation partage", "soulte", "equite", "egalite"], pourquoi: "La donation-partage fige les valeurs et une soulte peut rééquilibrer entre enfants." },
      { notion: "Réduction de droits avant 70 ans", mots: ["70 ans", "reduction de droits", "50 %"], pourquoi: "Une donation Dutreil en pleine propriété avant 70 ans ouvre une réduction de droits de 50 %." },
      { notion: "Évaluation de l'entreprise", mots: ["evaluation", "valorisation", "expert"], pourquoi: "Une évaluation sérieuse sécurise la base taxable." },
    ],
    corrige:
      "Je recommande une donation-partage sous pacte Dutreil : exonération de 75 % de la valeur des titres, sous réserve d'un engagement collectif puis individuel de conservation des titres et d'une fonction de direction exercée par l'un des héritiers (durées à vérifier dans la dernière loi de finances). Chaque enfant bénéficie en plus d'un abattement de 100 000 € par parent (renouvelable tous les 15 ans), et la donation en pleine propriété avant 70 ans ouvre une réduction de droits de 50 %. Pour l'équité, l'enfant repreneur reçoit les titres et verse une soulte, ou l'autre reçoit d'autres biens. Une évaluation sérieuse de la société est indispensable.",
  },
  {
    id: "cac",
    theme: "Audit",
    titre: "Premier mandat de commissaire aux comptes",
    enonce:
      "Tu es nommé·e CAC d'une PME de distribution (CA 12 M€). Au premier rendez-vous, tu découvres une caisse importante en espèces, des stocks jamais inventoriés et un comptable qui fait tout seul.",
    consigne: "Présente ta démarche d'audit et tes points de vigilance (10 à 15 lignes).",
    attendus: [
      { notion: "Indépendance et acceptation", mots: ["independance", "acceptation", "predecesseur"], pourquoi: "Vérifier son indépendance et contacter le prédécesseur avant d'accepter." },
      { notion: "Approche par les risques", mots: ["approche par les risques", "evaluation des risques", "risque d'anomalie", "risque de fraude"], pourquoi: "L'audit se planifie selon les risques d'anomalies significatives." },
      { notion: "Seuil de signification", mots: ["seuil de signification", "materialite"], pourquoi: "Le seuil détermine ce qui est significatif pour l'opinion." },
      { notion: "Contrôle interne et séparation des tâches", mots: ["controle interne", "separation des taches"], pourquoi: "Un comptable seul sans séparation des tâches est un risque de fraude." },
      { notion: "Inventaire physique", mots: ["inventaire", "assister", "comptage"], pourquoi: "Le CAC doit assister à l'inventaire des stocks significatifs." },
      { notion: "Espèces et blanchiment", mots: ["lcb-ft", "lcbft", "blanchiment", "tracfin", "especes"], pourquoi: "Des flux d'espèces importants imposent une vigilance LCB-FT." },
      { notion: "Circularisation et NEP", mots: ["circularisation", "confirmation", "nep"], pourquoi: "Confirmations externes des soldes, selon les normes d'exercice professionnel." },
    ],
    corrige:
      "Avant tout, je vérifie mon indépendance et contacte le prédécesseur. Ma démarche suit l'approche par les risques des NEP : prise de connaissance, détermination du seuil de signification, évaluation du contrôle interne. Ici, l'absence de séparation des tâches et la caisse en espèces créent un risque de fraude élevé et imposent une vigilance LCB-FT (déclaration à Tracfin en cas de soupçon). J'assisterai à l'inventaire physique des stocks, je circulariserai clients, fournisseurs et banques, et je communiquerai les faiblesses de contrôle interne à la direction.",
  },
  {
    id: "facture-electronique",
    theme: "TVA",
    titre: "La facture électronique arrive",
    enonce:
      "Une PME de 30 salariés te demande ce qu'elle doit faire pour la facturation électronique : elle facture aujourd'hui avec Word et reçoit ses factures par e-mail.",
    consigne: "Rédige ta note d'accompagnement (10 à 15 lignes).",
    attendus: [
      { notion: "Calendrier", mots: ["septembre 2026", "septembre 2027", "1er septembre", "2026", "2027"], pourquoi: "Réception obligatoire pour tous en septembre 2026 ; émission pour les PME et TPE en septembre 2027." },
      { notion: "Plateforme agréée", mots: ["plateforme agreee", "pdp", "plateforme de dematerialisation", "pa "], pourquoi: "Les factures transitent par une plateforme agréée choisie par l'entreprise." },
      { notion: "E-reporting", mots: ["e-reporting", "ereporting", "transmission des donnees"], pourquoi: "Les opérations hors facture électronique (B2C, international) sont transmises en e-reporting." },
      { notion: "Nouvelles mentions", mots: ["siren", "mentions", "adresse de livraison", "nature de l'operation", "option pour les debits"], pourquoi: "De nouvelles mentions obligatoires apparaissent sur les factures." },
      { notion: "Formats structurés", mots: ["factur-x", "ubl", "cii", "format structure", "pdf"], pourquoi: "Un PDF simple ne suffit plus : formats structurés (Factur-X, UBL, CII)." },
      { notion: "Accompagnement et lettre de mission", mots: ["lettre de mission", "accompagnement", "process", "logiciel"], pourquoi: "C'est une mission de conseil à cadrer : choix d'outil, process, formation." },
    ],
    corrige:
      "Depuis le 1er septembre 2026, la PME doit pouvoir recevoir des factures électroniques ; elle devra les émettre au 1er septembre 2027. Elle doit choisir une plateforme agréée (anciennement PDP) qui transmettra ses factures dans un format structuré (Factur-X, UBL ou CII) : Word et les PDF simples ne suffiront plus. Les opérations hors champ (ventes aux particuliers, international) relèveront de l'e-reporting. Les factures porteront de nouvelles mentions (SIREN du client, adresse de livraison, nature de l'opération, option pour les débits). Je propose une mission d'accompagnement encadrée par lettre de mission : choix du logiciel, revue des process et formation.",
  },
  {
    id: "embauche-restaurant",
    theme: "Social",
    titre: "Premier salarié d'un restaurant",
    enonce:
      "Lina ouvre un restaurant et veut embaucher un commis de cuisine à temps plein dès lundi. Elle te demande « tout ce qu'il faut faire » et combien il va lui coûter.",
    consigne: "Liste les démarches et les points de coût (10 à 15 lignes).",
    attendus: [
      { notion: "DPAE", mots: ["dpae", "declaration prealable"], pourquoi: "La DPAE est obligatoire avant toute embauche." },
      { notion: "Convention collective HCR", mots: ["convention collective", "hcr", "hotels cafes restaurants"], pourquoi: "La convention HCR fixe minima, durée du travail et avantages." },
      { notion: "Avantage en nature repas", mots: ["avantage en nature", "repas", "nourriture"], pourquoi: "Dans la restauration, les repas fournis constituent un avantage en nature." },
      { notion: "Réduction générale des cotisations", mots: ["reduction generale", "allegement", "rgdu", "fillon"], pourquoi: "Près du SMIC, la réduction générale diminue fortement les cotisations patronales." },
      { notion: "Mutuelle obligatoire", mots: ["mutuelle", "complementaire sante"], pourquoi: "L'employeur doit proposer une complémentaire santé et en financer au moins 50 %." },
      { notion: "Visite d'information et de prévention", mots: ["visite", "medecine du travail", "information et de prevention"], pourquoi: "Une visite d'information et de prévention doit être organisée." },
      { notion: "Contrat et registre", mots: ["contrat", "registre du personnel", "cdi", "cdd"], pourquoi: "Contrat écrit et registre unique du personnel." },
    ],
    corrige:
      "Avant lundi : DPAE auprès de l'URSSAF, contrat de travail écrit conforme à la convention collective HCR (minima, durée du travail), inscription au registre unique du personnel, adhésion à la médecine du travail pour la visite d'information et de prévention, mise en place de la mutuelle obligatoire (au moins 50 % à la charge de l'employeur). Côté coût, les repas fournis constituent un avantage en nature à intégrer en paie ; près du SMIC, la réduction générale des cotisations patronales réduit sensiblement le coût. Je chiffre un coût total mensuel et prépare la première paie et la DSN.",
  },
];

export const norm = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");

/** Notions trouvées dans ta note. */
export function corrigerSynthese(s: Synthese, texte: string) {
  const t = " " + norm(texte) + " ";
  const res = s.attendus.map((a) => ({ ...a, ok: a.mots.some((m) => t.includes(norm(m))) }));
  return { res, score: res.filter((r) => r.ok).length, total: res.length };
}

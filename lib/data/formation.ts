// QCM blanc hebdomadaire et oral blanc DEC. Contenu écrit à l'avance.
// {client} est remplacé par un client du cabinet pour ancrer la question
// dans la simulation.

export type QuestionQcm = {
  theme: string;
  question: string;
  choix: string[];
  bonne: number;
  explication: string;
};

export const QCM: QuestionQcm[] = [
  { theme: "TVA", question: "{client} vend des biens soumis au taux normal de TVA en France métropolitaine. Quel est ce taux ?", choix: ["5,5 %", "10 %", "20 %", "19,6 %"], bonne: 2, explication: "Le taux normal est de 20 % (19,6 % était l'ancien taux, avant 2014)." },
  { theme: "TVA", question: "Le Comptoir d'Anna sert des repas consommés sur place. Quel taux de TVA s'applique à la restauration (hors boissons alcoolisées) ?", choix: ["5,5 %", "10 %", "20 %", "2,1 %"], bonne: 1, explication: "La restauration sur place relève du taux intermédiaire de 10 %. Les boissons alcoolisées restent à 20 %." },
  { theme: "TVA", question: "{client} achète du gazole pour un véhicule de tourisme. Quelle part de la TVA est déductible ?", choix: ["0 %", "50 %", "80 %", "100 %"], bonne: 2, explication: "Depuis 2022, la TVA sur l'essence et le gazole des véhicules de tourisme est déductible à 80 %." },
  { theme: "TVA", question: "{client} achète une voiture de tourisme pour son dirigeant. La TVA sur l'achat est…", choix: ["Déductible à 100 %", "Déductible à 80 %", "Non déductible", "Déductible à 50 %"], bonne: 2, explication: "La TVA grevant l'achat de véhicules de tourisme (non affectés à une activité de transport ou d'auto-école) n'est pas déductible." },
  { theme: "PCG", question: "Écriture d'achat de marchandises de 1 000 € HT avec TVA à 20 % chez {client} :", choix: ["D 607 1 000 / D 44566 200 / C 401 1 200", "D 401 1 200 / C 607 1 000 / C 44571 200", "D 607 1 200 / C 401 1 200", "D 601 1 000 / D 44571 200 / C 411 1 200"], bonne: 0, explication: "Achat de marchandises au débit du 607, TVA déductible au 44566, dette fournisseur au crédit du 401." },
  { theme: "PCG", question: "Quel compte enregistre la TVA collectée ?", choix: ["44566", "44571", "4456", "44551"], bonne: 1, explication: "44571 = TVA collectée ; 44566 = TVA déductible sur autres biens et services ; 44551 = TVA à décaisser." },
  { theme: "PCG", question: "Une facture d'électricité de décembre de {client} arrive en janvier. On la rattache à l'exercice clos via le compte…", choix: ["486 Charges constatées d'avance", "408 Fournisseurs – factures non parvenues", "487 Produits constatés d'avance", "418 Clients – factures à établir"], bonne: 1, explication: "Une charge de l'exercice dont la facture n'est pas encore reçue se constate en 408 (FNP), en application de l'indépendance des exercices." },
  { theme: "PCG", question: "{client} paie le 1er octobre une assurance annuelle de 1 200 € (exercice civil). Montant des charges constatées d'avance au 31/12 ?", choix: ["300 €", "900 €", "1 200 €", "0 €"], bonne: 1, explication: "9 mois (janvier à septembre N+1) concernent l'exercice suivant : 1 200 × 9/12 = 900 € en compte 486." },
  { theme: "PCG", question: "Le compte 512 correspond à…", choix: ["Caisse", "Banque", "Valeurs mobilières de placement", "Virements internes"], bonne: 1, explication: "512 = Banques ; 53 = Caisse ; 50 = VMP ; 58 = Virements internes." },
  { theme: "PCG", question: "Une avance reçue d'un client pour une prestation de l'exercice suivant se comptabilise en…", choix: ["487 Produits constatés d'avance (si facturée)", "418 Factures à établir", "486 Charges constatées d'avance", "7xx produits de l'exercice"], bonne: 0, explication: "Un produit facturé mais qui concerne l'exercice suivant est neutralisé en produits constatés d'avance (487)." },
  { theme: "Immobilisations", question: "{client} achète un ordinateur à 420 € HT. Traitement admis ?", choix: ["Immobilisation obligatoire", "Charge de l'exercice (petit matériel < 500 € HT)", "Stock", "Charge constatée d'avance"], bonne: 1, explication: "L'administration admet la déduction immédiate des matériels et mobiliers de faible valeur (moins de 500 € HT)." },
  { theme: "Immobilisations", question: "Machine de 10 000 € HT acquise le 1er juillet N, amortie en linéaire sur 5 ans, exercice civil. Dotation N ?", choix: ["2 000 €", "1 000 €", "500 €", "10 000 €"], bonne: 1, explication: "Annuité de 2 000 €, au prorata temporis : 6 mois sur 12, soit 1 000 €." },
  { theme: "Immobilisations", question: "Les dotations aux amortissements d'exploitation sont enregistrées au compte…", choix: ["6811", "6871", "7811", "2815"], bonne: 0, explication: "6811 = dotations aux amortissements sur immobilisations (exploitation) ; 28xx enregistre le cumul des amortissements." },
  { theme: "Provisions", question: "{client} a une créance douteuse de 1 200 € TTC (TVA 20 %), risque de perte 50 %. Dépréciation ?", choix: ["600 €", "500 €", "1 200 €", "1 000 €"], bonne: 1, explication: "La dépréciation se calcule sur le montant HT : 1 000 × 50 % = 500 €." },
  { theme: "Principes", question: "Le principe de prudence impose…", choix: ["De comptabiliser les gains latents", "De comptabiliser les pertes probables mais pas les gains latents", "De ne jamais provisionner", "De réévaluer les actifs chaque année"], bonne: 1, explication: "Prudence : appréciation raisonnable des faits ; les pertes probables sont constatées, les profits latents ne le sont pas." },
  { theme: "Principes", question: "Combien de temps faut-il conserver les documents comptables et pièces justificatives ?", choix: ["3 ans", "6 ans", "10 ans", "30 ans"], bonne: 2, explication: "Le Code de commerce (art. L123-22) impose une conservation de 10 ans." },
  { theme: "Fiscal", question: "{client} est une PME éligible avec un bénéfice de 100 000 €. Taux d'IS sur les 42 500 premiers euros ?", choix: ["0 %", "15 %", "25 %", "33,33 %"], bonne: 1, explication: "Taux réduit de 15 % jusqu'à 42 500 € de bénéfice pour les PME éligibles, 25 % au-delà." },
  { theme: "Fiscal", question: "Taux normal de l'impôt sur les sociétés ?", choix: ["15 %", "25 %", "28 %", "33,33 %"], bonne: 1, explication: "Le taux normal est de 25 % depuis 2022." },
  { theme: "Fiscal", question: "Un déficit fiscal reporté en avant par {client} est imputable…", choix: ["Pendant 5 ans", "Pendant 10 ans", "Sans limite de durée, dans la limite de 1 M€ + 50 % du bénéfice au-delà", "Uniquement l'année suivante"], bonne: 2, explication: "Report en avant illimité dans le temps mais plafonné à 1 M€ majoré de 50 % du bénéfice excédant ce montant." },
  { theme: "Fiscal", question: "Délai de reprise de droit commun de l'administration en matière d'IS ?", choix: ["1 an", "3 ans", "6 ans", "10 ans"], bonne: 1, explication: "L'administration peut rectifier jusqu'à la fin de la 3e année suivant celle au titre de laquelle l'imposition est due." },
  { theme: "Juridique", question: "Les comptes annuels d'une SARL doivent être approuvés dans quel délai après la clôture ?", choix: ["3 mois", "4 mois", "6 mois", "12 mois"], bonne: 2, explication: "L'assemblée d'approbation doit se tenir dans les 6 mois de la clôture (prorogation possible par le président du tribunal)." },
  { theme: "Juridique", question: "Dépôt des comptes au greffe (dépôt électronique) : dans quel délai après l'approbation ?", choix: ["1 mois", "2 mois", "6 mois", "15 jours"], bonne: 1, explication: "1 mois après l'approbation, porté à 2 mois en cas de dépôt par voie électronique." },
  { theme: "Juridique", question: "Les capitaux propres de {client} deviennent inférieurs à la moitié du capital social. Que faut-il faire ?", choix: ["Rien", "Consulter les associés dans les 4 mois de l'approbation des comptes sur une éventuelle dissolution anticipée", "Déposer le bilan immédiatement", "Augmenter le capital sous 1 mois"], bonne: 1, explication: "Les associés doivent être consultés dans les 4 mois suivant l'approbation des comptes ayant fait apparaître la perte." },
  { theme: "Juridique", question: "Délai maximal de paiement entre professionnels (règle générale) ?", choix: ["30 jours", "60 jours à compter de la facture ou 45 jours fin de mois", "90 jours", "120 jours"], bonne: 1, explication: "Code de commerce : 60 jours à compter de la date d'émission de la facture, ou 45 jours fin de mois si convenu." },
  { theme: "Social", question: "{client} a moins de 50 salariés. Date limite de dépôt de la DSN mensuelle ?", choix: ["Le 5 du mois suivant", "Le 15 du mois suivant", "Le 25 du mois", "Le dernier jour du mois"], bonne: 1, explication: "DSN le 15 du mois suivant pour les entreprises de moins de 50 salariés (le 5 pour les autres)." },
  { theme: "Analyse", question: "Le fonds de roulement net global se calcule ainsi :", choix: ["Actif circulant – dettes à court terme", "Ressources stables – emplois stables", "Stocks + créances – dettes fournisseurs", "Trésorerie active – trésorerie passive"], bonne: 1, explication: "FRNG = ressources stables – emplois stables (actif immobilisé brut dans l'approche fonctionnelle)." },
  { theme: "Analyse", question: "Le taux de marge se rapporte…", choix: ["Au prix de vente HT", "Au coût d'achat HT", "Au chiffre d'affaires TTC", "Au résultat net"], bonne: 1, explication: "Taux de marge = marge / coût d'achat. Le taux de marque, lui, rapporte la marge au prix de vente HT." },
  { theme: "Analyse", question: "Capacité d'autofinancement (méthode additive) : résultat net…", choix: ["+ dotations – reprises + VNC des actifs cédés – produits de cession (± QP subventions)", "– dotations + reprises", "+ impôts + charges financières", "+ dividendes versés"], bonne: 0, explication: "On part du résultat et on neutralise les éléments calculés (dotations/reprises) et les plus ou moins-values de cession." },
  { theme: "Déontologie", question: "La lettre de mission est-elle obligatoire pour l'expert-comptable ?", choix: ["Non, c'est une simple bonne pratique", "Oui, le code de déontologie l'impose", "Seulement pour les sociétés cotées", "Seulement au-delà de 10 000 € d'honoraires"], bonne: 1, explication: "Le code de déontologie des experts-comptables impose de passer avec le client un contrat écrit définissant la mission." },
  { theme: "Déontologie", question: "Un expert-comptable soupçonne un blanchiment chez {client}. À qui adresse-t-il sa déclaration de soupçon ?", choix: ["Au procureur", "À Tracfin", "Au client", "À l'administration fiscale"], bonne: 1, explication: "La déclaration de soupçon est adressée à Tracfin, et il est interdit d'en informer le client." },
];


// Questions supplémentaires (social, juridique, audit) pour les validations de missions.
QCM.push(
  { theme: "Social", question: "Quelle est la durée légale du travail hebdomadaire d'un salarié à temps plein chez {client} ?", choix: ["35 heures", "39 heures", "40 heures", "48 heures"], bonne: 0, explication: "La durée légale est de 35 heures par semaine ; au-delà, ce sont des heures supplémentaires. 48 h est la durée maximale absolue." },
  { theme: "Social", question: "Combien de jours ouvrables de congés payés un salarié de {client} acquiert-il par mois de travail effectif ?", choix: ["2 jours", "2,5 jours", "3 jours", "1,5 jour"], bonne: 1, explication: "2,5 jours ouvrables par mois, soit 30 jours ouvrables (5 semaines) par an." },
  { theme: "Social", question: "{client} embauche un salarié. Quand faut-il faire la DPAE ?", choix: ["Dans le mois qui suit l'embauche", "Avant l'embauche, au plus tôt 8 jours avant", "À la fin de la période d'essai", "Avec la première DSN seulement"], bonne: 1, explication: "La déclaration préalable à l'embauche se fait avant l'embauche, au plus tôt 8 jours avant la prise de poste." },
  { theme: "Social", question: "Durée maximale de la période d'essai initiale d'un cadre en CDI (hors accord plus court) ?", choix: ["2 mois", "3 mois", "4 mois", "6 mois"], bonne: 2, explication: "Code du travail : 2 mois pour les employés, 3 mois pour les agents de maîtrise et techniciens, 4 mois pour les cadres." },
  { theme: "Juridique", question: "Quel est le capital social minimum pour créer la SAS de {client} ?", choix: ["1 €", "37 000 €", "7 500 €", "15 000 €"], bonne: 0, explication: "Le capital d'une SAS est librement fixé par les statuts (1 € suffit). 37 000 € est le minimum d'une SA." },
  { theme: "Juridique", question: "Combien d'associés une SARL peut-elle compter au maximum ?", choix: ["50", "100", "Illimité", "7"], bonne: 1, explication: "Une SARL compte au plus 100 associés." },
  { theme: "Juridique", question: "Chez {client} (SARL), qui approuve les comptes annuels ?", choix: ["Le gérant seul", "L'expert-comptable", "L'assemblée des associés", "Le greffe"], bonne: 2, explication: "Les comptes sont arrêtés par le gérant puis approuvés par les associés en assemblée." },
  { theme: "Audit", question: "Quel niveau d'assurance le commissaire aux comptes de {client} exprime-t-il dans son rapport sur les comptes ?", choix: ["Une assurance absolue", "Une assurance raisonnable", "Aucune assurance", "Une assurance limitée au seul bilan"], bonne: 1, explication: "L'audit légal conduit à une assurance raisonnable (élevée mais non absolue) que les comptes ne comportent pas d'anomalies significatives." },
  { theme: "Audit", question: "Durée du mandat d'un commissaire aux comptes ?", choix: ["3 exercices", "6 exercices", "10 exercices", "1 exercice renouvelable"], bonne: 1, explication: "Le commissaire aux comptes est nommé pour six exercices." },
  { theme: "Audit", question: "À quoi sert le seuil de signification dans la mission d'audit de {client} ?", choix: ["À fixer les honoraires", "À apprécier le caractère significatif des anomalies", "À calculer l'impôt", "À choisir les associés"], bonne: 1, explication: "Le seuil de signification est le montant au-delà duquel une anomalie est jugée significative pour l'utilisateur des comptes ; il oriente l'étendue des travaux." },
);

export type QuestionOral = { question: string; attendus: string[] };

export const ORAL: QuestionOral[] = [
  { question: "Présentez votre mémoire en deux minutes.", attendus: ["Contexte et origine du sujet", "Problématique clairement formulée", "Intérêt pour la profession comptable", "Plan et démarche", "Apport pratique (outil, guide, méthode)"] },
  { question: "Quelle différence faites-vous entre une mission d'audit et une mission de présentation des comptes ?", attendus: ["Audit : opinion sur la régularité, la sincérité et l'image fidèle", "Assurance raisonnable en audit", "Présentation : attestation de cohérence et de vraisemblance", "Étendue des travaux bien moindre en présentation", "Cadre normatif différent (NEP / normes de l'Ordre)"] },
  { question: "Un client vous demande d'antidater une facture. Que faites-vous ?", attendus: ["Refus clair", "Rappel des principes d'intégrité et du code de déontologie", "Risque pénal (faux, complicité)", "Proposition d'une solution conforme si elle existe", "Traçabilité écrite et, si besoin, fin de la mission"] },
  { question: "Pourquoi la lettre de mission est-elle essentielle ?", attendus: ["Obligation déontologique", "Définit le périmètre et les limites de la mission", "Précise les obligations réciproques", "Fixe les honoraires et leurs modalités", "Protège en cas de mise en cause de la responsabilité"] },
  { question: "Quelles sont vos obligations en matière de lutte contre le blanchiment ?", attendus: ["Identification du client et du bénéficiaire effectif", "Évaluation des risques et vigilance adaptée", "Déclaration de soupçon à Tracfin", "Interdiction d'informer le client", "Conservation des documents (5 ans)"] },
  { question: "Qu'est-ce que l'image fidèle ?", attendus: ["Objectif des comptes annuels (Code de commerce)", "Respect des règles comptables comme moyen", "Possibilité de déroger en cas exceptionnel avec justification en annexe", "Lien avec régularité et sincérité", "Information complémentaire dans l'annexe si nécessaire"] },
  { question: "Comment appréciez-vous la continuité d'exploitation d'un client ?", attendus: ["Analyse de la trésorerie prévisionnelle sur 12 mois", "Indicateurs : capitaux propres, pertes répétées, dettes échues", "Échanges avec le dirigeant sur ses plans", "Conséquences sur les comptes et l'annexe", "Procédure d'alerte s'il y a un commissaire aux comptes"] },
  { question: "Différence entre une provision et une dépréciation ?", attendus: ["Provision : passif dont l'échéance ou le montant est incertain", "Dépréciation : constat de perte de valeur d'un actif", "Comptes concernés (15x vs 29x, 39x, 49x)", "Conditions de déductibilité fiscale", "Reprise quand le risque disparaît"] },
  { question: "En quoi votre mémoire est-il utile à un cabinet comme le nôtre ?", attendus: ["Problème concret de cabinet identifié", "Solution opérationnelle proposée", "Mise en œuvre réaliste (temps, coût)", "Mesure des résultats", "Généralisation possible à d'autres cabinets"] },
  { question: "Comment gérez-vous un conflit d'intérêts ?", attendus: ["Identification préalable des situations à risque", "Principe d'indépendance et d'objectivité", "Information des parties concernées", "Mesures de sauvegarde ou refus de la mission", "Documentation dans le dossier"] },
];

export type Badge = { id: string; nom: string; description: string; icone: string };

export const BADGES: Badge[] = [
  { id: "premier_livre", nom: "Premier livrable", description: "Livrer un premier dossier", icone: "📦" },
  { id: "marathon", nom: "Marathon", description: "Livrer 10 dossiers", icone: "🏃" },
  { id: "boss_tva", nom: "Dompteuse de TVA", description: "Gagner une échéance TVA", icone: "🧾" },
  { id: "boss_dsn", nom: "Maîtresse de la paie", description: "Gagner une échéance DSN", icone: "💶" },
  { id: "boss_liasse", nom: "Liasse vaincue", description: "Gagner l'échéance de la liasse fiscale", icone: "🐉" },
  { id: "boss_ag", nom: "Approbation", description: "Gagner l'échéance d'approbation des comptes", icone: "🏛️" },
  { id: "qcm_parfait", nom: "Sans faute", description: "Obtenir 10/10 au QCM blanc", icone: "🎯" },
  { id: "qcm_5", nom: "Assidue", description: "Passer 5 QCM blancs", icone: "📚" },
  { id: "oral_80", nom: "Jury conquis", description: "Obtenir au moins 80 % à un oral blanc", icone: "🎤" },
  { id: "recrutement", nom: "Recruteuse", description: "Recruter un premier collaborateur", icone: "🤝" },
  { id: "pedagogue", nom: "Mentor", description: "Répondre 5 fois en mode Pédagogue", icone: "🧑‍🏫" },
  { id: "ferme", nom: "Main de fer", description: "Répondre 5 fois en mode Ferme", icone: "🛡️" },
  { id: "zen", nom: "Cabinet zen", description: "Atteindre un mood global de 80", icone: "🌿" },
  { id: "tresor", nom: "Trésor de guerre", description: "Atteindre 60 000 € de trésorerie", icone: "💰" },
  { id: "reputation", nom: "Réputation en or", description: "Atteindre 85 de réputation", icone: "⭐" },
  { id: "integre", nom: "Intègre", description: "Choisir 3 fois l'option déontologique d'un dilemme", icone: "⚖️" },
  { id: "qualite", nom: "Contrôle réussi", description: "Obtenir « Satisfaisant » au contrôle qualité de l'Ordre", icone: "🏛️" },
  { id: "batisseuse", nom: "Bâtisseuse", description: "Atteindre le cabinet premium", icone: "🏗️" },
  { id: "numero1", nom: "N°1 régional", description: "Prendre la tête du classement régional", icone: "🥇" },
  { id: "diplomee", nom: "Expert-comptable", description: "Réussir la soutenance du mémoire", icone: "🎓" },
  { id: "prix", nom: "Cabinet de l'année", description: "Recevoir le prix du cabinet de l'année", icone: "🏆" },
  { id: "cas_10", nom: "Réviseuse", description: "Résoudre 10 cas pratiques", icone: "🧮" },
];

import type { OptionDilemme } from "@/lib/types";

// Dilemmes : 3 options, une conséquence immédiate et une conséquence
// différée invisible (révélée plus tard dans le journal).

export type ModeleDilemme = { titre: string; texte: string; options: OptionDilemme[] };

export const DILEMMES: ModeleDilemme[] = [
  {
    titre: "La facture antidatée",
    texte: "{client} te demande d'enregistrer une facture datée de décembre alors qu'elle a été émise en janvier, « pour passer la charge sur l'exercice ».",
    options: [
      { label: "Refuser net et l'expliquer par écrit", cout: 1, effets: { satisfactionClient: -10, reputation: 3 }, differe: { delai: 8, effets: { reputation: 4 }, texte: "{client} a raconté à un confrère que tu avais refusé l'antidatage : ta réputation de rigueur circule." }, resultat: "Le client grogne, mais ton dossier est propre." },
      { label: "Proposer une solution légale (charge à payer si le service a été rendu en N)", cout: 2, effets: { satisfactionClient: 5, reputation: 2 }, differe: { delai: 10, effets: { satisfactionClient: 8 }, texte: "{client} a compris la différence entre antidater et rattacher une charge à payer. Il te fait davantage confiance." }, resultat: "Tu transformes une demande illégale en leçon de comptabilité d'engagement." },
      { label: "Laisser passer « pour cette fois »", cout: 0, effets: { satisfactionClient: 10 }, differe: { delai: 12, effets: { reputation: -15, tresorerie: -4000 }, texte: "Contrôle fiscal chez {client} : la facture antidatée est découverte. Le cabinet est mis en cause et doit dédommager le client." }, resultat: "Le client est ravi… pour l'instant." },
    ],
  },
  {
    titre: "Le dossier de dernière minute",
    texte: "{client} arrive avec un dossier complet à boucler en 48 heures, alors que l'équipe est déjà en surcharge.",
    options: [
      { label: "Accepter et majorer les honoraires", cout: 1, effets: { tresorerie: 2500, stressEquipe: 12 }, differe: { delai: 5, effets: { moralEquipe: -6 }, texte: "Le rush pour {client} a laissé des traces : l'équipe est fatiguée." }, resultat: "Rentrée d'argent immédiate, équipe sous tension." },
      { label: "Refuser poliment", cout: 0, effets: { satisfactionClient: -12 }, differe: { delai: 6, effets: { moralEquipe: 5 }, texte: "L'équipe a apprécié que tu protèges sa charge de travail." }, resultat: "Le client est déçu, l'équipe respire." },
      { label: "Accepter et le traiter toi-même le soir", cout: 2, effets: { tresorerie: 1800, satisfactionClient: 8 }, differe: { delai: 4, effets: { moralEquipe: -3, reputation: 3 }, texte: "Tu as bouclé le dossier de {client} seule. Le client est bluffé, mais l'équipe se demande si tu leur fais confiance." }, resultat: "Tu sacrifies ta soirée." },
    ],
  },
  {
    titre: "L'erreur de saisie",
    texte: "Une erreur de saisie de {agent} a faussé la TVA déclarée de {client} le mois dernier.",
    options: [
      { label: "Corriger, informer le client, débriefer avec {agent}", cout: 1, effets: { satisfactionClient: -5, competenceAgent: 6, confianceAgent: 6 }, differe: { delai: 7, effets: { competenceAgent: 4 }, texte: "{agent} ne refait plus jamais cette erreur et forme même les autres dessus." }, resultat: "Transparence totale : c'est la bonne pratique." },
      { label: "Corriger discrètement sur la prochaine déclaration", cout: 0, effets: {}, differe: { delai: 9, effets: { reputation: -8, satisfactionClient: -15 }, texte: "{client} a découvert la correction discrète et se sent trahi." }, resultat: "Personne ne sait rien… pour le moment." },
      { label: "Retirer le dossier à {agent}", cout: 1, effets: { confianceAgent: -15, stressAgent: 15 }, differe: { delai: 6, effets: { moralEquipe: -5 }, texte: "L'équipe a trouvé la sanction contre {agent} trop dure." }, resultat: "Le message est clair, mais il blesse." },
    ],
  },
  {
    titre: "Le cadeau du client",
    texte: "{client} offre une montre de valeur à {agent} pour le remercier, juste avant la négociation des honoraires.",
    options: [
      { label: "Faire rendre le cadeau et rappeler la règle d'indépendance", cout: 1, effets: { reputation: 3, confianceAgent: -4 }, differe: { delai: 8, effets: { reputation: 3 }, texte: "La règle sur les cadeaux est désormais affichée en salle de pause. Ton cabinet gagne en sérieux." }, resultat: "Indépendance préservée." },
      { label: "Accepter mais le déclarer et le partager avec l'équipe", cout: 0, effets: { moralEquipe: 4 }, differe: { delai: 10, effets: { satisfactionClient: -6 }, texte: "{client} a cru que ses honoraires seraient « arrangés ». Il est déçu de la facture." }, resultat: "Ambiance sympa, zone grise." },
      { label: "Fermer les yeux", cout: 0, effets: { confianceAgent: 5 }, differe: { delai: 12, effets: { reputation: -10 }, texte: "Un confrère a appris l'histoire de la montre. Ça fait jaser." }, resultat: "Rien ne se passe. Pour l'instant." },
    ],
  },
  {
    titre: "Le client qui ne paie pas",
    texte: "{client} a trois factures d'honoraires impayées et demande de lancer la paie du mois.",
    options: [
      { label: "Suspendre la mission jusqu'au règlement", cout: 1, effets: { tresorerie: 1500, satisfactionClient: -15 }, differe: { delai: 6, effets: { tresorerie: 2000 }, texte: "{client} a fini par régler le solde de ses factures." }, resultat: "Fermeté : le client règle une partie." },
      { label: "Faire la paie et mettre en place un échéancier", cout: 1, effets: { satisfactionClient: 6 }, differe: { delai: 10, effets: { tresorerie: 3000 }, texte: "L'échéancier de {client} est respecté. Trésorerie soulagée." }, resultat: "Solution négociée." },
      { label: "Continuer comme si de rien n'était", cout: 0, effets: { satisfactionClient: 4 }, differe: { delai: 14, effets: { tresorerie: -3500 }, texte: "{client} est en redressement judiciaire. Tes honoraires impayés sont perdus." }, resultat: "Tu évites le conflit." },
    ],
  },
  {
    titre: "Le soupçon",
    texte: "En révisant {client}, {agent} repère des espèces importantes déposées sans justificatif, toujours juste sous les seuils.",
    options: [
      { label: "Demander des justificatifs, documenter et envisager une déclaration de soupçon", cout: 2, effets: { reputation: 4, satisfactionClient: -10 }, differe: { delai: 10, effets: { reputation: 5 }, texte: "Ta vigilance LCB-FT sur {client} a été saluée lors du contrôle qualité de l'Ordre." }, resultat: "Tu appliques tes obligations de vigilance." },
      { label: "Demander simplement une explication au client", cout: 1, effets: {}, differe: { delai: 8, effets: { reputation: -4 }, texte: "L'explication de {client} était bancale et rien n'a été documenté. Le contrôle qualité te le reproche." }, resultat: "Demi-mesure." },
      { label: "Ignorer, ce n'est pas ton problème", cout: 0, effets: { satisfactionClient: 5 }, differe: { delai: 15, effets: { reputation: -20, tresorerie: -5000 }, texte: "Enquête sur {client} : le cabinet est sanctionné pour défaut de vigilance." }, resultat: "Tu détournes le regard." },
    ],
  },
  {
    titre: "Le télétravail",
    texte: "Plusieurs collaborateurs demandent deux jours de télétravail par semaine, en pleine saison des bilans.",
    options: [
      { label: "Accepter, sauf la semaine de la liasse", cout: 1, effets: { moralEquipe: 8 }, differe: { delai: 10, effets: { moralEquipe: 4 }, texte: "Le télétravail encadré plaît : l'équipe se sent respectée." }, resultat: "Compromis apprécié." },
      { label: "Refuser jusqu'à fin mai", cout: 0, effets: { moralEquipe: -8, stressEquipe: 4 }, differe: { delai: 9, effets: { moralEquipe: -4 }, texte: "La frustration sur le télétravail continue de peser." }, resultat: "Tension dans l'open space." },
      { label: "Accepter sans condition", cout: 0, effets: { moralEquipe: 12 }, differe: { delai: 7, effets: { stressEquipe: 8 }, texte: "Sans cadre, la coordination s'est dégradée. Des dossiers ont glissé." }, resultat: "Grande joie… et un peu de désorganisation." },
    ],
  },
  {
    titre: "L'optimisation agressive",
    texte: "{client} veut un montage pour ne quasiment plus payer d'impôt, trouvé « sur un forum ».",
    options: [
      { label: "Refuser et proposer des leviers légaux (amortissements, rémunération du dirigeant)", cout: 1, effets: { satisfactionClient: 4, reputation: 2 }, differe: { delai: 10, effets: { tresorerie: 1500 }, texte: "{client} a commandé une mission de conseil sur sa rémunération. Honoraires en plus !" }, resultat: "Conseil sain et facturable." },
      { label: "Mettre en œuvre le montage", cout: 1, effets: { satisfactionClient: 12, tresorerie: 2000 }, differe: { delai: 14, effets: { reputation: -18, satisfactionClient: -30 }, texte: "Le montage de {client} est requalifié en abus de droit. Pénalités lourdes et client furieux." }, resultat: "Le client est aux anges." },
      { label: "Le renvoyer vers un avocat fiscaliste", cout: 0, effets: { satisfactionClient: -3 }, differe: { delai: 8, effets: { reputation: 2 }, texte: "L'avocat a déconseillé le montage à {client}. Il apprécie ta prudence." }, resultat: "Tu restes dans ton périmètre." },
    ],
  },
  {
    titre: "La promotion",
    texte: "Un poste de senior se libère. {agent} le veut, mais sa rivalité avec un collègue risque d'exploser.",
    options: [
      { label: "Promouvoir {agent} avec une augmentation", cout: 1, effets: { confianceAgent: 15, tresorerie: -1200, stressEquipe: 4 }, differe: { delai: 8, effets: { moralEquipe: -4 }, texte: "La promotion de {agent} a créé des jalousies." }, resultat: "{agent} est ravi·e." },
      { label: "Ouvrir un entretien pour tout le monde", cout: 2, effets: { moralEquipe: 5 }, differe: { delai: 9, effets: { moralEquipe: 4 }, texte: "Le processus transparent de promotion a rassuré l'équipe." }, resultat: "Processus équitable, plus long." },
      { label: "Reporter la décision", cout: 0, effets: { confianceAgent: -10 }, differe: { delai: 7, effets: { confianceAgent: -8 }, texte: "{agent} a l'impression d'être ignoré·e." }, resultat: "Tu gagnes du temps." },
    ],
  },
  {
    titre: "Le logiciel miracle",
    texte: "Un éditeur propose un outil de saisie automatique des factures : 3 000 € la première année.",
    options: [
      { label: "L'acheter et former l'équipe", cout: 1, effets: { tresorerie: -3000, stressEquipe: 5 }, differe: { delai: 10, effets: { moralEquipe: 6, stressEquipe: -10 }, texte: "La saisie automatique fait gagner des heures à toute l'équipe." }, resultat: "Investissement lancé." },
      { label: "Faire un test sur un seul client", cout: 1, effets: { tresorerie: -500 }, differe: { delai: 8, effets: { moralEquipe: 3 }, texte: "Le test du logiciel est concluant. L'équipe est curieuse." }, resultat: "Prudence." },
      { label: "Refuser", cout: 0, effets: {}, differe: { delai: 10, effets: { moralEquipe: -3 }, texte: "Les plus jeunes trouvent que le cabinet manque de modernité." }, resultat: "On garde nos habitudes." },
    ],
  },
];

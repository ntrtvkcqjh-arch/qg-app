import type { Niveau, Personnalite } from "@/lib/types";

// Banque de messages écrits à l'avance (aucune API). {client}, {dossier},
// {collegue}, {jours} sont remplacés au moment de l'envoi.

export type ModeleMessage = {
  theme: string;
  niveau: Niveau;
  sujet: string;
  textes: string[]; // variantes neutres
  parPerso?: Partial<Record<Personnalite, string[]>>; // variantes selon la personnalité
  conseil: string; // phrase pédagogique utilisée par le Ghost Writer (version Pédagogue)
};

export const MODELES: Record<string, ModeleMessage> = {
  pieces: {
    theme: "pieces",
    niveau: 2,
    sujet: "Pièces manquantes — {client}",
    textes: [
      "J'ai relancé {client} deux fois pour les relevés bancaires de décembre. Toujours rien. J'ai avancé ce que je pouvais sur {dossier} mais je suis bloqué·e au rapprochement.",
      "Il manque les factures d'achat du 4e trimestre chez {client}. J'ai déjà fait la liste des pièces manquantes et je l'ai mise dans le dossier permanent.",
    ],
    parPerso: {
      anxieux: ["Désolé·e de te déranger… {client} ne m'a toujours pas envoyé les pièces pour {dossier}. J'ai peur qu'on soit en retard, j'ai déjà relancé deux fois, je ne sais pas si je dois insister."],
      nonchalant: ["{client} n'a pas envoyé ses pièces. Du coup {dossier} attend. On verra bien."],
      rebelle: ["Franchement {client} se moque de nous. Troisième relance pour {dossier}. Si tu ne les appelles pas toi, moi j'arrête de relancer."],
    },
    conseil: "Rappelle-toi qu'on ne peut pas certifier ce qu'on n'a pas vu : sans relevé, pas de rapprochement bancaire, et la lettre de mission prévoit justement les obligations du client.",
  },
  revision: {
    theme: "revision",
    niveau: 2,
    sujet: "{dossier} prêt pour ta revue",
    textes: [
      "J'ai terminé la révision de {dossier}. Les cycles achats, ventes et trésorerie sont justifiés, j'ai noté deux points d'attention dans la note de synthèse. Il me faut ta validation pour passer à la finalisation.",
      "{dossier} : révision bouclée. J'ai déjà préparé le dossier de travail et les feuilles maîtresses. Tu peux valider ?",
    ],
    parPerso: {
      perfectionniste: ["{dossier} : révision terminée. J'ai tout recoupé trois fois, y compris les comptes d'attente soldés à zéro. Il me manque juste ta validation, et je préfère que tu jettes un œil aux provisions."],
      ambitieux: ["{dossier} bouclé, en avance. J'ai même proposé au client une optimisation sur ses amortissements. Tu valides ? J'aimerais en parler au prochain point."],
    },
    conseil: "Pour valider une révision, vérifie la cohérence globale (variations N/N-1), les comptes d'attente soldés et la justification des postes significatifs : c'est la logique de seuil de signification.",
  },
  surcharge: {
    theme: "surcharge",
    niveau: 3,
    sujet: "Charge de travail",
    textes: ["J'ai {jours} dossiers qui tombent cette semaine. J'ai déjà décalé mes points clients non urgents mais je ne tiendrai pas tout."],
    parPerso: {
      anxieux: ["Je n'arrive plus à suivre… {jours} échéances cette semaine. Je reste tard tous les soirs, j'ai l'impression de mal faire mon travail."],
      ambitieux: ["J'ai {jours} dossiers en parallèle. Je peux tout faire, mais il me faudrait quelqu'un pour la saisie. Je propose que {collegue} m'aide."],
      rebelle: ["{jours} dossiers en même temps, c'est n'importe quoi. Il faut revoir la répartition, sinon ça va casser."],
    },
    conseil: "Prioriser selon les échéances légales et le risque : les obligations déclaratives (TVA, DSN, liasse) passent avant le conseil, car leur retard entraîne des majorations.",
  },
  erreur: {
    theme: "erreur",
    niveau: 4,
    sujet: "J'ai fait une erreur sur {dossier}",
    textes: ["En reprenant {dossier}, je me suis rendu compte que j'ai passé une facture d'immobilisation en charges. J'ai déjà corrigé l'écriture mais le prévisionnel envoyé au client était faux."],
    parPerso: {
      perfectionniste: ["Je n'en dors pas : sur {dossier} j'ai oublié de rattacher une facture à recevoir (FNP) au bon exercice. J'ai corrigé, mais le résultat provisoire envoyé était surévalué."],
      nonchalant: ["Petit souci sur {dossier} : la TVA déductible était en double. C'est corrigé normalement."],
    },
    conseil: "Une erreur se traite en trois temps : corriger l'écriture, mesurer l'impact sur les comptes et informer le client si un document déjà transmis est faux. C'est l'exigence d'intégrité du code de déontologie.",
  },
  conflit: {
    theme: "conflit",
    niveau: 3,
    sujet: "Problème avec {collegue}",
    textes: ["Je préfère te le dire directement : {collegue} a repris un de mes dossiers sans me prévenir. Ça devient compliqué de travailler ensemble."],
    parPerso: {
      rebelle: ["{collegue} passe son temps à critiquer mon travail devant tout le monde. Soit ça s'arrête, soit je règle ça moi-même."],
      ambitieux: ["{collegue} s'est attribué tout le mérite du dossier de la semaine dernière. Je voulais que tu le saches."],
    },
    conseil: "Un conflit dans l'équipe a un coût direct sur la qualité : la norme de maîtrise de la qualité du cabinet impose une supervision claire et une répartition des dossiers documentée.",
  },
  client_colere: {
    theme: "client_colere",
    niveau: 4,
    sujet: "{client} est furieux",
    textes: ["{client} vient d'appeler, très remonté : il trouve qu'on est trop lents sur {dossier} et menace de changer de cabinet. Je lui ai dit que tu le rappellerais."],
    conseil: "Face à un client mécontent : écouter, reformuler, rappeler le périmètre de la lettre de mission et fixer un calendrier écrit. Un changement de cabinet impose d'ailleurs au nouveau confrère de prendre contact avec nous.",
  },
  conge: {
    theme: "conge",
    niveau: 2,
    sujet: "Demande de congés",
    textes: ["J'aimerais poser trois jours la semaine prochaine. Mes dossiers sont à jour, j'ai laissé une note de passation à {collegue}."],
    parPerso: {
      anxieux: ["Est-ce que je pourrais prendre trois jours ? Je suis vraiment épuisé·e. Mais si ce n'est pas le moment, je comprends…"],
    },
    conseil: "Les congés se planifient en fonction des pics déclaratifs : on évite la période liasse (mai) et on organise une passation écrite pour assurer la continuité des missions.",
  },
  augmentation: {
    theme: "augmentation",
    niveau: 3,
    sujet: "Ma rémunération",
    textes: ["Ça fait un moment que je n'ai pas été augmenté·e. J'ai repris des dossiers importants cette année. Est-ce qu'on peut en parler ?"],
    parPerso: {
      ambitieux: ["J'ai reçu une proposition d'un autre cabinet. Je préfère rester, mais il faudrait qu'on revoie mon salaire."],
    },
    conseil: "Une revalorisation se justifie par des éléments objectifs : autonomie, complexité des dossiers suivis, taux de récupération des honoraires. C'est aussi un outil de fidélisation dans une profession en tension.",
  },
  conseil_tech: {
    theme: "conseil_tech",
    niveau: 2,
    sujet: "Question technique — {dossier}",
    textes: [
      "Sur {dossier}, le client a acheté un ordinateur à 450 € HT. Je l'ai passé en charges directement, c'est bon ?",
      "Pour {dossier}, une facture de décembre est arrivée en janvier. Je l'ai rattachée à N via une facture non parvenue (408). Tu confirmes ?",
      "Sur {dossier}, le client a payé l'assurance annuelle le 1er octobre. J'ai constaté 9 mois en charges constatées d'avance (486), ça te va ?",
    ],
    conseil: "Petit rappel : un matériel de faible valeur (moins de 500 € HT) peut être passé en charges ; une charge de N facturée en N+1 se rattache par une FNP (408) ; une charge payée d'avance se neutralise en charges constatées d'avance (486).",
  },
  rumeur: {
    theme: "rumeur",
    niveau: 1,
    sujet: "Bruit de couloir",
    textes: [
      "Paraît que {collegue} a passé une heure à la machine à café à se plaindre des dossiers de mai. L'ambiance est un peu tendue.",
      "Rumeur du jour : {collegue} aurait un entretien dans un autre cabinet. Je dis ça, je dis rien.",
      "À la pause, tout le monde parlait de la liasse. Certains ont peur de ne pas tenir.",
    ],
    conseil: "L'ambiance se pilote : un point d'équipe hebdomadaire et une répartition transparente des dossiers coupent court à la plupart des rumeurs.",
  },
  merci: {
    theme: "merci",
    niveau: 1,
    sujet: "Merci",
    textes: ["Merci pour ton aide sur {dossier}, ça m'a débloqué·e.", "Juste pour te dire : l'organisation de cette semaine est vraiment plus claire. Merci."],
    conseil: "La reconnaissance fait partie du management : elle renforce la confiance et la rétention.",
  },
  demission: {
    theme: "demission",
    niveau: 5,
    sujet: "Je pense partir",
    textes: ["Je préfère être honnête : je ne me sens plus à ma place ici. Je réfléchis sérieusement à démissionner. J'aimerais qu'on en parle avant que je prenne ma décision."],
    conseil: "Un départ coûte cher (recrutement, perte de connaissance des dossiers). L'entretien de rétention porte sur la charge, la reconnaissance et les perspectives, pas seulement sur le salaire.",
  },
  controle: {
    theme: "controle",
    niveau: 5,
    sujet: "{client} : avis de vérification fiscale",
    textes: ["{client} vient de recevoir un avis de vérification de comptabilité. Le dirigeant panique et veut que tu le rappelles aujourd'hui. Il faudra préparer le FEC et les justificatifs."],
    conseil: "En cas de contrôle : l'avis de vérification ouvre droit à l'assistance d'un conseil, le FEC doit être remis dès le début des opérations, et le délai de reprise de droit commun est de trois ans.",
  },
  prospect: {
    theme: "prospect",
    niveau: 2,
    sujet: "Nouveau prospect",
    textes: ["Un prospect est passé à l'accueil : {client} cherche un nouveau cabinet. Je peux préparer une lettre de mission si tu es d'accord."],
    conseil: "Avant d'accepter une mission : vérifier l'identité du client et du bénéficiaire effectif (vigilance LCB-FT), contacter le confrère précédent et signer une lettre de mission.",
  },
};

/** Conseils pédagogiques généraux si le thème n'en a pas. */
export const CONSEIL_DEFAUT = "Garde une trace écrite de chaque décision dans le dossier de travail : c'est la base de la démarche qualité du cabinet.";

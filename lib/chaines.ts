// Cas en plusieurs étapes : missions expertes (évaluation, due diligence,
// commissariat aux comptes, consolidation, transmission, procédure
// collective, création, fraude, international…), crises du cabinet et
// dossiers RH sensibles. Chaque étape est une décision ; le score final
// décide de l'issue. Contenu original, inspiré du programme du DEC.

import { jourDe } from "@/lib/calendrier";
import { messageSpecial } from "@/lib/ext";
import { clamp, depart, log, pick, rnd, uid } from "@/lib/moteur";
import { souvenir } from "@/lib/vie2";
import { noterClient } from "@/lib/vie3";
import type { Agent, Etat, OptionDilemme } from "@/lib/types";

type Ctx = { client?: string; agent?: string; montant?: number };
type Etape = { titre: string; texte: (e: Etat, x: Ctx) => string; options: [string, number][] };
type Fin = (e: Etat, r: number, x: Ctx) => void; // r = score / score max (0 à 1)
type Def = { emoji: string; nom: string; etapes: Etape[]; fin: Fin; besoin?: "client" | "agent" | "rien"; honoraires?: number };

const euros = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;
const cl = (e: Etat, x: Ctx) => e.clients.find((c) => c.id === x.client);
const ag = (e: Etat, x: Ctx) => e.agents.find((a) => a.id === x.agent);
const nomC = (e: Etat, x: Ctx) => cl(e, x)?.nom ?? "le client";
const dir = (e: Etat, x: Ctx) => cl(e, x)?.dirigeant ?? "le dirigeant";
const prenom = (e: Etat, x: Ctx) => ag(e, x)?.prenom ?? "ton collaborateur";

/** Issue standard d'une mission client : honoraires, satisfaction, niveau DEC. */
function finMission(nom: string, honoraires: number): Fin {
  return (e, r, x) => {
    const c = cl(e, x);
    const h = Math.round((honoraires * (0.6 + r * 0.6)) / 50) * 50;
    e.tresorerie += h;
    e.periode.ca += h;
    e.niveauDec = clamp(e.niveauDec + r * 4);
    if (c) {
      c.satisfaction = clamp(c.satisfaction + (r >= 0.8 ? 15 : r >= 0.5 ? 5 : -12));
      noterClient(c, jourDe(e.minute), `${nom} : livrable noté ${Math.round(8 + r * 12)}/20 par le client.`);
    }
    log(e, `📁 ${nom} pour ${c?.nom ?? "un client"} : livrable noté ${Math.round(8 + r * 12)}/20, ${euros(h)} d'honoraires.`, r >= 0.5 ? "bien" : "mal");
    if (r === 1) souvenir(e, "📁", `${nom} parfaite pour ${c?.nom ?? "un client"}`);
  };
}

export const CHAINES: Record<string, Def> = {
  // ---------- missions de conseil ----------
  evaluation: {
    emoji: "📊",
    nom: "Évaluation d'entreprise",
    besoin: "client",
    honoraires: 6000,
    etapes: [
      { titre: "Choix des méthodes", texte: (e, x) => `${dir(e, x)} veut connaître la valeur de ${nomC(e, x)} avant de faire entrer un associé. Quelles méthodes retiens-tu ?`, options: [["Uniquement l'actif net comptable", 0], ["Une approche multicritère : multiples d'EBE de sociétés comparables et flux de trésorerie actualisés (DCF), avec l'actif net réévalué en contrôle", 2], ["Le chiffre d'affaires multiplié par un coefficient « de place »", -1]] },
      { titre: "Retraitements", texte: () => "L'EBE affiché est de 420 000 €. Le dirigeant se verse 30 000 € par an, loin d'un salaire de marché, et un produit exceptionnel de 60 000 € est inclus. Que fais-tu ?", options: [["On garde 420 000 €, c'est le chiffre comptable", -1], ["Normaliser : rémunération du dirigeant au prix du marché et exclusion du produit non récurrent", 2], ["On retire seulement le produit exceptionnel", 1]] },
      { titre: "Passage à la valeur des titres", texte: () => "Tu obtiens une valeur d'entreprise. Comment passes-tu à la valeur des titres ?", options: [["Valeur d'entreprise − dette financière nette (y compris les dettes assimilées)", 2], ["Valeur d'entreprise + trésorerie, sans regarder les dettes", -1], ["Valeur d'entreprise = valeur des titres", 0]] },
    ],
    fin: finMission("Évaluation d'entreprise", 6000),
  },
  holding: {
    emoji: "🏛️",
    nom: "Montage de holding",
    besoin: "client",
    honoraires: 5000,
    etapes: [
      { titre: "Objectif du dirigeant", texte: (e, x) => `${dir(e, x)} veut racheter les parts de son associé (40 %) sans tout payer de sa poche. Quelle structure proposes-tu ?`, options: [["Une holding de reprise qui emprunte et rachète les titres, la dette étant remboursée par les dividendes de la cible", 2], ["Un prêt personnel au nom du dirigeant", 0], ["Faire racheter ses propres titres par la société, sans formalité", -1]] },
      { titre: "Régime fiscal", texte: () => "La holding détiendra 100 % de la cible. Comment optimiser la remontée des résultats ?", options: [["Régime mère-fille, voire intégration fiscale (détention d'au moins 95 %) pour imputer les intérêts sur les bénéfices de la cible", 2], ["Faire payer à la cible des honoraires de gestion sans prestation réelle", -2], ["Aucun régime particulier", 0]] },
      { titre: "Point de vigilance", texte: () => "Le dirigeant contrôle déjà la cible et veut la racheter via sa holding. Quel risque fiscal signales-tu ?", options: [["L'amendement Charasse : une partie des charges financières peut être réintégrée", 2], ["Aucun risque", -1], ["Le risque de perte du statut de SAS", 0]] },
    ],
    fin: finMission("Montage de holding", 5000),
  },
  due_diligence: {
    emoji: "🔬",
    nom: "Due diligence pour un fonds",
    besoin: "rien",
    honoraires: 18000,
    etapes: [
      { titre: "EBITDA normatif", texte: () => "Le fonds Altis Capital te mandate pour une due diligence financière sur une PME industrielle (CA 25 M€) qu'il veut racheter. L'EBITDA présenté par le vendeur est de 3,2 M€. Par quoi commences-tu ?", options: [["Reprendre l'EBITDA tel quel, c'est celui du business plan", -1], ["Analyser la qualité des résultats : éléments non récurrents, rémunérations normatives, effets des changements de méthode", 2], ["Vérifier seulement le chiffre d'affaires", 0]] },
      { titre: "Dette nette", texte: () => "Le vendeur annonce 4 M€ de dette financière. Tu découvres de l'affacturage, du crédit-bail et des dettes fiscales anciennes. Que fais-tu ?", options: [["Les intégrer comme éléments assimilés à de la dette dans le passage valeur d'entreprise / prix des titres", 2], ["Les ignorer : elles ne sont pas au poste « emprunts »", -2], ["Les mentionner en annexe sans les chiffrer", 0]] },
      { titre: "BFR et risques", texte: () => "Le BFR au 31/12 est anormalement bas et 45 % du CA vient d'un seul client. Ta conclusion pour le fonds ?", options: [["Calculer un BFR normatif (moyenne mensuelle) pour l'ajustement de prix, et signaler la dépendance client comme risque majeur", 2], ["Tout va bien, le BFR est bas", -1], ["Recommander d'abandonner le deal sans chiffrer", 0]] },
    ],
    fin: (e, r) => {
      const h = Math.round(18000 * (0.6 + r * 0.6));
      e.tresorerie += h;
      e.periode.ca += h;
      e.reputation = clamp(e.reputation + r * 6);
      e.niveauDec = clamp(e.niveauDec + r * 4);
      log(e, `🔬 Due diligence remise au fonds Altis Capital : ${r >= 0.8 ? "rapport salué, le fonds renégocie le prix de 2,4 M€ grâce à toi" : r >= 0.5 ? "rapport correct" : "le fonds juge le rapport superficiel"}. ${euros(h)} d'honoraires.`, r >= 0.5 ? "bien" : "mal");
      if (r >= 0.8) {
        souvenir(e, "🔬", "Première due diligence pour un fonds de Private Equity");
        e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + 2;
      }
    },
  },
  cac: {
    emoji: "🧾",
    nom: "Commissariat aux comptes",
    besoin: "client",
    honoraires: 12000,
    etapes: [
      { titre: "Planification", texte: (e, x) => `Mandat de commissaire aux comptes chez ${nomC(e, x)}. Comment démarres-tu ?`, options: [["Prise de connaissance de l'entité, évaluation des risques et fixation du seuil de signification", 2], ["Pointer directement toutes les factures de l'exercice", -1], ["Reprendre le dossier de l'expert-comptable du client", 0]] },
      { titre: "Contrôle interne et échantillonnage", texte: () => "Le cycle ventes repose sur un logiciel avec des contrôles automatiques fiables. Quelle approche ?", options: [["Tester l'efficacité des contrôles, puis réduire les contrôles de substance par sondage", 2], ["Tout contrôler à 100 %", 0], ["Ne rien contrôler, le logiciel est fiable", -2]] },
      { titre: "Opinion", texte: () => "La direction refuse de comptabiliser une provision pour litige probable de 180 000 € (seuil de signification : 100 000 €). L'anomalie est significative mais limitée à ce poste. Ton opinion ?", options: [["Certification sans réserve", -2], ["Certification avec réserve pour désaccord", 2], ["Refus de certifier", 0]] },
    ],
    fin: finMission("Mission de commissariat aux comptes", 12000),
  },
  consolidation: {
    emoji: "🧩",
    nom: "Consolidation de groupe",
    besoin: "client",
    honoraires: 9000,
    etapes: [
      { titre: "Périmètre", texte: (e, x) => `${nomC(e, x)} détient 80 % de la filiale A, 50 % de B avec un autre groupe (décisions à l'unanimité) et 30 % de C. Quelles méthodes (règles françaises) ?`, options: [["A en intégration globale, B en intégration proportionnelle, C en mise en équivalence", 2], ["Tout en intégration globale", -1], ["A et B en intégration globale, C hors périmètre", 0]] },
      { titre: "Opérations intragroupe", texte: () => "A vend des marchandises à B avec une marge, et une partie est encore en stock chez B. Que fais-tu ?", options: [["Rien, ce sont des sociétés différentes", -2], ["Éliminer les ventes et achats réciproques et la marge interne en stock", 2], ["Éliminer seulement les créances et dettes", 0]] },
      { titre: "Dividendes", texte: () => "A a versé un dividende à la mère. Traitement en consolidation ?", options: [["Éliminer le dividende du résultat de la mère et le réaffecter en réserves", 2], ["Le garder en produit financier consolidé", -1], ["Le déduire du chiffre d'affaires", 0]] },
    ],
    fin: finMission("Comptes consolidés", 9000),
  },
  transmission: {
    emoji: "👨‍👧",
    nom: "Transmission d'entreprise",
    besoin: "client",
    honoraires: 7000,
    etapes: [
      { titre: "Le projet", texte: (e, x) => `${dir(e, x)} (64 ans) veut transmettre ${nomC(e, x)} à sa fille, déjà directrice commerciale. Quelle piste en priorité ?`, options: [["Donation des titres avec un pacte Dutreil (exonération de 75 % de la valeur, sous engagements de conservation)", 2], ["Vente à un concurrent", 0], ["Ne rien préparer, la succession réglera tout", -2]] },
      { titre: "Engagements", texte: () => "Pour le pacte Dutreil, que faut-il respecter ?", options: [["Un engagement collectif de conservation (2 ans), puis un engagement individuel (4 ans), et une fonction de direction exercée par un signataire", 2], ["Aucune condition", -2], ["Garder les titres 1 an", 0]] },
      { titre: "Équité familiale", texte: () => "Le dirigeant a aussi un fils qui ne travaille pas dans l'entreprise. Que conseilles-tu ?", options: [["Une donation-partage avec soulte ou d'autres actifs pour le fils, pour préserver l'équité", 2], ["Ignorer le fils", -1], ["Donner 50 % des titres à chacun", 0]] },
    ],
    fin: finMission("Transmission d'entreprise", 7000),
  },
  procedure: {
    emoji: "🆘",
    nom: "Entreprise en difficulté",
    besoin: "client",
    honoraires: 5000,
    etapes: [
      { titre: "Premiers signaux", texte: (e, x) => `${nomC(e, x)} accumule les retards de paiement aux fournisseurs, mais n'est pas en cessation des paiements. Que proposes-tu ?`, options: [["Une procédure amiable et confidentielle : mandat ad hoc ou conciliation", 2], ["Déposer le bilan tout de suite", -2], ["Attendre que ça passe", -1]] },
      { titre: "Échec de la négociation", texte: () => "La conciliation échoue. L'entreprise n'est toujours pas en cessation des paiements, mais les difficultés sont insurmontables seule. Quelle procédure ?", options: [["Sauvegarde : protection judiciaire et gel des dettes antérieures", 2], ["Liquidation judiciaire", -2], ["Redressement judiciaire", 0]] },
      { titre: "Le plan", texte: () => "Le tribunal ouvre la période d'observation. Que prépares-tu ?", options: [["Un plan d'étalement des dettes (jusqu'à 10 ans) avec un prévisionnel réaliste et des mesures de restructuration", 2], ["Un plan qui promet de tout rembourser en 6 mois", -1], ["Rien : l'administrateur s'en occupe", 0]] },
    ],
    fin: (e, r, x) => {
      const c = cl(e, x);
      finMission("Accompagnement d'entreprise en difficulté", 5000)(e, r, x);
      if (c && r < 0.4) {
        e.clients = e.clients.filter((y) => y !== c);
        log(e, `🆘 ${c.nom} est placée en liquidation : le cabinet perd ce client.`, "mal");
      } else if (c && r >= 0.8) souvenir(e, "🆘", `${c.nom} sauvée grâce au plan de sauvegarde`);
    },
  },
  creation: {
    emoji: "🌱",
    nom: "Création d'entreprise",
    besoin: "rien",
    honoraires: 2500,
    etapes: [
      { titre: "Choix du statut", texte: () => "Inès et Malik, deux associés, veulent créer une start-up de livraison écoresponsable et lever des fonds dans 18 mois. Quel statut ?", options: [["Micro-entreprise", -1], ["SAS : souplesse des statuts, entrée d'investisseurs facilitée, présidents assimilés salariés", 2], ["Entreprise individuelle", -1]] },
      { titre: "Prévisionnel", texte: () => "Ils veulent montrer un CA de 2 M€ dès la première année au banquier. Que fais-tu ?", options: [["Construire un prévisionnel prudent avec des hypothèses justifiées et plusieurs scénarios", 2], ["Reprendre leurs chiffres sans les challenger", -1], ["Gonfler encore pour impressionner", -2]] },
      { titre: "Financement et formalités", texte: () => "Comment boucler le financement et immatriculer la société ?", options: [["Apport personnel, prêt bancaire avec garantie Bpifrance, prêts d'honneur, puis immatriculation sur le guichet unique de l'INPI", 2], ["Tout financer par découvert bancaire", -1], ["Immatriculer au greffe par courrier papier", 0]] },
    ],
    fin: (e, r) => {
      const h = Math.round(2500 * (0.6 + r * 0.6));
      e.tresorerie += h;
      if (r >= 0.6) {
        e.clients.push({ id: uid(e, "cl"), nom: "VéloVert SAS", dirigeant: "Inès et Malik", secteur: "Start-up livraison", trait: "énergie débordante, lève des fonds bientôt", satisfaction: 75, forfait: 1100, tvaMensuelle: true, paie: false, taille: 1 });
        log(e, `🌱 VéloVert SAS est immatriculée et devient cliente du cabinet (${euros(h)} d'honoraires de création).`, "bien");
        souvenir(e, "🌱", "Création de VéloVert SAS");
      } else log(e, "🌱 Les créateurs partent voir un autre cabinet, peu convaincus par l'accompagnement.", "mal");
    },
  },
  fraude: {
    emoji: "🕵️",
    nom: "Fraude interne chez un client",
    besoin: "client",
    honoraires: 4000,
    etapes: [
      { titre: "Signal d'alerte", texte: (e, x) => `En révisant ${nomC(e, x)}, ${pick(["Léa", "Karim", "ton équipe"])} remarque un nouveau fournisseur au RIB modifié trois fois, payé chaque mois sans bon de commande. Première réaction ?`, options: [["Confronter tout de suite la comptable du client", -1], ["Rassembler discrètement les éléments (rapprochements, factures, RIB) et alerter le dirigeant en tête à tête", 2], ["Ne rien dire, ce n'est pas notre mission", -2]] },
      { titre: "Enquête", texte: () => "Le dirigeant te demande d'aller plus loin. Que fais-tu ?", options: [["Une mission spécifique avec lettre de mission : analyse des paiements sur 3 ans et recherche de fournisseurs fictifs", 2], ["Fouiller la messagerie personnelle de la salariée", -2], ["Demander à la salariée de s'expliquer par écrit", 0]] },
      { titre: "Suites", texte: () => "Le détournement atteint 85 000 €. Que recommandes-tu au dirigeant ?", options: [["Dépôt de plainte, mise à pied conservatoire puis procédure disciplinaire, déclaration à l'assureur et renforcement du contrôle interne (double validation des RIB)", 2], ["Licencier sans procédure", -1], ["Étouffer l'affaire", -2]] },
    ],
    fin: finMission("Enquête sur une fraude interne", 4000),
  },
  international: {
    emoji: "🌍",
    nom: "Implantation à l'international",
    besoin: "client",
    honoraires: 6500,
    etapes: [
      { titre: "Structure", texte: (e, x) => `${nomC(e, x)} veut s'implanter en Espagne avec un commercial sur place qui signera des contrats. Point de vigilance ?`, options: [["Le risque d'établissement stable en Espagne : créer une filiale ou encadrer les pouvoirs du commercial", 2], ["Aucun : la société reste française", -1], ["Ouvrir seulement un compte bancaire espagnol", 0]] },
      { titre: "Prix de transfert", texte: () => "La filiale espagnole achètera les produits à la maison mère. À quel prix ?", options: [["Au prix de pleine concurrence, avec une documentation des prix de transfert", 2], ["À prix coûtant pour loger la marge en Espagne", -2], ["Au prix qui arrange chaque année", -1]] },
      { titre: "TVA", texte: () => "La France livre la filiale espagnole (assujettie). TVA ?", options: [["Livraison intracommunautaire exonérée en France, autoliquidée en Espagne, avec les numéros de TVA sur la facture", 2], ["TVA française à 20 %", -1], ["Pas de facture nécessaire entre sociétés du groupe", -2]] },
    ],
    fin: finMission("Implantation à l'international", 6500),
  },
  urssaf: {
    emoji: "📮",
    nom: "Contrôle URSSAF",
    besoin: "client",
    honoraires: 3500,
    etapes: [
      { titre: "Avis de contrôle", texte: (e, x) => `${nomC(e, x)} reçoit un avis de contrôle URSSAF. Que prépares-tu ?`, options: [["Les bulletins, DSN, contrats et justificatifs des avantages et frais professionnels, et la charte du cotisant contrôlé", 2], ["Rien, on verra le jour J", -1], ["Effacer les notes de frais douteuses", -2]] },
      { titre: "Lettre d'observations", texte: () => "L'inspecteur notifie un redressement sur des indemnités kilométriques sans justificatifs. Délai de réponse ?", options: [["30 jours pour répondre, prorogeables sur demande, en apportant les justificatifs", 2], ["2 ans", -1], ["Aucun : la décision est définitive", -1]] },
      { titre: "Contestation", texte: () => "L'URSSAF maintient une partie du redressement et adresse une mise en demeure. Recours ?", options: [["Saisir la commission de recours amiable (CRA) dans les 2 mois, puis le pôle social du tribunal judiciaire", 2], ["Saisir directement le Conseil d'État", -2], ["Ne pas payer et attendre", -1]] },
    ],
    fin: finMission("Assistance à un contrôle URSSAF", 3500),
  },

  // ---------- crises du cabinet ----------
  cyber: {
    emoji: "🛡️",
    nom: "Cyberattaque",
    besoin: "rien",
    etapes: [
      { titre: "Rançongiciel", texte: () => "Ce matin, les écrans affichent une demande de rançon de 50 000 € en bitcoins. Les serveurs sont chiffrés. Première décision ?", options: [["Payer la rançon pour aller vite", -2], ["Isoler le réseau, couper les accès, appeler un prestataire spécialisé et déposer plainte", 2], ["Redémarrer tous les postes", -1]] },
      { titre: "Données personnelles", texte: () => "Des données de clients (bulletins de paie) ont peut-être fuité. Que fais-tu ?", options: [["Notifier la CNIL dans les 72 heures et informer les personnes concernées si le risque est élevé", 2], ["Ne rien dire pour protéger la réputation", -2], ["Attendre d'en être sûre (plusieurs semaines)", -1]] },
      { titre: "Reprise", texte: () => "Comment reprends-tu l'activité ?", options: [["Restaurer les sauvegardes hors ligne, changer tous les mots de passe, activer la double authentification et former l'équipe", 2], ["Reprendre comme avant", -2], ["Racheter des ordinateurs neufs uniquement", 0]] },
    ],
    fin: (e, r) => {
      const perte = Math.round((60000 * (1.2 - r)) / 1000) * 1000;
      e.tresorerie -= perte;
      e.reputation = clamp(e.reputation - (r >= 0.8 ? 2 : r >= 0.5 ? 6 : 14));
      for (const d of e.dossiers) if (d.phase < 5) d.progression = Math.max(0, d.progression - (r >= 0.8 ? 5 : 20));
      e.compteurs.cyber = r >= 0.8 ? 2 : 1;
      log(e, `🛡️ Cyberattaque surmontée : coût total ${euros(perte)}. ${r >= 0.8 ? "Gestion de crise exemplaire, l'ANSSI cite ton cabinet en exemple." : r >= 0.5 ? "Quelques clients inquiets." : "La CNIL ouvre une enquête et plusieurs clients s'interrogent."}`, r >= 0.5 ? "neutre" : "mal");
      if (r >= 0.8) souvenir(e, "🛡️", "Cyberattaque repoussée");
    },
  },
  departs: {
    emoji: "🚪",
    nom: "Vague de démissions",
    besoin: "rien",
    etapes: [
      { titre: "L'annonce", texte: () => "Lundi matin : cinq collaborateurs du même pôle posent leur démission. Ils partent ensemble chez un concurrent. Que fais-tu d'abord ?", options: [["Les recevoir un par un pour comprendre les raisons, sans chantage", 2], ["Leur interdire de parler aux clients", -1], ["Les laisser partir sans un mot", -1]] },
      { titre: "Les clients", texte: () => "Ils pourraient emmener des clients. Ta priorité ?", options: [["Appeler les clients concernés, présenter les nouveaux interlocuteurs et vérifier les clauses de non-sollicitation", 2], ["Envoyer un mail générique", 0], ["Dénigrer les partants auprès des clients", -2]] },
      { titre: "La charge", texte: () => "Le préavis est de 3 mois. Comment absorbes-tu la charge ?", options: [["Recrutement immédiat, renfort temporaire des autres pôles et report négocié de certaines échéances", 2], ["Heures sup illimitées pour ceux qui restent", -1], ["Refuser tout nouveau dossier pendant 1 an", 0]] },
    ],
    fin: (e, r) => {
      const pole = pick(["expertise", "fiscal", "social"]);
      const partants = e.agents.filter((a) => a.filiere === pole).slice(0, r >= 0.8 ? 2 : r >= 0.5 ? 3 : 5);
      for (const a of partants) depart(e, a, "rejoint un concurrent avec ses collègues");
      for (const c of e.clients.slice(0, r >= 0.8 ? 0 : r >= 0.5 ? 1 : 3)) c.satisfaction = clamp(c.satisfaction - 20);
      log(e, `🚪 Vague de démissions : ${partants.length} départ(s) finalement. ${r >= 0.8 ? "Tu en as convaincu certains de rester." : ""}`, r >= 0.5 ? "neutre" : "mal");
    },
  },
  perte_client: {
    emoji: "📉",
    nom: "Perte du plus gros client",
    besoin: "rien",
    etapes: [
      { titre: "La nouvelle", texte: (e) => `${[...e.clients].sort((a, b) => b.forfait - a.forfait)[0]?.nom ?? "Ton plus gros client"} est racheté par un groupe qui centralise sa comptabilité. Tu perds ce client dans 3 mois. Première réaction ?`, options: [["Rencontrer le nouveau groupe pour proposer une mission de transition et de conseil", 2], ["Couper le contact immédiatement", -1], ["Baisser tes honoraires de 50 % pour le garder", 0]] },
      { titre: "Les finances", texte: () => "Ce client représentait une grosse part de ton chiffre. Que fais-tu ?", options: [["Prévisionnel de trésorerie, gel des dépenses non essentielles et plan commercial ciblé", 2], ["Licencier 20 % de l'équipe tout de suite", -1], ["Ne rien changer", -1]] },
      { titre: "La leçon", texte: () => "Comment éviter que ça se reproduise ?", options: [["Diversifier le portefeuille : aucun client au-delà de 10 % du chiffre d'affaires", 2], ["Signer des contrats de 10 ans", 0], ["Accepter n'importe quel client", -1]] },
    ],
    fin: (e, r) => {
      const c = [...e.clients].sort((a, b) => b.forfait - a.forfait)[0];
      if (c) {
        e.clients = e.clients.filter((x) => x !== c);
        if (r >= 0.8) e.tresorerie += c.forfait * 6;
      }
      e.compteurs.reseauBoost = (e.compteurs.reseauBoost ?? 0) + Math.round(r * 3);
      log(e, `📉 ${c?.nom ?? "Le client"} quitte le cabinet. ${r >= 0.8 ? "Tu décroches une mission de transition de 6 mois." : ""}`, "mal");
    },
  },
  fusion: {
    emoji: "🤝",
    nom: "Proposition de fusion",
    besoin: "rien",
    etapes: [
      { titre: "La proposition", texte: () => "Le cabinet Berthelot & Fils (35 personnes) propose de fusionner avec toi. Par quoi commences-tu ?", options: [["Une lettre d'intention, puis un audit croisé (clients, équipes, rentabilité, risques)", 2], ["Accepter tout de suite", -1], ["Refuser sans discuter", 0]] },
      { titre: "Gouvernance", texte: () => "Ils veulent la présidence et garder leur nom. Que négocies-tu ?", options: [["Une gouvernance proportionnelle à l'apport de chacun, un nom commun et des règles de décision écrites dans un pacte d'associés", 2], ["Tout leur laisser", -1], ["Exiger 100 % du pouvoir", -1]] },
      { titre: "Les équipes", texte: () => "Les deux cultures sont très différentes. Comment réussir l'intégration ?", options: [["Séminaire commun, binômes mixtes, harmonisation progressive des outils et des salaires", 2], ["Imposer tes méthodes dès le premier jour", -1], ["Laisser chaque équipe dans son coin", 0]] },
    ],
    fin: (e, r) => {
      if (r < 0.5) {
        log(e, "🤝 La fusion avec Berthelot & Fils échoue au dernier moment.", "mal");
        return;
      }
      const nb = Math.round(6 + r * 6);
      const secteurs = ["Commerce alimentaire", "BTP", "Profession libérale", "Immobilier", "Transport routier", "Restaurant"];
      for (let i = 0; i < nb; i++) e.clients.push({ id: uid(e, "cl"), nom: `Client Berthelot ${i + 1}`, dirigeant: "Client historique", secteur: secteurs[i % secteurs.length], trait: "client repris lors de la fusion", satisfaction: 55 + r * 20, forfait: 2400, tvaMensuelle: i % 2 === 0, paie: i % 3 === 0, taille: 1 });
      e.reputation = clamp(e.reputation + 6);
      e.concurrents = e.concurrents.filter((c) => !/Berthelot/.test(c.nom));
      log(e, `🤝 Fusion réussie avec Berthelot & Fils : ${nb} clients rejoignent le cabinet.`, "bien");
      souvenir(e, "🤝", "Fusion avec Berthelot & Fils");
    },
  },
  capital: {
    emoji: "💼",
    nom: "Ouverture du capital",
    besoin: "rien",
    etapes: [
      { titre: "La proposition", texte: () => "Un fonds d'investissement propose 3 M€ contre 45 % des droits de vote de ta société d'expertise comptable. Ta réaction ?", options: [["Impossible tel quel : les experts-comptables doivent détenir plus des deux tiers des droits de vote", 2], ["Accepter, c'est beaucoup d'argent", -2], ["Accepter si le fonds promet de ne pas voter", -1]] },
      { titre: "Contre-proposition", texte: () => "Le fonds revient avec 30 % des droits de vote pour 2 M€. Que négocies-tu ?", options: [["Un pacte d'associés : gouvernance, indépendance des missions, clause de sortie et respect de la déontologie", 2], ["Signer sans pacte", -1], ["Lui confier la direction opérationnelle", -2]] },
      { titre: "Utilisation des fonds", texte: () => "Que fais-tu de l'argent levé ?", options: [["Croissance externe (rachats de cabinets), outils et recrutements", 2], ["Dividendes exceptionnels pour les associés", -1], ["Le laisser sur le compte", 0]] },
    ],
    fin: (e, r) => {
      if (r < 0.5) {
        log(e, "💼 L'opération avec le fonds est abandonnée : l'Ordre rappelle les règles de détention du capital.", "mal");
        return;
      }
      e.tresorerie += 2_000_000;
      for (const a of e.agents.filter((x) => x.filiere === "associe")) a.confiance = clamp(a.confiance + (r >= 0.8 ? 5 : -5));
      log(e, "💼 Ouverture du capital réalisée : 2 M€ levés auprès du fonds, l'indépendance du cabinet est préservée.", "bien");
      souvenir(e, "💼", "Ouverture du capital à un fonds");
    },
  },
  label: {
    emoji: "🏅",
    nom: "Label qualité",
    besoin: "rien",
    etapes: [
      { titre: "Cartographie", texte: () => "Tu vises un label qualité pour le cabinet (organisation, satisfaction client, contrôle qualité). Première étape ?", options: [["Cartographier les processus (acceptation des missions, production, revue, facturation)", 2], ["Acheter un logo", -2], ["Rédiger une charte en une heure", 0]] },
      { titre: "Contrôle qualité interne", texte: () => "Comment organises-tu le contrôle qualité ?", options: [["Revue des dossiers par un pair, check-lists et indicateurs de satisfaction suivis chaque trimestre", 2], ["Le contrôle se fait si un client se plaint", -1], ["Seule l'associée relit tout", 0]] },
      { titre: "Audit externe", texte: () => "L'auditeur relève deux dossiers sans lettre de mission. Que fais-tu ?", options: [["Plan d'action correctif daté, régularisation et contrôle de suivi", 2], ["Contester les constats", -1], ["Cacher les dossiers", -2]] },
    ],
    fin: (e, r) => {
      e.tresorerie -= 15000;
      if (r >= 0.6) {
        e.compteurs.label = 1;
        e.reputation = clamp(e.reputation + 8);
        log(e, "🏅 Le cabinet obtient son label qualité ! Les grands comptes y sont sensibles.", "bien");
        souvenir(e, "🏅", "Label qualité obtenu");
      } else log(e, "🏅 Label refusé cette année : trop d'écarts relevés.", "mal");
    },
  },

  // ---------- RH sensibles ----------
  demission: {
    emoji: "📝",
    nom: "Démission surprise",
    besoin: "agent",
    etapes: [
      { titre: "La lettre", texte: (e, x) => `${prenom(e, x)} pose sa lettre de démission sur ton bureau : « J'ai une offre ailleurs. » Que dis-tu ?`, options: [["« Merci de me le dire en face. Qu'est-ce qui t'a donné envie de partir ? »", 2], ["« Tu ne peux pas me faire ça en pleine saison ! »", -2], ["« Combien ils te proposent ? Je m'aligne. »", 0]] },
      { titre: "La vraie raison", texte: (e, x) => `${prenom(e, x)} explique : « Je fais les mêmes dossiers depuis trois ans, je n'apprends plus rien. » Ta réponse ?`, options: [["Proposer un plan d'évolution concret : nouveaux dossiers de conseil, formation, objectif de promotion daté", 2], ["Proposer 10 % d'augmentation sans rien changer", 0], ["« C'est comme ça partout »", -1]] },
      { titre: "La décision", texte: (e, x) => `${prenom(e, x)} hésite. Comment conclus-tu ?`, options: [["Lui laisser 48 heures de réflexion, sans pression, en confirmant tes engagements par écrit", 2], ["Exiger une réponse immédiate", -1], ["Annoncer à l'équipe qu'il ou elle reste avant sa réponse", -2]] },
    ],
    fin: (e, r, x) => {
      const a = ag(e, x);
      if (!a) return;
      if (r >= 0.6) {
        a.moral = clamp(a.moral + 20);
        a.confiance = clamp(a.confiance + 15);
        log(e, `📝 ${a.prenom} reste au cabinet, convaincu·e par ton plan d'évolution.`, "bien");
      } else depart(e, a, "accepte l'offre d'un autre cabinet");
    },
  },
  harcelement: {
    emoji: "⚠️",
    nom: "Signalement de harcèlement",
    besoin: "agent",
    etapes: [
      { titre: "Le signalement", texte: (e, x) => `${prenom(e, x)} te signale des propos humiliants répétés de la part de son manager. Ta première réaction ?`, options: [["Écouter, prendre le signalement au sérieux et lancer une enquête interne impartiale, en informant le CSE", 2], ["Lui conseiller de « prendre sur soi »", -2], ["Convoquer les deux personnes ensemble", -1]] },
      { titre: "Protection", texte: () => "Pendant l'enquête, que fais-tu ?", options: [["Mesures conservatoires : séparer les deux personnes (bureaux, dossiers), sans pénaliser la victime", 2], ["Mettre la victime en télétravail forcé", -1], ["Ne rien changer", -2]] },
      { titre: "Conclusion", texte: () => "L'enquête confirme les faits. Que fais-tu ?", options: [["Sanction disciplinaire proportionnée, engagée dans les 2 mois de la connaissance des faits, et plan de prévention", 2], ["Un simple rappel oral", -1], ["Promouvoir le manager ailleurs", -2]] },
    ],
    fin: (e, r, x) => {
      const a = ag(e, x);
      for (const y of e.agents) y.confiance = clamp(y.confiance + (r >= 0.8 ? 4 : -6));
      if (a) a.moral = clamp(a.moral + (r >= 0.8 ? 15 : -20));
      if (r < 0.4) {
        e.tresorerie -= 30000;
        log(e, "⚠️ Le dossier part aux prud'hommes : le cabinet est condamné pour manquement à son obligation de sécurité.", "mal");
      } else log(e, "⚠️ Signalement traité dans les règles : l'équipe voit que la parole est prise au sérieux.", "bien");
    },
  },
  etranger: {
    emoji: "🌐",
    nom: "Recrutement d'un expert-comptable étranger",
    besoin: "rien",
    etapes: [
      { titre: "Titre de séjour", texte: () => "Ana, experte-comptable brésilienne brillante, veut te rejoindre. Que faut-il faire d'abord ?", options: [["Demander l'autorisation de travail et accompagner son titre de séjour (démarches en ligne sur l'ANEF)", 2], ["L'embaucher tout de suite, on régularisera plus tard", -2], ["L'embaucher comme stagiaire non rémunérée", -2]] },
      { titre: "Le diplôme", texte: () => "Peut-elle signer des comptes en tant qu'expert-comptable ?", options: [["Pas tout de suite : elle peut travailler comme collaboratrice, mais devra obtenir la reconnaissance de sa qualification et l'inscription à l'Ordre", 2], ["Oui, un diplôme étranger suffit", -1], ["Non, jamais", 0]] },
      { titre: "L'intégration", texte: () => "Comment réussir son intégration ?", options: [["Un parrain, des cours de fiscalité française et des dossiers progressifs", 2], ["Lui confier tout de suite les plus gros dossiers", -1], ["La laisser se débrouiller", -1]] },
    ],
    fin: (e, r) => {
      if (r < 0.5) {
        log(e, "🌐 Le recrutement d'Ana échoue : dossier administratif incomplet.", "mal");
        return;
      }
      const b = e.agents.filter((a) => a.filiere === "expertise").length;
      e.agents.push({ id: uid(e, "a"), prenom: "Ana", nom: "Ferreira", poste: "Senior", filiere: "expertise", personnalite: "ambitieux", couleur: "#118ab2", cheveux: "#3b2416", peau: "#c68b5e", bureau: 999, competence: 78, stress: 20, fatigue: 0, moral: 85, confiance: 70, salaire: 3700, activite: "absent", activiteJusqua: 0, absentJusquau: 0, embauche: jourDe(e.minute), bulle: null, bulleJusqua: 0, clan: null } as Agent);
      log(e, `🌐 Ana Ferreira rejoint le cabinet comme Senior (${b} personnes au pôle Expertise).`, "bien");
      souvenir(e, "🌐", "Arrivée d'Ana, première collaboratrice internationale");
    },
  },
};

// ---------- moteur ----------

export function lancerChaine(e: Etat, type: string, ctx: Ctx = {}): string | null {
  const def = CHAINES[type];
  if (!def) return "Scénario inconnu.";
  e.chaines ??= [];
  if (e.chaines.some((c) => c.type === type)) return "Ce dossier est déjà en cours.";
  if (def.besoin === "client" && !ctx.client) {
    if (!e.clients.length) return "Il faut au moins un client.";
    ctx.client = pick(e.clients).id;
  }
  if (def.besoin === "agent" && !ctx.agent) {
    const metiers = e.agents.filter((a) => ["expertise", "fiscal", "social", "juridique", "audit"].includes(a.filiere));
    if (!metiers.length) return "Il faut au moins un collaborateur.";
    ctx.agent = pick(metiers).id;
  }
  e.chaines.push({ id: uid(e, "ch"), type, etape: 0, score: 0, prochain: jourDe(e.minute), ctx });
  chainesDuJour(e, jourDe(e.minute));
  return null;
}

export function chainesDuJour(e: Etat, jour: number) {
  for (const k of e.chaines ?? []) {
    if (k.prochain > jour) continue;
    const def = CHAINES[k.type];
    const et = def?.etapes[k.etape];
    if (!def || !et) continue;
    k.prochain = 99999;
    const x = k.ctx as Ctx;
    // Options mélangées : la bonne réponse n'est jamais toujours au même endroit.
    const ordre = et.options.map((_, i) => i).sort(() => rnd() - 0.5);
    messageSpecial(e, x.agent ?? "cabinet", 4, `${def.emoji} ${def.nom} — étape ${k.etape + 1}/${def.etapes.length} : ${et.titre}`, et.texte(e, x), `client:${x.client ?? ""}|agent:${x.agent ?? ""}`, {}, ordre.map((i) => ({ label: et.options[i][0], cout: 0, effets: {}, resultat: "Décision prise.", action: "vie", code: `ch:${k.id}:${i}` }) as OptionDilemme));
  }
}

export function repondreChaine(e: Etat, id: string, choix: number) {
  const k = (e.chaines ?? []).find((x) => x.id === id);
  if (!k) return;
  const def = CHAINES[k.type];
  k.score += def.etapes[k.etape]?.options[choix]?.[1] ?? 0;
  k.etape++;
  if (k.etape < def.etapes.length) {
    k.prochain = jourDe(e.minute) + 2 + Math.floor(rnd() * 5);
    return;
  }
  e.chaines = (e.chaines ?? []).filter((x) => x !== k);
  const max = def.etapes.length * 2;
  def.fin(e, clamp(k.score / max, 0, 1), k.ctx as Ctx);
}

/** Déclenchements aléatoires, chaque début de mois. */
export function chainesDuMois(e: Etat) {
  const n = e.clients.length;
  const tirages: [string, number, boolean][] = [
    ["evaluation", 0.12, n >= 3],
    ["holding", 0.08, n >= 5],
    ["due_diligence", 0.08, e.reputation >= 45],
    ["cac", 0.08, n >= 6],
    ["consolidation", 0.06, n >= 8],
    ["transmission", 0.07, n >= 5],
    ["procedure", 0.06, n >= 6],
    ["creation", 0.1, true],
    ["fraude", 0.05, n >= 6],
    ["international", 0.05, n >= 8],
    ["urssaf", 0.08, n >= 4],
    ["demission", 0.06, e.agents.length >= 8],
    ["harcelement", 0.03, e.agents.length >= 15],
    ["etranger", 0.04, e.agents.length >= 10],
    ["fusion", 0.03, e.agents.length >= 20],
    ["capital", 0.025, e.agents.length >= 25],
    ["cyber", 0.03, (e.compteurs.cyber ?? 0) < 2],
    ["departs", 0.015, e.agents.length >= 25],
    ["perte_client", 0.015, n >= 10],
  ];
  let lancees = 0;
  for (const [type, p, ok] of tirages) {
    if (lancees >= 2) break;
    if (ok && rnd() < p && !lancerChaine(e, type)) lancees++;
  }
}


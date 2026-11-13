import type { Effets, Etat, OptionDilemme } from "@/lib/types";

// Arcs narratifs : de petites histoires en plusieurs épisodes, espacés de
// quelques jours. Chaque épisode est un choix ; la suite dépend des choix
// précédents. ctx contient les noms et identifiants (agent, client…).

export type Episode =
  | { titre: string; texte: string; options: OptionDilemme[] }
  | { fin: string; ton: "bien" | "mal" | "neutre"; effets?: Effets; action?: OptionDilemme["action"]; options?: undefined };

export type Arc = {
  id: string;
  titre: string;
  /** Renvoie le contexte si l'arc peut démarrer, sinon null. */
  condition: (e: Etat) => Record<string, string> | null;
  etapes: { delai: number; construire: (ctx: Record<string, string>, choix: number[], e: Etat) => Episode }[];
};

const hasard = <T,>(t: T[]) => t[Math.floor(Math.random() * t.length)];

export const ARCS: Arc[] = [
  {
    id: "dscg",
    titre: "Le DSCG",
    condition: (e) => {
      const a = e.agents.filter((x) => /Stagiaire|Assistant/.test(x.poste));
      if (!a.length) return null;
      const x = hasard(a);
      return { agent: x.id, nom: x.prenom };
    },
    etapes: [
      {
        delai: 0,
        construire: (c) => ({
          titre: `${c.nom} passe le DSCG`,
          texte: `${c.nom} t'annonce qu'il·elle passe les épreuves du DSCG dans deux semaines et aimerait trois jours pour réviser.`,
          options: [
            { label: "Accorder les trois jours", cout: 0, effets: { confianceAgent: 10, stressEquipe: 3 }, resultat: `${c.nom} est soulagé·e.` },
            { label: "Lui offrir une prépa intensive (800 €)", cout: 1, effets: { confianceAgent: 15, competenceAgent: 5, tresorerie: -800 }, resultat: `${c.nom} n'en revient pas.` },
            { label: "Refuser : pas en pleine saison", cout: 0, effets: { confianceAgent: -12, stressAgent: 10 }, resultat: `${c.nom} révisera la nuit…` },
          ],
        }),
      },
      {
        delai: 10,
        construire: (c, choix, e) => {
          const a = e.agents.find((x) => x.id === c.agent);
          if (!a) return { fin: `${c.nom} a quitté le cabinet avant ses résultats.`, ton: "neutre" };
          const chance = a.competence / 100 + (choix[0] === 2 ? -0.1 : 0.2) + (choix[0] === 1 ? 0.15 : 0);
          const reussi = Math.random() < chance;
          return reussi
            ? {
                titre: `${c.nom} a réussi le DSCG !`,
                texte: `Résultats tombés : ${c.nom} a validé ses épreuves. Toute l'équipe l'applaudit à la machine à café.`,
                options: [
                  { label: "Le·la promouvoir (+300 € brut)", cout: 1, effets: { confianceAgent: 15, moralEquipe: 4 }, resultat: `${c.nom} est promu·e.`, action: "promouvoir" },
                  { label: "Le·la féliciter publiquement", cout: 0, effets: { confianceAgent: 4, moralEquipe: 3 }, resultat: "Un beau moment d'équipe." },
                  { label: "Rien de spécial", cout: 0, effets: { confianceAgent: -8 }, resultat: `${c.nom} est un peu déçu·e.` },
                ],
              }
            : {
                titre: `${c.nom} a échoué au DSCG`,
                texte: `${c.nom} n'a pas validé ses épreuves et arrive au bureau la mine défaite.`,
                options: [
                  { label: "L'encourager et l'aider à préparer la prochaine session", cout: 1, effets: { confianceAgent: 12, competenceAgent: 3 }, resultat: `${c.nom} reprend confiance.` },
                  { label: "Lui laisser une journée pour encaisser", cout: 0, effets: { confianceAgent: 6, stressAgent: -10 }, resultat: "Une journée off bien méritée." },
                  { label: "Ne rien dire", cout: 0, effets: { confianceAgent: -6, stressAgent: 8 }, resultat: "Le silence pèse." },
                ],
              };
        },
      },
    ],
  },
  {
    id: "duel",
    titre: "Le duel",
    condition: (e) => {
      const r = e.relations.find((x) => x.type === "rivalite" && x.intensite > 45 && e.agents.some((a) => a.id === x.a) && e.agents.some((a) => a.id === x.b));
      if (!r || !e.clients.length) return null;
      const a = e.agents.find((x) => x.id === r.a)!;
      const b = e.agents.find((x) => x.id === r.b)!;
      return { agent: a.id, nom: a.prenom, agentB: b.id, nomB: b.prenom, client: hasard(e.clients).nom };
    },
    etapes: [
      {
        delai: 0,
        construire: (c) => ({
          titre: `${c.nom} contre ${c.nomB}`,
          texte: `${c.nom} et ${c.nomB} veulent tous les deux piloter le dossier phare de ${c.client}. Le ton monte dans l'open space.`,
          options: [
            { label: `Confier le dossier à ${c.nom}`, cout: 0, effets: { confianceAgent: 8 }, resultat: `${c.nomB} fulmine.` },
            { label: `Le confier à ${c.nomB}`, cout: 0, effets: { confianceAgent: -8 }, resultat: `${c.nom} claque la porte de la salle de pause.` },
            { label: "Les faire travailler en binôme", cout: 1, effets: { stressEquipe: 3 }, resultat: "Pari risqué : on verra." },
          ],
        }),
      },
      {
        delai: 7,
        construire: (c, choix) => ({
          titre: `${c.nom} et ${c.nomB} : la suite`,
          texte:
            choix[0] === 2
              ? `Le binôme ${c.nom}/${c.nomB} a livré un travail remarquable… mais avec des échanges tendus. L'équipe attend ta réaction.`
              : `Depuis ta décision, ${choix[0] === 0 ? c.nomB : c.nom} ne dit plus bonjour et l'ambiance se dégrade.`,
          options: [
            { label: "Entretien de recadrage à trois", cout: 1, effets: { moralEquipe: 2 }, resultat: "Les choses sont dites.", action: "reconcilier" },
            { label: "Organiser un team building (1 500 €)", cout: 1, effets: { moralEquipe: 8, tresorerie: -1500 }, resultat: "Escape game et pizzas.", action: "reconcilier" },
            { label: "Laisser faire le temps", cout: 0, effets: { stressEquipe: 6, moralEquipe: -4 }, resultat: "La tension reste palpable." },
          ],
        }),
      },
      {
        delai: 6,
        construire: (c, choix) =>
          choix[1] === 2
            ? { fin: `La rivalité ${c.nom}/${c.nomB} empoisonne toujours l'open space.`, ton: "mal" }
            : { fin: `${c.nom} et ${c.nomB} ont fini par s'apprécier : on les a vus déjeuner ensemble !`, ton: "bien" },
      },
    ],
  },
  {
    id: "faillite",
    titre: "La chute d'un client",
    condition: (e) => {
      const c = e.clients.filter((x) => x.forfait >= 1200);
      if (!c.length) return null;
      const x = hasard(c);
      return { client: x.id, nomClient: x.nom, dirigeant: x.dirigeant };
    },
    etapes: [
      {
        delai: 0,
        construire: (c) => ({
          titre: `${c.nomClient} paie en retard`,
          texte: `${c.nomClient} n'a pas réglé ses deux derniers forfaits. ${c.dirigeant} ne répond plus au téléphone.`,
          options: [
            { label: "Relance ferme avec mise en demeure", cout: 0, effets: { satisfactionClient: -10, tresorerie: 800 }, resultat: "Un premier virement arrive." },
            { label: "Proposer un échéancier", cout: 0, effets: { satisfactionClient: 5 }, resultat: `${c.dirigeant} accepte, soulagé.` },
            { label: "Analyser sa trésorerie avec lui", cout: 1, effets: { satisfactionClient: 10, reputation: 1 }, resultat: "Tu découvres une situation inquiétante." },
          ],
        }),
      },
      {
        delai: 6,
        construire: (c, choix) => ({
          titre: `${c.nomClient} en difficulté`,
          texte: `${choix[0] === 2 ? "Ton analyse le confirme" : "Les comptes provisoires le montrent"} : les capitaux propres de ${c.nomClient} sont négatifs et la trésorerie ne tiendra pas trois mois.`,
          options: [
            { label: "L'accompagner vers une procédure de conciliation (mission de conseil)", cout: 1, effets: { satisfactionClient: 15, reputation: 2 }, resultat: "Une mission de conseil est ouverte.", action: "mission_conseil" },
            { label: "Continuer la mission comme si de rien n'était", cout: 0, effets: {}, resultat: "Tu croises les doigts." },
            { label: "Mettre fin à la mission proprement", cout: 0, effets: { reputation: -1 }, resultat: `Fin de la collaboration avec ${c.nomClient}.`, action: "client_part" },
          ],
        }),
      },
      {
        delai: 8,
        construire: (c, choix) =>
          choix[1] === 0
            ? { fin: `Grâce à la conciliation, ${c.nomClient} a négocié avec ses créanciers et repart sur de bonnes bases. ${c.dirigeant} te recommande partout.`, ton: "bien", effets: { reputation: 4, satisfactionClient: 15 } }
            : choix[1] === 1
              ? { fin: `${c.nomClient} est placé en redressement judiciaire. Tes honoraires impayés sont perdus et le client quitte le cabinet.`, ton: "mal", action: "client_part_perte" }
              : { fin: `Tu as appris que ${c.nomClient} a été placé en redressement. Tu avais mis fin à la mission à temps.`, ton: "neutre" },
      },
    ],
  },
];

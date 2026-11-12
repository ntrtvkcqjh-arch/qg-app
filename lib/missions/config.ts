import "server-only";

export type Mission = "journal" | "recap";

export const MISSIONS: Record<
  Mission,
  { agent: "redacteur" | "chef-cabinet"; agentEnv: string; environmentEnv: string; titre: string }
> = {
  journal: {
    agent: "redacteur",
    agentEnv: "AGENT_ID_REDACTEUR",
    environmentEnv: "ENVIRONMENT_ID_REDACTEUR",
    titre: "Journal du matin",
  },
  recap: {
    agent: "chef-cabinet",
    agentEnv: "AGENT_ID_CHEF_CABINET",
    environmentEnv: "ENVIRONMENT_ID_CHEF_CABINET",
    titre: "Récap de la semaine",
  },
};

// Garde-fous de coût, fixés avec Marjana.
export const BUDGET_CENTS_USD = "500"; // 5 $ par mission (plafond appliqué par Anthropic)
export const DUREE_MAX_MINUTES = 60; // au-delà : interruption et échec

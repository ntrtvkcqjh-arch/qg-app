// Couleurs et libellés issus de la charte rapport-design.
export const AGENTS = {
  redacteur: { nom: "Rédacteur en chef", rubrique: "Journal", couleur: "#1F3A5F" },
  "chef-cabinet": { nom: "Chef de cabinet", rubrique: "Récap", couleur: "#4B3A6B" },
  styliste: { nom: "Styliste", rubrique: "Style", couleur: "#2F5D50" },
} as const;

export type AgentId = keyof typeof AGENTS;

export function agentInfo(agent: string) {
  return AGENTS[agent as AgentId] ?? { nom: agent, rubrique: agent, couleur: "#4A4A4A" };
}

const TZ = "Europe/Paris";

export function dateLongue(iso: string) {
  // iso = "AAAA-MM-JJ" (colonne date) : midi UTC pour éviter tout décalage.
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ,
  }).format(new Date(`${iso}T12:00:00Z`));
}

export function dateCourte(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

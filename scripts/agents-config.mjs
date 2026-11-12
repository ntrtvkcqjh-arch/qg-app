// Définition des agents du QG pour Claude Managed Agents.
// Source : config/managed-agents.example.md du pack, champs vérifiés dans la
// doc officielle (bêta managed-agents-2026-04-01) et dans le SDK installé.
//
// Les prompts système sont l'assemblage, sans réécriture, des fichiers du pack.

export const MODELE = { id: "claude-sonnet-5-5", effort: "high" };

// Skills personnalisés : dossier local -> nom du skill (= nom du dossier racine envoyé).
export const SKILLS = {
  "rapport-design": "shared/skills/rapport-design",
  "journal-du-matin": "agents/redacteur/skills/journal-du-matin",
  "recap-dimanche": "agents/chef-cabinet/skills/recap-dimanche",
};

// Outils : on part de « tout éteint » et on n'allume que le nécessaire.
// `read` + `glob` servent à lire les skills (dont le gabarit HTML).
// Pas de bash, pas d'écriture de fichiers : la réponse finale suffit.
const lecture = [
  { name: "read", enabled: true },
  { name: "glob", enabled: true },
];

export const AGENTS = {
  redacteur: {
    nom: "Rédacteur en chef",
    description: "Produit le Journal du matin de Marjana (édition semaine / week-end).",
    fichiers: [
      "agents/redacteur/SOUL.md",
      "agents/redacteur/AGENTS.md",
      "shared/regles-communes.md",
      "shared/sources.md",
      "shared/profil-marjana.md",
      "shared/contrat-sortie.md",
    ],
    skills: ["rapport-design", "journal-du-matin"],
    outils: [
      ...lecture,
      {
        name: "web_search",
        enabled: true,
        user_location: { type: "approximate", country: "FR", city: "Paris", timezone: "Europe/Paris" },
      },
      { name: "web_fetch", enabled: true, max_content_tokens: 40000 },
    ],
    environnement: "redacteur",
    envVar: "AGENT_ID_REDACTEUR",
  },
  "chef-cabinet": {
    nom: "Chef de cabinet",
    description: "Pilote l'ensemble du QG et produit le récap du dimanche.",
    fichiers: [
      "agents/chef-cabinet/SOUL.md",
      "agents/chef-cabinet/AGENTS.md",
      "shared/regles-communes.md",
      "shared/profil-marjana.md",
      "shared/contrat-sortie.md",
    ],
    skills: ["rapport-design", "recap-dimanche"],
    outils: [...lecture], // aucun outil web
    environnement: "chef-cabinet",
    envVar: "AGENT_ID_CHEF_CABINET",
  },
};

// Environnements (conteneurs) : un par agent.
// - Rédacteur : réseau ouvert, sinon les outils web ne renvoient rien
//   (« démarrer large », à resserrer plus tard sur shared/sources.md).
// - Chef de cabinet : réseau fermé, il ne travaille que sur les données fournies.
export const ENVIRONNEMENTS = {
  redacteur: {
    nom: "qg-redacteur",
    config: { type: "cloud", networking: { type: "unrestricted" } },
    envVar: "ENVIRONMENT_ID_REDACTEUR",
  },
  "chef-cabinet": {
    nom: "qg-chef-cabinet",
    config: { type: "cloud", networking: { type: "limited", allowed_hosts: [] } },
    envVar: "ENVIRONMENT_ID_CHEF_CABINET",
  },
};

export function outilsPour(agent) {
  return [
    {
      type: "agent_toolset_20260401",
      // Tout éteint par défaut ; exécution sans demande d'accord, puisque
      // personne ne regarde les missions du matin et que rien d'irréversible
      // n'est possible avec ces outils.
      default_config: { enabled: false, permission_policy: { type: "always_allow" } },
      configs: agent.outils,
    },
  ];
}

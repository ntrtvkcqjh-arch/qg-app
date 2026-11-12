import "server-only";
import { AGENTS, type AgentId } from "@/lib/agents";
import { maintenantParis } from "@/lib/missions/temps";
import type { createClient } from "@/lib/supabase/server";

type Db = Awaited<ReturnType<typeof createClient>>;

export type EtatBureau = "travaille" | "publie" | "echec" | "repos" | "dort";

export type AgentBureau = {
  id: AgentId;
  nom: string;
  couleur: string;
  etat: EtatBureau;
  bulle: string | null; // texte court au-dessus du personnage
  statut: string; // phrase complète pour la fiche
  activite: string[]; // dernières actions, la plus récente d'abord
  rapportId: string | null;
};

export type Bureau = { agents: AgentBureau[]; heure: number; minute: number; enCours: boolean };

type Run = {
  id: string;
  agent: string;
  mission: string | null;
  statut: string;
  demarre_a: string;
  termine_a: string | null;
  agent_events: { type: string; resume: string | null; created_at: string }[];
};

const TITRES: Record<string, string> = { journal: "le Journal", recap: "le récap", style: "le Style de la semaine" };
const DOUZE_HEURES = 12 * 3600_000;

const heureParis = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

/** Traduit la dernière action enregistrée en une bulle de quelques mots. */
function bulleDepuis(resume: string | null, type: string): string {
  const r = resume ?? "";
  if (r.startsWith("Recherche :")) return "Je cherche…";
  if (r.startsWith("Lecture :")) {
    try {
      return `Je lis ${new URL(r.slice(9).trim()).hostname.replace(/^www\./, "")}`.slice(0, 24);
    } catch {
      return "Je lis une page…";
    }
  }
  if (r.startsWith("Consulte :")) return "Je relis ma charte";
  if (type === "agent.message" || r.startsWith("Message")) return "J'écris…";
  if (r.startsWith("Erreur")) return "Petit souci…";
  if (type === "lancement") return "Je m'installe";
  return "Je réfléchis…";
}

export async function lireBureau(supabase: Db): Promise<Bureau> {
  const { data } = await supabase
    .from("agent_runs")
    .select("id, agent, mission, statut, demarre_a, termine_a, agent_events(type, resume, created_at)")
    .order("demarre_a", { ascending: false })
    .order("created_at", { referencedTable: "agent_events", ascending: false })
    .limit(30);
  const runs = (data ?? []) as Run[];

  // Le rapport lié au dernier run de chaque agent (lien « Lire »).
  const derniers = new Map<string, Run>();
  for (const r of runs) if (!derniers.has(r.agent)) derniers.set(r.agent, r);
  const ids = [...derniers.values()].map((r) => r.id);
  const { data: rapports } = ids.length
    ? await supabase.from("rapports").select("id, run_id").in("run_id", ids)
    : { data: [] as { id: string; run_id: string }[] };
  const rapportDe = new Map((rapports ?? []).map((r) => [r.run_id, r.id]));

  const { heure, minute } = maintenantParis();
  const nuit = heure >= 22 || heure < 6;
  const maintenant = Date.now();

  const agents = (Object.keys(AGENTS) as AgentId[]).map((id): AgentBureau => {
    const info = AGENTS[id];
    const run = derniers.get(id);
    const base = { id, nom: info.nom, couleur: info.couleur, rapportId: null, activite: [] as string[] };
    const repos: AgentBureau = nuit
      ? { ...base, etat: "dort", bulle: "Zzz", statut: "Dort. Prochaine mission à l'heure prévue." }
      : { ...base, etat: "repos", bulle: null, statut: "En pause, prêt pour la prochaine mission." };
    if (!run) return repos;

    const activite = run.agent_events.slice(0, 6).map((e) => e.resume ?? e.type);
    const titre = TITRES[run.mission ?? ""] ?? "sa mission";
    const fin = run.termine_a ? new Date(run.termine_a).getTime() : 0;

    if (run.statut === "en_cours") {
      const e = run.agent_events[0];
      const minutes = Math.max(1, Math.round((maintenant - new Date(run.demarre_a).getTime()) / 60_000));
      return {
        ...base,
        etat: "travaille",
        bulle: e ? bulleDepuis(e.resume, e.type) : "Je m'installe",
        statut: `Au travail sur ${titre} depuis ${minutes} min.`,
        activite,
        rapportId: rapportDe.get(run.id) ?? null,
      };
    }
    if (run.statut === "termine" && maintenant - fin < DOUZE_HEURES) {
      return {
        ...base,
        etat: "publie",
        bulle: "C'est publié !",
        statut: `A publié ${titre} à ${heureParis(run.termine_a!)}.`,
        activite,
        rapportId: rapportDe.get(run.id) ?? null,
      };
    }
    if ((run.statut === "echec" || run.statut === "interrompu") && maintenant - fin < DOUZE_HEURES) {
      return {
        ...base,
        etat: "echec",
        bulle: "Mission ratée",
        statut: `${titre.charAt(0).toUpperCase() + titre.slice(1)} a échoué${run.termine_a ? ` à ${heureParis(run.termine_a)}` : ""}. Détails dans Missions.`,
        activite,
        rapportId: null,
      };
    }
    return { ...repos, activite };
  });

  return { agents, heure, minute, enCours: agents.some((a) => a.etat === "travaille") };
}

import type { Metadata } from "next";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { agentInfo } from "@/lib/agents";
import { actualiser } from "./actions";
import BoutonsMission from "./BoutonsMission";

export const metadata: Metadata = { title: "Missions" };

type Run = {
  id: string;
  agent: string;
  mission: string | null;
  date_mission: string | null;
  statut: string;
  demarre_a: string;
  termine_a: string | null;
  cout_cents: number | null;
  erreur: string | null;
  incidents: { type: string; detail: string }[] | null;
  agent_events: { type: string; resume: string | null; created_at: string }[];
};

const heure = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

export default async function PageMissions() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("agent_runs")
    .select("id, agent, mission, date_mission, statut, demarre_a, termine_a, cout_cents, erreur, incidents, agent_events(type, resume, created_at)")
    .order("demarre_a", { ascending: false })
    .order("created_at", { referencedTable: "agent_events", ascending: false })
    .limit(15);
  const runs = (data ?? []) as Run[];

  return (
    <Cadre>
      <p className="k">Coulisses</p>
      <h1>Missions des agents</h1>
      <p className="meta">Plafond : 5 $ et 60 min par mission. Lancement automatique : Journal chaque matin, récap le dimanche.</p>
      <div className="double" />

      <BoutonsMission />
      <form action={actualiser}>
        <button type="submit" className="lien">Actualiser l&apos;état des missions</button>
      </form>

      <div className="filet" />
      {runs.length === 0 && <p className="vide">Aucune mission pour l&apos;instant.</p>}
      <ul className="liste">
        {runs.map((r) => {
          const a = agentInfo(r.agent);
          return (
            <li key={r.id} style={{ "--couleur": a.couleur } as React.CSSProperties}>
              <p className="meta">
                <span className="pastille" />
                {a.nom} · {heure(r.demarre_a)}
                {r.cout_cents != null && ` · ${(r.cout_cents / 100).toFixed(2)} $`}{" "}
                <span className={`tag ${r.statut === "echec" ? "echec" : r.statut === "en_cours" ? "attente" : ""}`}>
                  {r.statut === "en_cours" ? "En cours" : r.statut === "termine" ? "Publié" : r.statut === "echec" ? "Échec" : r.statut}
                </span>
              </p>
              {r.erreur && <p className="erreur">{r.erreur}</p>}
              {!!r.incidents?.length && (
                <p className="meta">Incidents : {r.incidents.map((i) => `${i.type} — ${i.detail}`).join(" · ")}</p>
              )}
              {r.agent_events.length > 0 && (
                <details>
                  <summary className="meta">Activité ({r.agent_events.length})</summary>
                  <ul className="meta" style={{ paddingLeft: 18, margin: "6px 0 0" }}>
                    {r.agent_events.slice(0, 40).map((e, i) => (
                      <li key={i} style={{ overflowWrap: "anywhere" }}>{e.resume ?? e.type}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </Cadre>
  );
}

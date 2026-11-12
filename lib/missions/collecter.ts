import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { DUREE_MAX_MINUTES } from "./config";
import { lireSortie } from "./contrat";

type Db = ReturnType<typeof createAdminClient>;
type Run = {
  id: string;
  agent: string;
  mission: "journal" | "recap" | "style" | null;
  session_id: string | null;
  demarre_a: string;
  curseur: string | null;
};
// Événement de session, typé au plus juste de ce qu'on lit.
type Ev = { id: string; type: string; processed_at?: string; [k: string]: unknown };

export type BilanCollecte = { run: string; etat: string };

/** Résumé d'une ligne, lisible dans le journal d'activité (et plus tard la vue Bureau). */
function resumer(ev: Ev): string | null {
  switch (ev.type) {
    case "agent.tool_use": {
      const input = (ev.input ?? {}) as Record<string, unknown>;
      if (ev.name === "web_search") return `Recherche : ${String(input.query ?? "").slice(0, 200)}`;
      if (ev.name === "web_fetch") return `Lecture : ${String(input.url ?? "").slice(0, 300)}`;
      if (ev.name === "read") return `Consulte : ${String(input.file_path ?? input.path ?? "").slice(0, 200)}`;
      return `Outil : ${String(ev.name)}`;
    }
    case "agent.message": {
      const n = ((ev.content ?? []) as { type: string; text?: string }[]).reduce((s, b) => s + (b.text?.length ?? 0), 0);
      return `Message de l'agent (${n} caractères)`;
    }
    case "session.error": {
      const e = (ev.error ?? {}) as { type?: string; message?: string };
      return `Erreur : ${e.type ?? "inconnue"} ${e.message ? `— ${e.message.slice(0, 200)}` : ""}`.trim();
    }
    case "session.status_idle":
      return `En pause : ${(ev.stop_reason as { type?: string } | undefined)?.type ?? "?"}`;
    case "session.status_terminated":
      return "Session terminée";
    case "session.status_rescheduled":
      return "Erreur passagère, nouvelle tentative";
    case "agent.thread_context_compacted":
      return "Contexte compacté";
    default:
      return null; // réflexion, spans, résultats d'outils : trop verbeux
  }
}

async function tousLesEvenements(client: Anthropic, sessionId: string) {
  const evs: Ev[] = [];
  for await (const ev of client.beta.sessions.events.list(sessionId, { order: "asc" })) evs.push(ev as unknown as Ev);
  return evs;
}

function texteFinal(evs: Ev[]) {
  const messages = evs
    .filter((e) => e.type === "agent.message")
    .map((e) => ((e.content ?? []) as { type: string; text?: string }[]).map((b) => b.text ?? "").join(""));
  const debut = messages.findLastIndex((m) => m.includes("<<<RAPPORT"));
  return (debut >= 0 ? messages.slice(debut) : messages).join("\n");
}

async function finaliser(db: Db, run: Run, statut: "termine" | "echec", champs: Record<string, unknown>) {
  // Verrou : un seul appel (webhook, cron ou visite) finalise un run donné.
  const { data } = await db
    .from("agent_runs")
    .update({ termine_a: new Date().toISOString(), statut, ...champs })
    .eq("id", run.id)
    .is("termine_a", null)
    .select("id");
  return (data?.length ?? 0) > 0;
}

async function echouer(db: Db, run: Run, erreur: string, extra: Record<string, unknown> = {}) {
  if (await finaliser(db, run, "echec", { erreur, ...extra })) {
    await db.from("rapports").update({ statut: "echec" }).eq("run_id", run.id);
    await db.from("agent_events").insert({ run_id: run.id, type: "echec", resume: erreur });
  }
}

export async function collecterRun(run: Run, client = new Anthropic(), db = createAdminClient()): Promise<BilanCollecte> {
  if (!run.session_id) {
    await echouer(db, run, "aucune session associée");
    return { run: run.id, etat: "echec" };
  }

  const session = await client.beta.sessions.retrieve(run.session_id);
  const evs = await tousLesEvenements(client, run.session_id);

  // 1. Journal d'activité : seulement les nouveaux événements.
  const depuis = run.curseur ? evs.findIndex((e) => e.id === run.curseur) + 1 : 0;
  const lignes = evs
    .slice(depuis)
    .map((e) => ({ run_id: run.id, event_id: e.id, type: e.type, resume: resumer(e), created_at: e.processed_at }))
    .filter((l) => l.resume);
  if (lignes.length) await db.from("agent_events").upsert(lignes, { onConflict: "event_id", ignoreDuplicates: true });
  const cout = session.usage?.list_cost?.amount ? Number.parseInt(session.usage.list_cost.amount, 10) : null;
  if (evs.length) await db.from("agent_runs").update({ curseur: evs.at(-1)!.id, cout_cents: cout }).eq("id", run.id);

  // 2. Où en est la session ?
  const dernierIdle = evs.findLast((e) => e.type === "session.status_idle");
  const raison = (dernierIdle?.stop_reason as { type?: string } | undefined)?.type;
  const finie = session.status === "terminated" || (session.status === "idle" && raison !== "requires_action");

  if (!finie) {
    const minutes = (Date.now() - new Date(run.demarre_a).getTime()) / 60000;
    if (minutes > DUREE_MAX_MINUTES) {
      try {
        await client.beta.sessions.events.send(run.session_id, { events: [{ type: "user.interrupt" }] });
      } catch {
        /* déjà arrêtée : rien à faire */
      }
      await echouer(db, run, `durée maximale dépassée (${Math.round(minutes)} min > ${DUREE_MAX_MINUTES} min) : mission interrompue`, { cout_cents: cout });
      return { run: run.id, etat: "interrompu" };
    }
    return { run: run.id, etat: `en cours (${session.status})` };
  }

  // 3. Session finie : on lit la réponse.
  const texte = texteFinal(evs);
  if (raison === "budget_reached") {
    await echouer(db, run, "plafond de dépense atteint avant la fin", { sortie_brute: texte || null, cout_cents: cout });
    return { run: run.id, etat: "echec (budget)" };
  }
  if (raison && raison !== "end_turn" && session.status !== "terminated") {
    await echouer(db, run, `session arrêtée : ${raison}`, { sortie_brute: texte || null, cout_cents: cout });
    return { run: run.id, etat: `echec (${raison})` };
  }

  const lu = lireSortie(texte, { type: run.mission ?? "journal", agent: run.agent });
  if (!lu.ok) {
    await echouer(db, run, `sortie non conforme : ${lu.raison}`, { sortie_brute: texte.slice(0, 500_000), cout_cents: cout });
    return { run: run.id, etat: "echec (sortie non conforme)" };
  }

  const s = lu.sortie;
  if (!(await finaliser(db, run, "termine", { incidents: s.incidents, cout_cents: cout }))) {
    return { run: run.id, etat: "déjà finalisé" };
  }
  await db.from("rapports").update({ titre: s.titre, date: s.date, html: s.html, statut: "publie" }).eq("run_id", run.id);
  if (s.carnet.length) {
    await db.from("carnets").insert(s.carnet.map((c) => ({ agent: run.agent, ...c })));
  }
  if (s.decisions.length) {
    await db.from("decisions").insert(s.decisions.map((d) => ({ agent: run.agent, ...d })));
  }
  await db.from("agent_events").insert({
    run_id: run.id,
    type: "publication",
    resume: `Rapport publié${s.incidents.length ? `, ${s.incidents.length} incident(s)` : ""}.`,
  });
  return { run: run.id, etat: "publie" };
}

/** Collecte toutes les missions en cours (ou une seule session, pour le webhook). */
export async function collecterTout(opts: { sessionId?: string } = {}): Promise<BilanCollecte[]> {
  const db = createAdminClient();
  let q = db.from("agent_runs").select("id, agent, mission, session_id, demarre_a, curseur").eq("statut", "en_cours");
  if (opts.sessionId) q = q.eq("session_id", opts.sessionId);
  const { data: runs } = await q;

  const client = new Anthropic();
  const bilans: BilanCollecte[] = [];
  for (const run of (runs ?? []) as Run[]) {
    try {
      bilans.push(await collecterRun(run, client, db));
    } catch (e) {
      bilans.push({ run: run.id, etat: `erreur de collecte : ${e instanceof Error ? e.message.slice(0, 200) : "?"}` });
    }
  }
  return bilans;
}

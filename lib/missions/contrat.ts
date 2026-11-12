// Lecture de la réponse finale d'un agent selon shared/contrat-sortie.md.
// Toute non-conformité renvoie { ok: false } avec la raison ; le brut est
// conservé ailleurs pour diagnostic.

export type EntreeCarnet = { date: string; entree: string; origine: "suggere_agent" | "decide_marjana" };
export type Decision = { date: string; decision: string; raison: string; annulation: string };
export type Incident = { type: string; detail: string };

export type Sortie = {
  type: "journal" | "recap";
  date: string;
  titre: string;
  html: string;
  carnet: EntreeCarnet[];
  decisions: Decision[];
  incidents: Incident[];
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function bloc(texte: string, nom: string) {
  const m = texte.match(new RegExp(`<<<${nom}>>>([\\s\\S]*?)<<<FIN_${nom}>>>`));
  return m ? m[1].trim() : null;
}

function tableauJson(texte: string, nom: string): unknown[] {
  const brut = bloc(texte, nom);
  if (brut === null) throw new Error(`bloc ${nom} absent`);
  let v: unknown;
  try {
    v = JSON.parse(brut);
  } catch {
    throw new Error(`bloc ${nom} : JSON invalide`);
  }
  if (!Array.isArray(v)) throw new Error(`bloc ${nom} : un tableau était attendu`);
  return v;
}

const chaine = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function lireSortie(
  texte: string,
  attendu: { type: "journal" | "recap"; agent: string },
): { ok: true; sortie: Sortie } | { ok: false; raison: string } {
  try {
    const entete = texte.match(/<<<RAPPORT\s+type="([^"]*)"\s+date="([^"]*)"\s+titre="([^"]*)"\s*>>>/);
    if (!entete) throw new Error("en-tête RAPPORT absent ou mal formé");
    const [, type, date, titre] = entete;
    if (type !== attendu.type) throw new Error(`type « ${type} » au lieu de « ${attendu.type} »`);
    if (!DATE_RE.test(date)) throw new Error(`date « ${date} » invalide`);

    const corps = texte.match(/<<<RAPPORT[^>]*>>>([\s\S]*?)<<<FIN_RAPPORT>>>/);
    const html = corps?.[1].trim() ?? "";
    if (html.length < 200 || !/<html[\s>]/i.test(html)) throw new Error("HTML du rapport absent ou incomplet");

    const carnet = tableauJson(texte, "CARNET").map((e) => {
      const o = e as Record<string, unknown>;
      const origine = o.origine === "decide_marjana" ? "decide_marjana" : "suggere_agent";
      const d = chaine(o.date, 10);
      return { date: DATE_RE.test(d) ? d : date, entree: chaine(o.entree, 2000), origine } as EntreeCarnet;
    }).filter((e) => e.entree);

    const decisions = tableauJson(texte, "DECISIONS").map((e) => {
      const o = e as Record<string, unknown>;
      const d = chaine(o.date, 10);
      return {
        date: DATE_RE.test(d) ? d : date,
        decision: chaine(o.decision, 1000),
        raison: chaine(o.raison, 2000),
        annulation: chaine(o.annulation, 1000),
      };
    }).filter((e) => e.decision);

    const incidents = tableauJson(texte, "INCIDENTS").map((e) => {
      const o = e as Record<string, unknown>;
      return { type: chaine(o.type, 60) || "autre", detail: chaine(o.detail, 1000) };
    });

    // Contrat : seul le Chef de cabinet rend des décisions.
    if (attendu.agent !== "chef-cabinet" && decisions.length) {
      incidents.push({ type: "contrat", detail: `${decisions.length} décision(s) rendue(s) par un agent non autorisé : ignorée(s).` });
      decisions.length = 0;
    }

    return { ok: true, sortie: { type: attendu.type, date, titre: titre.slice(0, 300), html, carnet, decisions, incidents } };
  } catch (e) {
    return { ok: false, raison: e instanceof Error ? e.message : "sortie illisible" };
  }
}

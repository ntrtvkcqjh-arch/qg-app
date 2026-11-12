import type { Metadata } from "next";
import Link from "next/link";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { agentInfo, dateCourte } from "@/lib/agents";

export const metadata: Metadata = { title: "Recherche" };

type Resultat = { id: string; agent: string; date: string; titre: string | null; html: string | null };

/** Texte lisible d'un rapport HTML (sans styles, scripts ni balises). */
function texteDe(html: string) {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();
}

const sansAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Extrait autour de la première occurrence, découpé en [avant, trouvé, après]. */
function extrait(texte: string, q: string): [string, string, string] | null {
  const i = sansAccents(texte).indexOf(sansAccents(q));
  if (i < 0) return null;
  const debut = Math.max(0, i - 90);
  const fin = Math.min(texte.length, i + q.length + 140);
  return [
    (debut > 0 ? "…" : "") + texte.slice(debut, i),
    texte.slice(i, i + q.length),
    texte.slice(i + q.length, fin) + (fin < texte.length ? "…" : ""),
  ];
}

export default async function Recherche({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requireUser();
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);

  let resultats: { r: Resultat; morceaux: [string, string, string] | null }[] = [];
  if (q.length >= 2) {
    const motif = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const { data } = await supabase
      .from("rapports")
      .select("id, agent, date, titre, html")
      .eq("statut", "publie")
      .or(`html.ilike.${JSON.stringify(motif)},titre.ilike.${JSON.stringify(motif)}`)
      .order("date", { ascending: false })
      .limit(30);
    resultats = ((data ?? []) as Resultat[])
      .map((r) => ({ r, morceaux: extrait(texteDe(r.html ?? ""), q) }))
      // L'occurrence peut n'être que dans le code HTML (une classe, un lien) : on l'écarte.
      .filter((x) => x.morceaux || sansAccents(x.r.titre ?? "").includes(sansAccents(q)));
  }

  return (
    <Cadre>
      <p className="k">Archives</p>
      <h1>Rechercher</h1>
      <div className="double" />
      <form action="/recherche" className="ligne" role="search">
        <input type="text" name="q" defaultValue={q} placeholder="Un deal, une norme, un mot…" aria-label="Rechercher dans les rapports" enterKeyHint="search" />
        <button type="submit" className="bouton">Chercher</button>
      </form>

      {q.length >= 2 && (
        <p className="meta" style={{ marginTop: 12 }}>
          {resultats.length === 0 ? `Aucun rapport ne contient « ${q} ».` : `${resultats.length} rapport${resultats.length > 1 ? "s" : ""} trouvé${resultats.length > 1 ? "s" : ""}.`}
        </p>
      )}

      <ul className="cartes" style={{ marginTop: 10 }}>
        {resultats.map(({ r, morceaux }) => {
          const a = agentInfo(r.agent);
          return (
            <li key={r.id}>
              <Link href={`/rapports/${r.id}`} className="carte" style={{ "--couleur": a.couleur } as React.CSSProperties}>
                <p className="k"><span>{a.rubrique} · {dateCourte(r.date)}</span></p>
                <h2>{r.titre ?? a.rubrique}</h2>
                {morceaux && (
                  <p className="meta" style={{ margin: "6px 0 0" }}>
                    {morceaux[0]}
                    <mark>{morceaux[1]}</mark>
                    {morceaux[2]}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </Cadre>
  );
}

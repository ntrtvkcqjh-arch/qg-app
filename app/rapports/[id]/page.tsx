import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser, UUID_RE } from "@/lib/auth";
import { agentInfo, dateCourte } from "@/lib/agents";
import { preparerHtmlRapport, SANDBOX } from "@/lib/sandbox";
import BarreRetour from "./BarreRetour";

export default async function LectureRapport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const { supabase } = await requireUser();
  const [{ data: rapport }, { data: retours }] = await Promise.all([
    supabase
      .from("rapports")
      .select("id, agent, type, date, titre, html, statut")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("retours")
      .select("valeur")
      .eq("rapport_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);
  if (!rapport) notFound();

  const a = agentInfo(rapport.agent);
  const lisible = rapport.statut === "publie" && rapport.html;

  return (
    <div className="lecture" style={{ "--couleur": a.couleur } as React.CSSProperties}>
      <div className="lecture-haut">
        <Link href="/" className="lien petit">← Kiosque</Link>
        <span className="meta">
          <span className="pastille" />
          {a.rubrique} · {dateCourte(rapport.date)}
        </span>
      </div>

      {lisible ? (
        <iframe
          className="rapport-cadre"
          title={rapport.titre ?? a.rubrique}
          sandbox={SANDBOX}
          referrerPolicy="no-referrer"
          srcDoc={preparerHtmlRapport(rapport.html!)}
        />
      ) : (
        <div className="colonne" style={{ flex: 1 }}>
          <h1>{rapport.titre ?? a.rubrique}</h1>
          <div className="double" />
          <p className="vide">
            {rapport.statut === "en_cours"
              ? "L'agent est encore en train de rédiger cette édition."
              : "Cette édition a échoué. Le détail est conservé pour diagnostic."}
          </p>
        </div>
      )}

      {lisible && <BarreRetour rapportId={rapport.id} dernier={retours?.[0]?.valeur ?? null} />}
    </div>
  );
}

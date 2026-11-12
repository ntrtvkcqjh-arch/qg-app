import Link from "next/link";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { agentInfo, dateLongue } from "@/lib/agents";

type LigneRapport = {
  id: string;
  agent: string;
  type: string;
  date: string;
  titre: string | null;
  statut: "en_cours" | "publie" | "echec";
};

export default async function Kiosque() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("rapports")
    .select("id, agent, type, date, titre, statut")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  const rapports = (data ?? []) as LigneRapport[];
  const parJour = new Map<string, LigneRapport[]>();
  for (const r of rapports) parJour.set(r.date, [...(parJour.get(r.date) ?? []), r]);

  return (
    <Cadre>
      <p className="k">Kiosque</p>
      <h1>Les éditions</h1>
      <div className="double" />

      {error && <p className="erreur">Impossible de charger les rapports.</p>}
      {!error && rapports.length === 0 && (
        <p className="vide">Aucun rapport pour l&apos;instant. Le premier Journal arrivera ici.</p>
      )}

      {[...parJour].map(([jour, liste]) => (
        <section key={jour}>
          <h2 className="jour">{dateLongue(jour)}</h2>
          <ul className="cartes">
            {liste.map((r) => {
              const a = agentInfo(r.agent);
              return (
                <li key={r.id}>
                  <Link
                    href={`/rapports/${r.id}`}
                    className="carte"
                    style={{ "--couleur": a.couleur } as React.CSSProperties}
                  >
                    <p className="k">
                      <span>{a.rubrique} · {a.nom}</span>
                      {r.statut === "en_cours" && <span className="tag attente">En cours</span>}
                      {r.statut === "echec" && <span className="tag echec">Échec</span>}
                    </p>
                    <h2>{r.titre ?? (r.type === "recap" ? "Récap de la semaine" : "Journal du matin")}</h2>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Cadre>
  );
}

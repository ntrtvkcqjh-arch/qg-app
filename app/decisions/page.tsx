import type { Metadata } from "next";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { agentInfo, dateCourte } from "@/lib/agents";
import { marquerAnnulee } from "./actions";

export const metadata: Metadata = { title: "Décisions" };

type Decision = {
  id: string;
  agent: string;
  date: string;
  decision: string;
  raison: string | null;
  annulation: string | null;
  annulee: boolean;
};

export default async function PageDecisions() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("decisions")
    .select("id, agent, date, decision, raison, annulation, annulee")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  const decisions = (data ?? []) as Decision[];

  return (
    <Cadre>
      <p className="k">Décisions</p>
      <h1>Ce que les agents ont décidé</h1>
      <p className="meta">Annule une décision si elle ne te convient pas : l&apos;agent en tiendra compte.</p>
      <div className="double" />

      {decisions.length === 0 && <p className="vide">Aucune décision pour l&apos;instant.</p>}
      <ul className="liste">
        {decisions.map((d) => {
          const a = agentInfo(d.agent);
          return (
            <li
              key={d.id}
              className={`decision ${d.annulee ? "annulee" : ""}`}
              style={{ "--couleur": a.couleur } as React.CSSProperties}
            >
              <p className="meta">
                <span className="pastille" />
                {a.nom} · {dateCourte(d.date)}
                {d.annulee && <> · <span className="tag echec">Annulée</span></>}
              </p>
              <h2>{d.decision}</h2>
              {d.raison && <p>{d.raison}</p>}
              {d.annulation && <p className="meta">Si annulée : {d.annulation}</p>}
              <form action={marquerAnnulee} className="actions">
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="annulee" value={String(!d.annulee)} />
                <button type="submit" className={d.annulee ? "lien" : "bouton secondaire"}>
                  {d.annulee ? "Rétablir" : "Annuler"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </Cadre>
  );
}

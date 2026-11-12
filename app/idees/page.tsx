import type { Metadata } from "next";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { dateCourte } from "@/lib/agents";
import { ajouterIdee, changerStatutIdee } from "./actions";

export const metadata: Metadata = { title: "Idées" };

type Idee = { id: string; texte: string; statut: string; created_at: string };

const LIBELLE: Record<string, string> = { nouvelle: "Nouvelle", retenue: "Retenue", ecartee: "Écartée" };

export default async function PageIdees() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("idees")
    .select("id, texte, statut, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const idees = (data ?? []) as Idee[];

  return (
    <Cadre>
      <p className="k">Boîte à idées</p>
      <h1>Les idées</h1>
      <p className="meta">Le Chef de cabinet les relit chaque dimanche.</p>
      <div className="double" />

      <form action={ajouterIdee} className="pile">
        <textarea name="texte" maxLength={2000} required placeholder="Une idée, même brute…" aria-label="Nouvelle idée" />
        <button type="submit" className="bouton">Déposer l&apos;idée</button>
      </form>

      <div className="filet" />
      {idees.length === 0 && <p className="vide">La boîte est vide.</p>}
      <ul className="liste">
        {idees.map((i) => (
          <li key={i.id}>
            <p className="meta">
              {dateCourte(i.created_at)} ·{" "}
              <span className={`tag ${i.statut === "ecartee" ? "echec" : i.statut === "nouvelle" ? "attente" : ""}`}>
                {LIBELLE[i.statut] ?? i.statut}
              </span>
            </p>
            <p style={{ overflowWrap: "anywhere" }}>{i.texte}</p>
            <div className="ligne">
              {Object.keys(LIBELLE)
                .filter((s) => s !== i.statut)
                .map((s) => (
                  <form key={s} action={changerStatutIdee}>
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="statut" value={s} />
                    <button type="submit" className="lien petit">→ {LIBELLE[s]}</button>
                  </form>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </Cadre>
  );
}

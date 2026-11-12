import type { Metadata } from "next";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { ajouterTodo, basculerTodo, changerPriorite, supprimerTodo } from "./actions";

export const metadata: Metadata = { title: "To-do" };

const PRIO = { 1: "HAUTE", 2: "MOY.", 3: "BASSE" } as Record<number, string>;

type Todo = { id: string; texte: string; priorite: number; fait: boolean };

export default async function PageTodo() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("todos")
    .select("id, texte, priorite, fait")
    .order("fait")
    .order("priorite")
    .order("created_at", { ascending: false });
  const todos = (data ?? []) as Todo[];
  const restantes = todos.filter((t) => !t.fait).length;

  return (
    <Cadre>
      <p className="k">To-do</p>
      <h1>À faire</h1>
      <p className="meta">{restantes} en cours · touche l&apos;étiquette pour changer la priorité</p>
      <div className="double" />

      <form action={ajouterTodo} className="pile">
        <div className="ligne">
          <input type="text" name="texte" maxLength={500} required placeholder="Nouvelle tâche" aria-label="Nouvelle tâche" />
          <select name="priorite" defaultValue="2" aria-label="Priorité">
            <option value="1">Haute</option>
            <option value="2">Moyenne</option>
            <option value="3">Basse</option>
          </select>
        </div>
        <button type="submit" className="bouton">Ajouter</button>
      </form>

      <div className="filet" />
      {todos.length === 0 && <p className="vide">Rien à faire. Profites-en.</p>}
      <ul className="liste">
        {todos.map((t) => (
          <li key={t.id} className={`todo ${t.fait ? "fait" : ""}`}>
            <form action={basculerTodo}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="fait" value={String(t.fait)} />
              <button type="submit" className="case" aria-label={t.fait ? "Marquer à faire" : "Marquer fait"}>
                {t.fait ? "✓" : ""}
              </button>
            </form>
            <span className="texte">{t.texte}</span>
            {!t.fait && (
              <form action={changerPriorite}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="priorite" value={t.priorite} />
                <button type="submit" className={`prio p${t.priorite}`} aria-label="Changer la priorité">
                  {PRIO[t.priorite]}
                </button>
              </form>
            )}
            <form action={supprimerTodo}>
              <input type="hidden" name="id" value={t.id} />
              <button type="submit" className="croix" aria-label="Supprimer">×</button>
            </form>
          </li>
        ))}
      </ul>
    </Cadre>
  );
}

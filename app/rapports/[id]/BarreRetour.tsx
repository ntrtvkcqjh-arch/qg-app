"use client";

import { useActionState } from "react";
import { enregistrerRetour, type EtatRetour } from "./actions";

const LIBELLES: Record<string, string> = { utile: "Utile", bof: "Bof", inutile: "Inutile" };

export default function BarreRetour({
  rapportId,
  dernier,
}: {
  rapportId: string;
  dernier: string | null;
}) {
  const [etat, action, enCours] = useActionState<EtatRetour, FormData>(enregistrerRetour, {});
  const valeur = etat.ok ? etat.valeur : dernier;

  return (
    <form action={action} className="retour-barre">
      <input type="hidden" name="rapport_id" value={rapportId} />
      <div className="trois">
        {Object.entries(LIBELLES).map(([v, label]) => (
          <button
            key={v}
            type="submit"
            name="valeur"
            value={v}
            disabled={enCours}
            className={`bouton ${valeur === v ? "" : "secondaire"}`}
            aria-pressed={valeur === v}
          >
            {label}
          </button>
        ))}
      </div>
      <details>
        <summary>
          {etat.ok
            ? `Merci, retour « ${LIBELLES[etat.valeur!]} » enregistré.`
            : valeur
              ? `Ton dernier retour : ${LIBELLES[valeur]}. Ajouter un commentaire ?`
              : "Ajouter un commentaire (facultatif)"}
        </summary>
        <textarea name="commentaire" maxLength={2000} placeholder="Ce qui t'a servi, ce qui manquait…" />
      </details>
      {etat.erreur && <p className="erreur" role="alert">{etat.erreur}</p>}
    </form>
  );
}

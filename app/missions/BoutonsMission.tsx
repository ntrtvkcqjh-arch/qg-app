"use client";

import { useActionState } from "react";
import { lancerManuellement, type EtatMission } from "./actions";

export default function BoutonsMission() {
  const [etat, action, enCours] = useActionState<EtatMission, FormData>(lancerManuellement, {});
  return (
    <form action={action} className="pile">
      <div className="ligne">
        <button type="submit" name="mission" value="journal" className="bouton" disabled={enCours} style={{ flex: 1 }}>
          Lancer le Journal
        </button>
        <button type="submit" name="mission" value="recap" className="bouton secondaire" disabled={enCours} style={{ flex: 1 }}>
          Lancer le récap
        </button>
      </div>
      <button type="submit" name="mission" value="style" className="bouton secondaire" disabled={enCours}>
        Lancer la Styliste
      </button>
      {enCours && <p className="meta">Démarrage…</p>}
      {etat.message && <p className="succes">{etat.message}</p>}
      {etat.erreur && <p className="erreur" role="alert">{etat.erreur}</p>}
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { seConnecter, type EtatConnexion } from "./actions";

export default function FormulaireConnexion() {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(seConnecter, {});

  return (
    <form action={action} className="pile">
      <label htmlFor="email">Adresse e-mail</label>
      <input id="email" name="email" type="email" autoComplete="username" inputMode="email" required />
      <label htmlFor="password">Mot de passe</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {etat.erreur && <p className="erreur" role="alert">{etat.erreur}</p>}
      <button type="submit" className="bouton" disabled={enCours}>
        {enCours ? "Connexion…" : "Entrer au QG"}
      </button>
    </form>
  );
}

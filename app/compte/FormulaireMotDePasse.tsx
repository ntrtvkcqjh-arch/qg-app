"use client";

import { useActionState } from "react";
import { changerMotDePasse, type EtatMotDePasse } from "./actions";

export default function FormulaireMotDePasse({ email }: { email: string }) {
  const [etat, action, enCours] = useActionState<EtatMotDePasse, FormData>(changerMotDePasse, {});

  if (etat.ok) {
    return (
      <p className="succes" role="status">
        Mot de passe enregistré. Désormais, tu entres au QG avec ton e-mail et ce mot de passe.
      </p>
    );
  }

  return (
    <form action={action} className="pile">
      {/* Champ e-mail caché : aide le trousseau iCloud à associer le mot de passe au bon compte. */}
      <input type="email" name="username" autoComplete="username" value={email} hidden readOnly />
      <label htmlFor="mdp">Nouveau mot de passe</label>
      <input id="mdp" name="mdp" type="password" autoComplete="new-password" minLength={10} required />
      <label htmlFor="confirmation">Confirmer</label>
      <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={10} required />
      {etat.erreur && <p className="erreur" role="alert">{etat.erreur}</p>}
      <button type="submit" className="bouton" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer mon mot de passe"}
      </button>
    </form>
  );
}

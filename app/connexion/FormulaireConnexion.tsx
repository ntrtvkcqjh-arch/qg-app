"use client";

import { useActionState, useState } from "react";
import { envoyerCode, verifierCode, type EtatConnexion } from "./actions";

const initial: EtatConnexion = { etape: "email" };

export default function FormulaireConnexion() {
  const [etatEmail, actionEmail, envoiEnCours] = useActionState(envoyerCode, initial);
  const [etatCode, actionCode, verifEnCours] = useActionState(verifierCode, { etape: "code" });
  const [recommencer, setRecommencer] = useState(false);

  const etapeCode =
    !recommencer && etatEmail.etape === "code" && etatCode.etape !== "email";

  if (!etapeCode) {
    const erreur = etatCode.etape === "email" ? etatCode.erreur : etatEmail.erreur;
    return (
      <form action={(fd) => { setRecommencer(false); return actionEmail(fd); }} className="pile">
        <label htmlFor="email">Adresse e-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <button type="submit" className="bouton" disabled={envoiEnCours}>
          {envoiEnCours ? "Envoi…" : "Recevoir un code"}
        </button>
      </form>
    );
  }

  return (
    <form action={actionCode} className="pile">
      <p className="meta">{etatEmail.message}</p>
      <label htmlFor="code">Code reçu par e-mail</label>
      <input
        id="code"
        name="code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={12}
        required
        autoFocus
      />
      {etatCode.erreur && <p className="erreur" role="alert">{etatCode.erreur}</p>}
      <button type="submit" className="bouton" disabled={verifEnCours}>
        {verifEnCours ? "Vérification…" : "Se connecter"}
      </button>
      <button type="button" className="lien" onClick={() => setRecommencer(true)}>
        Changer d&apos;adresse ou renvoyer un code
      </button>
    </form>
  );
}

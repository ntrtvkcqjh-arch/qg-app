import type { Metadata } from "next";
import FormulaireConnexion from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion" };

export default async function Connexion({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;
  return (
    <main className="colonne connexion">
      <p className="k">Accès privé</p>
      <h1>Le QG</h1>
      <div className="double" />
      {erreur && (
        <p className="erreur" role="alert">
          Le lien a expiré ou a déjà servi.
        </p>
      )}
      <FormulaireConnexion />
    </main>
  );
}

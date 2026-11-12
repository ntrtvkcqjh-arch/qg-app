import Navigation from "./Navigation";
import { seDeconnecter } from "@/app/connexion/actions";

/** Cadre commun des pages connectées : en-tête, contenu, onglets en bas. */
export default function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="entete">
        <span className="marque">Le QG</span>
        <form action={seDeconnecter}>
          <button type="submit" className="lien petit">Se déconnecter</button>
        </form>
      </header>
      <main className="colonne">{children}</main>
      <Navigation />
    </>
  );
}

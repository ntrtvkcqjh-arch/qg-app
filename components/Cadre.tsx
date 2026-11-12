import Link from "next/link";
import Navigation from "./Navigation";
import { seDeconnecter } from "@/app/connexion/actions";

/** Cadre commun des pages connectées : en-tête, contenu, onglets en bas. */
export default function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="entete">
        <span className="marque">Le QG</span>
        <span style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Link href="/compte" className="lien petit">Mon compte</Link>
          <form action={seDeconnecter}>
            <button type="submit" className="lien petit">Se déconnecter</button>
          </form>
        </span>
      </header>
      <main className="colonne">{children}</main>
      <Navigation />
    </>
  );
}

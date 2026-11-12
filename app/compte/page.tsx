import type { Metadata } from "next";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import FormulaireMotDePasse from "./FormulaireMotDePasse";

export const metadata: Metadata = { title: "Mon compte" };

export default async function PageCompte() {
  const { supabase } = await requireUser();
  const { data } = await supabase.auth.getClaims();
  const email = (data?.claims?.email as string | undefined) ?? "";
  return (
    <Cadre>
      <p className="k">Mon compte</p>
      <h1>Mon mot de passe</h1>
      <p className="meta">
        Au moins 10 caractères. Le plus simple et le plus sûr : une petite phrase que toi seule connais
        (par exemple trois ou quatre mots). Sur iPhone, accepte de l&apos;enregistrer dans le trousseau : Face ID le remplira.
      </p>
      <div className="double" />
      <FormulaireMotDePasse email={email} />
    </Cadre>
  );
}

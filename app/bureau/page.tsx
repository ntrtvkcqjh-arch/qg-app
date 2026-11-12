import type { Metadata } from "next";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { lireBureau } from "@/lib/bureau";
import { collecterApresAffichage } from "@/lib/missions/collecter";
import ActualisationAuto from "@/app/missions/ActualisationAuto";
import Piece from "./Piece";

export const metadata: Metadata = { title: "Bureau" };
export const dynamic = "force-dynamic";

export default async function PageBureau() {
  const { supabase } = await requireUser();
  const bureau = await lireBureau(supabase);
  if (bureau.enCours) collecterApresAffichage(); // en arrière-plan, après l'affichage

  return (
    <Cadre>
      <p className="k">En direct</p>
      <h1>Le Bureau</h1>
      <div className="double" />
      <Piece agents={bureau.agents} heure={bureau.heure} minute={bureau.minute} />
      <div style={{ marginTop: 10 }}>
        <ActualisationAuto active={bureau.enCours} />
        {!bureau.enCours && <p className="meta">Personne ne travaille en ce moment. Touche un agent pour voir ce qu&apos;il a fait.</p>}
      </div>
    </Cadre>
  );
}

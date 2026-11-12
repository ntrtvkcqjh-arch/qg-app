import type { Metadata } from "next";
import Cadre from "@/components/Cadre";
import { requireUser } from "@/lib/auth";
import { lireBureau } from "@/lib/bureau";
import { collecterTout } from "@/lib/missions/collecter";
import ActualisationAuto from "@/app/missions/ActualisationAuto";
import Piece from "./Piece";

export const metadata: Metadata = { title: "Bureau" };
export const dynamic = "force-dynamic";

export default async function PageBureau() {
  const { supabase } = await requireUser();
  let bureau = await lireBureau(supabase);
  if (bureau.enCours) {
    // Récupère les dernières actions auprès d'Anthropic avant d'afficher.
    try {
      await collecterTout();
      bureau = await lireBureau(supabase);
    } catch {
      /* affichage quand même */
    }
  }

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

import { cronAutorise, refus } from "@/lib/missions/garde";
import { lancerMission } from "@/lib/missions/lancer";
import { maintenantParis } from "@/lib/missions/temps";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// « 0 10 * * 0 » (UTC), à ±59 min près sur Vercel Hobby = dimanche entre 11h
// et 13h à Paris selon la saison : avec 60 min max, prêt avant 15h.
export async function GET(request: Request) {
  if (!cronAutorise(request)) return refus();

  const { jourSemaine, heure } = maintenantParis();
  if (jourSemaine !== 7 || heure < 11 || heure > 13) {
    return Response.json({ ignore: `hors créneau (Paris : jour ${jourSemaine}, ${heure}h)` });
  }
  return Response.json({ lancement: await lancerMission("style") });
}

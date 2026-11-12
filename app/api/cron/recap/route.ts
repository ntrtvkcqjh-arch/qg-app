import { cronAutorise, refus } from "@/lib/missions/garde";
import { lancerMission } from "@/lib/missions/lancer";
import { maintenantParis } from "@/lib/missions/temps";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// « 0 16 * * 0 » (UTC) = dimanche entre 17h et 19h à Paris selon la saison :
// avec 60 min max, le récap est prêt avant 20h.
export async function GET(request: Request) {
  if (!cronAutorise(request)) return refus();

  const { jourSemaine, heure } = maintenantParis();
  if (jourSemaine !== 7 || heure < 16 || heure > 18) {
    return Response.json({ ignore: `hors créneau (Paris : jour ${jourSemaine}, ${heure}h)` });
  }
  return Response.json({ lancement: await lancerMission("recap") });
}

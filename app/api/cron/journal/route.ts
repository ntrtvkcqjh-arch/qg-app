import { collecterTout } from "@/lib/missions/collecter";
import { cronAutorise, refus } from "@/lib/missions/garde";
import { lancerMission } from "@/lib/missions/lancer";
import { maintenantParis } from "@/lib/missions/temps";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron (UTC, à l'heure près sur Hobby) : « 0 3 * * * » = entre 4h et 6h
// à Paris selon la saison. Avec 60 min max par mission, le Journal est prêt
// avant 7h30 dans tous les cas.
export async function GET(request: Request) {
  if (!cronAutorise(request)) return refus();

  const { heure } = maintenantParis();
  if (heure < 3 || heure > 6) {
    return Response.json({ ignore: `hors créneau (heure de Paris : ${heure}h)` });
  }

  const nettoyage = await collecterTout(); // ferme ce qui traîne d'hier
  const lancement = await lancerMission("journal");
  return Response.json({ lancement, nettoyage });
}

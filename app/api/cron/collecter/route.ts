import { collecterTout } from "@/lib/missions/collecter";
import { cronAutorise, refus } from "@/lib/missions/garde";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Filet de sécurité : le webhook d'Anthropic fait la collecte en temps réel ;
// ce passage rattrape un avis perdu et interrompt les missions trop longues.
export async function GET(request: Request) {
  if (!cronAutorise(request)) return refus();
  return Response.json({ bilans: await collecterTout() });
}

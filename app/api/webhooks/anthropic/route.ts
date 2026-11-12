import Anthropic from "@anthropic-ai/sdk";
import { collecterTout } from "@/lib/missions/collecter";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Avis d'Anthropic quand une session change d'état (signé HMAC).
// Contenu volontairement minimal : on relit la session nous-mêmes.
export async function POST(request: Request) {
  const key = process.env.ANTHROPIC_WEBHOOK_SIGNING_KEY;
  if (!key) return new Response("Webhook non configuré", { status: 503 });

  const corps = await request.text(); // corps brut, indispensable à la vérification
  let evenement;
  try {
    evenement = new Anthropic().beta.webhooks.unwrap(corps, {
      headers: Object.fromEntries(request.headers),
      key,
    });
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  const { type, id } = evenement.data as { type: string; id: string };
  if (type === "session.status_idled" || type === "session.status_terminated") {
    await collecterTout({ sessionId: id }); // idempotent : les doublons ne publient rien deux fois
  }
  return new Response(null, { status: 204 });
}

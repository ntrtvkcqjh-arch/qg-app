import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Vérifie l'en-tête « Authorization: Bearer <CRON_SECRET> » envoyé par Vercel Cron.
 * Sans secret configuré, tout est refusé.
 */
export function cronAutorise(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const recu = Buffer.from(request.headers.get("authorization") ?? "");
  const attendu = Buffer.from(`Bearer ${secret}`);
  return recu.length === attendu.length && timingSafeEqual(recu, attendu);
}

export const refus = () => new Response("Non autorisé", { status: 401 });

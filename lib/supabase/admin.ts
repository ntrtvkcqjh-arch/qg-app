import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase « serveur » avec la clé secrète : contourne la RLS.
 * Réservé aux écritures des agents (routes cron / webhook / actions serveur).
 * Ne jamais importer depuis un composant client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

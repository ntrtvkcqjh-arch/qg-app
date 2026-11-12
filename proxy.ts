import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Pages accessibles sans session.
const PUBLIC_PATHS = ["/connexion", "/auth/"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    },
  );

  // Rafraîchit la session si besoin et vérifie le jeton.
  const { data } = await supabase.auth.getClaims();
  const connecte = Boolean(data?.claims?.sub);

  const path = request.nextUrl.pathname;
  const estPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!connecte && !estPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = "";
    const redirection = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirection.cookies.set(c));
    return redirection;
  }

  return response;
}

export const config = {
  // Tout sauf les fichiers statiques et les routes serveur protégées par leur
  // propre secret (/api/cron : CRON_SECRET ; /api/webhooks : signature HMAC),
  // et /essais/ : pages publiques et inoffensives du jeu de tests.
  matcher: [
    "/((?!_next/static|_next/image|api/cron|api/webhooks|essais/|favicon.ico|manifest.webmanifest|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};

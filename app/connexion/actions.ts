"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EtatConnexion = {
  etape: "email" | "code";
  message?: string;
  erreur?: string;
};

const COOKIE_EMAIL = "qg_email_en_attente";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function origine() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function envoyerCode(
  _prev: EtatConnexion,
  formData: FormData,
): Promise<EtatConnexion> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { etape: "email", erreur: "Adresse e-mail invalide." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // aucun nouveau compte, jamais
      emailRedirectTo: `${await origine()}/auth/confirm`,
    },
  });

  // Même réponse que le compte existe ou non : on ne révèle rien.
  if (error && error.status !== 400 && error.status !== 422) {
    return { etape: "email", erreur: "Envoi impossible pour le moment. Réessaie dans une minute." };
  }

  (await cookies()).set(COOKIE_EMAIL, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 15,
    path: "/connexion",
  });

  return {
    etape: "code",
    message: "Si cette adresse est autorisée, un e-mail vient de partir. Saisis le code qu'il contient.",
  };
}

export async function verifierCode(
  _prev: EtatConnexion,
  formData: FormData,
): Promise<EtatConnexion> {
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  const store = await cookies();
  const email = store.get(COOKIE_EMAIL)?.value;

  if (!email) return { etape: "email", erreur: "Le délai est dépassé. Redemande un code." };
  if (!/^\d{6,10}$/.test(code)) return { etape: "code", erreur: "Le code contient uniquement des chiffres." };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) return { etape: "code", erreur: "Code incorrect ou expiré." };

  store.delete({ name: COOKIE_EMAIL, path: "/connexion" });
  redirect("/");
}

export async function seDeconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}

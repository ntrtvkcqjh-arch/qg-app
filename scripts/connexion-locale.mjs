// Connexion de secours EN LOCAL, sans e-mail.
// Usage : node --env-file=.env.local scripts/connexion-locale.mjs
// Génère un lien de connexion à usage unique pour l'unique compte
// et l'ouvre dans le navigateur par défaut. Le jeton n'est jamais affiché.
import { execFileSync } from "node:child_process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Variables manquantes : lance-le avec --env-file=.env.local");
  process.exit(1);
}
const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

const { users = [] } = await (await fetch(`${url}/auth/v1/admin/users?per_page=5`, { headers: h })).json();
if (users.length !== 1) {
  console.error(`Arrêt : ${users.length} comptes trouvés, 1 attendu.`);
  process.exit(1);
}

const r = await fetch(`${url}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: h,
  body: JSON.stringify({ type: "magiclink", email: users[0].email }),
});
const j = await r.json();
const token = j.properties?.hashed_token ?? j.hashed_token;
if (!token) {
  console.error("Échec de la génération du lien :", r.status, j.error_code ?? j.msg ?? "");
  process.exit(1);
}

execFileSync("open", [`http://localhost:3000/auth/confirm?token_hash=${token}&type=magiclink`]);
console.log("Lien ouvert dans ton navigateur. Il ne sert qu'une fois.");

/**
 * Prépare le HTML d'un agent (non fiable) pour une iframe sandboxée.
 *
 * L'iframe elle-même porte sandbox="allow-popups allow-popups-to-escape-sandbox" :
 * pas de scripts, pas de formulaires, pas d'accès au site parent (origine opaque).
 * On ajoute en plus, à l'intérieur du document :
 *  - une CSP qui interdit tout chargement externe (images espionnes, polices,
 *    feuilles de style distantes) et tout script ;
 *  - <base target="_blank"> pour que les liens des sources s'ouvrent dans un
 *    nouvel onglet au lieu de rester bloqués dans le cadre.
 */
const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; script-src 'none'; form-action 'none'; base-uri 'none'";

const ENTETE = `<meta http-equiv="Content-Security-Policy" content="${CSP}"><base target="_blank">`;

export function preparerHtmlRapport(html: string) {
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}${ENTETE}`);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">${ENTETE}</head><body>${html}</body></html>`;
}

export const SANDBOX = "allow-popups allow-popups-to-escape-sandbox";

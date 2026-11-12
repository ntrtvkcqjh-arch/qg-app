#!/bin/bash
# Envoie les variables de .env.local vers le projet Vercel « qg-app » (Production),
# sans jamais les afficher. Usage : bash scripts/vercel-variables.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="/usr/local/bin:$PATH"

[ -f .env.local ] || { echo "Fichier .env.local introuvable."; exit 1; }

echo "1/3 Connexion à Vercel (une page s'ouvre dans ton navigateur : valide-la)…"
npx --yes vercel@latest whoami >/dev/null 2>&1 || npx --yes vercel@latest login

echo "2/3 Liaison avec le projet qg-app…"
npx --yes vercel@latest link --yes --project qg-app >/dev/null

echo "3/3 Envoi des variables (valeurs jamais affichées)…"
while IFS= read -r ligne || [ -n "$ligne" ]; do
  [[ "$ligne" =~ ^([A-Z_][A-Z0-9_]*)=(.+)$ ]] || continue   # ignore commentaires et lignes vides
  nom="${BASH_REMATCH[1]}"; valeur="${BASH_REMATCH[2]}"
  npx --yes vercel@latest env rm "$nom" production --yes >/dev/null 2>&1 || true
  printf '%s' "$valeur" | npx --yes vercel@latest env add "$nom" production >/dev/null
  echo "  ✓ $nom"
done < .env.local

echo "Terminé. Préviens Claude : il relance le déploiement."

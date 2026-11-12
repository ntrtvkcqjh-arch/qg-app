#!/bin/bash
# Envoie les variables de .env.local vers le projet Vercel « qg-app » (Production),
# sans jamais afficher les valeurs. Usage : bash scripts/vercel-variables.sh
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="/usr/local/bin:$PATH"
V="npx --yes vercel@latest"
PROJET="qg-app"

[ -f .env.local ] || { echo "Fichier .env.local introuvable."; exit 1; }

echo "1/3 Connexion à Vercel…"
$V whoami >/dev/null 2>&1 || $V login

echo "2/3 Envoi des variables vers le projet $PROJET (valeurs jamais affichées)…"
n=0
while IFS= read -r ligne || [ -n "$ligne" ]; do
  [[ "$ligne" =~ ^([A-Z_][A-Z0-9_]*)=(.+)$ ]] || continue   # ignore commentaires et lignes vides
  nom="${BASH_REMATCH[1]}"; valeur="${BASH_REMATCH[2]}"
  $V env rm "$nom" production --yes --project "$PROJET" >/dev/null 2>&1 || true
  if printf '%s' "$valeur" | $V env add "$nom" production --project "$PROJET" >/dev/null 2>/tmp/qg-vercel-err; then
    echo "  ✓ $nom"; n=$((n+1))
  else
    echo "  ✗ $nom : $(grep -v -i -E 'sk-|secret|key' /tmp/qg-vercel-err | tail -1)"; exit 1
  fi
done < .env.local

echo "3/3 Vérification…"
present=$($V env ls production --project "$PROJET" 2>/dev/null | grep -c -E "^\s+[A-Z_]+\s" || true)
echo "  $n variables envoyées, $present visibles sur Vercel."
echo "Terminé."

# Cabinet EZ

Simulation de cabinet d'expertise comptable pour préparer le DEC : un cabinet en 3D isométrique
où l'équipe travaille en temps réel (1 seconde réelle = 1 minute simulée), y compris quand
l'app est fermée (rattrapage jusqu'à 3 jours au retour).

- Aucune API externe : tout le contenu (messages, dilemmes, QCM, oral) est écrit à l'avance
  dans `lib/data/`, et la simulation tourne dans `lib/moteur.ts`.
- Sauvegarde dans le navigateur (localStorage, clé `cabinet-ez-v1`).
- Stack : Next.js, React Three Fiber, Zustand.

```bash
npm install
npm run dev
```

L'ancien QG est conservé dans la branche `archive-qg` et le tag `qg-final`.

## Crédits

Modèles 3D : « Furniture Kit » et « Mini Characters » de Kenney (www.kenney.nl), licence CC0.
Les licences sont dans `public/modeles/`.

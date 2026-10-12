# Guide de Contribution Thème (EPIC11)

## Objectif

Éviter la dette visuelle et préserver l'accessibilité lors de toute évolution UI.

## Source de vérité

- Palette thèmes: `src/shared/theme/themes.json`
- Accès runtime: `src/shared/theme/themes.ts`
- Tokens UI: `src/shared/theme/tokens.ts`
- Mapping Tailwind: `tailwind.config.js`

Ne pas dupliquer des valeurs hex ailleurs.

Contrat thème global v2:

- `primary`: `#FF6B6B`
- `secondary`: `#FFD700`
- `grey`: `#E2E8F3`
- `white`: `#FFF9F7`
- `black`: `#000000`
- `success`: `#15803D`
- `error`: `#DC2626`
- `warning`: `#B45309`

## Règles obligatoires

1. Pas de couleur inline dans `app/` et `src/` (hors whitelist).
2. Utiliser `Colors.*` pour les couleurs thème.
   Nouveau code: utiliser prioritairement `ThemeColors.*` (API canonique 10 couleurs).
   `Colors.*` reste une API transitoire qui inclut des alias legacy pour compat.
3. Utiliser `withAlpha(...)` pour toute opacité dynamique.
4. Respecter la priorité couleur:
   - zone personnalisée profil -> couleurs profil (fallback thème si invalide),
   - sinon -> tokens thème.
5. Texte sur fond `primary`: utiliser `textOnPrimary` (blanc en v2).
6. `themes.json` contient uniquement les couleurs de base; `primaryPastel` et `secondaryPastel` sont dérivées automatiquement (ratio `0.75`).

## Contrastes (bloquants)

Les seuils sont vérifiés par `scripts/check-theme-contrast.cjs`.

- `black/white` >= 7.0
- `black/grey` >= 7.0
- `black/primaryPastel` >= 7.0
- `black/secondaryPastel` >= 7.0
- `black/primary` >= 4.5
- `black/secondary` >= 4.5
- `error/background` >= 4.5
- `success/background` >= 4.5
- `warning/background` >= 4.5
- `white/primary` >= 2.5 (non bloquant, exception design v2)

## Commandes à lancer avant PR

```sh
npm run qa:theme
npm run lint
npm run lint:theme:contract
npm run lint:theme:shell
```

`qa:theme` exécute:

- `lint:colors` (anti-inline)
- `lint:theme:contract` (cardinalité=10 + valeurs contractuelles)
- `lint:contrast` (WCAG critique)
- `lint:theme:shell` (cohérence palette entre thème, Tailwind et shell plateforme)
- `lint:tokens:legacy:strict` (bloquant: 0 alias legacy hors couche compat)

## Processus pour ajouter/ajuster un thème

1. Modifier les couleurs de base dans `themes.json` (les pastels sont calculés automatiquement).
2. Vérifier les tokens exposés via `themes.ts` / `tokens.ts`.
3. Lancer `npm run qa:theme`.
4. Vérifier les écrans clés:
   - Auth
   - Home
   - Profiles
   - Settings
   - Routine Builder
5. Documenter tout compromis dans `docs/roadmap/EPIC11/E11-T10-theme-qa-checklist.md`.

## Whitelist inline-colors (cas autorisés)

- `src/shared/utils/colorUtils.ts` (génération `rgba(...)`)
- `src/features/profiles/types/index.ts` (palettes profils explicites 16/16)

Tout ajout à cette whitelist doit être justifié en revue.

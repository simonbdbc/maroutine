# E11-T10 — QA Visuelle + Accessibilité Thème

Date de campagne: **2026-04-15**  
Périmètre: EPIC11 v2 (socle thème coral/or + palettes profils 16/16)

## 1) Contrôles automatiques

Commande CI/Lint officielle:

```sh
npm run qa:theme
```

Composition:

- `node ./scripts/check-inline-colors.cjs`
- `node ./scripts/check-theme-contract.cjs`
- `node ./scripts/check-theme-contrast.cjs`
- `node ./scripts/check-theme-shell.cjs`
- `node ./scripts/check-legacy-theme-tokens.cjs --strict`

Résultat attendu:

- 0 couleur inline hors whitelist
- 0 échec contraste bloquant

Whitelist inline-colors:

- `src/shared/utils/colorUtils.ts`
- `src/features/profiles/types/index.ts`

## 2) Contrastes critiques validés

Seuils bloquants (`scripts/check-theme-contrast.cjs`):

- `black/white` >= 7.0
- `black/grey` >= 7.0
- `black/primaryPastel` >= 7.0
- `black/secondaryPastel` >= 7.0
- `black/primary` >= 4.5
- `black/secondary` >= 4.5
- `error/background` >= 4.5
- `success/background` >= 4.5
- `warning/background` >= 4.5

Contrôle non bloquant:

- `white/primary` >= 2.5 (exception design EPIC11 v2)

Snapshot de validation (run du 2026-04-15):

- `coralSunrise`: `black/primary = 7.57`, `black/secondary = 14.97`
- `coralSunrise`: `error/background = 4.63`, `success/background = 4.81`, `warning/background = 4.82`
- `coralSunrise`: `white/primary = 2.66` (passe le seuil non bloquant v2)

## 3) Checklist QA manuelle (écrans clés)

Objectif: vérifier cohérence visuelle + lisibilité réelle (mobile + web).

- [ ] `/(auth)/login` / `register` / `forgot-password` / `verify-email`
- [ ] `/(app)/home` mono-profil + multi-profils (tabs, header, CTA validation)
- [ ] `/(app)/profiles` (liste, ajout, édition, suppression, modal confirmation)
- [ ] `/(app)/settings` (sections + états erreur/succès)
- [ ] `RoutineBuilderScreen` (moments, activités, tâches, erreurs de validation)
- [ ] `StickerCollection` (état gagné / non gagné)

Points de contrôle manuels:

- [ ] texte lisible sur fonds primaires, pastel et surfaces blanches
- [ ] états erreur/succès/warning lisibles sans zoom (mobile + desktop)
- [ ] focus visibles au clavier (web) sur actions principales
- [ ] aucune régression de branding entre app shell, PWA et écrans in-app

## 4) Verdict ticket

- Livrables doc fournis: checklist QA + guide contribution thème
- Garde-fous automatiques actifs: inline-colors + contraste
- Contrastes critiques tokens validés en automatisé

Statut ticket recommandé: **✅ Fait** (avec exécution QA manuelle finale par recette produit si nécessaire).

# EPIC 1 — Setup & Architecture

**Statut : ✅ TERMINÉ**  
**Date de completion : 2025-03**  
**Dépendances :** aucune

---

## Résumé

Mise en place complète du projet Expo avec l'architecture feature-based, NativeWind v4, Expo Router v6, le design system Fredoka et les outils de qualité de code.

---

## Décisions d'architecture

### Framework & navigation
- **Expo SDK 54** avec React Native 0.81 — dernière version stable
- **Expo Router v6** (file-based routing) plutôt que React Navigation manuel → convention over configuration, typed routes, deep linking natif
- **Architecture feature-based** (`src/features/`) plutôt que layer-based (`components/`, `screens/`) → meilleure cohésion, scalabilité, équipe parallèle possible

### Styling
- **NativeWind v4** (Tailwind CSS pour React Native) plutôt que StyleSheet pur → design system cohérent, classes utilitaires, tokens centralisés
- NativeWind placé dans `presets` (pas `plugins`) de babel — correction nécessaire vs documentation officielle
- CSS entry point : `src/shared/theme/global.css`

### Typographie
- **Fredoka** (Regular 400, SemiBold 600, Bold 700) via `@expo-google-fonts/fredoka` → ton playful adapté aux enfants, contrairement à Poppins (app précédente)

### Qualité de code
- **TypeScript strict** avec `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns` — zéro `any` toléré
- **Path aliases** : `@features/`, `@shared/`, `@assets/` via `babel-plugin-module-resolver` + tsconfig
- ESLint + Prettier configurés

### Design system
- Tokens centralisés dans `src/shared/theme/tokens.ts` (Colors, FontFamily, Spacing, Radius, Shadows)
- Composants UI partagés : `Text`, `Button`, `Card`, `Badge` avec variantes Tailwind
- Utilitaire `cn()` = `clsx` + `tailwind-merge` pour fusion de classes conditionnelles

---

## Tâches

- [x] 1.1 Init projet Expo SDK 54 + TypeScript strict
- [x] 1.2 Configurer NativeWind v4 + `tailwind.config.js` avec design system complet
- [x] 1.3 Installer Expo Router v6 (file-based)
- [x] 1.4 Structure feature-based : `features/`, `shared/`, `navigation/`
- [x] 1.5 Path aliases TypeScript (`@features/`, `@shared/`, `@assets/`)
- [x] 1.6 Font Fredoka via `@expo-google-fonts/fredoka`
- [x] 1.7 Design system : tokens couleurs, radius, shadows, composants UI
- [x] 1.8 ESLint + Prettier
- [x] Fix : versions packages Expo SDK 54 (`expo-linear-gradient`, `expo-auth-session`, etc.)
- [x] Fix : scripts `npx expo` (vs `expo` global déprécié)
- [x] Fix : `nativewind/babel` dans `presets` (pas `plugins`)

---

## Fichiers créés

```
package.json, app.json, tsconfig.json, babel.config.js
tailwind.config.js, metro.config.js
nativewind-env.d.ts, expo-env.d.ts
app/_layout.tsx, app/index.tsx
app/(auth)/_layout.tsx, app/(auth)/login.tsx      ← placeholders
app/(app)/_layout.tsx, app/(app)/home.tsx          ← placeholders
app/(app)/profiles/index.tsx, app/(app)/settings.tsx
src/shared/theme/global.css, tokens.ts, index.ts
src/shared/components/ui/ Text, Button, Card, Badge
src/shared/hooks/useAppFonts.ts
src/shared/utils/cn.ts
src/features/auth/types/index.ts                  ← placeholder
src/features/home/types/index.ts                  ← placeholder
src/features/profiles/types/index.ts              ← placeholder
src/features/stickers/registry/index.ts           ← placeholder
```

---

## Notes & problèmes rencontrés

- `expo-linear-gradient@~14.0.4` n'existait pas → corrigé en `~15.0.8`
- `expo-auth-session@~6.0.3` incorrect → `~7.0.10`
- `react-native-reanimated/plugin` dans babel causait un duplicate avec SDK 54 → supprimé
- `npm run web` utilisait le vieux CLI global → corrigé avec `npx expo`

# EPIC 10 — Tests & Build

**Statut : 🔲 À FAIRE**  
**Dépendances :** tous les EPICs précédents

---

## Résumé

Tests unitaires sur les repositories et hooks, build EAS pour iOS et Android, configuration des environnements (dev/staging/prod).

---

## Décisions d'architecture

### Tests : Jest + Testing Library
- Tests unitaires sur la logique métier (repos, hooks, utils)
- Pas de tests E2E dans un premier temps (Detox = overhead important)
- Mocks Supabase pour les tests de repos

### Build : EAS Build
- Expo Application Services pour les builds natifs
- 3 profils : `development` (debug, dev client), `preview` (TestFlight/APK interne), `production`

---

## Tâches

### Tests
- [ ] 10.1 Configurer Jest avec `jest-expo`
- [ ] 10.2 Mock `@supabase/supabase-js` pour les tests
- [ ] 10.3 Tests unitaires `profileRepo` : CRUD
- [ ] 10.4 Tests unitaires `routineRepo` : check/uncheck, buildVM
- [ ] 10.5 Tests unitaires `authStore` : signIn, signOut, session expirée
- [ ] 10.6 Tests hooks : `useHomeRoutine` (optimistic updates)
- [ ] 10.7 Tests utils : `cn()`, `getRandomStickerKey()`

### TypeScript
- [ ] 10.8 `npm run tsc` sans erreur
- [ ] 10.9 Zéro usage de `any` (`@typescript-eslint/no-explicit-any: error`)

### Build EAS
- [ ] 10.10 Installer et configurer EAS CLI : `npm install -g eas-cli`
- [ ] 10.11 `eas.json` avec profils dev / preview / production
- [ ] 10.12 Variables d'environnement dans EAS Secrets
- [ ] 10.13 Build iOS `development` → TestFlight interne
- [ ] 10.14 Build Android `development` → APK interne
- [ ] 10.15 SHA-1 du keystore EAS → à ajouter dans Google Cloud Console (EPIC 2.S)

### App Store / Play Store (production)
- [ ] 10.16 Assets store : screenshots, icône 1024x1024, description
- [ ] 10.17 Build iOS `production` → App Store Connect
- [ ] 10.18 Build Android `production` → Google Play Console

---

## eas.json (référence)

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_ENV": "development" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "APP_ENV": "preview" }
    },
    "production": {
      "env": { "APP_ENV": "production" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## Checklist de validation

- [ ] `npm run tsc` → 0 erreur
- [ ] `npm run lint` → 0 warning
- [ ] Tous les tests passent (`npm test`)
- [ ] Build iOS sans erreur
- [ ] Build Android sans erreur
- [ ] App testée sur device physique iOS + Android

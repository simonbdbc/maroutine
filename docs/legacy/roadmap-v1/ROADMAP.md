# Roadmap — Routine v2

> Tableau de bord du projet. Source de vérité pour l'avancement et les décisions globales.
> Tous les fichiers de suivi sont dans `docs/roadmap/`.
> Les guides de configuration sont dans `docs/` (racine).

---

## État d'avancement

| EPIC | Titre | Statut | Priorité |
|------|-------|--------|----------|
| [EPIC 1](./EPIC1-setup.md) | Setup & Architecture | ✅ Terminé | — |
| [EPIC 2](./EPIC2-auth.md) | Auth email/password | ✅ Terminé | — |
| [EPIC 3](./EPIC3-db.md) | Supabase — DB & Client | ✅ Terminé | — |
| [EPIC 4](./EPIC4-profiles.md) | Profils enfants | ✅ Terminé | — |
| [EPIC 5](./EPIC5-home.md) | Routine du jour | ✅ Terminé | — |
| [EPIC 6](./EPIC6-stickers.md) | Stickers (refonte registry/assets) | ✅ Terminé | — |
| [EPIC 7](./EPIC7-settings.md) | Settings | ✅ Terminé | — |
| [EPIC 8](./EPIC8-catalog-builder.md) | Catalogue & Routine Builder | ✅ Terminé | 🔴 Haute |
| [EPIC 9](./EPIC9-corrections-home.md) | Home checkable parity (SQLite -> Supabase PSQL) | ✅ Terminé | 🔴 Haute |
| [EPIC 17](./EPIC17-web-pwa-prod.md) | Web + PWA production & assets stickers | 🔲 À faire | 🔴 Urgente |
| [EPIC 15](./EPIC15-side-menu-navigation.md) | Navigation side menu + shell mobile | 🔲 À faire | 🔴 Urgente |
| [EPIC 16](./EPIC16-rewards.md) | Récompenses | 🔲 À faire | 🔴 Haute |
| [EPIC 14](./EPIC14-mobile-qa-debug.md) | QA mobile native & debug (Android/iOS) | ⏸️ En pause | 🟠 Moyenne |
| [EPIC 10](./EPIC10-navigation.md) | Navigation complète | 🔲 À faire | 🟡 Basse |
| [EPIC 11](./EPIC11-polish.md) | Polish & UX | 🔲 À faire | 🟡 Basse |
| [EPIC 12](./EPIC12-tests-build.md) | Tests & Build EAS | 🔲 À faire | 🟡 Basse |
| [EPIC 13](./EPIC13-google-oauth.md) | Google OAuth | 🔲 Secondaire | ⚪ Fin de roadmap |

**Légende** : ✅ Terminé · 🚧 En cours · 🔲 À faire · ⏸️ En pause

---

## Ordre de développement

```
✅ EPIC 1    ✅ EPIC 2    ✅ EPIC 3
Setup        Auth email   Supabase DB
                   │
           ✅ EPIC 4 — Profils enfants
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
   ✅ EPIC 5   ✅ EPIC 6   ✅ EPIC 7
   Routine     Stickers    Settings
                   │
        ✅ EPIC 8 — Catalogue & Builder
                   │
        ✅ EPIC 9 — Home checkable parity
                   │
        🔲 EPIC 17 — Web + PWA prod
                   │
        🔲 EPIC 15 — Side menu & shell
                   │
        🔲 EPIC 16 — Récompenses
                   │
        ⏸️ EPIC 14 — QA mobile native
                   │
        🔲 EPIC 10 — Navigation
                   │
        🔲 EPIC 11 — Polish & UX
                   │
        🔲 EPIC 12 — Tests & Build
                   │
        🔲 EPIC 13 — Google OAuth
```

### EPICs réouverts : **Aucun**
Post-clôture livré: `E9-R13` (hardening DB stickers activité obligatoires, 10 mars 2026).
Post-clôture livré: `E7-U01` (édition directe de la tirelire par profil, 12 mars 2026).
Post-clôture livré: `E6-U01` (refonte stickers: registry dynamique + fallback image + pack assets rationalisé, 27 mars 2026).

Suivi tickets: [EPIC8-tickets-techniques.md](./EPIC8-tickets-techniques.md) (clôturé), [EPIC9-tickets-techniques.md](./EPIC9-tickets-techniques.md), [EPIC17-web-pwa-prod.md](./EPIC17-web-pwa-prod.md), [EPIC15-side-menu-navigation.md](./EPIC15-side-menu-navigation.md), [EPIC16-rewards.md](./EPIC16-rewards.md), [EPIC14-mobile-qa-debug.md](./EPIC14-mobile-qa-debug.md)

---

## Point d'avancement (27 mars 2026)

- `EPIC6` est consolidé en code avec une refonte post-clôture (registry stickers dynamique + nouvelle base assets).
- Ajustements UI stickers/avatars déjà présents dans le code (Home/Profils), en amont du polish global.
- Alignement SQL stickers livré: défaut `sticker_key='stars-icon'` (fallback image unifié).
- `EPIC17` est ajouté en priorité absolue pour livrer Web + PWA prod et la base de bibliothèque stickers scalable.
- `EPIC15` (side menu + shell) n'est pas démarré en implémentation applicative.
- `EPIC16` (Récompenses) est cadré en plan, non implémenté.
- `EPIC14` reste en pause le temps du refactor navigation.

---

## Suite Recommandée (Mars 2026)

1. **Urgent — EPIC 17 Web + PWA production**
- Finaliser build web production Expo.
- Livrer installabilité PWA.
- Préparer déploiement web production.
- Note: offline avancé + bibliothèque stickers pack/caching sont désormais en scope secondaire EPIC 17.

2. **Urgent — EPIC 15 Side menu & shell mobile**
- Remplacer la tab bar basse par une navigation latérale.
- Ajouter le trigger menu top-right sur Home (zone tabs profils).
- Corriger le recouvrement Android nav bar via safe-area bottom unifiée.
- Remplacer l'accès header Home vers `Récompenses`.

3. **EPIC 16 — Récompenses**
- Démarrer par un écran Récompenses MVP sur la route `/(app)/rewards`.
- Définir le contrat métier et les écritures transactionnelles impactant la tirelire.

4. **EPIC 14 — QA mobile native (en pause, reprise après refactor navigation)**
- Reprendre la recette complète Android + iOS après livraison EPIC 15/16.
- Qualifier et corriger les bugs P0/P1 restants avant reprise roadmap standard.

5. **R0 — Normalisation docs EPIC 10+**
- Aligner les titres/numérotations héritées dans les fichiers `EPIC10-*`, `EPIC11-*`, `EPIC12-*`, `EPIC13-*` pour éviter les ambiguïtés de pilotage.

6. **EPIC 10 — Navigation complète**
- Finaliser navigation (icônes tabs, modals, deep links, gestures iOS, navigation inter-profils).
- Livrer une checklist QA navigation iOS/Android/web.

7. **EPIC 11 — Polish & UX**
- Animations/haptics ciblés, empty states, thème par enfant, comportement offline minimal.
- Prioriser les effets à forte valeur perçue sans alourdir le runtime.

8. **EPIC 12 — Tests & Build EAS**
- Stabiliser la baseline qualité (`tsc`, lint, tests unitaires prioritaires).
- Mettre en place le pipeline build `development/preview/production` et valider sur devices.

9. **EPIC 13 — Google OAuth**
- Activer le provider Google (Cloud Console + Supabase Auth) après stabilisation build.
- Garder ce scope en fin de roadmap (confort utilisateur, non bloquant métier).

---

## Stack technique

| Catégorie | Choix | Raison |
|-----------|-------|--------|
| Framework | Expo SDK 54 + RN 0.81 | Dernière version stable, EAS Build |
| Navigation | Expo Router v6 | File-based, typed routes |
| Styling | NativeWind v4 (Tailwind) | Design system cohérent |
| Base de données | Supabase (PostgreSQL) | Cloud, RLS, Auth intégrée |
| Auth principale | Email/password (Supabase Auth) | Zéro friction |
| Auth secondaire | Google OAuth (EPIC 13) | Confort utilisateur |
| Session | Supabase SDK + AsyncStorage | Refresh auto |
| Font | Fredoka | Ton enfantin |
| Animations | Reanimated v4 | Inclus SDK 54 |

---

## Décisions globales

### Architecture feature-based
Chaque feature est un dossier auto-suffisant (`types/`, `services/`, `hooks/`, `components/`). Les éléments partagés vont dans `src/shared/`.

### Store auth sans Zustand
Store module-level singleton avec listeners. `supabase.auth.onAuthStateChange()` est la source de vérité.

### Optimistic updates (EPIC 5 + EPIC 9)
Cocher/décocher met à jour l'UI immédiatement, DB en background. EPIC 9 renforce les invariants de cascade et l'atomicité côté Postgres.

### UUID en DB
Tous les IDs sont des UUID. Meilleur pour le cloud, pas de collision.

### TypeScript strict
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. Zéro `any`.

### Compat web/native
`Platform.OS === "web"` → `window.confirm` au lieu de `Alert.alert` pour toutes les actions destructives.

---

## Variables d'environnement

```env
# Supabase (EPIC 3 — configuré ✅)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# Google OAuth (EPIC 13 — secondaire)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

---

## Docs de référence

| Fichier | Contenu |
|---------|---------|
| `docs/EPIC2-google-oauth.md` | Guide config Google Cloud Console |
| `docs/EPIC3-supabase.md` | SQL schéma complet + seed + RLS policies |

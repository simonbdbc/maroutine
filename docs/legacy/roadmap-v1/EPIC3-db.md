# EPIC 3 — Base de données Supabase

**Statut : ✅ CODE TERMINÉ — ⚙️ Config Supabase requise**  
**Dépendances :** EPIC 1 ✅  
**Débloque :** EPIC 4, EPIC 5, EPIC 6, EPIC 7

---

## Résumé

Client Supabase, types PostgreSQL, et repositories pour les données de l'app. Le code est entièrement livré. Il reste à créer le projet Supabase, exécuter le schéma SQL et renseigner les variables d'environnement.

> **Note :** Google OAuth dans Supabase est traité dans l'**EPIC 11**.

---

## Décisions d'architecture

### Supabase (PostgreSQL) plutôt que SQLite local
- Données cloud → sync multi-device
- Auth intégrée → sessions, refresh token, persistance automatique
- Row Level Security → isolation des données par utilisateur au niveau DB
- Free tier : 500 MB, 50 000 MAU

### UUID pour tous les IDs
- Vs INTEGER (SQLite précédent) → pas de collision, meilleur pour le cloud

### Repositories pattern
- Requêtes Supabase JS directes, typées via `supabaseTypes.ts`
- Pas d'ORM — cohérent avec la taille du projet

---

## Tâches code — toutes terminées ✅

- [x] `package.json` : `@supabase/supabase-js` + `react-native-url-polyfill`
- [x] `supabaseClient.ts` : `createClient` + AsyncStorage
- [x] `supabaseTypes.ts` : types de toutes les tables (prêts pour `gen types`)
- [x] `shared/db/index.ts` : barrel export
- [x] `profileRepo.ts` : `listProfiles`, `createProfile` (+ seed profile_moments), `updateProfile`, `deleteProfile`, `reorderProfiles`, `addToBalance`
- [x] `routineRepo.ts` : `getRoutineForDate` (jointures cascade), `checkTask`, `uncheckTask`, `validateDay`
- [x] `home/types/index.ts` : ViewModels mis à jour (UUIDs, champ `icon`)

## Tâches config — ⚙️ À faire par toi

- [ ] **3.A** Créer le projet Supabase sur [supabase.com](https://supabase.com) (région : West EU)
- [ ] **3.B** Renseigner dans `.env.local` :
  ```env
  EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
  ```
- [ ] **3.C** SQL Editor → coller et exécuter le schéma (voir `docs/EPIC3-supabase.md`)
- [ ] **3.D** SQL Editor → coller et exécuter le seed (moments + activités + tâches)
- [ ] **3.E** Activer RLS + policies (voir `docs/EPIC3-supabase.md`)
- [ ] **3.F** `npm install`
- [ ] **3.G** (optionnel) Régénérer les types :
  ```bash
  npx supabase gen types typescript --project-id <id> > src/shared/db/supabaseTypes.ts
  ```

## Tâches secondaires

- [ ] 3.S1 Google OAuth provider Supabase → voir **EPIC 11**
- [ ] 3.S2 Realtime subscriptions sur `daily_checks` → voir EPIC 9

---

## Schéma — tables

```
auth.users (Supabase natif)
    └── profiles               (enfants, liés à auth.users)
          ├── profile_moments  (pivot profil ↔ moment)
          │     └── profile_moment_activities (pivot ↔ activité)
          │           └── profile_moment_activity_tasks (pivot ↔ tâche)
          └── daily_checks     (état coché par jour)

moments     (global — seed)
activities  (global — seed)
tasks       (global — seed)
```

## Checklist de validation post-config

- [ ] `npm install` sans erreur
- [ ] `npx expo start --web` sans erreur console
- [ ] Inscription → user visible dans Supabase Dashboard → Auth → Users
- [ ] Connexion → session créée → accès HomeScreen
- [ ] Kill + relance → toujours connecté (persistSession)
- [ ] Déconnexion → retour LoginScreen
- [ ] RLS : deux comptes → données isolées

---

## Référence

Voir `docs/EPIC3-supabase.md` pour le SQL complet (schéma, seed, RLS policies).

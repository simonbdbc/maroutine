# E0-T02 — Matrice Source de Vérité (Offline-First v1)

**Statut :** Proposé (en revue)  
**Date :** 2026-03-31  
**Ticket :** E0-T02  
**Dépendance :** E0-T01 ([ADR-0001](./adr/ADR-0001-offline-first-architecture.md))

---

## Objectif

Définir, pour chaque type de donnée métier, la source de vérité locale/distance et le chemin de lecture/écriture attendu en architecture offline-first.

---

## Règles transverses

1. Les écrans critiques lisent depuis la couche locale durable (WatermelonDB) via repositories.
2. Les écritures critiques suivent le flux `local write -> sync_queue -> sync worker -> Supabase`.
3. Supabase n'est pas lu directement par la UI critique (hors flux Auth et bootstrap/sync contrôlés).
4. Le service worker et son cache réseau ne sont jamais source de vérité métier.
5. La création de compte / connexion initiale / vérification email sont des flux online-only.

---

## Matrice v1

| Type de donnée | Source locale durable (cible) | Source distante | Source de vérité pour lecture UI critique | Écriture initiale attendue | Sync/Conflits v1 | État actuel (2026-03-31) |
|---|---|---|---|---|---|---|
| Session Auth (token/session/user) | Session Supabase persistée localement (SDK, AsyncStorage) | Supabase Auth (`auth.users`, tokens) | Store auth local hydraté au boot | Supabase Auth SDK (`signIn/signUp/signOut`) | Auth initiale + vérification email online-only; session distante prioritaire; expiration invalide le local | Partiellement conforme (déjà local côté SDK) |
| Profils enfant (`profiles`) | Collection locale `profiles` | Table `profiles` | Local (`profiles`) | Local d'abord, puis enqueue upsert/delete | LWW par `updated_at` (hors exceptions métier) | Non conforme (accès directs Supabase dans `profileRepo`/`settingsRepo`) |
| Catalogue moments (`moments`) | Collection locale `moments` | Table `moments` | Local (`moments`) | Local d'abord puis enqueue | LWW sur métadonnées catalogues | Non conforme (reads/writes directs Supabase dans `catalogRepo`/`momentRepo`) |
| Catalogue activités (`activities`) | Collection locale `activities` | Table `activities` | Local (`activities`) | Local d'abord puis enqueue | LWW sur métadonnées catalogues | Non conforme (reads/writes directs Supabase dans `catalogRepo`/`momentRepo`) |
| Catalogue tâches (`tasks`) | Collection locale `tasks` | Table `tasks` | Local (`tasks`) | Local d'abord puis enqueue | LWW sur métadonnées catalogues | Non conforme (reads/writes directs Supabase dans `catalogRepo`/`momentRepo`) |
| Routine profil: pivots moments (`profile_moments`) | Collection locale `profile_moments` | Table `profile_moments` | Local (projection routine) | Local d'abord puis enqueue | LWW + ordre `sort_index` stable | Non conforme (reads/writes directs Supabase dans builder/home) |
| Routine profil: pivots activités (`profile_moment_activities`) | Collection locale `profile_moment_activities` | Table `profile_moment_activities` | Local (projection routine) | Local d'abord puis enqueue | LWW + ordre `sort_index`; `sticker_key` non vide | Non conforme (reads/writes directs Supabase dans builder/home) |
| Routine profil: pivots tâches (`profile_moment_activity_tasks`) | Collection locale `profile_moment_activity_tasks` | Table `profile_moment_activity_tasks` | Local (projection routine) | Local d'abord puis enqueue | LWW + ordre `sort_index` | Non conforme (reads/writes directs Supabase dans builder/home) |
| Checks du jour (`daily_checks`) | Collection locale `daily_checks` | Table `daily_checks` + RPC | Local (routine du jour) | Local d'abord (toggle), puis enqueue appel RPC sync | Idempotence par clé stable (E6-T04), LWW pour états booléens | Non conforme (RPC/reads directs Supabase dans `routineRepo`) |
| Validation journée (`daily_validations`) | Collection locale `daily_validations` | Table `daily_validations` + RPC `validate_day` | Local (`isDayValidated`, résumé jour) | Local tentative de validation puis enqueue | Opération idempotente par `(profile_id, check_date)` | Non conforme (RPC direct Supabase) |
| Solde étoiles (`profiles.balance`) | Champ local `profiles.balance` + journal `daily_validations` | `profiles.balance` | Local (`profiles.balance`) | Calcul local provisoire, convergence après ACK remote | Exception: valeur distante confirmée prévaut après `validate_day` | Non conforme (mise à jour distante directe) |
| Registry stickers statiques (`sticker_key`, assets bundle) | Métadonnées locales + assets embarqués | Aucune source distante obligatoire (v1 actuelle) | Local (registry stickers) | Locale uniquement | Pas de conflit (read-only local) | Conforme pour les assets embarqués |
| Packs stickers téléchargeables (futur) | `sticker_packs`, `sticker_assets`, `downloaded_packs` | Manifest catalogue + fichiers distants | Local (`ready` uniquement) | Download manager local | Activation atomique + intégrité obligatoire | À implémenter (EPIC4/EPIC5) |
| Outbox sync (`sync_queue`) | Collection locale `sync_queue` | N/A (journal local) | Non exposé UI métier, visible diagnostics | Écriture locale systématique à chaque mutation offline-first | Retry/backoff/idempotence/LWW selon entité | À implémenter (EPIC6) |
| État sync (`sync_state`) | Collection locale `sync_state` | N/A | UI diagnostic uniquement | Écriture locale par worker sync | Last-success/error + horodatage | À implémenter (EPIC6/EPIC7) |
| Projections UI (`HomeRoutineVM`, draft builder) | État mémoire dérivé de la DB locale | N/A | Projection locale uniquement | N/A (dérivée) | Recalculable, jamais source de vérité | Partiellement conforme (projection existe, mais depuis Supabase direct) |
| Cache service worker | Cache navigateur (shell/assets HTTP) | HTTP/CDN | Jamais | N/A | Purge/versionning SW séparé | Cible définie, implémentation EPIC2 |

---

## Exceptions explicitement autorisées (v1)

- Authentification: échanges Supabase Auth autorisés (login, refresh token, logout).
- Vérification email et inscription: flux réseau obligatoires, hors garantie offline.
- Bootstrap/migration transitoire: lecture distante autorisée seulement via couche repository/adapters, jamais depuis composants UI critiques.
- Opérations diagnostics/outils techniques: accès réseau possible si clairement séparé des parcours métier critiques.

---

## Impacts sur tickets suivants

- E0-T03: les diagrammes lecture/écriture/sync devront respecter strictement cette matrice.
- E0-T06: l'audit de conformité doit pointer les accès directs Supabase qui violent cette matrice.
- E3-T02/E3-T03: le schéma WatermelonDB et les repositories sont dérivés directement de cette matrice.
- E6-T01/E6-T02: la `sync_queue` devient obligatoire pour toute mutation métier critique.

---

## Checklist de validation (produit + tech)

- Chaque type de donnée métier a une source de vérité locale explicitée.
- Les exceptions réseau sont limitées et documentées.
- Les parcours critiques home/profils/builder peuvent être migrés vers local-first sans ambiguïté.

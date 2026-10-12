# EPIC 9 — Home checkable parity (SQLite -> Supabase PSQL)

**Statut : ✅ TERMINÉ (rescope stars simplifié livré, 10 mars 2026)**  
**Dépendances :** EPIC 3 ✅, EPIC 5 ✅, EPIC 6 ✅, EPIC 8 ✅  
**Débloque :** EPIC 10 (navigation finale), EPIC 11 (polish), EPIC 12 (tests/build)

---

## Résumé

Objectif: porter dans la v2 Supabase le comportement métier complet de la v1 pour la routine Home checkable, sans casser l'architecture feature-based.

Le board profil est déjà en place (header, progression, liste des moments, CTA validation). Le scope EPIC 9 concerne la logique checkable (activité/tâche), les invariants parent/enfant, et la validation de journée atomique côté Postgres.

Suivi détaillé des tickets techniques: `docs/roadmap/EPIC9-tickets-techniques.md`.

---

## Rescope 2026-03-10 (source de vérité)

> Cette section remplace le contrat T01 précédent en cas de conflit.

### Terminologie et mapping
- Le terme métier/UI est **étoiles**.
- Le code et la DB sont migrés de `points` vers `stars`.
- `todayStars` est affiché en UI; la tirelire reste `profiles.balance` (total d'étoiles).

### Règles métier simplifiées
- Hiérarchie conservée: `moment -> activité -> tâche`.
- Un **moment ne rapporte jamais d'étoiles**; il sert uniquement de récapitulatif de son contenu.
- Feuilles qui rapportent:
  - `task` cochée -> `task.stars`.
  - `activity` cochée **sans tâche** -> `activity.stars`.
- `todayStars` = somme des étoiles comptabilisées dans les moments (récap des activités/tâches).

### Toggle et validation
- `toggleTask` et `toggleActivity` conservés.
- `toggleMoment` supprimé du scope (SQL + types + repo + hook).
- `validate_day(profile_id, check_date)` reste atomique/idempotent:
  - calcule `earned_stars`,
  - crédite `balance`,
  - reset checks du jour,
  - persiste `daily_validations`.
- Après validation + refresh: `todayStars = daily_validations.earned_stars`.

### Règles Builder obligatoires
- Activité **sans tâche**: `activity.stars > 0` obligatoire.
- Activité **avec tâches**:
  - étoiles activité désactivées (et forcées à `0`),
  - toutes les tâches doivent avoir `task.stars > 0`.
- Pas de mode mixte.
- Ajouter la première tâche d'une activité -> désactive/réinitialise les étoiles activité.
- Supprimer la dernière tâche -> réactive l'édition des étoiles activité.
- La sauvegarde de routine est bloquée si une règle est violée.

### Analyse initiale des écarts (historique avant rescope)
- `src/features/home/types/index.ts` exposait `points` / `todayPoints` (corrigé).
- `src/features/home/services/homeOptimisticPatch.ts` comptait `moment.points` (moment feuille), non conforme (corrigé).
- `src/features/home/services/routineRepo.ts` exposait `toggleMoment` et des calculs moment-feuille (corrigé).
- `docs/sql/schema-v2.sql` contenait `points`, `points_earned`, `earned_points` et `toggle_moment_check` (corrigé).
- Builder (`builderDraftOps`, `useRoutineBuilder`, `RoutineBuilderScreen`, `builderWriteService`) autorisait encore:
  - étoiles activité alors que des tâches existent,
  - tâches à `0`,
  - absence de blocage de sauvegarde selon les nouvelles règles.

---

## Constat v2 (état validé)

### Déjà OK
- Board profil rendu correctement dans `app/(app)/home.tsx` (header, progression, moments, bouton validation).
- Data flow principal en place: `useHomeRoutine` + `routineRepo` + composants Home.
- Toggle activité + tâche branchés en UI, avec optimistic update, rollback et garde anti double-tap.
- Validation journée protégée contre les courses de sync (attente des toggles in-flight avant `validate_day`).
- Design sticker "done" (glow + sparkles + badge étoiles) aligné.
- Validation journée avec confirmation explicite des étoiles gagnées, garde anti double-submit et refresh post-action.
- Reset journée Settings cohérent avec Home (`daily_checks` + `daily_validations`), sans impact sur la tirelire.
- Après validation, "Aujourd'hui" affiche les `earned_stars` persistés (source: `daily_validations`) même après refresh.
- Activité pending: sticker simple dans le cercle gauche.
- Tâches: rendu uniquement en cercles `✗/✓` (sans sticker image).
- Header Home aligné terminologie produit: badge `Tirelire` (au lieu de `Solde`), sans libellé "Vue Parent".
- ActivityCard ajustée pour lisibilité mobile: indicateur état `✗/✓` en tête + sous-titre inline.

### Écarts vs comportement attendu (v1)
- Aucun écart fonctionnel bloquant identifié sur le scope EPIC 9.

---

## Cibles fonctionnelles

1. Conserver le board actuel et implémenter la parité checkable v1:
- activité pressable (cocher/décocher en cascade sur ses tâches)
- tâche pressable (recalcul automatique activité puis moment)
- progression et étoiles du jour cohérentes en temps réel
- validation journée avec confirmation, calcul des étoiles gagnées, crédit tirelire, reset des checks du jour

2. Respecter le modèle hiérarchique checkable:
- moment > activité > tâche
- `checked` et `totals` cohérents à tous les niveaux
- cas edge couverts: moment sans activité, activité sans tâche

3. Conserver l'architecture feature-based:
- `services/` = accès DB/Supabase uniquement
- `hooks/` = orchestration + optimistic updates + rollback
- `components/` = UI pure (pas d'accès DB)

---

## Décisions d'architecture (anti effets de bord)

### Source de vérité métier: Postgres (RPC transactionnelle)
- Déplacer les invariants de cascade dans des fonctions SQL atomiques.
- Éviter les séquences client multi-requêtes pour les opérations critiques (toggle, validate day).

### Contrat unique de domaine checkable
- Introduire un module pur de recalcul local pour l'optimistic UI (`task -> activity -> moment -> root`).
- Le hook applique un patch optimiste, puis confirme via RPC, puis rollback en cas d'erreur.

### Date métier locale maîtrisée
- Garder `YYYY-MM-DD` local comme clé journalière.
- Ne jamais mélanger avec des comparaisons UTC côté client pour les checks.

### Idempotence & concurrence
- Toggling idempotent (rejouable sans doubler les étoiles).
- Mise à jour du solde en SQL atomique, jamais en read-modify-write côté JS.

### Couplage faible inter-features
- Home n'importe pas de logique Settings.
- Settings réutilise des services Home publics pour reset/validation si besoin, pas de duplication.

---

## Contrat métier checkable (T01)

Cette section est la source de vérité métier pour EPIC 9.

### 1) Définition des éléments checkables (feuilles)
- `task` est checkable si elle appartient à une activité.
- `activity` est checkable uniquement si elle n'a aucune tâche enfant.
- Les compteurs et étoiles du jour sont calculés sur ces feuilles checkables.

### 2) Invariants parent/enfant
- Si une activité a des tâches: `activity.checked = all(tasks.checked)`.
- Si un moment a des activités: `moment.checked = all(activities.checked)`.
- Les états parents affichés dans la UI sont dérivés des enfants (pas de divergence durable parent/enfant).
- Toute opération de toggle doit laisser la hiérarchie cohérente (`task -> activity -> moment -> root`).

### 3) Invariants de comptage et progression
- `totalItems = nb(feuilles checkables)`.
- `totalCompleted = nb(feuilles checkables cochées)`.
- `progressPercent = round((totalCompleted / totalItems) * 100)` si `totalItems > 0`, sinon `0`.
- `todayStars = somme(stars des feuilles cochées du jour)`.

### 4) Règles de toggle
- `toggleTask`: inverse la tâche ciblée, recalcule son activité parente puis son moment parent, et ne modifie jamais `profiles.balance`.
- `toggleActivity`: si l'activité a des tâches, applique l'état cible à toutes ses tâches (cascade idempotente) puis recalcule parent; sinon l'activité est traitée comme feuille checkable.

### 5) Règles de validation de journée
- `validate_day(profile_id, check_date)` est la seule opération autorisée à créditer `profiles.balance`.
- `earned_stars` est calculé depuis l'état checké du jour juste avant reset.
- L'opération est atomique et idempotente côté SQL: un second appel pour le même `(profile_id, check_date)` ne doit jamais recréditer la tirelire, et la réponse doit rester stable (`earned_stars`, `new_balance`).
- Après validation: les checks du jour sont remis à zéro, `isDayValidated = true` pour ce profil et cette date, et la Home est en lecture seule pour cette date (pas de toggle autorisé).

### 6) Date métier (règle unique)
- Toutes les opérations Home utilisent une date locale `YYYY-MM-DD`.
- La date est déterminée une seule fois par action UI puis propagée telle quelle jusqu'à la RPC.
- Aucun calcul métier Home ne dépend d'une conversion UTC côté client.

### 7) Concurrence et anti side-effects
- Les toggles sont idempotents et ne produisent pas d'effets cumulatifs inattendus en cas de retry.
- Les crédits de tirelire se font uniquement en SQL transactionnel (pas de read-modify-write JS).
- En cas d'échec réseau après optimistic patch: rollback local puis refresh complet.

### 8) Contrat VM attendu (alignement types à implémenter)
- Le VM Home doit exposer explicitement les états `checked` aux 3 niveaux, les totaux `completed/total` cohérents à chaque niveau, et `todayStars`/`progressPercent`/`isDayValidated`.

---

## Plan d'implémentation

### 9.1 Contrat métier Home
- [x] Formaliser les invariants checkables (doc): règles parent/enfant + cas sans enfants.
- [x] Aligner `HomeRoutineVM`/types pour porter explicitement les états nécessaires à la UI (checked + totals fiables).
- [x] Documenter la règle "étoiles gagnées du jour" (source unique).
- [x] Extraire la clé date locale (`localDateString`) en utilitaire partagé pour éviter le couplage Home/Settings.

### 9.2 SQL / Supabase (invariants server-side)
- [x] Ajouter des RPC Postgres transactionnelles:
- `toggle_task_check(profile_id, profile_moment_activity_task_id, check_date)`
- `toggle_activity_check(profile_id, profile_moment_activity_id, check_date)`
- `validate_day(profile_id, check_date)` -> retourne `earned_stars`, `new_balance`
- [x] Implémenter `toggle_task_check(profile_id, profile_moment_activity_task_id, check_date)` avec recalcul activity/moment parent dans la même transaction.
- [x] Implémenter `toggle_activity_check(profile_id, profile_moment_activity_id, check_date)` avec cascade tâches + recalcul moment parent.
- [x] Implémenter `validate_day(profile_id, check_date)` idempotent avec retour stable (`earned_stars`, `new_balance`), crédit solde atomique et reset checks.
- [x] Ajouter la persistance `daily_validations` pour garantir l'idempotence des retries.
- [x] Garantir que les RPC maintiennent la cohérence parent/enfant.
- [x] Mettre à jour `docs/sql/schema-v2.sql` avec les fonctions et droits d'exécution.
- [x] Aligner `supabaseTypes.ts` avec les signatures/retours RPC ajoutés.
- [x] Durcir le schéma sticker activité: `profile_moment_activities.sticker_key` obligatoire (`DEFAULT 'stars-icon'` + `NOT NULL` + `CHECK btrim(sticker_key) <> ''`) via migration dédiée `docs/sql/migration-e9-r13-pma-sticker-required.sql`.

### 9.3 Repository Home (`src/features/home/services/routineRepo.ts`)
- [x] Remplacer les writes multi-étapes client par appels RPC.
- [x] Unifier lecture des checks du jour et mapping VM pour éviter les ambiguïtés parent/enfant.
- [x] Exposer une API métier claire: `toggleTask`, `toggleActivity`, `validateDay`.

### 9.4 Hook Home (`src/features/home/hooks/useHomeRoutine.ts`)
- [x] Extraire une mécanique optimistic générique (patch + rollback + refresh fallback).
- [x] Ajouter `toggleActivity`.
- [x] Protéger des doubles taps et courses (`inFlight` par cible).
- [x] Recentrer les erreurs sur des messages métier (sync/validation).

### 9.5 UI Home (parité comportement)
- [x] Rendre la ligne activité pressable dans `ActivityCard`.
- [x] Garder les tâches pressables dans `TaskRow`.
- [x] Afficher états pending/done cohérents pour activité et tâche.
- [x] Maintenir le style sticker done v1 (glow/pulse/sparkles/+étoiles).
- [x] Conserver le board profil actuel (pas de régression visuelle).

### 9.6 Validation journée
- [x] Confirmation explicite avec total d'étoiles gagnées.
- [x] Appel RPC transactionnel `validate_day`.
- [x] Refresh complet du board après validation.
- [x] Comportement post-validation clarifié dans la spec (lecture seule vs reset immédiat), appliqué de façon unique.

### 9.7 Settings / cohérence transversale
- [x] Vérifier la compatibilité avec `resetDayChecks` et `resetBalance`.
- [x] Éviter tout double effet sur la tirelire entre Home et Settings.

### 9.8 Qualité / tests
- [x] Tests unitaires du patch optimiste (cascade task/activity, agrégats stars).
- [x] Tests repo (mapping VM Home) sur règles feuilles + override validation (`earned_stars`).
- [x] Checklist manuelle multi-profils, multi-date, web/native documentée.
- [x] Commande dédiée: `test:e9-r11` (`tsc -p tsconfig.e9-r11.json && node dist/e9-r11-tests/tests/e9-r11/run.js`).

### 9.9 Migration des données existantes (E9-R10)
- [x] Clarifier que `docs/sql/schema-v2.sql` est réservé à la remise à zéro destructive.
- [x] Ajouter une section SQL de vérification post-migration (lecture seule) dans `docs/sql/migration-e9-r02-points-to-stars.sql`.
- [x] Documenter les résultats attendus pour valider l'absence de perte/casse: colonnes legacy absentes, colonnes stars présentes, cohérence `stars_earned`, RPC alignées.

### 9.10 Recette QA finale (E9-R12)

Preuves exécutées le **2026-03-10**:
- `npm run test:e9-r11` -> `OK 6 test(s) passes` (toggle task/activity, agrégats stars, override `earned_stars`).
- Vérification de contrat Home/Settings/SQL par inspection ciblée (scopes `profile_id` + `check_date`, idempotence `validate_day`, rollback + refresh, séparation UI/services, reset Settings).

Checklist finalisée (preuves de non-régression):
- [x] Home multi-profils: isolation par `profile_id` sur lecture moments/checks/validation (`routineRepo` filtre `profile_id` sur chaque requête).
- [x] Validation journée: garde `isDayValidated`, appel RPC atomique, refresh systématique, crédit solde idempotent SQL (`validate_day`).
- [x] Retry réseau: rollback snapshot + message erreur + `refresh()` sur échec toggle/validation.
- [x] Settings reset journée: suppression ciblée `daily_validations` + `daily_checks` par `(profile_id, check_date)`, sans modification de la tirelire.
- [x] Settings reset étoiles: `resetBalance` met uniquement `profiles.balance = 0`.
- [x] Multi-date: toutes les opérations critiques filtrent/propagent `check_date` avec la clé locale `localDateString()`.
- [x] Restart app: rechargement DB au montage (`useEffect -> refresh -> getRoutineForDate`), ce qui force la source de vérité serveur.
- [x] Migration existante: script SQL post-migration documenté et prêt à exécution en section 3 de `docs/sql/migration-e9-r02-points-to-stars.sql`.

---

## Fichiers impactés (prévision)

```
docs/roadmap/EPIC9-corrections-home.md      ← mis à jour (ce document)
docs/sql/schema-v2.sql                       ← fonctions RPC + grants (à implémenter)
docs/sql/migration-e9-r02-points-to-stars.sql ← migration non destructive + vérification post-migration
docs/sql/migration-e9-r13-pma-sticker-required.sql ← migration non destructive sticker activité obligatoire
src/shared/db/supabaseTypes.ts               ← regen types Supabase (si RPC/types changent)

src/features/home/services/routineRepo.ts    ← refactor writes/read mapping
src/features/home/services/routineMapper.ts  ← mapping VM Home pur (testable)
src/features/home/services/homeOptimisticPatch.ts ← patch/recompute local deterministe
src/features/home/hooks/useHomeRoutine.ts    ← optimistic orchestration + toggles activity
src/features/home/types/index.ts             ← ajustements VM si nécessaire

src/features/home/components/ActivityCard.tsx
src/features/home/components/TaskRow.tsx
src/features/home/components/MomentSection.tsx
src/features/home/components/ValidateDayButton.tsx

tests/e9-r11/run.ts                           ← tests unitaires E9-R11 (repo mapper + patch)
tsconfig.e9-r11.json                          ← config TypeScript dédiée aux tests E9-R11
```

---

## Critères d'acceptation

- [x] Cocher une tâche met à jour instantanément UI + étoiles du jour + progression.
- [x] Cocher/décocher une activité met à jour toutes ses tâches et parents de manière cohérente.
- [x] Aucun double crédit de la tirelire, même en taps rapides ou latence réseau.
- [x] Validation journée crédite exactement les étoiles gagnées et réinitialise les checks du jour selon la règle métier définie.
- [x] Après refresh/app restart, l'état affiché correspond strictement à la DB (pas de divergence).
- [x] Aucun accès Supabase direct depuis les composants UI.
- [x] La vérification post-migration SQL renvoie uniquement les résultats attendus (aucune colonne legacy / aucune incohérence `stars_earned`).

---

## Hors scope de cet EPIC

- Realtime live sync multi-device (peut venir ensuite).
- Refonte visuelle complète Home (EPIC polish).
- Google OAuth / auth flows.

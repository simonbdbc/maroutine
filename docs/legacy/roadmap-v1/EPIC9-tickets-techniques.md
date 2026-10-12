# EPIC 9 — Tickets techniques

Objectif: executer EPIC 9 en PRs courtes, sans effets de bord, en respectant l'architecture feature-based.

Statut du fil: `✅ CLOTURÉ` (rescope stars simplifié livré le 10 mars 2026).

---

## Ordre recommande

`T01 -> T02 -> T03 -> T06 -> T07 -> T08 -> T09 -> T10 -> T11 -> T12`  
`T04/T05` peuvent etre livres entre `T03` et `T08` selon priorite UI.

---

## Backlog ticketise

| Ticket | Statut | Scope | Fichiers cibles | DoD |
|---|---|---|---|---|
| `E9-T01` | ✅ Termine | Contrat metier checkable (invariants + cas edge + regle points/jour + regle validation) | `docs/roadmap/EPIC9-corrections-home.md`, `docs/roadmap/EPIC5-home.md` | Regles non ambigues et utilisables pour tests/impl |
| `E9-T02` | ✅ Termine | Decoupler date metier Home/Settings (`localDateString` en shared) | `src/features/home/services/routineRepo.ts`, `src/features/settings/services/settingsRepo.ts`, `src/shared/*` | Plus aucun import `@features/home` depuis Settings |
| `E9-T03` | ✅ Termine | RPC SQL `toggle_task_check` atomique + idempotent | `docs/sql/schema-v2.sql` | Toggle rejouable sans double credit |
| `E9-T04` | ✅ Termine | RPC SQL `toggle_activity_check` avec cascade vers taches | `docs/sql/schema-v2.sql` | Cohesion parent/enfant garantie en 1 transaction |
| `E9-T05` | ✅ Termine | RPC SQL `toggle_moment_check` (backend pret) | `docs/sql/schema-v2.sql` | Endpoint coherent avec les memes invariants |
| `E9-T06` | ✅ Termine | RPC SQL `validate_day` (earned_points + new_balance) | `docs/sql/schema-v2.sql` | Credit tirelire atomique, reset checks du jour |
| `E9-T07` | ✅ Termine | Typage Supabase des Functions RPC | `src/shared/db/supabaseTypes.ts`, `src/shared/db/index.ts` | Appels RPC strictement types |
| `E9-T08` | ✅ Termine | Refactor repo Home vers RPC (`toggleTask/activity/moment`, `validateDay`) | `src/features/home/services/routineRepo.ts` | Plus de read-modify-write JS sur `profiles.balance` |
| `E9-T09` | ✅ Termine | Module pur d'optimistic patch + recompute agregats | `src/features/home/services/homeOptimisticPatch.ts`, `src/features/home/hooks/useHomeRoutine.ts` | Patch deterministe + rollback fiable |
| `E9-T10` | ✅ Termine | Hook: `toggleActivity`, garde `inFlight`, refresh fallback | `src/features/home/hooks/useHomeRoutine.ts`, `src/features/home/types/index.ts` | Pas de doubles taps concurrents sur la meme cible |
| `E9-T11` | ✅ Termine | UI parite v1 (activite pressable + tache pressable + done/pending coherent) | `src/features/home/components/ActivityCard.tsx`, `src/features/home/components/TaskRow.tsx`, `src/features/home/components/MomentSection.tsx`, `app/(app)/home.tsx` | Interaction complete sans regression visuelle |
| `E9-T12` | ✅ Termine | Validation journee UX + coherence Settings + checklist QA | `src/features/home/components/ValidateDayButton.tsx`, `src/features/settings/services/settingsRepo.ts`, `app/(app)/profiles/index.tsx`, `docs/roadmap/EPIC9-corrections-home.md` | Parcours stable multi-profils/multi-date/restart |
| `E9-B01` | ✅ Termine | Fix course condition: validation avec toggles in-flight pouvait créditer `0` | `src/features/home/hooks/useHomeRoutine.ts` | Validation attend la fin de sync avant `validate_day` |
| `E9-B02` | ✅ Termine | Fix affichage étoiles du jour post-validation | `src/features/home/services/routineRepo.ts` | Si `daily_validations` existe, `todayStars` = `earned_stars` après refresh |
| `E9-T13` | ✅ Termine | UI activité pending: sticker simple dans cercle gauche | `src/features/home/components/ActivityCard.tsx`, `src/features/home/components/StickerSlot.tsx` | Activité non cochée affiche un sticker simple à gauche |
| `E9-T14` | ✅ Termine | UI tâches: retirer stickers, garder cercles `✗/✓` | `src/features/home/components/TaskRow.tsx` | Tâches rendues sans sticker image |

---

## Notes de sequencing

- `T03`, `T04`, `T05`, `T06` sont la base anti side-effects (atomique/idempotent).
- `T08`, `T09`, `T10`, `T11` se font apres les RPC pour eviter du rework.
- `T12` ferme le fil avec la verification transverse Home/Settings.

---

## Backlog rescope stars (livré)

| Ticket | Statut | Scope | Fichiers cibles | DoD |
|---|---|---|---|---|
| `E9-R01` | ✅ Termine | Renommer le langage metier `points` -> `stars` dans Home + docs EPIC 9 | `docs/roadmap/EPIC9-corrections-home.md`, `docs/roadmap/EPIC5-home.md`, `src/features/home/*` | Plus aucun `points` metier expose dans Home (UI/types/hooks) |
| `E9-R02` | ✅ Termine | Migration SQL colonnes `points*` -> `stars*` + `earned_points` -> `earned_stars` | `docs/sql/schema-v2.sql`, `docs/sql/migration-e9-r02-points-to-stars.sql` | Schema source + script de migration copy/paste alignes en `stars` |
| `E9-R03` | ✅ Termine | Refactor RPC: supprimer `toggle_moment_check`, garder `toggle_task_check` + `toggle_activity_check` + `validate_day` | `docs/sql/schema-v2.sql`, `docs/sql/migration-e9-r02-points-to-stars.sql` | Plus aucun endpoint `toggle_moment*`; grants et signatures alignes |
| `E9-R04` | ✅ Termine | Regles SQL de calcul: moment ne rapporte jamais, validation depuis feuilles uniquement | `docs/sql/schema-v2.sql`, `docs/sql/migration-e9-r02-points-to-stars.sql` | `validate_day` calcule uniquement sur taches + activites sans taches |
| `E9-R05` | ✅ Termine | Regenerer/aligner types Supabase (`stars`, RPC sans moment) | `src/shared/db/supabaseTypes.ts`, `src/shared/db/index.ts` | Types stricts en `stars` et export `toggle_moment` retire |
| `E9-R06` | ✅ Termine | Refactor Home VM + repo (`todayStars`, `activity.stars`, `task.stars`, moment recap only) | `src/features/home/types/index.ts`, `src/features/home/services/routineRepo.ts`, `src/features/home/index.ts` | Home lit/calcul correctement les etoiles sans feuille moment et export `toggleMoment` retire |
| `E9-R07` | ✅ Termine | Refactor optimistic patch sur nouvelles regles feuilles + suppression path moment toggle | `src/features/home/services/homeOptimisticPatch.ts`, `src/features/home/hooks/useHomeRoutine.ts` | Patch local conforme aux regles stars et sans `toggleMoment` |
| `E9-R08` | ✅ Termine | UI Home: libelles/props en etoiles + badge done coherent | `src/features/home/components/ValidateDayButton.tsx`, `src/features/home/components/ActivityCard.tsx`, `src/features/home/components/StickerSlot.tsx`, `app/(app)/home.tsx` | UI ne parle que d'etoiles; comportement inchange |
| `E9-R09` | ✅ Termine | Compat Settings reset journee apres renommage (`daily_validations.earned_stars`) | `src/features/settings/services/settingsRepo.ts` | Reset journee fonctionnel apres migration |
| `E9-R10` | ✅ Termine | Migration des donnees existantes + script de verification post-migration | `docs/sql/schema-v2.sql`, `docs/sql/migration-e9-r02-points-to-stars.sql`, `docs/roadmap/EPIC9-corrections-home.md` | Donnees migrees sans perte et checks post-migration documentes |
| `E9-R11` | ✅ Termine | Tests Home (repo + patch optimiste) sur regles stars simplifiees | `src/features/home/services/routineMapper.ts`, `src/features/home/services/homeOptimisticPatch.ts`, `tests/e9-r11/run.ts`, `tsconfig.e9-r11.json` | Cas critiques couverts: toggle, aggregation stars, validation override |
| `E9-R12` | ✅ Termine | Recette QA finale multi-profils/multi-date/restart sur vocabulaire stars | `docs/roadmap/EPIC9-corrections-home.md` | Checklist completee avec preuves de non-regression |
| `E9-R13` | ✅ Termine | Hardening DB stickers activite: `profile_moment_activities.sticker_key` obligatoire (DEFAULT + NOT NULL + CHECK non vide) | `docs/sql/migration-e9-r13-pma-sticker-required.sql`, `docs/sql/schema-v2.sql`, `src/shared/db/supabaseTypes.ts` | Aucune activite de routine sans sticker en base; contrat schema/types aligne |

### Dependances builder (EPIC 8)

- Les tickets `E9-R06` a `E9-R08` dependent des regles Builder ci-dessous:
  - activite sans taches => etoiles activite obligatoires (>0),
  - activite avec taches => etoiles activite desactivees (=0) + toutes les taches >0.

# EPIC 8 — Tickets techniques

Objectif: finaliser EPIC 8 (Catalogue + Routine Builder) apres rescope `points -> stars` et ajout stickers activite par profil/moment, sans casser EPIC 9.

Statut du fil: `✅ CLOTURÉ` (rescope stars/stickers livré le 10 mars 2026).

---

## Ordre recommande

`Aucun` (fil clos)

---

## Tickets deja livres

| Ticket | Statut | Scope | Fichiers cibles | DoD |
|---|---|---|---|---|
| `E8-R01` | ✅ Termine | Ajout 1re tache: forcer `activity.stars = 0` et desactiver edition activite | `src/features/catalog/services/builderDraftOps.ts`, `src/features/catalog/components/RoutineBuilderScreen.tsx` | Activite avec taches impossible a renseigner en etoiles |
| `E8-R02` | ✅ Termine | Suppression derniere tache: reactiver edition activite | `src/features/catalog/services/builderDraftOps.ts`, `src/features/catalog/components/RoutineBuilderScreen.tsx` | Retour au cas "activite feuille" |
| `E8-R03` | ✅ Termine | Validation bloquante avant save (regles activite/taches) | `src/features/catalog/services/builderValidation.ts`, `src/features/catalog/hooks/useRoutineBuilder.ts` | Save refuse si draft metier invalide |
| `E8-R04` | ✅ Termine | Messages metier lisibles + surlignage des erreurs | `src/features/catalog/components/RoutineBuilderScreen.tsx` | Erreurs visibles au bon niveau activite/tache |
| `E8-R05` | ✅ Termine | Migration code Catalog/Builder `points/default_points` -> `stars/default_stars` (types, repo, UI labels) | `src/features/catalog/types/index.ts`, `src/features/catalog/services/catalogRepo.ts`, `src/features/catalog/services/builderReadService.ts`, `src/features/catalog/services/builderWriteService.ts`, `src/features/catalog/services/builderDraftOps.ts`, `src/features/catalog/services/builderValidation.ts`, `src/features/catalog/hooks/useRoutineBuilder.ts`, `src/features/catalog/components/RoutineBuilderScreen.tsx`, `src/features/profiles/services/momentRepo.ts`, `src/features/profiles/services/profileRepo.ts`, `src/features/profiles/types/index.ts` | Plus aucun acces `default_points`/`points` dans features catalog/profiles; VM Builder expose `stars`; UI parle d'etoiles |
| `E8-R06` | ✅ Termine | Persistance sticker activite par pivot `profile_moment_activities.sticker_key` (read/write + types) | `src/features/catalog/services/builderReadService.ts`, `src/features/catalog/services/builderWriteService.ts`, `src/shared/db/supabaseTypes.ts` | Un sticker choisi dans Builder est retrouve apres reload |
| `E8-R07` | ✅ Termine | UI Builder: selection/modification sticker par activite (par profil/moment) | `src/features/catalog/components/RoutineBuilderScreen.tsx`, `src/features/catalog/hooks/useRoutineBuilder.ts`, `src/features/catalog/services/builderDraftOps.ts`, `src/features/profiles/components/StickerPicker.tsx` | Chaque activite a un picker sticker; modification locale puis sauvegarde DB |
| `E8-R08` | ✅ Termine | Integrer le sticker configure dans Home pour l'etat activite pending/done (source Builder unique) | `src/features/home/services/routineMapper.ts`, `src/features/home/types/index.ts`, `src/features/home/components/ActivityCard.tsx` | Activite non cochee/cochee affiche la meme cle sticker Builder; aucun fallback runtime |
| `E8-R09` | ✅ Termine | Tests unitaires Builder (ops + validation) et non-regression mapping stars/sticker | `tests/e8-r09/run.ts`, `tsconfig.e8-r09.json`, `src/features/catalog/services/builderDraftOps.ts`, `src/features/catalog/services/builderValidation.ts`, `src/features/home/services/routineMapper.ts` | Cas critiques couverts: regles stars, add/remove task, sticker persist, save/reload |
| `E8-R10` | ✅ Termine | Recette finale + cloture doc EPIC8 | `docs/roadmap/EPIC8-catalog-builder.md`, `docs/roadmap/ROADMAP.md` | Checklist QA completee, EPIC8 passe `✅` |

---

## Cloture

EPIC 8 est termine. Le suivi historique des tickets est conserve dans ce fichier.

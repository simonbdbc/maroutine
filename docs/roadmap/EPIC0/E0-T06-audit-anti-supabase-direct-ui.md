# E0-T06 — Audit Anti-Supabase Direct UI (Écrans Critiques)

**Statut :** Proposé (en revue)  
**Date :** 2026-03-31  
**Ticket :** E0-T06  
**Dépendances :** E0-T02, E0-T03

---

## Objectif

Inventorier les accès Supabase depuis la couche UI, identifier les écrans conformes/non conformes et établir un plan de remédiation.

---

## Périmètre audité

Écrans critiques ciblés:
- Home: `app/(app)/home.tsx`
- Profils: `app/(app)/profiles/index.tsx`
- Builder routine: `app/(app)/profiles/builder.tsx` + `src/features/catalog/components/RoutineBuilderScreen.tsx`
- Réglages métier: `app/(app)/settings.tsx`

Écrans auth (contrôle annexe):
- `app/(auth)/login.tsx`
- `src/features/auth/screens/*`

---

## Méthode

1. Recherche statique des imports directs `supabase` dans UI:
   - `rg "import { supabase } from \"@shared/db\""` sur `app/` + `src/features` (hors `services/`, `stores/`).
2. Analyse des chaînes d'appel écran -> hook -> service pour détecter les accès indirects au distant.
3. Classement conformité:
   - `Conforme (direct)` = aucun import/appel Supabase dans le fichier UI.
   - `Non conforme (direct)` = accès Supabase direct depuis UI.
   - `Exception validée` = accès direct accepté par contrainte produit explicitée.
   - `Risque indirect` = UI sans accès direct, mais dépend d'un service Supabase direct (non local-first).

---

## Résultats synthèse

| Catégorie | Résultat |
|---|---|
| Accès Supabase direct dans UI critique ciblée | 0 |
| Accès Supabase direct dans UI globale (incl. auth) | 1 (exception auth validée: `VerifyEmailScreen`) |
| Écrans critiques dépendants de services Supabase directs (indirect) | 4/4 |

---

## Détails par écran

| Écran | Statut direct UI | Risque indirect | Preuves |
|---|---|---|---|
| Home | Conforme (direct) | Oui | `app/(app)/home.tsx:17-18` -> `useProfiles` / `useHomeRoutine`; `useHomeRoutine.ts:4-9`; `routineRepo.ts:1,46-55,61-83,124-158` |
| Profils | Conforme (direct) | Oui | `app/(app)/profiles/index.tsx:7,12`; `useProfiles.ts:3-10`; `profileRepo.ts:1,31-37,57-69,92-100`; `settingsRepo.ts:1,15-29,42-66` |
| Builder routine | Conforme (direct) | Oui | `app/(app)/profiles/builder.tsx:5`; `RoutineBuilderScreen.tsx:310`; `useRoutineBuilder.ts:3-4`; `builderReadService.ts:1,33-37,52-57,66-70`; `builderWriteService.ts:1,28-31,43-62,67-151` |
| Settings | Conforme (direct) | Oui (élevé) | `app/(app)/settings.tsx:8-12` (import direct `catalogRepo`); `catalogRepo.ts:1,15-17,30-37,62-64,108-110` |

---

## Exception directe identifiée (hors périmètre critique)

| Écran | Constat | Preuve |
|---|---|---|
| VerifyEmailScreen | Appel direct `supabase.auth.resend` dans la UI, requis par flux auth online-only | `src/features/auth/screens/VerifyEmailScreen.tsx:4,22-25` |

Remarque: exception acceptée, car l'app offline est conditionnée à une authentification préalable en ligne.

---

## Conclusion conformité E0-T06

- **DoD "0 accès direct sur écrans critiques ciblés"**: **atteint** (audit statique).
- **Conformité architecture offline-first globale**: **non atteinte** à ce stade, car les écrans critiques restent dépendants de services qui lisent/écrivent Supabase directement.
- **Exception auth**: acceptée (signup/login/verify-email non couverts par l'exigence offline).

---

## Plan de remédiation recommandé

1. Introduire des repositories local-first pour home/profils/builder/settings (EPIC3 E3-T03).
2. Réserver Supabase aux adapters sync/auth et interdire les imports `@shared/db` hors `services/adapters` (avec exception auth explicitée).
3. Ajouter un contrôle CI (grep bloquant) pour empêcher `import { supabase }` dans `app/**` et `src/features/**/{screens,components,hooks}`, sauf liste d'exceptions auth.

---

## Commande d'audit reproductible

```bash
rg -n "import\\s+\\{\\s*supabase\\s*\\}\\s+from\\s+\"@shared/db\"" app src/features --glob '*.tsx' --glob '!**/services/**' --glob '!**/stores/**'
```

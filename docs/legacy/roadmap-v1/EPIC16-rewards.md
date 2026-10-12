# EPIC 16 — Récompenses

**Statut : 🔲 À FAIRE**  
**Dépendances :** EPIC 9 ✅, EPIC 15 🔲  
**Débloque :** EPIC 11 (polish UX), EPIC 12 (tests/build)

---

## Résumé

Cet EPIC couvre le nouveau screen `Récompenses` appelé depuis le Home header et le side menu.

EPIC 15 livre l'accès/navigation vers `/(app)/rewards`.  
EPIC 16 implémente le métier et l'expérience utilisateur de la fonctionnalité Récompenses.

---

## Cibles fonctionnelles (MVP)

- Afficher un écran Récompenses dédié, lisible parent/enfant.
- Réutiliser la tirelire existante (`profiles.balance`) comme source de budget.
- Permettre des actions de récompense sans casser la cohérence des étoiles.
- Garder le comportement idempotent/atomique sur les écritures impactant la tirelire.

---

## Tickets techniques (prévision)

| Ticket | Statut | Scope | Fichiers pressentis | DoD |
|---|---|---|---|---|
| `E16-T01` | 🔲 À faire | Cadrage métier Récompenses (règles, rôles parent/enfant, UX de base) | `docs/roadmap/EPIC16-rewards.md` | Contrat métier validé avant implémentation |
| `E16-T02` | 🔲 À faire | Définir le modèle de données Récompenses (schéma + migrations SQL) | `docs/sql/schema-v2.sql`, `docs/sql/migration-*.sql`, `src/shared/db/supabaseTypes.ts` | Schéma DB prêt et typé |
| `E16-T03` | 🔲 À faire | Implémenter services/repo Récompenses (lecture + écritures transactionnelles) | `src/features/rewards/services/*` | API feature stable et testable |
| `E16-T04` | 🔲 À faire | Implémenter `RewardsScreen` (liste, états vides, erreurs, loading) | `app/(app)/rewards.tsx`, `src/features/rewards/components/*`, `src/features/rewards/hooks/*` | Écran fonctionnel branché données réelles |
| `E16-T05` | 🔲 À faire | Flux d'action Récompense (débit tirelire + protections anti double débit) | `src/features/rewards/services/*`, `src/features/settings/services/settingsRepo.ts` | Aucun double débit possible |
| `E16-T06` | 🔲 À faire | QA + tests ciblés Récompenses | `tests/*`, `docs/roadmap/EPIC16-rewards.md` | Checklist fonctionnelle validée |

---

## Hors scope

- Refonte design complète multi-feature.
- Gamification avancée hors MVP (badges complexes, challenges, saisons).

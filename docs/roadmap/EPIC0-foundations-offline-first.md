# EPIC 0 — Fondations d'Architecture Offline-First

**Statut : 🚧 En cours**  
**Priorité : Critique**  
**Dépendances amont :** aucune  
**Dépendances aval :** EPIC 1, 2, 3, 4, 5, 6, 8

---

## Objectif

Verrouiller l'architecture offline-first avant implémentation pour éviter une dérive vers un cache opportuniste non durable.

## Principe d'Architecture

- Les écrans critiques lisent depuis WatermelonDB local.
- Supabase reste le backend distant (Auth/Postgres/Storage).
- Service worker limité au shell/cache réseau.
- Sync pilotée par outbox locale explicite.
- Packs stickers gérés par couche dédiée (hors cache générique).
- Onboarding auth (création de compte / login initial / vérification email) online-only; mode offline métier après authentification.

## Sous-lots

- ADR architecture offline-first.
- Schémas de flux lecture/écriture/sync.
- Matrice source de vérité par type de donnée.
- Politique de conflits v1.
- Politique de versionning packs.
- Audit anti-accès direct Supabase depuis UI critique.

Livrable ADR courant: [ADR-0001 offline-first architecture](./adr/ADR-0001-offline-first-architecture.md)
Livrable matrice courant: [E0-T02 source de vérité](./EPIC0/E0-T02-source-of-truth-matrix.md)
Livrable flux courant: [E0-T03 lecture/écriture/sync](./EPIC0/E0-T03-read-write-sync-flows.md)
Livrable conflits courant: [E0-T04 politique conflits v1](./EPIC0/E0-T04-conflict-policy-v1.md)
Livrable versionning packs courant: [E0-T05 politique versionning packs](./EPIC0/E0-T05-pack-versioning-policy.md)
Livrable audit courant: [E0-T06 audit anti-Supabase direct UI](./EPIC0/E0-T06-audit-anti-supabase-direct-ui.md)

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E0-T01 | ADR offline-first | 🚧 En cours | Critique | Architecture | — | Rédiger ADR principes/couches | Implémentation code | ADR versionné et validé | ADR approuvé | Review archi | Revenir ADR N-1 | Historique ADR | 2, 3, 5 |
| E0-T02 | Matrice source de vérité | 🚧 En cours | Critique | Architecture | E0-T01 | Lister source de vérité par donnée | Modèle final complet | Tableau source locale/distance | Tableau validé | Review produit+tech | Restaurer matrice N-1 | Journal changements matrice | 2, 5 |
| E0-T03 | Flux lecture/écriture/sync | 🚧 En cours | Critique | Architecture | E0-T01 | Schéma flux local->outbox->remote | Détails per-feature | Diagrammes décisionnels | Diagrammes validés | Walkthrough scénarios | Version précédente diagrammes | Checklist parcours | 3, 5 |
| E0-T04 | Politique conflits v1 | 🚧 En cours | Critique | Gouvernance sync | E0-T03 | Définir LWW + cas exception | Résolution avancée multi-acteurs | Politique écrite + cas limites | Politique signée | Revue cas de conflit | Revenir politique conservatrice | Journal conflits simulés | 3 |
| E0-T05 | Politique versionning packs | 🚧 En cours | Critique | Stickers | E0-T01 | Définir niveaux catalogue/pack/asset | CDN final | Contrat versionning documenté | Contrat validé | Revue technique | Revenir à contrat minimal | Log versions attendues | 2, 4 |
| E0-T06 | Audit anti-Supabase direct UI | 🚧 En cours | Critique | Gouvernance code | E0-T02, E0-T03 | Inventaire lectures UI critiques | Refactor total immédiat | Liste écrans conformes/non conformes | 0 accès direct sur écrans critiques ciblés | Contrôle manuel + grep | Lever règle pour debug local | Rapport conformité | 5 |

## Risques Couverts

- Risque 2: confusion cache vs stockage durable.
- Risque 3: absence de journal de sync.
- Risque 5: dépendance réseau des écrans métier.

## Critères de Done EPIC

- Architecture validée.
- Conventions de nommage/responsabilités validées.
- Règle "aucun écran critique ne lit Supabase direct" validée.

## Dépendances Amont/Aval

- Amont: aucune.
- Aval: débloque tous les EPICs web-first.

# EPIC 9 — Hardening Web-First Production

**Statut : 🔲 À faire**  
**Priorité : Moyenne**  
**Dépendances amont :** EPIC 1, 2, 3, 4, 5, 6, 7, 8  
**Dépendances aval :** EPIC 10

---

## Objectif

Stabiliser la v1 web offline-first en production avant extension Android/iOS.

## Principe d'Architecture

- Campagne QA dédiée offline-first.
- Tests de résilience sur SW, packs, sync et reprise.
- Instrumentation minimale de production pour diagnostiquer rapidement.

## Sous-lots

- Matrice QA offline-first.
- Scénarios réseau coupé/reprise.
- Scénarios update SW/obsolescence.
- Scénarios corruption partielle packs.
- Scénarios conflits sync/retry.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E9-T01 | Matrice QA offline-first | 🔲 À faire | Moyenne | QA | E7-T02, E6-T07 | Définir matrice cas critiques | E2E device farm complète | Matrice validée et versionnée | Couverture scénarios critiques approuvée | Revue QA | Revenir matrice N-1 | Historique exécutions | 1, 2, 3, 4, 5 |
| E9-T02 | Scénarios SW update/obsolescence | 🔲 À faire | Moyenne | QA SW | E2-T04, E2-T06 | Tester versions waiting/activation/rollback | Refactor SW | Cas SW obsolète traités | Aucun blocage majeur non documenté | Tests manuels + preview | Revenir SW baseline | Logs version SW | 1 |
| E9-T03 | Scénarios corruption pack partielle | 🔲 À faire | Moyenne | QA packs | E4-T04, E5-T04 | Simuler téléchargements partiels/corruptions | Auto-heal complet | Détection + récupération documentées | Aucune utilisation de pack invalide | Tests corruption artificielle | Désactiver version fautive | Logs intégrité pack | 2, 4 |
| E9-T04 | Scénarios conflits sync/retry | 🔲 À faire | Moyenne | QA sync | E6-T05, E6-T06 | Simuler conflits + retries idempotents | Conflits multi-acteurs avancés | Conflits v1 et retries validés | Aucun doublon critique observé | Tests charge légère | Suspendre sync auto | Logs conflits/retries | 3 |
| E9-T05 | Tests reprise refresh/redémarrage | 🔲 À faire | Moyenne | QA reprise | E3-T04, E6-T03, E8-T01 | Vérifier persistance et reprise | Migration version majeure | Reprise fiable après refresh/restart | Données locales cohérentes après restart | Tests cold/warm restarts | Revenir sauvegarde N-1 | Logs reprise | 3, 5 |
| E9-T06 | Instrumentation minimale prod | 🔲 À faire | Moyenne | Observabilité | E7-T04 | Instrumenter SW/packs/sync/réseau | Plateforme APM complète | Signal minimum production disponible | Incident triable en <30 min | Exercice incident simulé | Désactiver métriques non stables | Dashboard minimal | 1, 2, 3, 4 |

## Risques Couverts

- Consolidation des risques 1, 2, 3, 4, 5 avant extension mobile.

## Critères de Done EPIC

- Matrice QA validée.
- Scénarios de reprise testés.
- Instrumentation minimale active en prod.

## Dépendances Amont/Aval

- Amont: tous les EPICs web-first.
- Aval: prérequis d'extension Android/iOS (EPIC 10).

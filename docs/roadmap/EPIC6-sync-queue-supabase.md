# EPIC 6 — Journal de Sync Local + Moteur de Synchronisation Supabase

**Statut : 🔲 À faire**  
**Priorité : Critique**  
**Dépendances amont :** EPIC 0, EPIC 3  
**Dépendances aval :** EPIC 7, EPIC 8, EPIC 9

---

## Objectif

Rendre les écritures offline fiables, rejouables et traçables via une outbox locale explicite.

## Principe d'Architecture

- Écrire local d'abord.
- Enregistrer la mutation dans `sync_queue`.
- Pousser vers Supabase ensuite.
- Marquer `synced` uniquement après confirmation distante.
- Retry avec backoff + idempotence.

## Sous-lots

- Modèle `sync_queue` local.
- API outbox locale.
- Worker de sync au retour réseau.
- Idempotency key stable.
- Politique conflits v1 (LWW) + diagnostics.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E6-T01 | Schéma `sync_queue` | 🔲 À faire | Critique | Modèle sync | E3-T02, E0-T03 | Définir colonnes queue (op/payload/status/retry/idempotency) | Bus événementiel global | Schéma queue documenté et versionné | Queue exploitable localement | Tests insert/read local | Revenir schéma N-1 | Metrics taille queue | 3 |
| E6-T02 | API outbox locale | 🔲 À faire | Critique | DAL sync | E6-T01 | API création/maj événements sync | Resolve conflits automatique avancé | API outbox utilisée par write path | Toute mutation offline entre en queue | Tests write offline | Revenir write direct temporaire | Logs enqueue | 3 |
| E6-T03 | Sync worker reconnexion/reprise | 🔲 À faire | Critique | Worker | E6-T02, E3-T05 | Worker relance sur reconnect + redémarrage | Concurrence multi-worker complète | Traitement séquentiel/lot robuste | Sync reprend après redémarrage | Tests restart/reconnect | Stopper worker auto | Logs run worker | 3, 5 |
| E6-T04 | Idempotency key stable | 🔲 À faire | Critique | Fiabilité | E6-T02 | Générer clé stable par mutation | Dédup globale inter-services | Retry sans doublon distant | Aucun doublon après retry | Tests retry forcé | Désactiver retrys automatiques | Logs clés idempotence | 3 |
| E6-T05 | Retry + backoff | 🔲 À faire | Critique | Fiabilité | E6-T03 | Politique retry progressive | Circuit breaker complexe | Échecs transitoires rejoués | Retry conforme policy | Tests erreurs réseau 5xx | Réduire retry au manuel | Metrics retry_count | 3 |
| E6-T06 | Politique conflits v1 (LWW) + traçage | 🔲 À faire | Haute | Gouvernance sync | E0-T04, E6-T03 | Appliquer LWW entités non critiques | Merge collaboratif avancé | Conflits traités et loggés | Cas conflits v1 couverts | Tests conflits synthétiques | Revenir manuel conflit | Journal conflits | 3 |
| E6-T07 | Observabilité erreurs sync | 🔲 À faire | Haute | Observabilité | E6-T03, E6-T05 | Reporter `last_error`, états, dernier succès | Observabilité APM complète | Erreurs sync visibles diagnostics | Debug possible sans serveur | QA erreurs simulées | Revenir logs minima | Dashboard simple sync | 3 |

## Risques Couverts

- Risque 3: offline sans journal de sync.
- Risque 5: dépendance au réseau en écriture.

## Critères de Done EPIC

- Écriture offline survit au redémarrage.
- Mutation part à la reconnexion.
- Pas de doublons après retry.
- Erreurs sync traçables.

## Dépendances Amont/Aval

- Amont: EPIC 0, EPIC 3.
- Aval: nécessaire pour diagnostics, auth offline, hardening.

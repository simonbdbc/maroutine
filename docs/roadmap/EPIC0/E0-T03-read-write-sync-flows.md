# E0-T03 — Flux Lecture / Écriture / Sync (Offline-First v1)

**Statut :** Proposé (en revue)  
**Date :** 2026-03-31  
**Ticket :** E0-T03  
**Dépendance :** E0-T01 ([ADR-0001](./adr/ADR-0001-offline-first-architecture.md))

---

## Objectif

Formaliser les flux de référence `local -> outbox -> remote` pour les parcours critiques, avec points de décision explicites.

## Précondition d'entrée offline

- Onboarding auth (signup, login initial, vérification email) = online-only.
- Les flux ci-dessous s'appliquent aux parcours métier après authentification et session locale disponible.

---

## Diagramme 1 — Lecture UI critique

```mermaid
flowchart TD
  A["Un écran critique demande des données"] --> B["Repository local-first appelé par le use-case"]
  B --> C{"Données locales disponibles ?"}
  C -- "Oui" --> D["Lire WatermelonDB local"]
  D --> E["Projeter ViewModel et afficher UI"]
  C -- "Non" --> F{"Réseau disponible ?"}
  F -- "Non" --> G["Afficher état offline/empty basé local"]
  F -- "Oui" --> H["Bootstrap/sync lit distant via adapter Supabase"]
  H --> I["Hydrater la base locale"]
  I --> D
```

Règle: la UI ne lit jamais Supabase directement.

---

## Diagramme 2 — Écriture métier critique

```mermaid
flowchart TD
  A["Action utilisateur: create/update/delete/toggle"] --> B["Use-case + validations métier"]
  B --> C["Transaction locale: write dans WatermelonDB"]
  C --> D["Enqueue événement dans sync_queue (status=pending)"]
  D --> E["Recalcul projection locale et refresh UI optimiste"]
  E --> F{"Réseau disponible ?"}
  F -- "Oui" --> G["Déclencher sync worker (immédiat ou court délai)"]
  F -- "Non" --> H["Conserver pending jusqu'au retour réseau"]
```

Règle: pas de write distant direct depuis un composant UI critique.

---

## Diagramme 3 — Exécution Sync Worker

```mermaid
flowchart TD
  A["Worker prend l'événement pending le plus ancien"] --> B["Construire idempotency_key stable"]
  B --> C["Appeler adapter distant Supabase"]
  C --> D{"Réponse distante"}
  D -- "2xx succès" --> E["Marquer sync_queue: synced"]
  E --> F["Mettre à jour sync_state: last_success_at"]
  D -- "Erreur transitoire (network/5xx)" --> G["retry_count++ et calcul next_retry_at (backoff)"]
  G --> H{"Budget retry épuisé ?"}
  H -- "Non" --> I["Statut pending_retry"]
  H -- "Oui" --> J["Statut failed + last_error"]
  D -- "Conflit/viol de contrainte" --> K["Appliquer politique conflits v1 (E0-T04)"]
  K --> L{"Résolution automatique possible ?"}
  L -- "Oui" --> M["Écrire résolution locale + enqueue follow-up"]
  L -- "Non" --> N["Statut conflict + diagnostic actionnable"]
```

Règle: un événement n'est `synced` qu'après ACK distant.

---

## Diagramme 4 — Décision de lecture selon contexte réseau

```mermaid
flowchart TD
  A["Lecture demandée"] --> B{"Écran critique ?"}
  B -- "Oui" --> C["Forcer chemin local-first"]
  C --> D{"Local vide ?"}
  D -- "Non" --> E["Afficher local immédiatement"]
  D -- "Oui" --> F["Afficher fallback offline + demande sync non bloquante"]
  B -- "Non" --> G["Chemin adaptable (diag/admin)"]
```

Règle: même online, un écran critique lit local d'abord.

---

## Walkthrough Scénarios (QA)

| ID | Scénario | Chemin attendu | Résultat attendu |
|---|---|---|---|
| S0 | Utilisateur non authentifié sans réseau | Hors scope flux métier offline-first | Impossible de créer/valider un compte offline |
| S1 | Lecture écran home en offline avec local déjà hydraté | Diagramme 1: `local available` | UI complète sans appel réseau |
| S2 | Lecture cold-start avec local vide et réseau disponible | Diagramme 1: `local missing -> remote hydrate -> local read` | UI après hydration locale, sans couplage direct composant->Supabase |
| S3 | Toggle tâche online | Diagramme 2 + 3: `local write -> enqueue -> sync success` | Feedback immédiat + event `synced` |
| S4 | Toggle activité offline puis reconnexion | Diagramme 2 puis 3 différé | Mutation conservée localement puis propagée à la reconnexion |
| S5 | Sync en erreur transitoire | Diagramme 3: `retry/backoff` | Pas de perte mutation; retry programmé |
| S6 | Conflit distant sur update | Diagramme 3: branche conflit | Event marqué `conflict` ou résolu selon politique E0-T04 |

---

## Checklist parcours (DoD E0-T03)

- Chaque lecture critique passe par repository local-first.
- Chaque écriture critique crée une entrée `sync_queue`.
- Les statuts `pending/synced/pending_retry/failed/conflict` sont couverts par les flux.
- Les chemins offline (sans réseau) restent fonctionnels pour les parcours critiques.
- Le flux conflit référence explicitement E0-T04.

---

## Observabilité minimale attendue

- `sync_queue.size`, `sync_queue.pending_count`, `sync_queue.failed_count`.
- `sync_worker.last_success_at`, `sync_worker.last_error`.
- `sync_worker.retry_count` par événement.
- `conflict.count` et `conflict.last_entity`.

---

## Hors portée (rappel ticket)

- Détails par feature écran par écran.
- Algorithme complet de résolution des conflits (traité en E0-T04).

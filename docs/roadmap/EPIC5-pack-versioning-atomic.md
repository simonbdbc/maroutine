# EPIC 5 — Versionning Atomique des Packs

**Statut : 🔲 À faire**  
**Priorité : Haute**  
**Dépendances amont :** EPIC 4, EPIC 2, EPIC 0  
**Dépendances aval :** EPIC 7, EPIC 9

---

## Objectif

Éviter les versions mixtes/partielles des packs et limiter les re-téléchargements inutiles.

## Principe d'Architecture

- Versionning à trois niveaux: catalogue, pack, asset (si nécessaire).
- Téléchargement dans zone temporaire + validation + activation atomique.
- Purge de l'ancienne version uniquement après succès de l'activation.

## Sous-lots

- Manifeste catalogue versionné.
- Manifeste pack versionné avec checksums.
- Transaction de download/activation.
- Politique cache séparée shell/catalogue/assets.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E5-T01 | Manifeste catalogue versionné | 🔲 À faire | Haute | Métadonnées | E4-T01, E0-T05 | Spécifier liste packs + versions | Distribution CDN multi-région | Catalogue versionné documenté | Détection version distante possible | Tests revalidation TTL | Revenir manifeste simple | Logs version catalogue | 4 |
| E5-T02 | Manifeste pack (version/checksums) | 🔲 À faire | Haute | Métadonnées | E5-T01, E4-T04 | Détailler assets d'un pack | Signatures avancées | Contrat pack complet | Version pack vérifiable local/remote | Tests manifeste incomplet | Revenir contrat minimal | Logs mismatch manifeste | 4 |
| E5-T03 | Zone temporaire de téléchargement | 🔲 À faire | Haute | Transaction | E5-T02, E4-T03 | Download staging avant activation | Compression avancée | Écriture isolée avant switch | Aucun overwrite direct en place | Tests coupure en staging | Revenir séquence précédente | Logs staging lifecycle | 4 |
| E5-T04 | Activation atomique nouvelle version | 🔲 À faire | Haute | Transaction | E5-T03, E4-T05 | Switch atomique ancienne->nouvelle version | Multi-version simultanée longue durée | Activation sans état mixte | Aucune version mixte visible en UI | Tests switch pendant usage | Revenir version active N-1 | Logs activation | 4 |
| E5-T05 | Purge ancienne version post-succès | 🔲 À faire | Haute | Hygiene stockage | E5-T04 | Purger ancienne version après validation | Nettoyage historique complet | Purge sûre et traçable | Espace disque libéré après succès | Tests rollback puis succès | Suspendre purge automatique | Logs purge success/skip | 2, 4 |
| E5-T06 | Politique cache séparée | 🔲 À faire | Moyenne | Cache policy | E2-T02, E5-T01 | Règles distinctes shell/catalogue/assets | CDN tuning exhaustif | Politique cache documentée + appliquée | Assets inchangés non rechargés inutilement | QA réseau + reload | Revenir cache conservateur | Metrics hits/miss par type | 1, 4 |

## Risques Couverts

- Risque 4: granularité/versionning incorrect.
- Risque 2: confusion cache durable vs opportuniste.

## Critères de Done EPIC

- Pas de version mixte visible.
- Changement de version détecté proprement.
- Assets inchangés non rechargés inutilement.

## Dépendances Amont/Aval

- Amont: EPIC 4, EPIC 2, EPIC 0.
- Aval: support diagnostics/hardening (EPIC 7, EPIC 9).

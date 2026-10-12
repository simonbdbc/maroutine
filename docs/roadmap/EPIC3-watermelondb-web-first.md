# EPIC 3 — WatermelonDB Web-First + Repository Local-First

**Statut : 🔲 À faire**  
**Priorité : Critique**  
**Dépendances amont :** EPIC 0, EPIC 1  
**Dépendances aval :** EPIC 4, EPIC 6, EPIC 8

---

## Objectif

Faire de la base locale WatermelonDB (LokiJSAdapter web) la source de vérité métier du web.

## Principe d'Architecture

- Écrans critiques lisent depuis WatermelonDB local.
- UI ne lit pas Supabase directement.
- Réseau = secondaire; sync en arrière-plan à la reconnexion.

## Sous-lots

- Schéma local initial.
- DAL locale (repositories).
- Bootstrap local au démarrage.
- Hydration UI depuis local.
- Déclenchement sync non bloquant au retour réseau.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E3-T01 | Setup WatermelonDB web (LokiJSAdapter) | 🔲 À faire | Critique | Base locale | E0-T01, E1-T05 | Initialiser DB locale web | Adapter mobile natif | DB locale bootable sur web | Init stable sans réseau | Smoke test boot offline | Revenir storage temporaire | Logs init DB | 5 |
| E3-T02 | Schéma collections locales | 🔲 À faire | Critique | Modèle local | E3-T01 | Créer collections minimales (`profiles`, `moments`, `activities`, `tasks`, `sticker_packs`, `sticker_assets`, `downloaded_packs`, `sync_queue`, `sync_state`) | Modèle final complet v2 | Schéma versionné et documenté | Collections accessibles | Tests CRUD local basique | Revenir schéma N-1 | Audit migration locale | 2, 5 |
| E3-T03 | Repositories local-first | 🔲 À faire | Critique | DAL | E3-T02, E0-T06 | Implémenter accès via repositories | Refactor exhaustif toutes features | UI critique passe par repositories locaux | Plus d'accès direct Supabase en UI critique | Audit imports + QA | Revenir bridge provisoire | Metrics appels couche DAL | 5 |
| E3-T04 | Bootstrap local + hydration UI | 🔲 À faire | Critique | Démarrage | E3-T03 | Charger état UI depuis local au boot | Sync complète initiale | UI utilisable sans fetch initial | Écrans critiques visibles offline | Tests cold start offline | Revenir boot réseau | Temps de boot + erreurs | 5 |
| E3-T05 | Sync arrière-plan au retour réseau | 🔲 À faire | Haute | Orchestration | E3-T04 | Trigger sync non bloquant | Résolution conflits avancée | Sync lancée automatiquement quand réseau revient | Aucune régression UX offline | Tests bascule offline/online | Désactiver trigger auto | Logs transitions réseau | 3, 5 |
| E3-T06 | Garde-fou anti-Supabase direct UI | 🔲 À faire | Haute | Gouvernance | E3-T03 | Règle documentée + check manuel/CI | Blocage compile strict complet | Violations détectables et tracées | Aucune violation sur écrans critiques | Revue PR + grep | Assouplir règle en urgence | Rapport violations | 5 |

## Risques Couverts

- Risque 5: dépendance réseau des écrans métier.
- Risque 2: confusion stockage local durable vs cache.

## Critères de Done EPIC

- Les écrans critiques fonctionnent sans fetch réseau initial.
- L'UI est pilotée par WatermelonDB local.
- Supabase est derrière la couche sync/repository.

## Dépendances Amont/Aval

- Amont: EPIC 0, EPIC 1.
- Aval: nécessaire pour packs offline et sync robuste.

# EPIC 2 — App Shell Offline + Service Worker Maîtrisé

**Statut : 🚧 Implémenté — validation preview restante**
**Priorité : Critique**  
**Dépendances amont :** EPIC 0, EPIC 1  
**Dépendances aval :** EPIC 4, EPIC 5, EPIC 9

---

## Objectif

Garantir l'ouverture offline après premier chargement avec un service worker strictement limité au shell/cache, sans logique métier.

## Principe d'Architecture

- Service worker minimal généré au build et précache réduit.
- Pas de source de vérité métier via cache navigateur.
- Stratégie d'update pilotée par UI, pas de `skipWaiting()` agressif.

## Sous-lots

- Service worker minimal généré (shell).
- Stratégies cache navigation/shell.
- Gestion des updates + bannière.
- Panic reset (unregister SW + purge cache + hard reload).

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E2-T01 | Service worker minimal généré | ✅ Fait | Critique | SW shell | E1-T05 | Configurer SW précache réduit | Offline métier complet | SW cache shell et assets critiques | App s'ouvre offline après 1er chargement | E2E Chromium worker actif | Désactiver SW | Événements install/activate | 1 |
| E2-T02 | Stratégies cache navigation/shell | ✅ Fait | Critique | SW cache | E2-T01 | Network-first navigation + fallback | Stratégies agressives API | Routes web tolèrent offline | Fallback offline opérationnel | E2E réseau coupé | Revenir stratégie baseline | Diagnostics caches | 1 |
| E2-T03 | Exclusion logique métier du cache API | ✅ Fait | Critique | Gouvernance cache | E2-T01 | Documenter/interdire API comme vérité | Sync queue | Règles explicites sur endpoints API/auth | Aucune dépendance métier au cache API | Tests contractuels + audit SW | Lever règles temporairement | Analytics erreurs | 1, 2 |
| E2-T04 | Gestion update en waiting + bannière | ✅ Fait | Critique | Lifecycle SW | E2-T01 | Flux update utilisateur contrôlé | Auto-reload forcé | Bannière update + action consentie | Update visible sans cassure session | Contrat automatisé ; QA N/N+1 restante | Revenir prompt passif | Événements update | 1 |
| E2-T05 | Panic reset SW/cache | ✅ Fait | Haute | Support/diagnostic | E2-T01 | Outil reset local | Reset données métier | Bouton reset SW/cache documenté | Reset reproductible | Contrat + écran E2E | Désactiver outil | Événements reset | 1 |
| E2-T06 | Procédure rollback SW | 🚧 En cours | Haute | Ops | E2-T04 | Procédure version N-1 | Rollback DB | Runbook documenté | Rollback testé en preview | Exercice rollback restant | Conserver version courante | Journal incident | 1 |

## Risques Couverts

- Risque 1: service worker trop agressif.

## Critères de Done EPIC

- Ouverture offline après premier chargement.
- Nouvelle version visible proprement.
- Aucun blocage cache figé en prod sans reset.

## Livrables

- Contrat neutre : [`../PWA-CONTRACT.md`](../PWA-CONTRACT.md)
- État d'implémentation et rollback : [`../PWA-IMPLEMENTATION.md`](../PWA-IMPLEMENTATION.md)
- Générateur : `scripts/post-export-web.cjs`
- Validateur : `scripts/validate-pwa.mjs`
- Tests : `scripts/pwa-lifecycle-contract.test.mjs` et `tests/e2e/pwa.spec.ts`

## Dépendances Amont/Aval

- Amont: EPIC 0, EPIC 1.
- Aval: base nécessaire pour packs/versionning/hardening.

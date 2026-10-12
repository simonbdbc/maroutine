# EPIC 7 — UX Offline / Réseau / Diagnostics

**Statut : 🔲 À faire**  
**Priorité : Haute**  
**Dépendances amont :** EPIC 2, EPIC 4, EPIC 5, EPIC 6  
**Dépendances aval :** EPIC 9

---

## Objectif

Rendre l'état offline compréhensible pour l'utilisateur et diagnostiquer rapidement les incidents (SW, packs, sync, réseau).

## Principe d'Architecture

- Signaux UI explicites pour offline/sync/update.
- Écran diagnostics consolidant états techniques utiles.
- Outils de secours actionnables sans intervention serveur.

## Sous-lots

- Bannières d'état online/offline/sync/update.
- Écran diagnostics détaillé.
- Outils de secours (purge/reset/relance sync/revalidation).

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E7-T01 | Bannières online/offline/pending/update | 🔲 À faire | Haute | UX état | E2-T04, E6-T03 | Afficher état réseau/sync/version | Design microcopy final complet | Bannières non ambiguës | Utilisateur sait l'état courant | QA UX online/offline | Masquer bannières non critiques | Compteur affichages bannières | 1, 3 |
| E7-T02 | Écran diagnostics unifié | 🔲 À faire | Haute | Diagnostic | E4-T06, E6-T07, E5-T04 | Afficher stockage, packs, queue, dernier sync/échec, versions | Outils admin serveur | Écran diagnostics complet | Différencier bug SW/pack/sync/réseau | QA scénarios incidents | Masquer infos avancées | Logs consultations diagnostics | 1, 2, 3, 4 |
| E7-T03 | Outils secours (purge/reset/relance) | 🔲 À faire | Haute | Recovery | E2-T05, E6-T03, E5-T01 | Actions de secours locales documentées | Reset compte utilisateur | Actions exécutables et sûres | Recovery sans intervention serveur | Tests incident cache/queue | Désactiver actions risquées | Logs actions secours | 1, 2, 3 |
| E7-T04 | Guide debug prod offline-first | 🔲 À faire | Moyenne | Ops/QA | E7-T02, E7-T03 | Procédure diagnostic pas-à-pas | Monitoring enterprise complet | Guide exécutable par équipe | Temps d'investigation réduit | Runbook drill | Revenir guide N-1 | Journal postmortem | 1, 2, 3, 4 |

## Risques Couverts

- Rend observables les risques 1, 2, 3 et 4.

## Critères de Done EPIC

- L'utilisateur sait s'il est offline.
- L'utilisateur voit si des modifs attendent sync.
- L'équipe distingue rapidement SW vs pack vs sync vs réseau.

## Dépendances Amont/Aval

- Amont: EPIC 2, EPIC 4, EPIC 5, EPIC 6.
- Aval: supporte la campagne de hardening EPIC 9.

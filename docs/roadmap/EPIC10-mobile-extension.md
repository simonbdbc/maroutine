# EPIC 10 — Extension Android/iOS avec WatermelonDB Natif

**Statut : 🔲 Secondaire**  
**Priorité : Secondaire**  
**Dépendances amont :** EPIC 9  
**Dépendances aval :** —

---

## Objectif

Étendre l'architecture offline-first au natif (Android/iOS) après stabilisation web, en conservant le domaine métier partagé.

## Principe d'Architecture

- Conserver repositories et modèle local-first.
- Isoler les adapters web/natif.
- Utiliser WatermelonDB + `SQLiteAdapter` côté natif.
- Limiter la duplication de logique métier.

## Sous-lots

- Compatibilité codebase cross-platform.
- Build natif debug/release.
- Contraintes réseau/stockage mobile.
- Validation de parité web->mobile.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E10-T01 | Isolation adapters web/natif | 🔲 À faire | Secondaire | Architecture mobile | E9-T06 | Séparer couche adapter sans casser domaine | Refonte complète app | Abstraction adapter propre | Build web inchangé après isolation | Tests build web + natif debug | Revenir adapter web-only | Logs init adapter par plateforme | 5 |
| E10-T02 | Domaine métier partagé | 🔲 À faire | Secondaire | Architecture mobile | E10-T01 | Réutiliser repositories/règles métier | Fork mobile indépendant | Faible duplication logique métier | Contrats métier identiques web/mobile | Tests unitaires domaine | Revenir impl spécifique plateforme | Couverture tests domaine | 5 |
| E10-T03 | Pipeline build Android/iOS | 🔲 À faire | Secondaire | Delivery mobile | E10-T01 | Configurer builds debug/release | Publication stores finale | Pipeline de build reproductible | Builds debug/release passent | Tests build CI | Suspendre release profile | Logs build pipeline | 5 |
| E10-T04 | Contraintes réseau/stockage mobile | 🔲 À faire | Secondaire | Runtime mobile | E10-T02 | Adapter download/sync aux contraintes mobiles | Optimisation perf avancée | Comportements offline mobile documentés | Pas de régression majeure en mobilité | QA devices réels | Désactiver feature mobile risquée | Metrics usage stockage mobile | 2, 3, 5 |
| E10-T05 | Validation parité web->mobile | 🔲 À faire | Secondaire | QA mobile | E10-T03, E10-T04 | Vérifier parité fonctionnelle clé | Parité pixel-perfect | Parcours critiques alignés | Checklist parité validée | QA cross-platform | Revenir scope web-only | Dashboard écarts parité | 5 |

## Risques Couverts

- Contrôle de la dérive de domaine entre web et mobile.

## Critères de Done EPIC

- Android/iOS reprennent le modèle offline-first.
- Logique métier alignée avec le web.
- Duplication de domaine minimale.

## Dépendances Amont/Aval

- Amont: EPIC 9 (web stabilisé).
- Aval: aucune.

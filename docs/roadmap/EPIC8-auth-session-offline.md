# EPIC 8 — Auth et Session Compatibles Offline

**Statut : 🔲 À faire**  
**Priorité : Moyenne**  
**Dépendances amont :** EPIC 3, EPIC 6  
**Dépendances aval :** EPIC 9

---

## Objectif

Permettre à un utilisateur déjà connecté de continuer à utiliser l'app en offline sans logout brutal.

## Principe d'Architecture

- Session locale persistée côté client.
- Opérations métier locales autorisées sans roundtrip auth immédiat.
- Opérations réseau sensibles mises en attente si offline.
- Resync propre à la reconnexion.

## Sous-lots

- Persistance session locale.
- Gestion douce des expirations token.
- Reprise réseau + resync auth-dépendante.
- Garde-fous pour opérations réseau sensibles.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E8-T01 | Persistance session locale | 🔲 À faire | Moyenne | Session | E3-T04 | Conserver état session pour usage local | Refactor provider auth global complet | Session locale restaurable offline | Utilisateur déjà connecté reste utilisable offline | Tests restart offline | Revenir session volatile | Logs restauration session | 5 |
| E8-T02 | Expiration token sans logout brutal offline | 🔲 À faire | Moyenne | UX auth | E8-T01 | Dégrader en mode local si token expiré hors réseau | Renouvellement token custom complet | Pas de logout forcé pendant coupure réseau | App reste utilisable localement | Tests token expiré + offline | Revenir politique stricte online-only | Logs états auth dégradés | 5 |
| E8-T03 | Reprise réseau + resync auth dépendante | 🔲 À faire | Moyenne | Reconnexion | E6-T03, E8-T01 | Relancer sync quand auth/réseau reviennent | Re-sync historique complet | Reprise propre après reconnexion | Modifs locales synchronisées après retour réseau | Tests offline->online | Bloquer sync auto et fallback manuel | Logs reprise auth/sync | 3, 5 |
| E8-T04 | Garde-fous opérations réseau sensibles | 🔲 À faire | Moyenne | Sécurité opérationnelle | E8-T02, E6-T02 | Mettre en attente ou refuser proprement les opérations sensibles | RBAC avancé | Comportement explicite en offline | Pas d'échec silencieux sur opérations sensibles | QA scénarios sensibles | Désactiver guard et journaliser | Logs refus/mise en attente | 5 |

## Risques Couverts

- Risque 5: dépendance réseau sur écrans métier/auth.
- Risque 3: cohérence des opérations en attente de sync.

## Critères de Done EPIC

- Utilisateur déjà connecté continue en offline.
- Reprise propre à la reconnexion.
- Pas de blocage shell/écrans critiques lié auth hors réseau.

## Dépendances Amont/Aval

- Amont: EPIC 3, EPIC 6.
- Aval: alimente la stabilisation finale EPIC 9.

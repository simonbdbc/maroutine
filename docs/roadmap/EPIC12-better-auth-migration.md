# EPIC 12 — Migration Auth vers Better Auth (Email/Password + Google OAuth)

**Statut : 🔲 À faire**  
**Priorité : Critique**  
**Dépendances amont :** EPIC 0, EPIC 1  
**Dépendances aval :** EPIC 8, EPIC 9

---

## Objectif

Remplacer l'authentification actuelle centrée Supabase Auth email/password par Better Auth, en conservant deux méthodes de connexion:
- email/password,
- Google OAuth.

## Principe d'Architecture

- Better Auth devient la couche d'authentification applicative (login/signup/session).
- Supabase reste backend de données (Postgres/Storage) et n'est plus la couche auth exposée à l'UI.
- Les écrans d'auth s'appuient sur une API auth unique (adapter Better Auth) pour éviter la duplication des flows.
- La migration doit préserver la compatibilité avec la stratégie offline-first (session locale + reprise réseau).

## Sous-lots

- Cadrage contrat auth cible + stratégie de migration.
- Intégration Better Auth email/password.
- Intégration Google OAuth.
- Migration client (store/hooks/screens/services auth).
- Migration comptes/sessions existants.
- QA, rollback et retrait du legacy auth.

## Tickets

| ID | Titre | Statut | Priorité | Lot | Dépendances | Portée | Hors portée | Implémentation attendue | DoD | Tests/QA | Rollback | Observabilité | Risques couverts |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E12-T01 | Contrat cible Better Auth + plan de migration | 🔲 À faire | Critique | Cadrage | E0-T01 | Définir flows login/signup/logout/reset/session + mapping legacy->cible | Passkeys/magic links | Spécification auth validée et séquencée | Contrat approuvé produit+tech | Review architecture + sécurité | Revenir au contrat auth legacy | Journal décisions auth | 5 |
| E12-T02 | Intégration Better Auth email/password | 🔲 À faire | Critique | Backend auth | E12-T01 | Implémenter endpoints/config Better Auth pour email/password | Social login | Auth email/password opérationnelle via Better Auth | Signup/login/logout/reset passent via Better Auth | Tests API + parcours UI | Basculer feature flag vers legacy auth | Logs erreurs auth backend | 5 |
| E12-T03 | Intégration Google OAuth (Better Auth) | 🔲 À faire | Critique | OAuth | E12-T02, E1-T06 | Configurer provider Google, callback URLs, envs dev/preview/prod | Autres providers OAuth | Connexion Google fonctionnelle sur web v1 | Login Google valide sur preview/prod | Tests OAuth (popup/redirect) | Désactiver provider Google et fallback email/password | Logs callbacks OAuth + erreurs | 5 |
| E12-T04 | Migration client auth (store/hooks/screens/services) | 🔲 À faire | Critique | Front auth | E12-T02, E12-T03 | Remplacer l'usage direct Supabase Auth dans UI par adapter Better Auth | Refonte UI complète auth | UI auth branchement unique Better Auth | Plus d'appel direct Supabase Auth côté écrans auth | Tests unitaires hooks + smoke UI | Revenir adapter legacy | Metrics succès/échec login | 5 |
| E12-T05 | Migration comptes/sessions existants | 🔲 À faire | Haute | Données/migration | E12-T02 | Définir et exécuter stratégie de continuité utilisateurs existants | Migration cross-tenant complexe | Utilisateurs existants migrables sans perte d'accès | Plan migration validé + testé en preview | Tests migration + reprise compte | Restauration snapshot + retour legacy | Rapport migration (succès/échecs) | 5 |
| E12-T06 | Compatibilité offline-first session locale | 🔲 À faire | Haute | Runtime auth | E12-T04, E12-T05 | Aligner Better Auth avec les exigences EPIC8 (session locale, reprise douce offline) | Sync queue complète | Session locale exploitable avec moteur offline-first | Pas de logout brutal lors coupure réseau | Tests offline/online + expiration | Revenir mode session conservateur | Logs états session locale | 5 |
| E12-T07 | QA auth complète + runbook rollback | 🔲 À faire | Haute | QA/ops | E12-T04, E12-T05, E12-T06 | Tester flows email/password + Google + erreurs + reprise | Audit sécurité externe complet | Parcours auth stables en web v1 | Checklist QA validée + runbook rollback prêt | Tests manuels + non-régression | Rollback documenté et rejouable | Dashboard incidents auth | 5 |
| E12-T08 | Retrait du legacy auth Supabase direct + docs | 🔲 À faire | Haute | Cleanup | E12-T07 | Nettoyer code/docs auth legacy et pointer Better Auth comme source unique | Suppression dépendances DB non liées | Legacy auth retiré des parcours actifs | Plus de chemin auth actif hors Better Auth | Grep + revue finale | Réactiver module legacy en urgence | Rapport de conformité auth | 5 |

## Risques Couverts

- Risque 5: dépendance réseau et fragilité session sur écrans métier.
- Réduction du risque de divergence entre parcours email/password et OAuth.

## Critères de Done EPIC

- Auth email/password fonctionne via Better Auth.
- Google OAuth fonctionne via Better Auth.
- Les parcours d'auth UI n'utilisent plus Supabase Auth direct.
- Migration des comptes/sessions validée.
- Rollback auth documenté et testé.

## Dépendances Amont/Aval

- Amont: EPIC 0 (contrat architecture), EPIC 1 (domaines/env web).
- Aval: EPIC 8 (session offline-compatible), EPIC 9 (hardening final).

# Tickets GitLab — Backlog Offline-First (v1)

> Index global des tickets prêts à créer en issues GitLab.
> Le détail strict complet est la source de vérité dans les fichiers `EPIC*.md`.

---

## Template Issue GitLab (copier-coller)

```md
Titre: [E?-T??] <titre>
Labels: roadmap, offline-first, epic-?, priority-?

## ID

E?-T??

## Statut

🔲 À faire

## Priorité

<critique|très critique|haute|moyenne|secondaire>

## Lot

<lot>

## Dépendances

<liste IDs>

## Portée

<scope strict>

## Hors portée

<out-of-scope strict>

## Implémentation attendue

<résultat attendu>

## DoD

<definition of done>

## Tests/QA

<tests obligatoires>

## Rollback

<stratégie rollback>

## Observabilité

<logs/metrics/traces attendus>

## Risques couverts

<1..5>
```

---

## Ordre d'Implémentation

1. EPIC 0
2. EPIC 1
3. EPIC 2
4. EPIC 3
5. EPIC 4
6. EPIC 5
7. EPIC 6
8. EPIC 7
9. EPIC 12
10. EPIC 8
11. EPIC 9
12. EPIC 11
13. EPIC 13
14. EPIC 15
15. EPIC 18
16. EPIC 10 (secondaire)

---

## Index Global (121 tickets)

| ID      | EPIC    | Titre                                                               | Statut      | Priorité      | Dépendances clés                        | Référence                                        |
| ------- | ------- | ------------------------------------------------------------------- | ----------- | ------------- | --------------------------------------- | ------------------------------------------------ |
| E0-T01  | EPIC 0  | ADR offline-first                                                   | 🚧 En cours | Critique      | —                                       | [EPIC0](./EPIC0-foundations-offline-first.md)    |
| E0-T02  | EPIC 0  | Matrice source de vérité                                            | 🚧 En cours | Critique      | E0-T01                                  | [EPIC0](./EPIC0-foundations-offline-first.md)    |
| E0-T03  | EPIC 0  | Flux lecture/écriture/sync                                          | 🚧 En cours | Critique      | E0-T01                                  | [EPIC0](./EPIC0-foundations-offline-first.md)    |
| E0-T04  | EPIC 0  | Politique conflits v1                                               | 🚧 En cours | Critique      | E0-T03                                  | [EPIC0](./EPIC0-foundations-offline-first.md)    |
| E0-T05  | EPIC 0  | Politique versionning packs                                         | 🚧 En cours | Critique      | E0-T01                                  | [EPIC0](./EPIC0-foundations-offline-first.md)    |
| E0-T06  | EPIC 0  | Audit anti-Supabase direct UI                                       | 🚧 En cours | Critique      | E0-T02,E0-T03                           | [EPIC0](./EPIC0-foundations-offline-first.md)    |
| E1-T01  | EPIC 1  | Manifest PWA v1                                                     | 🚧 En cours | Critique      | E0-T01                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T02  | EPIC 1  | Icônes/splash PWA                                                   | 🚧 En cours | Critique      | E1-T01                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T03  | EPIC 1  | Setup Cloudflare Pages + GitLab                                     | 🚧 En cours | Critique      | E0-T01                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T04  | EPIC 1  | Preview par branche                                                 | 🚧 En cours | Critique      | E1-T03                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T05  | EPIC 1  | Production sur `main`                                               | 🚧 En cours | Critique      | E1-T03                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T06  | EPIC 1  | Domaine `maroutine.app` + HTTPS                                     | 🚧 En cours | Critique      | E1-T05                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T07  | EPIC 1  | `_headers` + `_redirects`                                           | 🚧 En cours | Critique      | E1-T05                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T08  | EPIC 1  | Redirection legacy `maroutine.sbcenter.fr` -> `maroutine.app`       | 🚧 En cours | Haute         | E1-T06                                  | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E1-T09  | EPIC 1  | Exposer les stickers statiques sur Cloudflare Pages                 | 🚧 En cours | Haute         | E1-T05,E1-T07                           | [EPIC1](./EPIC1-pwa-cloudflare-pages.md)         |
| E2-T01  | EPIC 2  | Service worker minimal généré                                       | ✅ Fait     | Critique      | E1-T05                                  | [EPIC2](./EPIC2-app-shell-service-worker.md)     |
| E2-T02  | EPIC 2  | Stratégies cache navigation/shell                                   | ✅ Fait     | Critique      | E2-T01                                  | [EPIC2](./EPIC2-app-shell-service-worker.md)     |
| E2-T03  | EPIC 2  | Exclusion logique métier du cache API                               | ✅ Fait     | Critique      | E2-T01                                  | [EPIC2](./EPIC2-app-shell-service-worker.md)     |
| E2-T04  | EPIC 2  | Gestion update waiting + bannière                                   | ✅ Fait     | Critique      | E2-T01                                  | [EPIC2](./EPIC2-app-shell-service-worker.md)     |
| E2-T05  | EPIC 2  | Panic reset SW/cache                                                | ✅ Fait     | Haute         | E2-T01                                  | [EPIC2](./EPIC2-app-shell-service-worker.md)     |
| E2-T06  | EPIC 2  | Procédure rollback SW                                               | 🚧 En cours | Haute         | E2-T04                                  | [EPIC2](./EPIC2-app-shell-service-worker.md)     |
| E3-T01  | EPIC 3  | Setup WatermelonDB web                                              | 🔲 À faire  | Critique      | E0-T01,E1-T05                           | [EPIC3](./EPIC3-watermelondb-web-first.md)       |
| E3-T02  | EPIC 3  | Schéma collections locales                                          | 🔲 À faire  | Critique      | E3-T01                                  | [EPIC3](./EPIC3-watermelondb-web-first.md)       |
| E3-T03  | EPIC 3  | Repositories local-first                                            | 🔲 À faire  | Critique      | E3-T02,E0-T06                           | [EPIC3](./EPIC3-watermelondb-web-first.md)       |
| E3-T04  | EPIC 3  | Bootstrap local + hydration UI                                      | 🔲 À faire  | Critique      | E3-T03                                  | [EPIC3](./EPIC3-watermelondb-web-first.md)       |
| E3-T05  | EPIC 3  | Sync arrière-plan retour réseau                                     | 🔲 À faire  | Haute         | E3-T04                                  | [EPIC3](./EPIC3-watermelondb-web-first.md)       |
| E3-T06  | EPIC 3  | Garde-fou anti-Supabase direct UI                                   | 🔲 À faire  | Haute         | E3-T03                                  | [EPIC3](./EPIC3-watermelondb-web-first.md)       |
| E4-T01  | EPIC 4  | Modèle local packs/assets/downloaded                                | 🔲 À faire  | Très critique | E3-T02,E0-T05                           | [EPIC4](./EPIC4-sticker-packs-offline.md)        |
| E4-T02  | EPIC 4  | Catalogue packs + statuts offline                                   | 🔲 À faire  | Très critique | E4-T01                                  | [EPIC4](./EPIC4-sticker-packs-offline.md)        |
| E4-T03  | EPIC 4  | Download manager lot/reprise                                        | 🔲 À faire  | Très critique | E4-T02                                  | [EPIC4](./EPIC4-sticker-packs-offline.md)        |
| E4-T04  | EPIC 4  | Vérification complétude + intégrité                                 | 🔲 À faire  | Très critique | E4-T03                                  | [EPIC4](./EPIC4-sticker-packs-offline.md)        |
| E4-T05  | EPIC 4  | Activation stricte statut ready                                     | 🔲 À faire  | Critique      | E4-T04                                  | [EPIC4](./EPIC4-sticker-packs-offline.md)        |
| E4-T06  | EPIC 4  | Suppression manuelle + diagnostics stockage                         | 🔲 À faire  | Haute         | E4-T02                                  | [EPIC4](./EPIC4-sticker-packs-offline.md)        |
| E5-T01  | EPIC 5  | Manifeste catalogue versionné                                       | 🔲 À faire  | Haute         | E4-T01,E0-T05                           | [EPIC5](./EPIC5-pack-versioning-atomic.md)       |
| E5-T02  | EPIC 5  | Manifeste pack versionné/checksums                                  | 🔲 À faire  | Haute         | E5-T01,E4-T04                           | [EPIC5](./EPIC5-pack-versioning-atomic.md)       |
| E5-T03  | EPIC 5  | Zone temporaire téléchargement                                      | 🔲 À faire  | Haute         | E5-T02,E4-T03                           | [EPIC5](./EPIC5-pack-versioning-atomic.md)       |
| E5-T04  | EPIC 5  | Activation atomique nouvelle version                                | 🔲 À faire  | Haute         | E5-T03,E4-T05                           | [EPIC5](./EPIC5-pack-versioning-atomic.md)       |
| E5-T05  | EPIC 5  | Purge ancienne version post-succès                                  | 🔲 À faire  | Haute         | E5-T04                                  | [EPIC5](./EPIC5-pack-versioning-atomic.md)       |
| E5-T06  | EPIC 5  | Politique cache séparée                                             | 🔲 À faire  | Moyenne       | E2-T02,E5-T01                           | [EPIC5](./EPIC5-pack-versioning-atomic.md)       |
| E6-T01  | EPIC 6  | Schéma `sync_queue`                                                 | 🔲 À faire  | Critique      | E3-T02,E0-T03                           | [EPIC6](./EPIC6-sync-queue-supabase.md)          |
| E6-T02  | EPIC 6  | API outbox locale                                                   | 🔲 À faire  | Critique      | E6-T01                                  | [EPIC6](./EPIC6-sync-queue-supabase.md)          |
| E6-T03  | EPIC 6  | Sync worker reconnexion/reprise                                     | 🔲 À faire  | Critique      | E6-T02,E3-T05                           | [EPIC6](./EPIC6-sync-queue-supabase.md)          |
| E6-T04  | EPIC 6  | Idempotency key stable                                              | 🔲 À faire  | Critique      | E6-T02                                  | [EPIC6](./EPIC6-sync-queue-supabase.md)          |
| E6-T05  | EPIC 6  | Retry + backoff                                                     | 🔲 À faire  | Critique      | E6-T03                                  | [EPIC6](./EPIC6-sync-queue-supabase.md)          |
| E6-T06  | EPIC 6  | Politique conflits v1 + traçage                                     | 🔲 À faire  | Haute         | E0-T04,E6-T03                           | [EPIC6](./EPIC6-sync-queue-supabase.md)          |
| E6-T07  | EPIC 6  | Observabilité erreurs sync                                          | 🔲 À faire  | Haute         | E6-T03,E6-T05                           | [EPIC6](./EPIC6-sync-queue-supabase.md)          |
| E7-T01  | EPIC 7  | Bannières online/offline/pending/update                             | 🔲 À faire  | Haute         | E2-T04,E6-T03                           | [EPIC7](./EPIC7-offline-ux-diagnostics.md)       |
| E7-T02  | EPIC 7  | Écran diagnostics unifié                                            | 🔲 À faire  | Haute         | E4-T06,E6-T07,E5-T04                    | [EPIC7](./EPIC7-offline-ux-diagnostics.md)       |
| E7-T03  | EPIC 7  | Outils secours purge/reset/relance                                  | 🔲 À faire  | Haute         | E2-T05,E6-T03,E5-T01                    | [EPIC7](./EPIC7-offline-ux-diagnostics.md)       |
| E7-T04  | EPIC 7  | Guide debug prod offline-first                                      | 🔲 À faire  | Moyenne       | E7-T02,E7-T03                           | [EPIC7](./EPIC7-offline-ux-diagnostics.md)       |
| E12-T01 | EPIC 12 | Contrat cible Better Auth + plan migration                          | 🔲 À faire  | Critique      | E0-T01                                  | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E12-T02 | EPIC 12 | Intégration Better Auth email/password                              | 🔲 À faire  | Critique      | E12-T01                                 | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E12-T03 | EPIC 12 | Intégration Google OAuth (Better Auth)                              | 🔲 À faire  | Critique      | E12-T02,E1-T06                          | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E12-T04 | EPIC 12 | Migration client auth (store/hooks/screens/services)                | 🔲 À faire  | Critique      | E12-T02,E12-T03                         | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E12-T05 | EPIC 12 | Migration comptes/sessions existants                                | 🔲 À faire  | Haute         | E12-T02                                 | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E12-T06 | EPIC 12 | Compatibilité offline-first session locale                          | 🔲 À faire  | Haute         | E12-T04,E12-T05                         | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E12-T07 | EPIC 12 | QA auth complète + runbook rollback                                 | 🔲 À faire  | Haute         | E12-T04,E12-T05,E12-T06                 | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E12-T08 | EPIC 12 | Retrait legacy auth Supabase direct + docs                          | 🔲 À faire  | Haute         | E12-T07                                 | [EPIC12](./EPIC12-better-auth-migration.md)      |
| E8-T01  | EPIC 8  | Persistance session locale                                          | 🔲 À faire  | Moyenne       | E3-T04                                  | [EPIC8](./EPIC8-auth-session-offline.md)         |
| E8-T02  | EPIC 8  | Expiration token sans logout brutal offline                         | 🔲 À faire  | Moyenne       | E8-T01                                  | [EPIC8](./EPIC8-auth-session-offline.md)         |
| E8-T03  | EPIC 8  | Reprise réseau + resync auth dépendante                             | 🔲 À faire  | Moyenne       | E6-T03,E8-T01                           | [EPIC8](./EPIC8-auth-session-offline.md)         |
| E8-T04  | EPIC 8  | Garde-fous opérations réseau sensibles                              | 🔲 À faire  | Moyenne       | E8-T02,E6-T02                           | [EPIC8](./EPIC8-auth-session-offline.md)         |
| E9-T01  | EPIC 9  | Matrice QA offline-first                                            | 🔲 À faire  | Moyenne       | E7-T02,E6-T07                           | [EPIC9](./EPIC9-web-first-hardening.md)          |
| E9-T02  | EPIC 9  | Scénarios SW update/obsolescence                                    | 🔲 À faire  | Moyenne       | E2-T04,E2-T06                           | [EPIC9](./EPIC9-web-first-hardening.md)          |
| E9-T03  | EPIC 9  | Scénarios corruption pack partielle                                 | 🔲 À faire  | Moyenne       | E4-T04,E5-T04                           | [EPIC9](./EPIC9-web-first-hardening.md)          |
| E9-T04  | EPIC 9  | Scénarios conflits sync/retry                                       | 🔲 À faire  | Moyenne       | E6-T05,E6-T06                           | [EPIC9](./EPIC9-web-first-hardening.md)          |
| E9-T05  | EPIC 9  | Tests reprise refresh/redémarrage                                   | 🔲 À faire  | Moyenne       | E3-T04,E6-T03,E8-T01                    | [EPIC9](./EPIC9-web-first-hardening.md)          |
| E9-T06  | EPIC 9  | Instrumentation minimale prod                                       | 🔲 À faire  | Moyenne       | E7-T04                                  | [EPIC9](./EPIC9-web-first-hardening.md)          |
| E11-T01 | EPIC 11 | Source unique des thèmes (`themes.ts`)                              | 🚧 En cours | Haute         | —                                       | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T02 | EPIC 11 | Activer `coralSunrise` par défaut                                   | 🚧 En cours | Haute         | E11-T01                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T03 | EPIC 11 | Aligner couleurs système web/PWA/Expo                               | 🚧 En cours | Haute         | E11-T02                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T04 | EPIC 11 | Utilitaires couleur centralisés (alpha/variants)                    | ✅ Fait     | Haute         | E11-T01                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T05 | EPIC 11 | Migration composants UI partagés                                    | ✅ Fait     | Haute         | E11-T01,E11-T04                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T06 | EPIC 11 | Migration Auth + Layout                                             | ✅ Fait     | Haute         | E11-T05                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T07 | EPIC 11 | Migration Settings / Profiles / Catalog                             | ✅ Fait     | Haute         | E11-T05                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T08 | EPIC 11 | Migration Home avec règle profil prioritaire                        | ✅ Fait     | Haute         | E11-T05,E11-T07                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T09 | EPIC 11 | Garde-fou CI/Lint anti-couleurs inline                              | ✅ Fait     | Haute         | E11-T06,E11-T07,E11-T08                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T10 | EPIC 11 | QA visuelle + accessibilité + documentation                         | ✅ Fait     | Moyenne       | E11-T09                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T11 | EPIC 11 | Correctif socle : thème unique mobile-first (10 couleurs)           | ✅ Fait     | Critique      | E11-T10                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T12 | EPIC 11 | Correctif génération pastel automatique (theme)                     | ✅ Fait     | Haute         | E11-T11                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T13 | EPIC 11 | Correctif tokens : alignement API `Colors` sur les 10 couleurs      | ✅ Fait     | Critique      | E11-T11,E11-T12                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T14 | EPIC 11 | Correctif migration app vers tokens canoniques                      | ✅ Fait     | Critique      | E11-T13                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T15 | EPIC 11 | Correctif Tailwind + shell plateforme sur palette canonique         | ✅ Fait     | Haute         | E11-T11,E11-T13                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T16 | EPIC 11 | Correctif dette legacy palettes profils                             | ✅ Fait     | Haute         | E11-T11,E11-T14                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T17 | EPIC 11 | Correctif CI strict : garde-fou cardinalité palette (=10)           | ✅ Fait     | Haute         | E11-T11,E11-T12,E11-T13                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T18 | EPIC 11 | Rebaser le contrat thème coral v2                                   | ✅ Fait     | Critique      | E11-T17                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T19 | EPIC 11 | Restaurer palettes profils 16/16                                    | ✅ Fait     | Critique      | E11-T18                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T20 | EPIC 11 | Réactiver UX complète du picker couleurs profil                     | ✅ Fait     | Haute         | E11-T19                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T21 | EPIC 11 | Verrouiller frontière thème défaut vs profil                        | ✅ Fait     | Haute         | E11-T18,E11-T20                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T22 | EPIC 11 | Mettre à jour garde-fous CI thème v2                                | ✅ Fait     | Haute         | E11-T18,E11-T19                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T23 | EPIC 11 | Mettre à jour tests EPIC11 (v2)                                     | ✅ Fait     | Haute         | E11-T19,E11-T22                         | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T24 | EPIC 11 | QA non-régression UI thème v2                                       | 🔲 À faire  | Moyenne       | E11-T20,E11-T21,E11-T23                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E11-T25 | EPIC 11 | Documentation roadmap & conventions thème v2                        | 🚧 En cours | Moyenne       | E11-T24                                 | [EPIC11](./EPIC11-theme-system-coral-default.md) |
| E13-T01 | EPIC 13 | Définir le contrat responsive Home smartphone-only                  | ✅ Fait     | Critique      | E11-T23                                 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E13-T02 | EPIC 13 | Compacter le header Home sur smartphone                             | ✅ Fait     | Haute         | E13-T01                                 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E13-T03 | EPIC 13 | Réduire l'icône profil Home sur smartphone                          | ✅ Fait     | Haute         | E13-T01                                 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E13-T04 | EPIC 13 | Compacter le bouton bas de page (validation journée) sur smartphone | ✅ Fait     | Haute         | E13-T01                                 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E13-T05 | EPIC 13 | Compacter les headers de cards moments/activités sur smartphone     | ✅ Fait     | Haute         | E13-T01                                 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E13-T06 | EPIC 13 | Réduire la taille des stickers Home sur smartphone                  | ✅ Fait     | Haute         | E13-T05                                 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E13-T07 | EPIC 13 | Garde-fous non-régression tablette/desktop Home                     | ✅ Fait     | Haute         | E13-T02,E13-T03,E13-T04,E13-T05,E13-T06 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E13-T08 | EPIC 13 | QA manuelle finale Home smartphone + validation produit             | 🚧 En cours | Moyenne       | E13-T07                                 | [EPIC13](./EPIC13-home-smartphone-adaptation.md) |
| E15-T01 | EPIC 15 | Spécification UX copie de routine                                   | 🔲 À faire  | Haute         | —                                       | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E15-T02 | EPIC 15 | Service copie routine en mode remplacement                          | 🔲 À faire  | Haute         | E15-T01                                 | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E15-T03 | EPIC 15 | UI copie depuis écran Profils                                       | 🔲 À faire  | Haute         | E15-T02                                 | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E15-T04 | EPIC 15 | Tests non-régression copie                                          | 🔲 À faire  | Haute         | E15-T02                                 | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E15-T05 | EPIC 15 | Spécification PDF Home imprimable                                   | 🔲 À faire  | Moyenne       | —                                       | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E15-T06 | EPIC 15 | Bouton PDF depuis écran Profils                                     | 🔲 À faire  | Moyenne       | E15-T05                                 | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E15-T07 | EPIC 15 | Tests/QA PDF Home                                                   | 🔲 À faire  | Moyenne       | E15-T06                                 | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E15-T08 | EPIC 15 | Documentation et limites v1                                         | 🔲 À faire  | Moyenne       | E15-T03,E15-T06                         | [EPIC15](./EPIC15-routine-copy-printable-pdf.md) |
| E18-T01 | EPIC 18 | Documentation EPIC18 + tickets                                      | 🔲 À faire  | Haute         | EPIC13                                  | [EPIC18](./EPIC18-layout-preferences.md)         |
| E18-T02 | EPIC 18 | Service préférences locales layout                                  | 🔲 À faire  | Haute         | E18-T01                                 | [EPIC18](./EPIC18-layout-preferences.md)         |
| E18-T03 | EPIC 18 | Side menu piloté par bouton                                         | 🔲 À faire  | Haute         | E18-T02                                 | [EPIC18](./EPIC18-layout-preferences.md)         |
| E18-T04 | EPIC 18 | Paramètre routines côte à côte                                      | 🔲 À faire  | Haute         | E18-T02                                 | [EPIC18](./EPIC18-layout-preferences.md)         |
| E18-T05 | EPIC 18 | Home multi-routines auto                                            | 🔲 À faire  | Haute         | E18-T04                                 | [EPIC18](./EPIC18-layout-preferences.md)         |
| E18-T06 | EPIC 18 | Tests non-régression layout                                         | 🔲 À faire  | Haute         | E18-T02,E18-T03,E18-T05                 | [EPIC18](./EPIC18-layout-preferences.md)         |
| E18-T07 | EPIC 18 | QA finale layout local                                              | 🔲 À faire  | Moyenne       | E18-T03,E18-T05,E18-T06                 | [EPIC18](./EPIC18-layout-preferences.md)         |
| E10-T01 | EPIC 10 | Isolation adapters web/natif                                        | 🔲 À faire  | Secondaire    | E9-T06                                  | [EPIC10](./EPIC10-mobile-extension.md)           |
| E10-T02 | EPIC 10 | Domaine métier partagé                                              | 🔲 À faire  | Secondaire    | E10-T01                                 | [EPIC10](./EPIC10-mobile-extension.md)           |
| E10-T03 | EPIC 10 | Pipeline build Android/iOS                                          | 🔲 À faire  | Secondaire    | E10-T01                                 | [EPIC10](./EPIC10-mobile-extension.md)           |
| E10-T04 | EPIC 10 | Contraintes réseau/stockage mobile                                  | 🔲 À faire  | Secondaire    | E10-T02                                 | [EPIC10](./EPIC10-mobile-extension.md)           |
| E10-T05 | EPIC 10 | Validation parité web->mobile                                       | 🔲 À faire  | Secondaire    | E10-T03,E10-T04                         | [EPIC10](./EPIC10-mobile-extension.md)           |

---

## Convention de Statut

- `🔲 À faire`
- `🚧 En cours`
- `✅ Fait`
- `⏸️ Bloqué`

Un ticket ne passe "Ready" que si ses dépendances sont `✅`.

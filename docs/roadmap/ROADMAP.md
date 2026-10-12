# Roadmap — Offline-First Web-First (v1)

> Source de vérité active pour la stratégie produit et technique.
> Ancienne roadmap archivée dans `docs/legacy/roadmap-v1/`.

---

## Vision Cible

### v1 prioritaire (web)

Une PWA installable déployée sur Cloudflare Pages qui:

- fonctionne en offline-first sur le web,
- lit/écrit les données métier via WatermelonDB côté web,
- gère les packs stickers offline avec téléchargement explicite, versionning et vérification,
- synchronise avec Supabase/Postgres quand le réseau revient (modèle local-first).

### v2 secondaire (mobile)

Étendre la même architecture à Android/iOS avec WatermelonDB + `SQLiteAdapter`.

---

## Domaines & Environnements

- **Prod v1 prioritaire:** `maroutine.app` (Cloudflare Pages, HTTPS, déploiement automatique depuis GitLab).
- **Domaine legacy:** `maroutine.sbcenter.fr` redirigé en 301 vers `maroutine.app` après validation TLS.

---

## État d'Avancement (Nouvelle Roadmap)

| EPIC                                              | Titre                                                      | Statut        | Priorité      |
| ------------------------------------------------- | ---------------------------------------------------------- | ------------- | ------------- |
| [EPIC 0](./EPIC0-foundations-offline-first.md)    | Fondations architecture offline-first                      | 🚧 En cours   | Critique      |
| [EPIC 1](./EPIC1-pwa-cloudflare-pages.md)         | PWA installable + Cloudflare Pages                         | 🚧 En cours   | Critique      |
| [EPIC 2](./EPIC2-app-shell-service-worker.md)     | App shell offline + service worker maîtrisé                | 🚧 Implémenté | Critique      |
| [EPIC 3](./EPIC3-watermelondb-web-first.md)       | WatermelonDB web-first + repository local-first            | 🔲 À faire    | Critique      |
| [EPIC 4](./EPIC4-sticker-packs-offline.md)        | Packs stickers offline permanents                          | 🔲 À faire    | Très critique |
| [EPIC 5](./EPIC5-pack-versioning-atomic.md)       | Versionning atomique des packs                             | 🔲 À faire    | Haute         |
| [EPIC 6](./EPIC6-sync-queue-supabase.md)          | Outbox locale + moteur sync Supabase                       | 🔲 À faire    | Critique      |
| [EPIC 7](./EPIC7-offline-ux-diagnostics.md)       | UX offline / réseau / diagnostics                          | 🔲 À faire    | Haute         |
| [EPIC 11](./EPIC11-theme-system-coral-default.md) | Refonte système de thème + `coralSunrise` par défaut       | 🚧 En cours   | Haute         |
| [EPIC 13](./EPIC13-home-smartphone-adaptation.md) | Adaptation Home smartphone (compact)                       | 🚧 En cours   | Haute         |
| [EPIC 15](./EPIC15-routine-copy-printable-pdf.md) | Copie de routine + PDF imprimable                          | 🔲 À faire    | Haute         |
| [EPIC 18](./EPIC18-layout-preferences.md)         | Préférences layout locales                                 | 🔲 À faire    | Haute         |
| [EPIC 12](./EPIC12-better-auth-migration.md)      | Migration auth Better Auth (email/password + Google OAuth) | 🔲 À faire    | Critique      |
| [EPIC 8](./EPIC8-auth-session-offline.md)         | Auth/session compatibles offline                           | 🔲 À faire    | Moyenne       |
| [EPIC 9](./EPIC9-web-first-hardening.md)          | Hardening web-first prod                                   | 🔲 À faire    | Moyenne       |
| [EPIC 10](./EPIC10-mobile-extension.md)           | Extension Android/iOS                                      | 🔲 Secondaire | Secondaire    |

**Légende:** 🔲 À faire · 🚧 En cours · ✅ Fait · ⏸️ Bloqué

---

## Ordre d'Exécution Recommandé

### Bloc prioritaire — Web-first

`EPIC 0 -> EPIC 1 -> EPIC 2 -> EPIC 3 -> EPIC 4 -> EPIC 5 -> EPIC 6 -> EPIC 7 -> EPIC 12 -> EPIC 8 -> EPIC 9 -> EPIC 11 -> EPIC 13 -> EPIC 15 -> EPIC 18`

### Bloc secondaire — Mobile

`EPIC 10` après stabilisation web v1, stabilisation thème (EPIC 11) et adaptation Home smartphone (EPIC 13).

Règle d'or: les tickets sont triés par dépendances internes avant parallélisation.

---

## Décisions d'Architecture Globales

- UI des écrans critiques lit depuis **WatermelonDB local** uniquement.
- Supabase = backend distant (Auth, Postgres, Storage), jamais source directe des écrans critiques.
- Onboarding Auth (signup/login initial/verification email) nécessite le réseau; l'offline métier suppose une session déjà authentifiée.
- Service worker limité à l'app shell/caches réseau, **sans logique métier**.
- Packs stickers gérés dans une couche dédiée (catalogue, download manager, vérification, versionning), distincte du cache navigateur opportuniste.
- Sync basée sur une outbox locale explicite (`sync_queue`) avec idempotence, retry, observabilité.

---

## Cartographie Risques -> EPICs

| Risque   | Description                                      | EPICs de couverture                     |
| -------- | ------------------------------------------------ | --------------------------------------- |
| Risque 1 | Service worker trop agressif                     | EPIC 2, EPIC 7, EPIC 9                  |
| Risque 2 | Confusion cache opportuniste vs stockage durable | EPIC 0, EPIC 4, EPIC 5, EPIC 7          |
| Risque 3 | Offline sans journal de sync                     | EPIC 0, EPIC 6, EPIC 7, EPIC 9          |
| Risque 4 | Mauvaise granularité de version des packs        | EPIC 5, EPIC 7, EPIC 9                  |
| Risque 5 | Dépendance réseau des écrans métier              | EPIC 0, EPIC 3, EPIC 6, EPIC 12, EPIC 8 |

---

## Validation Documentaire

- `docs/roadmap/` ne contient plus de fichiers legacy.
- Chaque EPIC actif contient une table tickets `E{epic}-T{nn}`.
- La politique domaines (`maroutine.app` principal, `maroutine.sbcenter.fr` legacy redirigé) est documentée.
- `README.md` pointe vers la nouvelle roadmap active et vers l'archive legacy.

---

## Recommandation Finale

La ligne directrice officielle est:

- web-first sérieux,
- local-first réel avec WatermelonDB,
- service worker minimal orienté shell,
- packs stickers gérés hors cache opportuniste,
- sync explicite vers Supabase,
- extension Android/iOS après stabilisation production web.

Cette approche évite le piège "PWA = simple cache" et prépare une continuité crédible vers mobile natif.

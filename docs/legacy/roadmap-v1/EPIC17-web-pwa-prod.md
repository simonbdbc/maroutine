# EPIC 17 — Web + PWA Production (MVP) & assets stickers (secondaire)

**Statut : 🔲 À FAIRE (PRIORITAIRE)**  
**Dépendances :** EPIC 3 ✅, EPIC 6 ✅, EPIC 9 ✅  
**Débloque :** Go-live Web v1 prod

---

## Résumé

Objectif prioritaire: livrer une version **Web + PWA installable** de l'app en production,
avec un pipeline de build/déploiement fiable.

Objectif secondaire: préparer offline avancé + bibliothèque stickers scalable.

---

## Périmètre prioritaire (MVP phase 1)

- Publication Web prod (Expo Router web).
- PWA installable (desktop + Android Chrome).
- Déploiement web prod rejouable.

## Périmètre secondaire (post-MVP)

- Cache offline shell applicatif.
- Service worker avancé + fallback offline.
- Bibliothèque stickers par packs (download différé).
- Préchargement d'un pack par défaut.
- Versioning/mise à jour/cache avancé des packs.

Hors scope global:
- migration immédiate complète en spritesheets,
- features avancées de marketplace stickers,
- analytics avancée d'usage packs.

---

## Décisions d'architecture

### Cible technique
- Expo + Expo Router + React.
- `expo-image` pour le rendu et cache image côté app.
- Workbox pour service worker PWA.
- IndexedDB pour métadonnées/cache offline évolué des packs (phase 1.5/2).

### Stratégie assets recommandée (secondaire)
1. **Phase 1 (MVP prod)**:
- CDN + `stickers.json` (metadata packs).
- Téléchargement à la demande d'un pack.
- Cache navigateur + service worker + cache image `expo-image`.

2. **Phase 2 (scale)**:
- Versioning fort (`version`, `checksum`, `size`) + sync incrémentale.
- IndexedDB pour gestion locale des packs.
- Option spritesheet + mapping JSON pour réduire drastiquement le nombre de requêtes.

---

## Tickets techniques prioritaires (MVP)

| Ticket | Statut | Scope | Fichiers pressentis | DoD |
|---|---|---|---|---|
| `E17-T01 (WEB-1)` | ✅ Fait | Configuration build Web production Expo (router, assets, fonts, config web) | `app.json`, `package.json`, `app/*`, `src/shared/theme/*` | `npx expo export --platform web` passe, app web démarre sans erreur |
| `E17-T02 (WEB-2)` | ✅ Fait | Environnement de build prod web (scripts, variables env, optimisation bundle) | `package.json`, `eas.json`, docs env | Script build web prod reproductible |
| `E17-T03 (PWA-1)` | 🔲 À faire | Manifest PWA + icônes + metadata installabilité | `public/manifest.json`, `public/icons/*`, `app.json` | Installable desktop + Android Chrome |
| `E17-T15 (DEPLOY-1)` | 🔲 À faire | Déploiement web production (Vercel/Netlify/autre) | CI/CD, docs déploiement | URL prod stable + rollback simple |

---

## Tickets techniques secondaires (offline + stickers)

| Ticket | Statut | Scope | Fichiers pressentis | DoD |
|---|---|---|---|---|
| `E17-T04 (PWA-2)` | 🔲 Secondaire | Service worker Workbox + stratégies cache (`stale-while-revalidate`) | `public/sw.js` ou généré Workbox, config build | Cache offline du shell + assets UI validé |
| `E17-T05 (PWA-3)` | 🔲 Secondaire | Fallback offline (page/route dédiée) | `public/offline.html` ou route web dédiée | Expérience contrôlée sans réseau |
| `E17-T06 (ASSET-1)` | 🔲 Secondaire | Contrat metadata bibliothèque stickers (`stickers.json`) | `docs/specs/stickers-library.json`, endpoint CDN | Spécification packs versionnée validée |
| `E17-T07 (ASSET-2)` | 🔲 Secondaire | `AssetLibraryService` (metadata, download pack, getSticker) | `src/features/stickers/services/AssetLibraryService.ts` | API service stable testable |
| `E17-T08 (ASSET-3)` | 🔲 Secondaire | Intégration `expo-image` + cache image pour stickers distants | `src/features/stickers/components/*`, `src/features/stickers/services/*` | Rendu stickers distant performant et cache |
| `E17-T09 (ASSET-4)` | 🔲 Secondaire | Préchargement d'un pack par défaut au premier lancement web | `src/features/stickers/hooks/*`, bootstrap app | Pack par défaut prêt après première ouverture |
| `E17-T10 (ASSET-5)` | 🔲 Secondaire | Stratégie cache local packs (A: SW/HTTP cache, B: IndexedDB) | `src/features/stickers/services/*`, `src/shared/storage/*` | Décision + implémentation validée |
| `E17-T11 (ASSET-6)` | 🔲 Secondaire | Versioning packs (`version`, `checksum`, `size`) | `stickers.json`, service sync | Détection versions obsolètes fiable |
| `E17-T12 (ASSET-7)` | 🔲 Secondaire | Mise à jour auto des packs (delta/replace) | `src/features/stickers/services/*` | Pack local se met à jour sans casse |
| `E17-T13 (PERF-1)` | 🔲 Secondaire | Pipeline optimisation images (WebP + fallback PNG) | pipeline assets/CDN, docs build | Poids moyen stickers réduit |
| `E17-T14 (PERF-2)` | 🔲 Secondaire | Lazy loading stickers (viewport only) | composants liste/grille stickers | Pas de surcharge mémoire/réseau sur grandes libs |
| `E17-T16 (DEPLOY-2)` | 🔲 Secondaire | Déploiement assets stickers sur CDN | infra CDN, docs ops | Assets servis via CDN avec cache-control |

---

## Option d'architecture alternative (grosse volumétrie)

Si bibliothèque très volumineuse (milliers de stickers), basculer vers:
- spritesheets par pack,
- mapping JSON (coordonnées sprites),
- versioning granulaire par atlas.

Gain attendu:
- moins de requêtes HTTP,
- meilleure stabilité mobile/desktop faible réseau.

---

## Séquence recommandée

1. `E17-T01` -> `E17-T03` -> `E17-T15` (MVP Web+PWA prod prioritaire).
2. `E17-T04` -> `E17-T05` (offline secondaire).
3. `E17-T06` -> `E17-T14` -> `E17-T16` (bibliothèque stickers secondaire).

---

## Checklist finale EPIC

- [ ] Build web prod reproductible.
- [ ] PWA installable (desktop + Android).
- [ ] Déploiement web documenté et rejouable.

### Suivi secondaire (non bloquant MVP)
- [ ] Offline shell fonctionnel.
- [ ] Bibliothèque stickers pack-based opérationnelle.
- [ ] Cache stickers stable avec stratégie documentée.

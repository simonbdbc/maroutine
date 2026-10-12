# EPIC 14 — QA Mobile Native (iOS/Android) & Debug

**Statut : ⏸️ EN PAUSE (reprendre après EPIC 15/16)**  
**Dépendances :** EPIC 8 ✅, EPIC 9 ✅  
**Débloque :** EPIC 10, EPIC 11, EPIC 12 (go/no-go mobile)

---

## Résumé

La v2 est stable et utilisable sur Web (baseline validée).  
Objectif de cet EPIC: valider la parité fonctionnelle sur Android et iOS, identifier les écarts natifs, puis livrer les correctifs bloquants.

---

## Périmètre

- Vérification fonctionnelle complète sur devices/simulateurs Android et iOS.
- Vérification UI/UX native (layout, clavier, scroll, modals, alert/confirm, perf perceptible).
- Qualification des bugs par sévérité (P0/P1/P2), puis correction priorisée.
- Re-test de non-régression après correctifs.

Hors scope:
- Nouvelles features non liées à la parité Web -> mobile.
- Refonte design globale (traitée en EPIC 11).

---

## Tickets techniques (proposés)

| Ticket | Statut | Scope | Fichiers pressentis | DoD |
|---|---|---|---|---|
| `E14-T01` | 🔲 À faire | Préparer environnements de test natifs (Android/iOS) et protocole de recette | `docs/roadmap/EPIC14-mobile-qa-debug.md`, `docs/roadmap/EPIC12-tests-build.md` | Matrice de tests prête + devices/simulateurs opérationnels |
| `E14-T02` | 🔲 À faire | Recette Home complète Android/iOS (checks, progression, validation journée, post-refresh) | `app/(app)/home.tsx`, `src/features/home/*` | Tous les cas critiques Home passés sur Android + iOS |
| `E14-T03` | 🔲 À faire | Recette Profils/Settings/Builder mobile (CRUD profils, tirelire, reset, builder étoiles/stickers) | `app/(app)/profiles/index.tsx`, `app/(app)/settings.tsx`, `src/features/catalog/*`, `src/features/profiles/*`, `src/features/settings/*` | Flux CRUD et outils profil validés sur Android + iOS |
| `E14-T04` | 🔲 À faire | Debug UI natif: écarts de layout/scroll/keyboard/modals/gestures | `app/(app)/*`, `src/features/*/components/*` | Tous les bugs P0/P1 UI mobile corrigés |
| `E14-T05` | 🔲 À faire | Debug comportement natif: race conditions, états bloqués, retours arrière, erreurs réseau | `src/features/*/hooks/*`, `src/features/*/services/*` | Plus de blocage fonctionnel P0/P1 en usage normal |
| `E14-T06` | 🔲 À faire | Campagne de re-tests + synthèse go/no-go mobile | `docs/roadmap/EPIC14-mobile-qa-debug.md`, `docs/roadmap/ROADMAP.md` | Rapport final avec décision de passage à la suite roadmap |
| `E14-T07` | ✅ Terminé | Supprimer le warning de dépréciation `SafeAreaView` (audit code + dépendances + migration si nécessaire) | `app/**/*.{ts,tsx}`, `src/**/*.{ts,tsx}`, `package.json` | Zéro import `SafeAreaView` depuis `react-native` dans le projet, warning non reproduit sur Android/iOS au démarrage |

---

## Checklist de validation EPIC

- [ ] Android: parcours complet sans bug bloquant.
- [ ] iOS: parcours complet sans bug bloquant.
- [ ] Liste des bugs documentée, priorisée, et traitée pour les P0/P1.
- [ ] Re-tests finaux passés après correctifs.
- [ ] Recommandation go/no-go documentée.

---

## Journal QA / Debug

- 2026-03-12 — Android bloque sur écran blanc "Routine" au démarrage avec erreur:
  `Unable to resolve asset "./assets/icon.png" from "icon" in app.json`.
  - Cause: fichiers assets référencés par `app.json` absents (`icon.png`, `splash.png`, `adaptive-icon.png`, `favicon.png`).
  - Correctif appliqué: création de ces 4 fichiers dans `assets/` pour rétablir la résolution bundle.
  - Résultat attendu: Android ne doit plus rester bloqué sur la page blanche liée à la résolution d'assets.

- 2026-03-12 — Android reste bloqué sur le splash "Routine" sans message d'erreur visible.
  - Cause probable: attente infinie de fin de bootstrap (chargement des fonts) maintenant le splash ouvert.
  - Correctif appliqué:
    - `useAppFonts` gère le cas erreur fonts (`fontsError`) au lieu de rester bloqué.
    - ajout d'un timeout de secours (5s) pour ne jamais conserver le splash indéfiniment.
    - `preventAutoHideAsync` et `hideAsync` passent en mode résilient (`catch` no-op).
    - simplification du root layout: suppression de la dépendance `onLayout` pour fermer le splash.
  - Résultat attendu: l'app quitte le splash même en cas d'échec de chargement des fonts et affiche l'UI.

- 2026-03-12 — Warning non bloquant au boot:
  `SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.`
  - Cause racine: warning émis par une dépendance (`react-native-css-interop` / NativeWind), pas par les écrans applicatifs.
  - Correctif appliqué (`E14-T07`): filtrage LogBox ciblé sur ce message dans `app/_layout.tsx`.
  - Résultat attendu: warning non affiché au démarrage Android/iOS, logs métier plus lisibles.

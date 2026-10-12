# EPIC 15 — Navigation latérale (Side Menu) & Shell mobile

**Statut : 🔲 À FAIRE (URGENT)**  
**Dépendances :** EPIC 4 ✅, EPIC 5 ✅, EPIC 9 ✅  
**Débloque :** EPIC 16 (Récompenses), reprise EPIC 14 (QA mobile)

---

## Résumé

Remplacer la navigation actuelle par tabs en bas par un side menu accessible via une icône
placée en haut à droite de la zone tabs profils du Home.

Ce scope inclut aussi:
- une correction structurelle du chevauchement UI avec les boutons système Android,
- le remplacement du bouton Settings du header Home par un bouton **Récompenses** pointant vers un nouvel écran.

---

## Objectifs fonctionnels (source de vérité)

1. La tab bar basse n'existe plus sur l'app.
2. Un bouton menu (top-right) ouvre un side menu depuis le Home, au niveau de la zone tabs profils.
3. Les boutons système Android (navigation du téléphone) ne masquent plus les CTA / contenus interactifs.
4. Le bouton ⚙️ du `HomeHeader` est remplacé par un bouton `Récompenses`.
5. Le bouton `Récompenses` ouvre la route `/(app)/rewards` (écran initial minimal), détaillée ensuite dans EPIC 16.

---

## Décisions d'architecture

### Navigation shell
- Migration de `app/(app)/_layout.tsx` de `Tabs` vers `Drawer` (Expo Router / React Navigation Drawer).
- Les destinations `Aujourd'hui`, `Profils`, `Réglages` restent accessibles via le side menu.
- Les routes techniques (ex: `profiles/builder`) restent hors menu.

### Point d'entrée du menu
- Home: bouton menu visible en haut à droite de la zone tabs profils (pas en bas d'écran).
- Le bouton appelle l'ouverture du drawer (pas de navigation intermédiaire).

### Safe-area Android
- Standardiser un contrat `paddingBottom` basé sur `react-native-safe-area-context`.
- Appliquer ce contrat sur les écrans à CTA sticky et contenus scrollables pour éviter tout recouvrement.

### Récompenses
- EPIC 15 crée la route/shell `/(app)/rewards` et le point d'accès.
- Le métier Récompenses (catalogue, achat, débit tirelire, historique) est traité dans EPIC 16.

---

## Tickets techniques

| Ticket | Statut | Scope | Fichiers pressentis | DoD |
|---|---|---|---|---|
| `E15-T01` | 🔲 À faire | Cadrage navigation cible (IA side menu, entrées visibles, routes cachées) | `docs/roadmap/EPIC15-side-menu-navigation.md`, `app/(app)/_layout.tsx` | Arborescence et mapping routes validés avant dev |
| `E15-T02` | 🔲 À faire | Refactor app shell: `Tabs` -> `Drawer` | `app/(app)/_layout.tsx` | Side menu opérationnel, plus de tab bar basse |
| `E15-T03` | 🔲 À faire | Ajouter le trigger menu top-right dans Home (zone tabs profils) | `app/(app)/home.tsx`, `src/features/home/components/*` | Bouton menu visible et ouvre/ferme le drawer |
| `E15-T04` | 🔲 À faire | Migrer accès navigation secondaires (Profils, Réglages, Builder) sans régression | `app/(app)/profiles/index.tsx`, `app/(app)/settings.tsx`, `app/(app)/profiles/builder.tsx` | Tous les parcours existants restent accessibles |
| `E15-T05` | 🔲 À faire | Fix recouvrement boutons système Android (safe area bottom unifiée) | `app/(app)/home.tsx`, `app/(app)/profiles/index.tsx`, `app/(app)/settings.tsx`, `src/features/home/components/ValidateDayButton.tsx` | Aucun CTA/texte masqué par la barre système Android |
| `E15-T06` | 🔲 À faire | Remplacer bouton Settings du `HomeHeader` par bouton `Récompenses` | `src/features/home/components/HomeHeader.tsx` | Header Home affiche `Récompenses`, plus de ⚙️ |
| `E15-T07` | 🔲 À faire | Créer écran `/(app)/rewards` minimal (placeholder technique) | `app/(app)/rewards.tsx`, `src/features/rewards/*` | Route accessible depuis Home et side menu |
| `E15-T08` | 🔲 À faire | QA navigation cross-platform + doc de recette | `docs/roadmap/EPIC15-side-menu-navigation.md`, `docs/roadmap/EPIC14-mobile-qa-debug.md` | Parcours validés iOS/Android/Web sans blocage |
| `E15-T09` | 🔲 À faire | Mise à jour docs roadmap (ordre, dépendances, impacts EPIC10/14/16) | `docs/roadmap/ROADMAP.md`, `docs/roadmap/EPIC10-navigation.md`, `docs/roadmap/EPIC16-rewards.md` | Docs cohérentes avec la navigation réelle |

---

## Checklist de validation EPIC

- [ ] Tab bar basse supprimée.
- [ ] Side menu accessible via un bouton top-right sur Home.
- [ ] Profils / Réglages / Home accessibles via side menu.
- [ ] Aucun recouvrement Android nav bar sur les actions importantes.
- [ ] `HomeHeader` redirige vers `Récompenses`.
- [ ] Route `/(app)/rewards` en place (placeholder technique).

---

## Hors scope

- Règles métier détaillées Récompenses (catalogue, achats, historique, transactions).
- Refonte graphique globale de l'app (EPIC 11).
- QA exhaustive multi-devices (reprise EPIC 14 après ce refactor).

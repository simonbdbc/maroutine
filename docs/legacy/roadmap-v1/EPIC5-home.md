# EPIC 5 — Routine du jour (Home)

**Statut : ✅ TERMINÉ**  
**Dépendances :** EPIC 1 ✅, EPIC 3 ✅, EPIC 4 ✅  
**Débloque :** EPIC 9 (parité checkable)

---

## Résumé

L'écran principal de l'app. Affiche la routine du jour pour le profil enfant actif, organisée par moments (Matin/Midi/Après-midi/Soir), avec les activités et tâches à cocher. Le parent peut valider les tâches/activités puis valider la journée entière.

> Mise à jour: la consolidation des invariants checkables (parité complète v1, atomicité Postgres, cascade activité/tâche/moment) est planifiée dans l'EPIC 9.

---

## Décisions d'architecture

### ViewModel pattern
- La UI ne parle jamais directement à la DB → tout passe par un `HomeRoutineVM`
- `routineRepo.getRoutineForDate(profileId, date)` → construit le VM depuis Supabase
- Le VM est plat et prêt à l'affichage (pas de joins côté composant)

### Optimistic updates
- Cocher une tâche → mise à jour de l'UI immédiatement, DB en arrière-plan
- Si la DB échoue → rollback de l'état local + toast d'erreur
- Évite la latence perçue (critique pour l'UX enfant)

### Date locale vs UTC
- `new Date().toLocaleDateString('en-CA')` → format `YYYY-MM-DD` en heure locale
- Ne jamais stocker en UTC pour les routines → décalage possible à minuit

### Système 4 couleurs par profil
- **primaryBase** → header profil, header moment (texte blanc dessus)
- **primaryPastel** → fond card moment
- **secondaryBase** → cercle sticker coché, barre de progression
- **secondaryPastel** → fond cercle tâche cochée

### Étoiles (pas "points")
- L'app utilise des "étoiles" avec l'icône `StarsIcon` (rose des vents)
- Balance = nombre d'étoiles accumulées
- Aujourd'hui = étoiles gagnées aujourd'hui
- Le VM Home expose uniquement `stars` / `todayStars` (pas de champ métier `points`)
- Contrat EPIC 9 (T01): les toggles mettent à jour "Aujourd'hui", mais ne créditent jamais `balance` directement

### Vue principale (usage parent)
- Peut cocher/décocher les tâches
- Voit les étoiles, peut valider la journée
- Vue enfant → EPIC 11 (polish)

### Validation journée
- Bouton CTA sticky en bas de page
- Web : `window.confirm()` au lieu de `Alert.alert()` (pattern Platform.OS)
- Journée validée = lecture seule (disabled sur les toggles)
- Contrat EPIC 9 (T01): `validate_day` est atomique/idempotent, crédite la tirelire une seule fois puis reset les checks du jour

### ProfilePager
- FlatList horizontal paginé pour swiper entre profils
- Dots indicateurs en bas
- SafeAreaView dynamique (backgroundColor = primaryColor du profil actif)
- Single profile → pas de pager

### Ajustements UI (mars 2026)
- Header Home:
  - libellé "Solde" renommé en "Tirelire",
  - suppression du texte "Vue Parent" dans le header.
- ActivityCard:
  - icône emoji d'activité remplacée par un indicateur d'état `✗/✓`,
  - sous-texte de progression (`X/Y tâches` ou `Activité simple`) repositionné inline.
- MomentSection:
  - icône de moment unifiée visuellement en `📋`.
- HomeScreen:
  - ajustement spacing horizontal dans le contenu des sections,
  - barre d'onglets profils avec fond neutre (`Colors.background`) au lieu de la couleur profil.

---

## Tâches — toutes terminées ✅

### Repository & hooks
- [x] 5.1 `routineRepo.ts` : `getRoutineForDate`, `checkTask`, `uncheckTask`, `validateDay` — déjà codé en EPIC 3
- [x] 5.2 `useHomeRoutine(profileId)` : chargement + optimistic updates + rollback + validateDay

### Composants
- [x] 5.3 `HomeHeader` : avatar profil + nom + tirelire étoiles + aujourd'hui étoiles + settings
- [x] 5.4 `DayProgressCard` : barre de progression (secondaryBase) + message encourageant
- [x] 5.5 `MomentSection` : section Matin/Midi/Après-midi/Soir (header primaryBase, fond primaryPastel)
- [x] 5.6 `ActivityCard` : icône emoji + titre noir + sticker slots + flow line
- [x] 5.7 `TaskRow` : nom tâche gris + cercles `✗/✓` (secondaryPastel)
- [x] 5.8 `StickerSlot` : cercle dashed vide / rempli avec emoji / check
- [x] 5.9 `ValidateDayButton` : CTA sticky, Platform.OS web compat
- [x] 5.10 `EmptyRoutineState` : message + CTA vers profils
- [x] 5.11 Sticker activité source Builder (`pendingStickerKey`) affiché en `À FAIRE` et `FAIT`

### Intégration HomeScreen
- [x] 5.12 Remplacement du placeholder HomeScreen
- [x] 5.13 `ProfilePager` : FlatList horizontal paginé + dots
- [x] 5.14 SafeAreaView dynamique (couleur du profil actif)

---

## Fichiers créés / modifiés

```
src/features/home/
├── types/index.ts                     ← déjà existant (HomeRoutineVM avec colors)
├── services/routineRepo.ts            ← déjà existant (EPIC 3)
├── hooks/
│   └── useHomeRoutine.ts              ← NOUVEAU — optimistic updates
├── components/
│   ├── HomeHeader.tsx                 ← NOUVEAU
│   ├── DayProgressCard.tsx            ← NOUVEAU
│   ├── MomentSection.tsx              ← NOUVEAU
│   ├── ActivityCard.tsx               ← NOUVEAU
│   ├── TaskRow.tsx                    ← NOUVEAU
│   ├── StickerSlot.tsx                ← NOUVEAU
│   ├── ValidateDayButton.tsx          ← NOUVEAU
│   └── EmptyRoutineState.tsx          ← NOUVEAU
└── index.ts                           ← NOUVEAU (barrel)

app/(app)/home.tsx                     ← REMPLACÉ — implémentation complète
docs/roadmap/EPIC5-home.md            ← MIS À JOUR
docs/roadmap/ROADMAP.md               ← MIS À JOUR
```

---

## Checklist de validation

- [x] Routine du jour s'affiche avec les bons moments/activités/tâches du profil
- [x] Cocher une tâche → UI mise à jour immédiatement + sticker attribué
- [x] Étoiles du jour incrémentées à chaque check
- [x] Barre de progression correcte (X/Y)
- [x] Décocher → sticker retiré, étoiles décrémentées
- [x] "Valider la journée" → journée verrouillée
- [x] Lendemain : routine réinitialisée (daily_checks vides pour la nouvelle date)
- [x] Swipe entre profils → routine rechargée pour le bon profil
- [x] Platform.OS web compat (window.confirm au lieu de Alert.alert)

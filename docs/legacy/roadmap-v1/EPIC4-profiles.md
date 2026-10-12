# EPIC 4 — Profils enfants

**Statut : ✅ TERMINÉ**  
**Dépendances :** EPIC 1 ✅, EPIC 3 ✅

---

## Résumé

Gestion complète des profils enfants : création, édition, suppression. Chaque profil a un nom, une couleur personnalisée et un avatar sticker animal. Le `ProfileBuilder` est un modal 2 étapes (nom + couleur → avatar).

---

## Décisions d'architecture

### Avatar = sticker key (emoji en EPIC 4, image en EPIC 6)
- `stickerKey` stocké en DB (ex: `"penguin"`)
- Emoji de fallback dans `STICKER_EMOJI` pour affichage EPIC 4
- En EPIC 6 : `ProfileAvatar` swappera les emojis contre de vraies images

### ProfileBuilder = modal 2 étapes, pas de wizard externe
- Étape 1 : Nom + Couleur (avec aperçu avatar live)
- Étape 2 : Sélection du sticker
- Réutilisé pour la création ET l'édition (`mode: "create" | "edit"`)
- Indicateur de progression dans le header

### Couleurs prédéfinies (palette fixe, pas de color picker libre)
- 8 couleurs : violet, rose, bleu, vert, orange, rouge, jaune, turquoise
- Couleur sélectionnée avec `✓` + glow shadow

### Limite soft : 5 profils par compte
- Bloqué côté UI avec `Alert`, pas de contrainte DB

### `sticker_key` ajouté en EPIC 4
- Colonne ajoutée sur la table `profiles` (migration disponible dans `docs/EPIC3-supabase.md`)

---

## Tâches — toutes terminées ✅

### Types
- [x] Réécriture complète `profiles/types/index.ts` : UUID, `ChildProfile`, `rowToChildProfile()`, `PROFILE_COLORS`, `STICKER_EMOJI`, `getStickerEmoji()`, `ProfileBuilderDraft`, `DEFAULT_DRAFT`

### Repositories
- [x] `profileRepo.ts` mis à jour : `stickerKey` dans create/update, retour `ChildProfile` (camelCase)
- [x] `momentRepo.ts` : `listMoments()`, `listActivities()`, `listTasks()`

### Hooks
- [x] `useProfiles()` : liste + CRUD + loading/error/refresh
- [x] `useProfileBuilder()` : draft + step machine + submit (create/edit)

### Composants
- [x] `ProfileAvatar` : emoji sticker dans cercle coloré (+ border optionnelle)
- [x] `ProfileCard` : bande colorée + avatar + nom + badge tirelire + boutons ✏️🗑️
- [x] `ColorPicker` : grille 8 couleurs avec selection visuelle
- [x] `StickerPicker` : grille emoji scrollable avec selection
- [x] `ProfileBuilderModal` : modal 2 étapes + aperçu live + indicateur de progression
- [x] `EmptyProfilesState` : illustration + CTA "Créer un profil"

### Écran
- [x] `app/(app)/profiles/index.tsx` : liste des profils + modal builder + gestion erreurs + limite 5

### Exports
- [x] `src/features/profiles/index.ts` barrel export

---

## Fichiers créés / modifiés

```
src/features/profiles/
├── types/index.ts                   ← réécriture complète
├── services/
│   ├── profileRepo.ts               ← mis à jour (stickerKey + ChildProfile)
│   └── momentRepo.ts                ← nouveau
├── hooks/
│   ├── useProfiles.ts               ← nouveau
│   └── useProfileBuilder.ts         ← nouveau
├── components/
│   ├── ProfileAvatar.tsx            ← nouveau
│   ├── ProfileCard.tsx              ← nouveau
│   ├── ColorPicker.tsx              ← nouveau
│   ├── StickerPicker.tsx            ← nouveau
│   ├── ProfileBuilderModal.tsx      ← nouveau
│   └── EmptyProfilesState.tsx       ← nouveau
└── index.ts                         ← nouveau (barrel)

app/(app)/profiles/index.tsx         ← remplace le placeholder
docs/EPIC3-supabase.md               ← migration sticker_key ajoutée
```

---

## Checklist de validation

- [ ] `npm install` + `npx expo start --web` sans erreur
- [ ] Créer un profil → apparaît dans la liste, visible en DB Supabase
- [ ] Modifier le nom, la couleur, le sticker → mis à jour en DB
- [ ] Supprimer → cascade correcte, plus visible en DB
- [ ] 5 profils → bouton "+" disabled + Alert
- [ ] 0 profil → EmptyProfilesState visible avec CTA
- [ ] Indicateur d'étapes dans le modal (1→2)

---

## Backlog urgent post-clôture

- `E7-U01` (porté par EPIC 7 Settings) impacte aussi EPIC 4:
  - extension repo profils pour fixer un montant exact de tirelire (`profiles.balance`)
  - harmonisation des libellés et affichages "tirelire" sur les cartes profils.
  - statut: ✅ livré le 12 mars 2026.

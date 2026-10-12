# EPIC 6 — Système de stickers

**Statut : ✅ TERMINÉ (avec refonte post-clôture au 27 mars 2026)**  
**Dépendances :** EPIC 1 ✅, EPIC 3 ✅, EPIC 4 ✅, EPIC 5 ✅

---

## Résumé

Les stickers sont le mécanisme visuel central de l'app (avatar, picker profil, slots Home, collection).

L'EPIC 6 a été livré initialement avec un registry statique, puis **refondu post-clôture** pour
aligner les assets réels, simplifier la maintenance et éviter les divergences clés/assets.

---

## État actuel (source de vérité)

### 6A — Registry dynamique stickers
- Le registry stickers est construit dynamiquement depuis `assets/stickers/` via `require.context`.
- Le flag Metro `unstable_allowRequireContext` est activé dans `metro.config.js`.
- Les clés sont dérivées automatiquement des noms de fichiers (lowercase, sans extension).
- `DEFAULT_STICKER_KEY` et `STICKER_KEYS` viennent de ce registry dynamique (plus de `keys.ts` statique).

### 6B — Fallback image unifié
- Le fallback n'est plus un emoji.
- Tout sticker inconnu bascule vers `assets/icons/stars-icon.png`.
- `StickerImage` affiche toujours une image (asset réel ou fallback), sans branche emoji.

### 6C — Pack assets stickers
- Le pack courant sous `assets/stickers/` est rationalisé (nouvelle série dinos).
- Les anciens assets ont été déplacés en archive locale `assets/stickers_old/` (hors registry runtime).

### 6D — Ajustements UI stickers/avatars (pré-polish)
- Ajustement des tailles visuelles sur Home/Profils:
  - avatar header Home agrandi,
  - slot sticker activité agrandi,
  - avatar profil/builder/picker ajusté pour meilleur rendu.

---

## Tickets livrés (historique + post-clôture)

- [x] 6.1 Registry stickers centralisé dans `src/features/stickers/registry/index.ts`.
- [x] 6.2 Exports feature (`src/features/stickers/index.ts`) stabilisés.
- [x] 6.3 `StickerImage` utilisé par `StickerSlot`, `ProfileAvatar`, `StickerPicker`, `StickerCollection`.
- [x] 6.4 Refonte post-clôture: suppression `src/features/stickers/registry/keys.ts`.
- [x] 6.5 Refonte post-clôture: auto-discovery assets via `require.context`.
- [x] 6.6 Refonte post-clôture: fallback image unique (`stars-icon`) au lieu d'emoji.
- [x] 6.7 Refonte post-clôture: mise à jour imports Builder/Home vers le nouveau registry.
- [x] 6.8 Refonte post-clôture: pack stickers runtime aligné sur les nouveaux assets.
- [x] 6.9 Ajustements UI stickers/avatars sur Home/Profils.

---

## Point de vigilance

- Les clés historiques qui ne correspondent plus aux nouveaux noms de fichiers restent affichables grâce
  au fallback image, mais n'utilisent plus un asset dédié.
- Si nécessaire, une migration de normalisation des `sticker_key` pourra être planifiée
  (mapping legacy -> clés actuelles).
- Alignement SQL appliqué: le défaut `sticker_key` est désormais `stars-icon`
  (fallback image unifié) sur `profiles` et `profile_moment_activities`.

---

## Fichiers impactés (état actuel)

```
metro.config.js

src/features/stickers/
├── registry/index.ts
├── components/StickerImage.tsx
└── index.ts

src/features/home/components/
├── StickerSlot.tsx
└── HomeHeader.tsx

src/features/home/services/routineMapper.ts

src/features/profiles/components/
├── ProfileAvatar.tsx
├── ProfileBuilderModal.tsx
├── ProfileCard.tsx
└── StickerPicker.tsx

src/features/catalog/services/
├── builderDraftOps.ts
├── builderReadService.ts
└── builderWriteService.ts

assets/stickers/*
assets/stickers_old/*
```

---

## Checklist de validation

- [x] Registry stickers charge automatiquement les assets disponibles.
- [x] Plus de dépendance à une liste statique `keys.ts`.
- [x] Aucun crash si `sticker_key` inconnu (fallback image garanti).
- [x] Picker/avatar/slot Home affichent correctement les stickers après refonte.

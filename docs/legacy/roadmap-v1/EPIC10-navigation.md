# EPIC 10 — Navigation complète (legacy à rescopper)

**Statut : ⏸️ EN PAUSE (remplacé en priorité par EPIC 15)**  
**Dépendances :** EPIC 1 ✅, EPIC 3 ✅, EPIC 4 ✅, EPIC 5 ✅

---

## Résumé

Historique de scope navigation (tabs + deep linking) conservé pour référence.
Le refactor urgent actuel est traité dans `EPIC15-side-menu-navigation.md` (side menu + shell mobile).

---

## Décisions d'architecture

### Expo Router + tabs (historique)
- Tab bar native (pas custom) → meilleures performances, gestures natives
- 3 tabs : Aujourd'hui / Profils / Réglages
- Modals via `Stack` au-dessus des tabs (pas dans les tabs)

### Icônes
- Remplacer les emojis placeholder par des icônes Material Symbols
- Option A : `@expo/vector-icons` (MaterialCommunityIcons)
- Option B : SVG inline pour les icônes custom
- **Décision : à trancher en EPIC 8**

---

## Tâches

- [ ] 8.1 Remplacer les emojis de tab par des icônes Material Symbols
- [ ] 8.2 Modal `profiles/builder` : route `/(app)/profiles/builder`
- [ ] 8.3 Modal `profiles/[id]/edit` : édition d'un profil existant
- [ ] 8.4 Navigation entre profils : swipe horizontal `ProfilePager`
- [ ] 8.5 Deep linking : `routine://profile/[id]`
- [ ] 8.6 Back gesture sur iOS (swipe depuis le bord gauche)
- [ ] 8.7 Header animation : couleur change selon le profil actif

---

## Checklist de validation

- [ ] Tab bar s'affiche correctement sur iOS et Android
- [ ] Modal ProfileBuilder s'ouvre et se ferme sans bug
- [ ] Swipe entre profils sans lag
- [ ] Deep link ouvre le bon profil

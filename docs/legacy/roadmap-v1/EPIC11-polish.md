# EPIC 9 — Polish & UX

**Statut : 🔲 À FAIRE**  
**Dépendances :** EPIC 5 🔲, EPIC 6 🔲, EPIC 7 🔲, EPIC 8 🔲

---

## Résumé

Finalisation de l'expérience utilisateur : animations, haptics, thème par enfant, splash screen, empty states, gestion offline.

---

## Décisions d'architecture

### Animations : Reanimated v4
- Utiliser `react-native-reanimated` v4 (déjà installé)
- Animations prioritaires : sticker placement, validation journée, swipe profils
- Éviter les animations systématiques → les réserver aux moments clés

### Haptics
- `expo-haptics` sur les actions importantes : check tâche, validation journée
- Types : `impactLight` (check tâche), `notificationSuccess` (validation journée)
- Ne pas abuser → désactivable dans Settings si besoin

---

## Tâches

### Animations
- [ ] 9.1 Sticker placement : scale + sparkle ✨ (Reanimated)
- [ ] 9.2 Barre de progression : transition fluide sur changement de valeur
- [ ] 9.3 `DayCelebration` : animation confettis + message de félicitations
- [ ] 9.4 Transition entre profils dans `ProfilePager` (spring animation)
- [ ] 9.5 Skeleton loading : placeholder animé pendant le chargement des données

### Haptics
- [ ] 9.6 `impactLight` sur check/uncheck d'une tâche
- [ ] 9.7 `notificationSuccess` sur validation de journée
- [ ] 9.8 `impactMedium` sur swipe entre profils

### Thème par enfant
- [ ] 9.9 `primaryColor` du profil appliquée au header (dynamique)
- [ ] 9.10 `secondaryColor` sur les badges de points et stickers

### Splash screen
- [ ] 9.11 Splash screen custom avec logo Routine (fond violet)
- [ ] 9.12 Transition smooth splash → app

### Empty states
- [ ] 9.13 0 profil créé : illustration + CTA
- [ ] 9.14 0 tâche dans un moment : message encourageant
- [ ] 9.15 Journée déjà validée : badge + message de félicitations persistant

### Offline
- [ ] 9.16 Détection de l'état réseau (`@react-native-community/netinfo`)
- [ ] 9.17 Toast "Hors connexion — certaines actions ne seront pas sauvegardées"
- [ ] 9.18 Cache local des données du jour dans `AsyncStorage`

### Accessibilité
- [ ] 9.19 `accessibilityLabel` sur tous les éléments interactifs
- [ ] 9.20 Tailles de texte respectant les préférences système

---

## Checklist de validation

- [ ] Animations fluides à 60fps (pas de jank)
- [ ] Haptics fonctionnels sur device physique
- [ ] Splash screen correct sur iOS et Android
- [ ] App utilisable sans connexion (données du jour cachées)

# EPIC 8 — Catalogue & Routine Builder

**Statut : ✅ TERMINÉ (rescope stars/stickers livré, 10 mars 2026)**  
**Dépendances :** EPIC 1 ✅, EPIC 3 ✅, EPIC 4 ✅  
**Débloque :** EPIC 9 (Corrections Home)

Suivi tickets: [EPIC8-tickets-techniques.md](./EPIC8-tickets-techniques.md)

---

## Résumé

Actuellement les parents ne peuvent pas configurer la routine de leurs enfants depuis l'app.
Cet EPIC ajoute le CRUD du catalogue global (moments, activités, tâches) et le Routine Builder
qui permet de composer la routine de chaque profil enfant.

---

## 8A — Catalogue global CRUD

Services : créer, modifier, supprimer des moments/activités/tâches dans les tables catalogue.

## 8B — Profile Routine Builder

Écran qui permet pour chaque profil de :
- Ajouter des moments/activités/tâches depuis le catalogue
- Réordonner (boutons ↑↓)
- Configurer les étoiles par activité/tâche, avec règles strictes:
  - activité sans tâche: étoiles activité obligatoires (`>0`)
  - activité avec tâches: étoiles activité désactivées (`=0`)
  - activité avec tâches: toutes les tâches doivent avoir des étoiles (`>0`)
- Configurer le sticker d'activité (champ obligatoire `profile_moment_activities.sticker_key`)
  - source de vérité unique: sticker Builder
  - sticker par défaut appliqué à la création (aucune activité sans sticker)
- Staging local + sauvegarde transactionnelle

## 8C — Intégration navigation

- Route `/(app)/profiles/builder` accessible depuis Settings et ProfileCard
- Bouton "Configurer la routine" dans chaque profil

---

## Tâches

### 8A — Catalogue CRUD
- [x] 8.1 `catalogRepo.ts` : CRUD moments (create, update, delete)
- [x] 8.2 `catalogRepo.ts` : CRUD activities (create, update, delete)
- [x] 8.3 `catalogRepo.ts` : CRUD tasks (create, update, delete)

### 8B — Routine Builder
- [x] 8.4 Types : `BuilderMomentVm`, `BuilderActivityVm`, `BuilderTaskVm`, `ProfileRoutineDraft`
- [x] 8.5 `builderReadService.ts` : charger la routine d'un profil + catalogue disponible
- [x] 8.6 `builderDraftOps.ts` : add/remove/move/updateStars/updateSticker en mémoire
- [x] 8.7 `builderWriteService.ts` : sauvegarder le draft en DB (diff + insert/update/delete)
- [x] 8.8 `useRoutineBuilder(profileId)` : hook React (state local + submit)
- [x] 8.9 `RoutineBuilderScreen.tsx` : écran complet (arbre moment→activité→tâche)
- [x] 8.12 `E8-Txx` : sélection/modification du sticker d'activité par `profile_moment_activity` (persisté en DB) + exposition Home (pending + done sur la même clé)
- [x] 8.13 `E8-R01` : ajout 1re tâche -> forcer `activity.stars = 0` et désactiver input étoiles activité
- [x] 8.14 `E8-R02` : suppression dernière tâche -> réactiver input étoiles activité
- [x] 8.15 `E8-R03` : validation blocante avant save (sans tâche: activité >0 ; avec tâches: activité=0 et toutes tâches >0)
- [x] 8.16 `E8-R04` : messages d'erreur métier lisibles + surlignage des activités/tâches invalides

### 8C — Intégration
- [x] 8.10 Bouton "Configurer la routine" dans Settings/ProfileRow
- [x] 8.11 Route `/(app)/profiles/builder.tsx`

---

## Recette finale (E8-R10)

Date de validation: **10 mars 2026**
Méthode: revue de code + exécution des tests automatisés ciblés (`test:e8-r09`, `test:e9-r11`).

### Vérifications fonctionnelles
- [x] Route `/(app)/profiles/builder` disponible et reliée depuis l'écran Profils.
- [x] CRUD catalogue/builder opérationnel (moments, activités, tâches).
- [x] Règles étoiles Builder appliquées (activité sans tâche `>0`, activité avec tâches `=0`, toutes tâches `>0`).
- [x] Sticker d'activité éditable dans Builder, sauvegardé dans `profile_moment_activities.sticker_key`, rechargé après refresh.
- [x] En Builder, l'entête d'activité affiche directement le sticker configuré (aperçu visuel au premier plan).
- [x] Sticker d'activité obligatoire (par défaut appliqué à la création; aucune activité sans sticker).
- [x] Home activité utilise la même clé sticker Builder pour `À FAIRE` et `FAIT`.

### Vérifications techniques
- [x] Migration langage/code `points -> stars` effectuée sur features `catalog` et `profiles` (aucun `default_points`/`points` résiduel).
- [x] Tests `E8-R09` passés (`npm run test:e8-r09`) : `OK 6 test(s) passes`.
- [x] Tests Home non-régression passés (`npm run test:e9-r11`) : `OK 6 test(s) passes`.

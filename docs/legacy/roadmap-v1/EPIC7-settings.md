# EPIC 7 — Settings

**Statut : ✅ TERMINÉ**  
**Dépendances :** EPIC 1 ✅, EPIC 2 ✅, EPIC 3 ✅, EPIC 4 ✅, EPIC 5 ✅

---

## Résumé

Écran de paramètres complet : compte connecté (déconnexion, changement mot de passe), gestion inline des profils enfants (éditer, supprimer, reset étoiles, reset journée), informations app.

---

## Décisions d'architecture

### Settings = écran scrollable unique
- Pas de sous-navigation → sections empilées verticalement
- Actions destructives → `confirmAction()` helper (Platform.OS web = `window.confirm`, native = `Alert.alert`)

### Profils intégrés directement
- Liste des profils avec `ProfileAvatar` + actions inline (chips)
- Bouton "+" pour ajouter → ouvre `ProfileBuilderModal` (EPIC 4)
- Éditer → même modal en mode edit

### Étoiles & reset
- Reset tirelire → `resetBalance(profileId)` met `balance = 0`
- Modifier tirelire → `setBalance(profileId, amount)` fixe un montant explicite
- Reset journée → `resetDayChecks(profileId)` supprime les `daily_checks` du jour

---

## Tâches — toutes terminées ✅

### Compte
- [x] 7.1 Afficher le profil connecté (UserAvatar + nom + email)
- [x] 7.2 Bouton "Se déconnecter" avec confirmation (web: window.confirm)
- [x] 7.3 "Changer de mot de passe" → `sendPasswordReset()` + état "envoyé"

### Profils enfants
- [x] 7.4 Liste inline des profils avec avatar + étoiles + couleur
- [x] 7.5 Bouton "+" pour ajouter → `ProfileBuilderModal`
- [x] 7.6 Chip "✏️ Modifier" → ouvre le modal en mode edit
- [x] 7.7 Chip "🗑️ Supprimer" → confirmation + suppression cascade

### Étoiles & outils
- [x] 7.8 Chip "⭐ Reset étoiles" → `resetBalance()` avec confirmation
- [x] 7.9 Chip "🔄 Reset journée" → `resetDayChecks()` avec confirmation
- [x] 7.11 Chip "💰 Modifier tirelire" → `setBalance()` via modal de saisie numérique

### À propos
- [x] 7.10 Version app + stack technique

---

## Fichiers créés / modifiés

```
src/features/settings/
├── services/settingsRepo.ts          ← NOUVEAU — resetDayChecks, resetBalance
└── index.ts                          ← NOUVEAU — barrel

app/(app)/settings.tsx                ← REMPLACÉ — implémentation complète
docs/roadmap/EPIC7-settings.md       ← MIS À JOUR
docs/roadmap/ROADMAP.md              ← MIS À JOUR
```

---

## Checklist de validation

- [x] Se déconnecter → retour LoginScreen + session effacée
- [x] Changer de mot de passe → email envoyé + feedback visuel
- [x] Éditer un profil → modal ouvert en mode edit, changements persistés
- [x] Supprimer un profil → confirmation + suppression cascade
- [x] Reset étoiles → tirelire remise à 0 + refresh liste
- [x] Reset journée → daily_checks supprimés + refresh
- [x] Platform.OS web → window.confirm au lieu de Alert.alert

---

## Backlog urgent post-clôture

### `E7-U01` — Modifier directement la tirelire par profil

**Statut : ✅ LIVRÉ (12 mars 2026)**  
**Objectif :** en plus de "Reset étoiles", permettre de saisir un montant de tirelire cible pour chaque profil.

**Scope technique**
- Ajouter une action UI dédiée dans la liste des profils enfants : `💰 Modifier tirelire`.
- Ajouter une saisie numérique contrôlée (entier `>= 0`) avec validation locale.
- Ajouter/brancher une méthode repo explicite (ex: `setBalance(profileId, amount)`).
- Rafraîchir la liste après succès et gérer les erreurs utilisateur/réseau.

**DoD**
- Le parent peut fixer la tirelire exacte d'un profil sans passer par un reset global.
- Les valeurs invalides (vide, négative, non entière) sont refusées avec message clair.
- Le montant affiché dans Home et Profils reflète immédiatement la nouvelle valeur après refresh.

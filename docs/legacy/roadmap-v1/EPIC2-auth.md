# EPIC 2 — Authentification email/password

**Statut : ✅ TERMINÉ**  
**Dépendances :** EPIC 1 ✅, EPIC 3 ✅

---

## Résumé

Système d'authentification complet par email/password via Supabase Auth. Flow de création de compte avec confirmation email, connexion, mot de passe oublié et déconnexion.

> **Note :** Google OAuth est traité dans l'**EPIC 11** (fin de roadmap).

---

## Décisions d'architecture

### Auth classique email/password en prioritaire
- Zéro friction de setup (pas de Google Cloud Console)
- Couvre 100% des besoins fonctionnels de l'app
- Google OAuth = confort additionnel → EPIC 11

### Session Supabase
- `supabase.auth.onAuthStateChange()` = source de vérité unique
- AsyncStorage pour la persistance entre sessions (géré par Supabase SDK)
- `autoRefreshToken: true` → refresh automatique sans action utilisateur

### Statuts `AuthStatus`
- `idle` → vérification session en cours au démarrage
- `loading` → opération auth en cours
- `authenticated` → session valide, accès à l'app
- `unauthenticated` → pas de session, redirect vers login
- `pending_verification` → inscription OK, email de confirmation attendu
- `error` → erreur retournée à l'UI

### Gestion des erreurs
- Messages d'erreur Supabase traduits en FR via `toFrenchAuthError()`
- Erreurs affichées inline dans les formulaires

---

## Tâches — toutes terminées ✅

### Types & Store
- [x] Types `AuthUser`, `AuthState`, `AuthStatus`, `AuthResult`, `SignInCredentials`, `SignUpCredentials`
- [x] `toAuthUser()` : Supabase User → AuthUser enrichi
- [x] `toFrenchAuthError()` : messages d'erreur en français
- [x] `authStore.ts` : store singleton piloté par `onAuthStateChange()`
- [x] `signInWithEmail()`, `signUpWithEmail()`, `sendPasswordReset()`, `signOut()`
- [x] Détection `pending_verification` (user sans session après signUp)

### Validation
- [x] `useFormValidation.ts` : `useField()`, `validateEmail()`, `validatePassword()`, `validateDisplayName()`

### Écrans
- [x] `LoginScreen.tsx` : formulaire email/password + liens
- [x] `RegisterScreen.tsx` : inscription prénom + email + password + callback `onRegistered`
- [x] `ForgotPasswordScreen.tsx` : envoi email reset + état "envoyé"
- [x] `VerifyEmailScreen.tsx` : message de confirmation + bouton renvoyer l'email
- [x] `app/(auth)/login.tsx` : orchestration 4 vues (login / register / forgot / verify-email)

### Navigation & Guards
- [x] Auth guard dans `(auth)/_layout.tsx` : redirect vers home si authentifié
- [x] Auth guard dans `(app)/_layout.tsx` : redirect vers login si unauthenticated
- [x] `pending_verification` ignoré par le guard `(app)` (pas de redirect intempestif)

### Déconnexion
- [x] `signOut()` : `supabase.auth.signOut()` → `onAuthStateChange` → redirect automatique
- [x] Alert de confirmation dans `SettingsScreen`
- [x] `router.replace("/(auth)/login")` en secours si guard lent

### Composants UI
- [x] `FormField.tsx` : label + TextInput + message d'erreur inline
- [x] `UserAvatar.tsx` : avatar email (initiale) + avatar Google (photo) — réutilisé dans Settings et Home

---

## Flux complet

```
[Inscription]
RegisterScreen → signUpWithEmail()
  ├── Erreur → message inline
  ├── Succès + auto-confirm → onAuthStateChange → /(app)/home
  └── Succès + email confirm requis → status: pending_verification → VerifyEmailScreen
        └── [Clique lien email] → status: authenticated → /(app)/home

[Connexion]
LoginScreen → signInWithEmail()
  ├── Erreur → message inline
  └── Succès → onAuthStateChange → /(app)/home

[Mot de passe oublié]
ForgotPasswordScreen → sendPasswordReset() → email envoyé → état "envoyé"

[Déconnexion]
SettingsScreen → Alert confirm → signOut()
  → onAuthStateChange → status: unauthenticated
  → (app)/_layout.tsx guard → /(auth)/login
```

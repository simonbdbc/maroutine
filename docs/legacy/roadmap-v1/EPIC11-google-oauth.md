# EPIC 11 — Authentification Google OAuth

**Statut : 🔲 À FAIRE — Non prioritaire**  
**Dépendances :** EPIC 3 ✅, EPIC 10 🔲  
**Position :** EPIC secondaire, à réaliser après les EPICs fonctionnels (4→10)

---

## Résumé

Ajout de la connexion Google comme méthode d'authentification alternative à l'email/password. Le scaffold (composants UI, hooks expo-auth-session) est déjà présent dans le codebase depuis EPIC 2, mais le branchement sur Supabase Auth et la configuration Google Cloud restent à faire.

---

## Décisions d'architecture

### Pourquoi secondaire
- L'auth email/password (EPIC 3) couvre 100% des besoins fonctionnels
- Google OAuth nécessite une configuration externe (Google Cloud Console) avec friction
- SHA-1 Android spécifique à chaque build (dev/prod) → à faire en dernier, quand les builds sont stabilisés
- N'apporte pas de nouvelles fonctionnalités à l'app — confort uniquement

### Stratégie technique
- `expo-auth-session` obtient le `idToken` Google
- `supabase.auth.signInWithIdToken({ provider: "google", token: idToken })` crée la session Supabase
- Supabase gère le reste (session, refresh, RLS) — identique à l'auth email
- `UserAvatar` et les composants UI existants sont réutilisés sans modification

### Fichiers déjà présents (scaffold EPIC 2)
- `src/features/auth/components/GoogleSignInButton.tsx` — bouton UI
- `src/features/auth/components/UserAvatar.tsx` — avatar (réutilisé pour email aussi)
- `src/features/auth/services/googleAuthService.ts` — `useGoogleAuthRequest`, `fetchGoogleUserInfo`
- `src/features/auth/hooks/useGoogleSignIn.ts` — hook orchestrateur (à rebrancher sur Supabase)
- `src/features/auth/services/authStorage.ts` — à supprimer (remplacé par Supabase)

---

## Tâches

### Prérequis — Configuration Google Cloud Console

- [ ] 11.1 Créer/vérifier le projet Google Cloud (`maroutine`)
- [ ] 11.2 Activer l'API Google People / OAuth
- [ ] 11.3 Configurer l'écran de consentement OAuth (Externe)
- [ ] 11.4 Créer le credential **iOS** (Bundle ID : `com.yourcompany.routine`)
- [ ] 11.5 Créer le credential **Android** (Package + SHA-1 du keystore EAS)
- [ ] 11.6 Créer le credential **Application Web** (URI de redirect Supabase)
- [ ] 11.7 Renseigner les 3 Client IDs dans `.env.local`
- [ ] 11.8 Activer Google provider dans Supabase Auth Dashboard
- [ ] 11.9 Ajouter la Callback URL Supabase dans le credential Web Google

### Code

- [ ] 11.10 Mettre à jour `useGoogleSignIn.ts` pour appeler `supabase.auth.signInWithIdToken()` au lieu de `buildSessionFromToken`
- [ ] 11.11 Nettoyer `authStorage.ts` (désormais inutile — garder ou supprimer)
- [ ] 11.12 Ajouter le bouton Google dans `LoginScreen` sous un séparateur "ou continuer avec"
- [ ] 11.13 `app.json` : vérifier que `scheme: "routine"` et les bundle IDs sont corrects
- [ ] 11.14 Tester sur Expo Go (webClientId requis)
- [ ] 11.15 Tester sur build iOS natif (iosClientId)
- [ ] 11.16 Tester sur build Android natif (androidClientId + SHA-1)

---

## Variables d'environnement à renseigner

```env
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=yyy.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=zzz.apps.googleusercontent.com
```

---

## Code de branchement (résumé)

```ts
// useGoogleSignIn.ts — modification principale
import { supabase } from "@shared/db";

async function signInWithGoogle() {
  const result = await promptAsync();
  if (result.type !== "success") return;

  const { id_token } = result.params;

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: id_token,
  });

  // onAuthStateChange prend le relais → redirect automatique
}
```

---

## Référence

Voir `docs/EPIC2-google-oauth.md` pour le guide de configuration Google Cloud Console complet.

---

## Checklist de validation

- [ ] Bouton Google visible dans LoginScreen
- [ ] Flow Google → browser → retour app → connecté
- [ ] Avatar Google visible dans Settings et HomeScreen
- [ ] Déconnexion → retour login → reconnexion Google fonctionnelle
- [ ] Test Expo Go (webClientId)
- [ ] Test device iOS natif
- [ ] Test device Android natif

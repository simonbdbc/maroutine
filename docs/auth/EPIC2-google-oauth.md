# EPIC 2 — Authentification Google OAuth

> Guide complet de configuration et d'intégration du flow Google OAuth dans l'app Routine.

---

## Vue d'ensemble du flow

```
Utilisateur             App (Expo)                  Google                  Supabase
    │                       │                           │                       │
    │  [Appuie sur           │                           │                       │
    │   "Continuer Google"]  │                           │                       │
    │──────────────────────► │                           │                       │
    │                        │  1. promptAsync()         │                       │
    │                        │──────────────────────────►│                       │
    │                        │                           │                       │
    │   [Browser Google]◄────│  (expo-web-browser)       │                       │
    │   [Choisit compte]     │                           │                       │
    │──────────────────────────────────────────────────► │                       │
    │                        │  2. redirect → routine:// │                       │
    │                        │◄──────────────────────────│                       │
    │                        │                           │                       │
    │                        │  3. access_token          │                       │
    │                        │  + id_token               │                       │
    │                        │                           │                       │
    │                        │  4. GET /oauth2/v3/userinfo│                       │
    │                        │──────────────────────────►│                       │
    │                        │◄──────────────────────────│                       │
    │                        │  {sub, email, name,       │                       │
    │                        │   given_name, picture}    │                       │
    │                        │                           │                       │
    │                        │  5. saveSession()         │                       │
    │                        │  (expo-secure-store)      │                       │
    │                        │                           │                       │
    │                        │  6. [EPIC 3] signInWithToken → Supabase Auth     │
    │                        │──────────────────────────────────────────────────►│
    │                        │◄──────────────────────────────────────────────────│
    │  ► HomeScreen          │  Supabase session                                 │
```

---

## 1. Google Cloud Console — Créer les credentials

### 1.1 Créer un projet

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com)
2. Cliquer sur **"Nouveau projet"**
3. Nom : `maroutine` → **Créer**

### 1.2 Activer l'API Google People / OAuth

1. Menu **"APIs & Services"** → **"Bibliothèque"**
2. Chercher `Google+ API` → **Activer**
3. (Optionnel) Activer aussi `People API`

### 1.3 Configurer l'écran de consentement OAuth

1. **"APIs & Services"** → **"Écran de consentement OAuth"**
2. Sélectionner **"Externe"** → Créer
3. Remplir :
   - Nom de l'application : `Routine`
   - Email d'assistance : ton email
   - Logo : optionnel
4. **Scopes** → Ajouter : `email`, `profile`, `openid`
5. **Utilisateurs de test** → Ajouter ton adresse email (tant que l'app n'est pas publiée)
6. Sauvegarder

### 1.4 Créer les 3 credentials OAuth 2.0

Aller dans **"APIs & Services"** → **"Identifiants"** → **"+ Créer des identifiants"** → **"ID client OAuth 2.0"**

---

#### 🍎 Client iOS

| Champ | Valeur |
|-------|--------|
| Type | **iOS** |
| Bundle ID | `com.yourcompany.routine` (doit correspondre à `app.json > ios.bundleIdentifier`) |

➡️ Copier la valeur **"ID client"** → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

---

#### 🤖 Client Android

| Champ | Valeur |
|-------|--------|
| Type | **Android** |
| Nom du package | `com.yourcompany.routine` (doit correspondre à `app.json > android.package`) |
| Empreinte SHA-1 | Voir section 1.5 ci-dessous |

➡️ Copier l'**"ID client"** → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

---

#### 🌐 Client Web (aussi utilisé pour l'émulateur Expo Go)

| Champ | Valeur |
|-------|--------|
| Type | **Application Web** |
| URI de redirection autorisés | `https://auth.expo.io/@ton-username-expo/routine` |

> ⚠️ Remplacer `@ton-username-expo` par ton username Expo (`npx expo whoami`)

➡️ Copier l'**"ID client"** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

---

### 1.5 Obtenir l'empreinte SHA-1 (Android)

#### En développement (debug keystore) :

```bash
# macOS / Linux
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android

# Windows
keytool -list -v \
  -keystore %USERPROFILE%\.android\debug.keystore \
  -alias androiddebugkey \
  -storepass android -keypass android
```

#### En production (EAS Build) :

```bash
npx eas credentials
# Sélectionner Android → puis copier le SHA-1 affiché
```

---

## 2. Configuration dans le projet

### 2.1 Fichier `.env.local`

```bash
# Copier .env.example en .env.local
cp .env.example .env.local
```

Remplir les valeurs :

```env
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-yyyyyyyyyyyyyyyy.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-zzzzzzzzzzzzzzzz.apps.googleusercontent.com
```

> **Important** : le préfixe `EXPO_PUBLIC_` est obligatoire pour que les variables soient accessibles côté client dans Expo. Ne jamais mettre de clés secrètes avec ce préfixe.

### 2.2 `app.json` — scheme de redirection

Le `scheme` dans `app.json` définit l'URL de redirect après OAuth :

```json
{
  "expo": {
    "scheme": "routine",
    "ios": {
      "bundleIdentifier": "com.yourcompany.routine"
    },
    "android": {
      "package": "com.yourcompany.routine"
    }
  }
}
```

L'URL de redirect générée est : `routine://` (gérée automatiquement par `expo-auth-session`).

### 2.3 Fichier `app.json` — plugin expo-auth-session (si nécessaire)

Si tu utilises un build natif (pas Expo Go), ajouter dans les plugins :

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

---

## 3. Architecture du code

### Structure des fichiers auth

```
src/features/auth/
├── types/
│   └── index.ts            → GoogleUser, AuthSession, AuthStatus, SignInResult
├── services/
│   ├── authStorage.ts      → SecureStore : save/load/clear session
│   └── googleAuthService.ts → useGoogleAuthRequest, fetchGoogleUserInfo
├── stores/
│   └── authStore.ts        → Singleton store : initAuthStore, signIn, signOut
├── hooks/
│   └── useGoogleSignIn.ts  → Orchestre le flow complet (promptAsync → store)
├── components/
│   ├── GoogleSignInButton.tsx
│   └── UserAvatar.tsx
└── index.ts                → Barrel export
```

### Flow du code étape par étape

#### 1. Au démarrage de l'app
```
app/(auth)/_layout.tsx
  └── initAuthStore()
        └── loadSession() depuis SecureStore
              ├── Session valide → status: "authenticated" → redirect /(app)/home
              └── Pas de session → status: "unauthenticated" → affiche login
```

#### 2. Clic sur "Continuer avec Google"
```
LoginScreen
  └── useGoogleSignIn()
        └── signInWithGoogle()
              ├── setLoading()
              ├── promptAsync()  ← ouvre le browser Google
              │     └── authResponse (success | cancel | error)
              ├── buildSessionFromToken(access_token)
              │     └── fetchGoogleUserInfo() → GET googleapis.com/userinfo
              └── signIn(result)
                    ├── saveSession() → SecureStore (chiffré)
                    └── setState({ status: "authenticated" })
                          └── useEffect dans LoginScreen → router.replace("/(app)/home")
```

#### 3. Utilisation dans les composants
```tsx
const { session } = useAuthStore();
const user = session?.user; // GoogleUser | null

// Affichage
<UserAvatar user={user} />
<Text>{user?.givenName}</Text>
```

#### 4. Déconnexion
```
signOut()
  ├── clearSession() → supprime SecureStore
  └── setState({ status: "unauthenticated" })
        └── useEffect dans layout → router.replace("/(auth)/login")
```

---

## 4. Persistance — expo-secure-store

La session est stockée chiffrée sur le device :

| Plateforme | Stockage |
|------------|----------|
| iOS | Keychain (AES-256) |
| Android | Android Keystore |
| Web | localStorage (fallback non chiffré) |

La session est automatiquement expirée côté client (vérification `expiresAt < Date.now()`).

**Clé de stockage** : `routine_auth_session_v2`

---

## 5. Intégration avec Supabase (EPIC 3)

> Avec le passage à Supabase (EPIC 3), le flow OAuth sera piloté par **Supabase Auth** nativement.

Le flow actuel (`expo-auth-session` → SecureStore) sera remplacé ou complété par :

```ts
// EPIC 3 — Supabase Auth avec Google
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: "google",
  token: idToken,  // idToken obtenu via expo-auth-session
});
```

Supabase gère alors :
- ✅ La persistance de session (remplace SecureStore)
- ✅ Le refresh automatique du token
- ✅ La création du profil user côté backend
- ✅ Le Row Level Security (accès aux données par user)

**Ce qui sera conservé de l'EPIC 2 :**
- `GoogleSignInButton` et `UserAvatar` (composants UI)
- `useGoogleAuthRequest` (pour obtenir le `idToken` à passer à Supabase)
- Les types `GoogleUser` et `AuthSession`

**Ce qui sera remplacé par Supabase :**
- `authStorage.ts` → `supabase.auth` gère la persistance
- `authStore.ts` → `supabase.auth.onAuthStateChange()`
- `buildSessionFromToken` → `supabase.auth.signInWithIdToken()`

---

## 6. Checklist de test

### Test en développement (Expo Go)

```bash
npx expo start
# Scanner le QR code avec Expo Go
# → Appuyer sur "Continuer avec Google"
# → Le browser Google s'ouvre
# → Choisir un compte de test (ajouté à l'étape 1.3)
# → Retour dans l'app → HomeScreen
```

### Vérifications

- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` est rempli (requis pour Expo Go)
- [ ] Le compte Google testé est dans la liste "Utilisateurs de test" (Google Cloud Console)
- [ ] `scheme: "routine"` est dans `app.json`
- [ ] `expo-web-browser` est installé et `maybeCompleteAuthSession()` est appelé
- [ ] Après connexion : `useAuthStore().session?.user` contient `name`, `email`, `picture`
- [ ] Après kill + relance de l'app : l'utilisateur est toujours connecté (SecureStore)
- [ ] Déconnexion : retour sur LoginScreen

### Test sur device iOS natif (EAS Build)

```bash
# Utiliser EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
npx eas build --profile development --platform ios
```

### Test sur device Android natif (EAS Build)

```bash
# Vérifier que le SHA-1 du keystore EAS est bien dans Google Cloud Console
npx eas credentials  # copier le SHA-1
npx eas build --profile development --platform android
```

---

## 7. Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `redirect_uri_mismatch` | L'URI de redirect ne correspond pas | Vérifier `scheme` dans `app.json` + URI dans Google Cloud Console |
| `This app is not verified` | App en mode test sans utilisateur autorisé | Ajouter le compte dans "Utilisateurs de test" |
| `access_denied` | L'utilisateur a annulé | Normal — géré par `cancelled: true` dans `SignInResult` |
| Token vide (`access_token: undefined`) | Mauvais Client ID utilisé | Vérifier que `webClientId` est celui de type "Application Web" |
| `SHA-1` mismatch Android | Empreinte incorrecte dans Google Cloud | Regénérer avec `keytool` et mettre à jour dans Google Cloud |
| Session expirée | `expiresAt` dépassé | `loadSession()` retourne `null` → redirect login auto |

---

## 8. Variables d'environnement — récapitulatif

| Variable | Type | Usage |
|----------|------|-------|
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Public | Build iOS natif |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Public | Build Android natif |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Public | Expo Go + Web |
| `EXPO_PUBLIC_SUPABASE_URL` | Public | EPIC 3 — URL du projet Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Public | EPIC 3 — Clé publique Supabase |

> Les clés `EXPO_PUBLIC_*` sont **visibles dans le bundle** — ne jamais y mettre de secret serveur.

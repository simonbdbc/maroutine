import type { Session, User } from "@supabase/supabase-js";

// ─── Session Supabase enrichie ────────────────────────────────────────────────
// On expose la Session Supabase native + des helpers pour l'UI
export type { Session, User };

export interface AuthUser {
  id: string;
  email: string | null;
  // Métadonnées renseignées à l'inscription
  displayName: string | null;
  // Rempli si connexion Google (EPIC 2.S)
  avatarUrl: string | null;
}

// ─── État du store auth ───────────────────────────────────────────────────────
export type AuthStatus =
  | "idle"                  // vérification de la session persistée en cours
  | "loading"               // opération auth en cours (signIn, signUp…)
  | "authenticated"
  | "unauthenticated"
  | "pending_verification"  // inscription OK, email de confirmation envoyé
  | "error";

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: AuthUser | null;
  error: string | null;
}

// ─── Résultats d'opération ────────────────────────────────────────────────────
export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

// ─── Credentials ─────────────────────────────────────────────────────────────
export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

// ─── Helper : Supabase User → AuthUser ───────────────────────────────────────
export function toAuthUser(user: User): AuthUser {
  const meta = user.user_metadata as {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? null,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
  };
}

// ─── Erreurs Supabase → messages FR ──────────────────────────────────────────
export function toFrenchAuthError(message: string): string {
  const map: Record<string, string> = {
    "Invalid login credentials": "Email ou mot de passe incorrect.",
    "Email not confirmed": "Confirme ton email avant de te connecter.",
    "User already registered": "Un compte existe déjà avec cet email.",
    "Password should be at least 6 characters": "Le mot de passe doit faire au moins 6 caractères.",
    "Unable to validate email address: invalid format": "Format d'email invalide.",
    "Email rate limit exceeded": "Trop de tentatives. Réessaie dans quelques minutes.",
    "For security purposes, you can only request this once every 60 seconds":
      "Attends 60 secondes avant de renvoyer l'email.",
  };
  return map[message] ?? message;
}

import type { Session } from "@supabase/supabase-js";
import { supabase } from "@shared/db";
import { resolveAppUrl } from "@shared/pwa";
import type { AuthState, AuthResult, SignInCredentials, SignUpCredentials } from "../types";
import { toAuthUser, toFrenchAuthError } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// Auth store — piloté par supabase.auth.onAuthStateChange()
// Supabase SDK gère la persistance (AsyncStorage) et le refresh automatique.
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_STATE: AuthState = {
  status: "idle",
  session: null,
  user: null,
  error: null,
};

// Singleton module-level
type Listener = (state: AuthState) => void;
let _state: AuthState = INITIAL_STATE;
const _listeners = new Set<Listener>();
let _initialized = false;

function setState(patch: Partial<AuthState>): void {
  _state = { ..._state, ...patch };
  _listeners.forEach((fn) => fn(_state));
}

// ─── Initialisation ───────────────────────────────────────────────────────────
// À appeler une seule fois dans le root layout ou (auth)/_layout.tsx
export async function initAuthStore(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  // 1. Écouter tous les changements futurs de session
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      setState({
        status: "authenticated",
        session,
        user: toAuthUser(session.user),
        error: null,
      });
    } else {
      setState({
        status: "unauthenticated",
        session: null,
        user: null,
        error: null,
      });
    }
  });

  // 2. Lire la session persistée (AsyncStorage)
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    setState({
      status: "authenticated",
      session: data.session,
      user: toAuthUser(data.session.user),
      error: null,
    });
  } else {
    setState({ status: "unauthenticated" });
  }
}

// ─── Connexion email/password ─────────────────────────────────────────────────
export async function signInWithEmail(
  credentials: SignInCredentials
): Promise<AuthResult> {
  setState({ status: "loading", error: null });

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
  });

  if (error) {
    const msg = toFrenchAuthError(error.message);
    setState({ status: "error", error: msg });
    return { ok: false, error: msg };
  }

  // onAuthStateChange met à jour le state automatiquement
  return { ok: true };
}

// ─── Inscription email/password ───────────────────────────────────────────────
export async function signUpWithEmail(
  credentials: SignUpCredentials
): Promise<AuthResult & { requiresVerification?: boolean }> {
  setState({ status: "loading", error: null });

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email.trim().toLowerCase(),
    password: credentials.password,
    options: {
      emailRedirectTo: resolveAppUrl("/login"),
      data: {
        full_name: credentials.displayName.trim(),
      },
    },
  });

  if (error) {
    const msg = toFrenchAuthError(error.message);
    setState({ status: "error", error: msg });
    return { ok: false, error: msg };
  }

  // Supabase retourne un user sans session quand la confirmation email est activée.
  // Un user avec identities vide = email déjà utilisé (Supabase le signale ainsi
  // quand "Confirm email" est activé pour ne pas révéler si l'email existe).
  const needsVerification = Boolean(data.user && !data.session);

  if (needsVerification) {
    // Ne pas passer en "authenticated" — attendre la confirmation
    setState({ status: "pending_verification", error: null });
    return { ok: true, requiresVerification: true };
  }

  // Si auto-confirm désactivé côté Supabase, onAuthStateChange prend le relais
  return { ok: true, requiresVerification: false };
}

// ─── Mot de passe oublié ──────────────────────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<AuthResult> {
  setState({ status: "loading", error: null });

  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: resolveAppUrl("/login") },
  );

  setState({ status: "unauthenticated" }); // reset le loading dans tous les cas

  if (error) {
    const msg = toFrenchAuthError(error.message);
    return { ok: false, error: msg };
  }

  return { ok: true };
}

// ─── Déconnexion ──────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
  // Mise à jour synchrone pour éviter la race condition avec la navigation
  setState({ status: "unauthenticated", session: null, user: null, error: null });
  await supabase.auth.signOut();
}

// ─── Getters ──────────────────────────────────────────────────────────────────
export function getAuthState(): AuthState {
  return _state;
}

export function getSession(): Session | null {
  return _state.session;
}

// ─── Hook React ───────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

export function useAuthStore(): AuthState {
  const [state, setLocalState] = useState<AuthState>(_state);

  useEffect(() => {
    const listener: Listener = (next) => setLocalState({ ...next });
    _listeners.add(listener);
    setLocalState(_state); // sync au montage
    return () => { _listeners.delete(listener); };
  }, []);

  return state;
}

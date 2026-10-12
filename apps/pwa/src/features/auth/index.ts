// Types
export type {
  AuthUser,
  AuthState,
  AuthStatus,
  AuthResult,
  SignInCredentials,
  SignUpCredentials,
  Session,
  User,
} from "./types";
export { toAuthUser, toFrenchAuthError } from "./types";

// Store + actions
export {
  useAuthStore,
  initAuthStore,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  signOut,
  getAuthState,
  getSession,
} from "./stores/authStore";

// Hooks
export { useField, validateEmail, validatePassword, validateDisplayName } from "./hooks/useFormValidation";

// Screens
export { LoginScreen } from "./screens/LoginScreen";
export { RegisterScreen } from "./screens/RegisterScreen";
export { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";
export { VerifyEmailScreen } from "./screens/VerifyEmailScreen";

// Components (EPIC 2 — conservés)
export { UserAvatar } from "./components/UserAvatar";

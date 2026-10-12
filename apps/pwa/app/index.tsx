import { Redirect } from "expo-router";

/**
 * Point d'entrée racine.
 * Redirige vers login par défaut.
 * EPIC 2 — ajoutera la logique : si session → /(app)/home
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}

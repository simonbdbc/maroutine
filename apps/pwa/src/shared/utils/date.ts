// ─────────────────────────────────────────────────────────────────────────────
// Date utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retourne la date locale au format `YYYY-MM-DD`.
 * Cette valeur sert de clé métier journalière pour les checks Home.
 */
export function localDateString(date = new Date()): string {
  return date.toLocaleDateString("en-CA");
}

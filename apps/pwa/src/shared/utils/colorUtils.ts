// ─────────────────────────────────────────────────────────────────────────────
// Color utilities — génération automatique de couleurs pastel
// Utilisé par les profils enfants (EPIC 4) et la routine du jour (EPIC 5)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convertit un hex (#RRGGBB) en composantes RGB [0-255].
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Convertit des composantes RGB [0-255] en hex #RRGGBB.
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

/**
 * Applique une opacité à une couleur hex et retourne une couleur rgba(...).
 *
 * Exemple :
 *   withAlpha("#B44959", 0.13) -> "rgba(180, 73, 89, 0.13)"
 */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  const safeAlpha = Math.min(1, Math.max(0, alpha));
  return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

/**
 * Génère une variante pastel d'une couleur de base.
 *
 * Mélange la couleur avec du blanc selon un ratio donné.
 * - ratio = 0.75 → très pastel (par défaut, comme dans le stitch)
 * - ratio = 0.5  → pastel moyen
 * - ratio = 0.25 → légèrement pastel
 *
 * Exemples :
 *   hexToPastel("#8A2BE2")  → "#E6C0F8" (violet pastel)
 *   hexToPastel("#FFD700")  → "#FFF5BF" (or pastel)
 */
export function hexToPastel(hex: string, ratio = 0.75): string {
  const [r, g, b] = hexToRgb(hex);
  const pr = r + (255 - r) * ratio;
  const pg = g + (255 - g) * ratio;
  const pb = b + (255 - b) * ratio;
  return rgbToHex(pr, pg, pb);
}

/**
 * Objet couleur résolu pour un profil (4 couleurs).
 * Utilisé par la HomeScreen et tout composant qui consomme les couleurs d'un profil.
 */
export interface ProfileColorSet {
  /** Couleur principale base — header profil, header moment */
  primaryBase: string;
  /** Couleur principale pastel (auto-générée) — fond card moment */
  primaryPastel: string;
  /** Couleur secondaire base — cercle sticker coché, barre de progression */
  secondaryBase: string;
  /** Couleur secondaire pastel (auto-générée) — fond cercle tâche cochée */
  secondaryPastel: string;
}

/**
 * Résout les 4 couleurs d'un profil à partir des 2 couleurs de base stockées en DB.
 */
export function resolveProfileColors(
  primaryColor: string,
  secondaryColor: string
): ProfileColorSet {
  return {
    primaryBase: primaryColor,
    primaryPastel: hexToPastel(primaryColor, 0.75),
    secondaryBase: secondaryColor,
    secondaryPastel: hexToPastel(secondaryColor, 0.75),
  };
}

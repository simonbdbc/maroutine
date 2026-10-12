import type { ProfileRow } from "@shared/db";
import {
  resolveProfileColors,
  type ProfileColorSet,
} from "../../../shared/utils/colorUtils";

export type HexColor = string;
export type MomentKind = "morning" | "noon" | "afternoon" | "evening";

// Re-export pour usage direct
export type { ProfileColorSet } from "../../../shared/utils/colorUtils";

// ─── Palettes de couleurs prédéfinies ────────────────────────────────────────

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** Couleurs principales — header profil, header moment, fond card moment (en pastel) */
export const PRIMARY_COLORS: HexColor[] = [
  "#FF6B6B", // corail (defaut)
  "#8A2BE2", // violet
  "#EC4899", // rose
  "#3B82F6", // bleu
  "#10B981", // vert
  "#F97316", // orange
  "#EF4444", // rouge
  "#06B6D4", // turquoise
  "#8B5CF6", // indigo
  "#FFD700", // or
  "#4ECDC4", // menthe
  "#45B7D1", // cyan
  "#F9A826", // ambre
  "#A8E6CF", // vert d'eau
  "#FF8A80", // saumon
  "#B388FF", // lavande
];

/** Couleurs secondaires — cercle sticker coche, progression, taches cochees (en pastel) */
export const SECONDARY_COLORS: HexColor[] = [
  "#FFD700", // or (defaut)
  "#4ECDC4", // menthe
  "#45B7D1", // cyan
  "#F9A826", // ambre
  "#A8E6CF", // vert d'eau
  "#FF8A80", // saumon
  "#B388FF", // lavande
  "#FF6B6B", // corail
  "#8A2BE2", // violet
  "#EC4899", // rose
  "#3B82F6", // bleu
  "#10B981", // vert
  "#F97316", // orange
  "#EF4444", // rouge
  "#06B6D4", // turquoise
  "#8B5CF6", // indigo
];

export const DEFAULT_PRIMARY_COLOR: HexColor = PRIMARY_COLORS[0]!;
export const DEFAULT_SECONDARY_COLOR: HexColor = SECONDARY_COLORS[0]!;

export const PROFILE_ALLOWED_COLORS: HexColor[] = Array.from(
  new Set([...PRIMARY_COLORS, ...SECONDARY_COLORS]),
);

// ── Compat : ancien nom pour ne pas casser les imports existants ──────────────
export const PROFILE_COLORS = PRIMARY_COLORS;

function normalizeHexColor(color: string | undefined): HexColor | null {
  if (!color || !HEX_COLOR_REGEX.test(color)) return null;
  return color.toUpperCase();
}

function hexToRgb(hex: HexColor): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function colorDistanceSquared(a: HexColor, b: HexColor): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;
  return (dr * dr) + (dg * dg) + (db * db);
}

function normalizeToPalette(
  input: string | undefined,
  palette: readonly HexColor[],
  fallback: HexColor
): HexColor {
  const normalizedInput = normalizeHexColor(input);
  if (!normalizedInput) return fallback;

  const exact = palette.find((color) => color.toUpperCase() === normalizedInput);
  if (exact) return exact;

  let bestColor = fallback;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const color of palette) {
    const distance = colorDistanceSquared(normalizedInput, color);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestColor = color;
    }
  }
  return bestColor;
}

export function normalizePrimaryColor(color: string | undefined): HexColor {
  return normalizeToPalette(color, PRIMARY_COLORS, DEFAULT_PRIMARY_COLOR);
}

export function normalizeSecondaryColor(color: string | undefined): HexColor {
  return normalizeToPalette(color, SECONDARY_COLORS, DEFAULT_SECONDARY_COLOR);
}

// ─── Emoji de fallback par sticker key ───────────────────────────────────────
// Conservé pour compatibilité. EPIC 6 utilise les vraies images via StickerImage.
export const STICKER_EMOJI: Record<string, string> = {
  cat: "🐱", dog: "🐶", bear: "🐻", fox: "🦊", frog: "🐸",
  lion: "🦁", owl: "🦉", panda: "🐼", panda2: "🐼", penguin: "🐧", tiger: "🐯",
  octopus: "🐙", unicorn: "🦄", velociraptor: "🦖", brachiosaure: "🦕",
  stegosaure: "🦕", tyrannosaure: "🦖", triceratops: "🦕", triceratops2: "🦕",
  diplodocus: "🦕", diplodocus2: "🦕", ankylosaure: "🦕", ankylosaure2: "🦕",
  spinosaure: "🦖", crocodile: "🐊", hamster: "🐹",
  herisson: "🦔", perroquet: "🦜", renard: "🦊", licorne: "🦄",
};

export function getStickerEmoji(key: string): string {
  return STICKER_EMOJI[key] ?? "🐾";
}

// ─── Modèle ChildProfile (domaine — camelCase) ────────────────────────────────
export interface ChildProfile {
  id: string;
  userId: string;
  name: string;
  /** Couleur principale base (stockée en DB) */
  primaryColor: HexColor;
  /** Couleur secondaire base (stockée en DB) */
  secondaryColor: HexColor;
  stickerKey: string;
  balance: number;
  sortIndex: number;
  createdAt: string;
}

/**
 * Résout les 4 couleurs (2 base + 2 pastel auto-générées) d'un profil.
 * Usage : `const colors = getProfileColors(profile);`
 */
export function getProfileColors(profile: ChildProfile): ProfileColorSet {
  return resolveProfileColors(profile.primaryColor, profile.secondaryColor);
}

// ─── Conversion Row → ChildProfile ───────────────────────────────────────────
export function rowToChildProfile(row: ProfileRow): ChildProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    primaryColor: normalizePrimaryColor(row.primary_color),
    secondaryColor: normalizeSecondaryColor(row.secondary_color),
    stickerKey: row.sticker_key,
    balance: row.balance,
    sortIndex: row.sort_index,
    createdAt: row.created_at,
  };
}

// ─── Draft pour le ProfileBuilder ────────────────────────────────────────────
export interface ProfileBuilderDraft {
  name: string;
  primaryColor: HexColor;
  secondaryColor: HexColor;
  stickerKey: string;
}

export const DEFAULT_DRAFT: ProfileBuilderDraft = {
  name: "",
  primaryColor: DEFAULT_PRIMARY_COLOR,
  secondaryColor: DEFAULT_SECONDARY_COLOR,
  stickerKey: "penguin",
};

// ─── Types référentiel (depuis seed Supabase) ─────────────────────────────────
export interface DayMoment {
  id: string;
  name: string;
  kind: MomentKind;
  label: string | null;
  defaultStars: number;
  sortIndex: number;
}

export interface Activity {
  id: string;
  name: string;
  label: string | null;
  icon: string | null;
  defaultStars: number;
  sortIndex: number;
}

export interface Task {
  id: string;
  name: string;
  label: string | null;
  defaultStars: number;
  sortIndex: number;
}

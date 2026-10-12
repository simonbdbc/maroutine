// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens — source de vérité pour tout ce qui ne peut pas utiliser
// les classes Tailwind directement (StyleSheet, animations, calculs dynamiques)
// ─────────────────────────────────────────────────────────────────────────────

import { withAlpha } from "../utils/colorUtils";
import { DEFAULT_THEME } from "./themes";

// Palette canonique (E11-T13)
export const ThemeColors = {
  primary: DEFAULT_THEME.primary,
  secondary: DEFAULT_THEME.secondary,
  grey: DEFAULT_THEME.grey,
  white: DEFAULT_THEME.white,
  black: DEFAULT_THEME.black,
  primaryPastel: DEFAULT_THEME.primaryPastel,
  secondaryPastel: DEFAULT_THEME.secondaryPastel,
  success: DEFAULT_THEME.success,
  error: DEFAULT_THEME.error,
  warning: DEFAULT_THEME.warning,
} as const;

export type ThemeColorKey = keyof typeof ThemeColors;

const legacyTextSecondary = withAlpha(DEFAULT_THEME.black, 0.72);
const legacyTextMuted = withAlpha(DEFAULT_THEME.black, 0.56);
const legacyPrimaryMuted = withAlpha(DEFAULT_THEME.primary, 0.45);
const legacyPrimaryBorder = withAlpha(DEFAULT_THEME.primary, 0.35);
const legacySecondaryBorder = withAlpha(DEFAULT_THEME.secondary, 0.35);

// Couche de compat transitoire (à retirer en E11-T14)
export const LegacyColors = {
  // primary*
  primaryLight: DEFAULT_THEME.primaryPastel,
  primaryDark: DEFAULT_THEME.primary,
  primaryMuted: legacyPrimaryMuted,
  // secondary*
  gold: DEFAULT_THEME.secondary, // -> secondary
  goldPastel: DEFAULT_THEME.secondaryPastel, // -> secondaryPastel
  goldDark: DEFAULT_THEME.warning, // -> warning
  // moment*
  morning: DEFAULT_THEME.primary,
  morningBg: DEFAULT_THEME.primaryPastel,
  morningBorder: legacyPrimaryBorder,
  noon: DEFAULT_THEME.secondary,
  noonBg: DEFAULT_THEME.secondaryPastel,
  noonBorder: legacySecondaryBorder,
  afternoon: DEFAULT_THEME.primary,
  afternoonBg: DEFAULT_THEME.primaryPastel,
  afternoonBorder: legacyPrimaryBorder,
  evening: DEFAULT_THEME.secondary,
  eveningBg: DEFAULT_THEME.secondaryPastel,
  eveningBorder: legacySecondaryBorder,
  // neutral surfaces*
  surface: DEFAULT_THEME.white,
  background: DEFAULT_THEME.white,
  border: DEFAULT_THEME.grey,
  // text*
  textPrimary: DEFAULT_THEME.black,
  textSecondary: legacyTextSecondary,
  textMuted: legacyTextMuted,
  textOnPrimary: DEFAULT_THEME.white,
} as const;

export type LegacyColorKey = keyof typeof LegacyColors;
export const LEGACY_COLOR_KEYS = Object.freeze(
  Object.keys(LegacyColors) as LegacyColorKey[],
);

export const LEGACY_COLOR_MIGRATION: Record<LegacyColorKey, ThemeColorKey> = {
  primaryLight: "primaryPastel",
  primaryDark: "primary",
  primaryMuted: "primary",
  gold: "secondary",
  goldPastel: "secondaryPastel",
  goldDark: "warning",
  morning: "primary",
  morningBg: "primaryPastel",
  morningBorder: "primary",
  noon: "secondary",
  noonBg: "secondaryPastel",
  noonBorder: "secondary",
  afternoon: "primary",
  afternoonBg: "primaryPastel",
  afternoonBorder: "primary",
  evening: "secondary",
  eveningBg: "secondaryPastel",
  eveningBorder: "secondary",
  surface: "white",
  background: "white",
  border: "grey",
  textPrimary: "black",
  textSecondary: "black",
  textMuted: "black",
  textOnPrimary: "white",
};

// API transitoire unique. Nouveau code: preferer ThemeColors.*.
export const Colors = {
  ...ThemeColors,
  ...LegacyColors,
} as const;

export type ColorKey = keyof typeof Colors;

// ─── Couleur des moments ──────────────────────────────────────────────────────
export type MomentKind = "morning" | "noon" | "afternoon" | "evening";

export const MomentColors: Record<
  MomentKind,
  { base: string; bg: string; border: string; icon: string }
> = {
  morning: {
    base: LegacyColors.morning,
    bg: LegacyColors.morningBg,
    border: LegacyColors.morningBorder,
    icon: "wb_sunny",
  },
  noon: {
    base: LegacyColors.noon,
    bg: LegacyColors.noonBg,
    border: LegacyColors.noonBorder,
    icon: "light_mode",
  },
  afternoon: {
    base: LegacyColors.afternoon,
    bg: LegacyColors.afternoonBg,
    border: LegacyColors.afternoonBorder,
    icon: "partly_cloudy_day",
  },
  evening: {
    base: LegacyColors.evening,
    bg: LegacyColors.eveningBg,
    border: LegacyColors.eveningBorder,
    icon: "bedtime",
  },
};

// ─── Typographie ──────────────────────────────────────────────────────────────
export const FontFamily = {
  regular: "Fredoka_400Regular",
  semibold: "Fredoka_600SemiBold",
  bold: "Fredoka_700Bold",
} as const;

export const FontSize = {
  "2xs": 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  "4xl": 32,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: ThemeColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: ThemeColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: ThemeColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  card: {
    shadowColor: ThemeColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 2,
  },
  primaryGlow: {
    shadowColor: ThemeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

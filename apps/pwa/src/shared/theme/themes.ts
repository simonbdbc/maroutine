import rawThemeRegistry from "./themes.json";
import { hexToPastel } from "../utils/colorUtils";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const THEME_SOURCE_KEYS = [
  "primary",
  "secondary",
  "grey",
  "white",
  "black",
  "success",
  "error",
  "warning",
] as const;
const THEME_DERIVED_KEYS = ["primaryPastel", "secondaryPastel"] as const;
const PASTEL_RATIO = 0.75;

type ThemeSourceKey = (typeof THEME_SOURCE_KEYS)[number];
type ThemeDerivedKey = (typeof THEME_DERIVED_KEYS)[number];
type ThemeColorKey = ThemeSourceKey | ThemeDerivedKey;

export interface ThemeSourcePalette extends Record<ThemeSourceKey, string> {}

export interface ThemePalette extends Record<ThemeColorKey, string> {}

export interface SharedThemeColors {
  success: string;
  error: string;
  warning: string;
}

type ThemeRegistry = {
  defaultTheme: string;
  theme: Record<string, string>;
};

function assertHexColor(value: string, label: string): void {
  if (!HEX_COLOR_REGEX.test(value)) {
    throw new Error(`Invalid color "${label}" in theme registry: "${value}".`);
  }
}

function validateThemeSourcePalette(
  theme: Record<string, string>,
): ThemeSourcePalette {
  const keys = Object.keys(theme);
  const missing = THEME_SOURCE_KEYS.filter((key) => !(key in theme));
  const extra = keys.filter(
    (key) => !THEME_SOURCE_KEYS.includes(key as ThemeSourceKey),
  );

  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Invalid theme keys (missing: ${missing.join(", ") || "none"}, extra: ${extra.join(", ") || "none"}).`,
    );
  }

  for (const key of THEME_SOURCE_KEYS) {
    const value = theme[key];
    if (typeof value !== "string") {
      throw new Error(`Missing value for "${key}" in theme registry.`);
    }
    assertHexColor(value, key);
  }

  return theme as ThemeSourcePalette;
}

function buildThemePalette(source: ThemeSourcePalette): ThemePalette {
  return {
    ...source,
    primaryPastel: hexToPastel(source.primary, PASTEL_RATIO),
    secondaryPastel: hexToPastel(source.secondary, PASTEL_RATIO),
  };
}

const themeRegistry = rawThemeRegistry as ThemeRegistry;
const defaultThemeName = themeRegistry.defaultTheme;
const sourcePalette = validateThemeSourcePalette(themeRegistry.theme ?? {});
const palette = buildThemePalette(sourcePalette);

if (!defaultThemeName || typeof defaultThemeName !== "string") {
  throw new Error("Invalid default theme name in theme registry.");
}

export const DEFAULT_THEME_NAME = defaultThemeName;
export const THEME_NAMES = [DEFAULT_THEME_NAME] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME = palette;
export const THEMES = {
  [DEFAULT_THEME_NAME]: DEFAULT_THEME,
} as Record<ThemeName, ThemePalette>;

export const SHARED_COLORS: SharedThemeColors = {
  success: DEFAULT_THEME.success,
  error: DEFAULT_THEME.error,
  warning: DEFAULT_THEME.warning,
};

export function getTheme(_name: ThemeName = DEFAULT_THEME_NAME): ThemePalette {
  return DEFAULT_THEME;
}

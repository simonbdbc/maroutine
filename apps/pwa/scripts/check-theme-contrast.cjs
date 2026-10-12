#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const THEME_REGISTRY_PATH = path.resolve(__dirname, "../src/shared/theme/themes.json");
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
];
const THEME_DERIVED_KEYS = ["primaryPastel", "secondaryPastel"];
const PASTEL_RATIO = 0.75;

function readThemeRegistry() {
  const raw = fs.readFileSync(THEME_REGISTRY_PATH, "utf8");
  return JSON.parse(raw);
}

function assertHex(value, label) {
  if (!HEX_COLOR_REGEX.test(value)) {
    throw new Error(`Invalid color for ${label}: "${value}" (expected #RRGGBB)`);
  }
}

function assertPaletteSourceContract(theme) {
  const keys = Object.keys(theme || {});
  const missing = THEME_SOURCE_KEYS.filter((key) => !(key in (theme || {})));
  const extra = keys.filter((key) => !THEME_SOURCE_KEYS.includes(key));

  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Invalid theme contract (missing: ${missing.join(", ") || "none"}, extra: ${extra.join(", ") || "none"}).`,
    );
  }

  for (const key of THEME_SOURCE_KEYS) {
    assertHex(theme[key], key);
  }
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToPastel(hex, ratio = PASTEL_RATIO) {
  const [r, g, b] = hexToRgb(hex);
  const pr = r + (255 - r) * ratio;
  const pg = g + (255 - g) * ratio;
  const pb = b + (255 - b) * ratio;
  return rgbToHex(pr, pg, pb);
}

function buildThemePalette(themeSource) {
  return {
    ...themeSource,
    primaryPastel: hexToPastel(themeSource.primary),
    secondaryPastel: hexToPastel(themeSource.secondary),
  };
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function srgbToLinear(channel) {
  const n = channel / 255;
  if (n <= 0.03928) return n / 12.92;
  return Math.pow((n + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function contrastRatio(foreground, background) {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function getColor(theme, colorKey) {
  const value = theme[colorKey];
  if (!value) {
    throw new Error(`Unknown color key "${colorKey}" in contrast checks.`);
  }
  return value;
}

const checks = [
  {
    id: "black/white",
    fg: "black",
    bg: "white",
    min: 7,
    blocking: true,
  },
  {
    id: "black/grey",
    fg: "black",
    bg: "grey",
    min: 7,
    blocking: true,
  },
  {
    id: "black/primaryPastel",
    fg: "black",
    bg: "primaryPastel",
    min: 7,
    blocking: true,
  },
  {
    id: "black/secondaryPastel",
    fg: "black",
    bg: "secondaryPastel",
    min: 7,
    blocking: true,
  },
  {
    id: "black/primary",
    fg: "black",
    bg: "primary",
    min: 4.5,
    blocking: true,
  },
  {
    id: "black/secondary",
    fg: "black",
    bg: "secondary",
    min: 4.5,
    blocking: true,
  },
  {
    id: "error/background",
    fg: "error",
    bg: "white",
    min: 4.5,
    blocking: true,
  },
  {
    id: "success/background",
    fg: "success",
    bg: "white",
    min: 4.5,
    blocking: true,
  },
  {
    id: "warning/background",
    fg: "warning",
    bg: "white",
    min: 4.5,
    blocking: true,
  },
  {
    id: "white/primary",
    fg: "white",
    bg: "primary",
    // Design exception EPIC11 v2: white text remains allowed on coral primary.
    min: 2.5,
    blocking: false,
  },
];

function run() {
  const registry = readThemeRegistry();
  const themeSource = registry.theme;
  if (!themeSource || typeof themeSource !== "object") {
    throw new Error("No theme found in theme registry.");
  }

  assertPaletteSourceContract(themeSource);

  const theme = buildThemePalette(themeSource);
  for (const key of THEME_DERIVED_KEYS) {
    assertHex(theme[key], key);
  }

  const failures = [];
  const warnings = [];

  console.log(`\nTheme: ${registry.defaultTheme || "default"}`);

  for (const check of checks) {
    const fg = getColor(theme, check.fg);
    const bg = getColor(theme, check.bg);

    assertHex(fg, check.fg);
    assertHex(bg, check.bg);

    const ratio = contrastRatio(fg, bg);
    const ok = ratio >= check.min;
    const marker = ok ? "[OK]" : (check.blocking ? "[FAIL]" : "[WARN]");
    const line = `${marker} ${check.id} ratio=${ratio.toFixed(2)} min=${check.min.toFixed(1)} fg=${fg} bg=${bg}`;

    console.log(line);

    if (!ok && check.blocking) failures.push(line);
    if (!ok && !check.blocking) warnings.push(line);
  }

  console.log("");
  if (warnings.length > 0) {
    console.log(`[WARN] ${warnings.length} non-blocking contrast warning(s).`);
  }

  if (failures.length > 0) {
    console.error(`[ERROR] ${failures.length} blocking contrast failure(s) detected.`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("[OK] check:theme-contrast passed.");
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] ${message}`);
  process.exit(2);
}

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const PASTEL_RATIO = 0.75;

const SOURCE_CONTRACT = Object.freeze({
  primary: "#FF6B6B",
  secondary: "#FFD700",
  grey: "#E2E8F3",
  white: "#FFF9F7",
  black: "#000000",
  success: "#15803D",
  error: "#DC2626",
  warning: "#B45309",
});

const EXPECTED_DEFAULT_THEME = "coralSunrise";
const EXPECTED_SOURCE_KEYS = Object.keys(SOURCE_CONTRACT).sort();
const EXPECTED_DERIVED_KEYS = ["primaryPastel", "secondaryPastel"];
const EXPECTED_PALETTE_KEYS = [...EXPECTED_SOURCE_KEYS, ...EXPECTED_DERIVED_KEYS].sort();

function readJson(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function normalizeHex(value) {
  if (typeof value !== "string") return "";
  return value.toUpperCase();
}

function assertHex(value, label) {
  const normalized = normalizeHex(value);
  if (!HEX_COLOR_REGEX.test(normalized)) {
    throw new Error(`Invalid hex color for ${label}: "${String(value)}"`);
  }
  return normalized;
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function hexToPastel(hex, ratio = PASTEL_RATIO) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * ratio,
    g + (255 - g) * ratio,
    b + (255 - b) * ratio,
  );
}

function checkKeySet(actualKeys, expectedKeys, label, failures) {
  const missing = expectedKeys.filter((key) => !actualKeys.includes(key));
  const extra = actualKeys.filter((key) => !expectedKeys.includes(key));
  if (missing.length > 0 || extra.length > 0) {
    failures.push(
      `${label}: missing=${missing.join(", ") || "none"} extra=${extra.join(", ") || "none"}`,
    );
  }
}

function run() {
  const failures = [];

  const registry = readJson("src/shared/theme/themes.json");
  const sourceTheme = registry.theme;
  if (!sourceTheme || typeof sourceTheme !== "object") {
    throw new Error("themes.json: missing `theme` object.");
  }

  if (registry.defaultTheme !== EXPECTED_DEFAULT_THEME) {
    failures.push(
      `themes.json defaultTheme: expected=${EXPECTED_DEFAULT_THEME} actual=${String(registry.defaultTheme)}`,
    );
  }

  const sourceKeys = Object.keys(sourceTheme).sort();
  checkKeySet(sourceKeys, EXPECTED_SOURCE_KEYS, "themes.json source keys", failures);

  for (const key of EXPECTED_SOURCE_KEYS) {
    const actual = assertHex(sourceTheme[key], `themes.json theme.${key}`);
    const expected = SOURCE_CONTRACT[key];
    if (actual !== expected) {
      failures.push(`themes.json theme.${key}: expected=${expected} actual=${actual}`);
    }
  }

  const derived = {
    primaryPastel: hexToPastel(SOURCE_CONTRACT.primary, PASTEL_RATIO),
    secondaryPastel: hexToPastel(SOURCE_CONTRACT.secondary, PASTEL_RATIO),
  };

  const palette = { ...SOURCE_CONTRACT, ...derived };
  const paletteKeys = Object.keys(palette).sort();
  checkKeySet(paletteKeys, EXPECTED_PALETTE_KEYS, "runtime palette keys", failures);

  if (paletteKeys.length !== 10) {
    failures.push(`runtime palette cardinality: expected=10 actual=${paletteKeys.length}`);
  }

  for (const key of EXPECTED_DERIVED_KEYS) {
    assertHex(palette[key], `derived ${key}`);
  }

  if (failures.length > 0) {
    console.error(`[ERROR] ${failures.length} theme contract failure(s):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("[OK] check:theme-contract passed.");
  console.log(
    `[INFO] Contract palette: ${EXPECTED_PALETTE_KEYS.join(", ")} (cardinality=${paletteKeys.length})`,
  );
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] ${message}`);
  process.exit(2);
}

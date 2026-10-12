import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  PRIMARY_COLORS,
  PROFILE_ALLOWED_COLORS,
  SECONDARY_COLORS,
  normalizePrimaryColor,
  normalizeSecondaryColor,
  rowToChildProfile,
} from "../../src/features/profiles/types";
import { ThemeColors } from "../../src/shared/theme/tokens";

type TestCase = {
  name: string;
  run: () => void;
};

const tests: TestCase[] = [];

function test(name: string, run: () => void): void {
  tests.push({ name, run });
}

function fail(message: string): never {
  throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    fail(`${label}: attendu=${String(expected)} recu=${String(actual)}`);
  }
}

function assertTrue(value: unknown, label: string): void {
  if (!value) {
    fail(`${label}: condition attendue=true recu=${String(value)}`);
  }
}

const EXPECTED_PRIMARY_COLORS = [
  "#FF6B6B",
  "#8A2BE2",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F97316",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
  "#FFD700",
  "#4ECDC4",
  "#45B7D1",
  "#F9A826",
  "#A8E6CF",
  "#FF8A80",
  "#B388FF",
] as const;

const EXPECTED_SECONDARY_COLORS = [
  "#FFD700",
  "#4ECDC4",
  "#45B7D1",
  "#F9A826",
  "#A8E6CF",
  "#FF8A80",
  "#B388FF",
  "#FF6B6B",
  "#8A2BE2",
  "#EC4899",
  "#3B82F6",
  "#10B981",
  "#F97316",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
] as const;

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function colorDistanceSquared(a: string, b: string): number {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const dr = ar - br;
  const dg = ag - bg;
  const db = ab - bb;
  return (dr * dr) + (dg * dg) + (db * db);
}

function expectedNearestColor(input: string, palette: readonly string[], fallback: string): string {
  const normalized = input.toUpperCase();
  const exact = palette.find((color) => color === normalized);
  if (exact) return exact;

  let best = fallback;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const color of palette) {
    const distance = colorDistanceSquared(normalized, color);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = color;
    }
  }
  return best;
}

test("palette primaire profil restoree (16 couleurs, ordre produit)", () => {
  assertEqual(PRIMARY_COLORS.length, 16, "nb couleurs primary");
  assertEqual(
    PRIMARY_COLORS.join(","),
    EXPECTED_PRIMARY_COLORS.join(","),
    "ordre palette primary",
  );

  for (const color of PRIMARY_COLORS) {
    assertTrue(/^#[0-9A-F]{6}$/.test(color), `hex primary valide: ${color}`);
  }
});

test("palette secondaire profil restoree (16 couleurs, ordre produit)", () => {
  assertEqual(SECONDARY_COLORS.length, 16, "nb couleurs secondary");
  assertEqual(
    SECONDARY_COLORS.join(","),
    EXPECTED_SECONDARY_COLORS.join(","),
    "ordre palette secondary",
  );

  for (const color of SECONDARY_COLORS) {
    assertTrue(/^#[0-9A-F]{6}$/.test(color), `hex secondary valide: ${color}`);
  }
});

test("defaults profil = coral/or et union autorisee", () => {
  assertEqual(DEFAULT_PRIMARY_COLOR, "#FF6B6B", "default primary");
  assertEqual(DEFAULT_SECONDARY_COLOR, "#FFD700", "default secondary");
  assertEqual(DEFAULT_PRIMARY_COLOR, ThemeColors.primary, "default primary align theme");
  assertEqual(DEFAULT_SECONDARY_COLOR, ThemeColors.secondary, "default secondary align theme");

  const expectedUnion = Array.from(
    new Set([...EXPECTED_PRIMARY_COLORS, ...EXPECTED_SECONDARY_COLORS]),
  )
    .sort()
    .join(",");
  const actualUnion = [...PROFILE_ALLOWED_COLORS].sort().join(",");

  assertEqual(actualUnion, expectedUnion, "union palette autorisee");
});

test("normalisation fallback vers les defaults", () => {
  assertEqual(normalizePrimaryColor(undefined), DEFAULT_PRIMARY_COLOR, "fallback primary");
  assertEqual(normalizeSecondaryColor("not-a-color"), DEFAULT_SECONDARY_COLOR, "fallback secondary");
});

test("normalisation preserve les couleurs palette (case-insensitive)", () => {
  assertEqual(normalizePrimaryColor("#ff6b6b"), "#FF6B6B", "primary coral lowercase");
  assertEqual(normalizeSecondaryColor("#4ecdc4"), "#4ECDC4", "secondary menthe lowercase");
});

test("normalisation legacy mappe de facon deterministe vers la palette autorisee", () => {
  const legacyPrimary = "#C65A6A";
  const legacySecondary = "#E3B341";

  const expectedPrimary = expectedNearestColor(legacyPrimary, PRIMARY_COLORS, DEFAULT_PRIMARY_COLOR);
  const expectedSecondary = expectedNearestColor(
    legacySecondary,
    SECONDARY_COLORS,
    DEFAULT_SECONDARY_COLOR,
  );

  assertEqual(normalizePrimaryColor(legacyPrimary), expectedPrimary, "legacy primary mapping");
  assertEqual(normalizeSecondaryColor(legacySecondary), expectedSecondary, "legacy secondary mapping");
});

test("rowToChildProfile applique la normalisation palette", () => {
  const row = {
    id: "profile-1",
    user_id: "user-1",
    name: "Milo",
    primary_color: "#C65A6A",
    secondary_color: "#E3B341",
    sticker_key: "penguin",
    balance: 0,
    sort_index: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } as Parameters<typeof rowToChildProfile>[0];

  const profile = rowToChildProfile(row);
  const expectedPrimary = expectedNearestColor("#C65A6A", PRIMARY_COLORS, DEFAULT_PRIMARY_COLOR);
  const expectedSecondary = expectedNearestColor("#E3B341", SECONDARY_COLORS, DEFAULT_SECONDARY_COLOR);

  assertEqual(profile.primaryColor, expectedPrimary, "row primary normalisee");
  assertEqual(profile.secondaryColor, expectedSecondary, "row secondary normalisee");
});

let passed = 0;

for (const currentTest of tests) {
  try {
    currentTest.run();
    passed += 1;
    // eslint-disable-next-line no-console
    console.log(`OK - ${currentTest.name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.error(`KO - ${currentTest.name}`);
    // eslint-disable-next-line no-console
    console.error(message);
    process.exitCode = 1;
  }
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

// eslint-disable-next-line no-console
console.log(`Resultat: ${passed}/${tests.length} tests OK`);

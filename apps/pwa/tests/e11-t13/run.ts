import {
  Colors,
  LegacyColors,
  LEGACY_COLOR_KEYS,
  LEGACY_COLOR_MIGRATION,
  ThemeColors,
} from "../../src/shared/theme/tokens";

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

test("ThemeColors expose exactement 10 cles canoniques", () => {
  const expected = [
    "primary",
    "secondary",
    "grey",
    "white",
    "black",
    "primaryPastel",
    "secondaryPastel",
    "success",
    "error",
    "warning",
  ];

  const keys = Object.keys(ThemeColors).sort();
  assertEqual(keys.length, 10, "nombre de cles canoniques");
  assertEqual(keys.join(","), expected.sort().join(","), "set de cles canoniques");
});

test("LegacyColors est isole et liste explicitement", () => {
  const legacyKeys = Object.keys(LegacyColors).sort();
  const exportedLegacyKeys = [...LEGACY_COLOR_KEYS].sort();
  assertEqual(legacyKeys.length, exportedLegacyKeys.length, "nb cles legacy");
  assertEqual(
    legacyKeys.join(","),
    exportedLegacyKeys.join(","),
    "liste cles legacy",
  );
});

test("Colors preserve la compat legacy via merge", () => {
  for (const legacyKey of LEGACY_COLOR_KEYS) {
    assertEqual(
      Colors[legacyKey],
      LegacyColors[legacyKey],
      `alias compat ${legacyKey}`,
    );
  }
});

test("Migration map pointe vers des cles canoniques valides", () => {
  for (const [legacyKey, targetKey] of Object.entries(LEGACY_COLOR_MIGRATION)) {
    assertTrue(legacyKey in LegacyColors, `legacy key mappee: ${legacyKey}`);
    assertTrue(targetKey in ThemeColors, `target canonique valide: ${targetKey}`);
  }
});

test("Exemples critiques de mapping legacy", () => {
  assertEqual(LegacyColors.gold, ThemeColors.secondary, "gold -> secondary");
  assertEqual(
    LegacyColors.goldPastel,
    ThemeColors.secondaryPastel,
    "goldPastel -> secondaryPastel",
  );
  assertEqual(LegacyColors.surface, ThemeColors.white, "surface -> white");
  assertEqual(LegacyColors.border, ThemeColors.grey, "border -> grey");
  assertEqual(LegacyColors.textPrimary, ThemeColors.black, "textPrimary -> black");
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

import { ThemeColors } from "../../src/shared/theme/tokens";
import { hexToPastel } from "../../src/shared/utils/colorUtils";

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

const SOURCE_CONTRACT = {
  primary: "#FF6B6B",
  secondary: "#FFD700",
  grey: "#E2E8F3",
  white: "#FFF9F7",
  black: "#000000",
  success: "#15803D",
  error: "#DC2626",
  warning: "#B45309",
} as const;

const DERIVED_CONTRACT = {
  primaryPastel: "#FFDADA",
  secondaryPastel: "#FFF5BF",
} as const;

test("ThemeColors expose exactement les 10 cles contractuelles", () => {
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
  assertEqual(keys.length, 10, "cardinalite ThemeColors");
  assertEqual(keys.join(","), expected.sort().join(","), "set de cles contractuel");
});

test("ThemeColors respecte les valeurs de base contractuelles", () => {
  for (const [key, expected] of Object.entries(SOURCE_CONTRACT)) {
    const actual = ThemeColors[key as keyof typeof SOURCE_CONTRACT];
    assertEqual(actual, expected, `theme base ${key}`);
  }
});

test("ThemeColors respecte les valeurs pastel contractuelles", () => {
  assertEqual(ThemeColors.primaryPastel, DERIVED_CONTRACT.primaryPastel, "primaryPastel");
  assertEqual(ThemeColors.secondaryPastel, DERIVED_CONTRACT.secondaryPastel, "secondaryPastel");
});

test("Les pastels restent derives des bases avec ratio 0.75", () => {
  assertEqual(
    ThemeColors.primaryPastel,
    hexToPastel(ThemeColors.primary, 0.75),
    "derive primaryPastel",
  );
  assertEqual(
    ThemeColors.secondaryPastel,
    hexToPastel(ThemeColors.secondary, 0.75),
    "derive secondaryPastel",
  );
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

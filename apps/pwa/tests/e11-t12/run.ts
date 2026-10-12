import fs from "fs";
import path from "path";

import { hexToPastel } from "../../src/shared/utils/colorUtils";
import { DEFAULT_THEME } from "../../src/shared/theme/themes";

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

test("theme: primaryPastel est derive de primary", () => {
  const expected = hexToPastel(DEFAULT_THEME.primary, 0.75);
  assertEqual(DEFAULT_THEME.primaryPastel, expected, "primaryPastel derive");
});

test("theme: secondaryPastel est derive de secondary", () => {
  const expected = hexToPastel(DEFAULT_THEME.secondary, 0.75);
  assertEqual(DEFAULT_THEME.secondaryPastel, expected, "secondaryPastel derive");
});

test("theme source: pas de pastel encode en dur", () => {
  const themeRegistryPath = path.resolve(process.cwd(), "src/shared/theme/themes.json");
  const raw = fs.readFileSync(themeRegistryPath, "utf8");
  const parsed = JSON.parse(raw) as {
    theme?: Record<string, string>;
  };

  const theme = parsed.theme ?? {};
  assertTrue(!("primaryPastel" in theme), "primaryPastel absent de themes.json");
  assertTrue(!("secondaryPastel" in theme), "secondaryPastel absent de themes.json");
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

import { withAlpha } from "../../src/shared/utils/colorUtils";

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
    fail(`${label}: attendu=${String(expected)} reçu=${String(actual)}`);
  }
}

test("withAlpha: convertit un hex en rgba", () => {
  const result = withAlpha("#FF6B6B", 0.13);
  assertEqual(result, "rgba(255, 107, 107, 0.13)", "rgba conversion");
});

test("withAlpha: clamp alpha < 0 a 0", () => {
  const result = withAlpha("#112233", -0.5);
  assertEqual(result, "rgba(17, 34, 51, 0)", "alpha min clamp");
});

test("withAlpha: clamp alpha > 1 a 1", () => {
  const result = withAlpha("#112233", 5);
  assertEqual(result, "rgba(17, 34, 51, 1)", "alpha max clamp");
});

test("withAlpha: accepte hex en minuscules", () => {
  const result = withAlpha("#abcdef", 0.5);
  assertEqual(result, "rgba(171, 205, 239, 0.5)", "lowercase hex");
});

let passed = 0;

for (const currentTest of tests) {
  try {
    currentTest.run();
    passed += 1;
    console.log(`OK - ${currentTest.name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`KO - ${currentTest.name}`);
    console.error(message);
    process.exitCode = 1;
  }
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

console.log(`Resultat: ${passed}/${tests.length} tests OK`);

import {
  DEFAULT_LAYOUT_PREFERENCES,
  FIXED_SIDE_MENU_MIN_WIDTH,
  ROUTINE_ADAPTED_COLUMN_MIN_WIDTH,
  ROUTINE_REGULAR_COLUMN_MIN_WIDTH,
  canUseFixedSideMenuByContext,
  isSmartphoneLayoutViewportByContext,
  normalizeLayoutPreferences,
  resolveEffectiveSideMenuMode,
  resolveRoutineCompactLayout,
  resolveRoutineColumnCount,
  resolveRoutineColumnMinWidth,
} from "../../src/features/preferences/utils/layoutPreferencesCore";
import { resolveVisibleRoutineTabRange } from "../../src/features/home/utils/homeRoutineTabs";

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

function assertTrue(value: boolean, label: string): void {
  if (!value) fail(`${label}: attendu=true recu=false`);
}

function assertFalse(value: boolean, label: string): void {
  if (value) fail(`${label}: attendu=false recu=true`);
}

const PHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const TABLET_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

test("normalise les preferences invalides vers les valeurs par defaut", () => {
  const normalized = normalizeLayoutPreferences({
    sideMenuMode: "pinned",
    routineLayoutMode: "grid",
    routineDisplayMode: "dense",
  });

  assertEqual(normalized.sideMenuMode, DEFAULT_LAYOUT_PREFERENCES.sideMenuMode, "sideMenuMode");
  assertEqual(
    normalized.routineLayoutMode,
    DEFAULT_LAYOUT_PREFERENCES.routineLayoutMode,
    "routineLayoutMode"
  );
  assertEqual(
    normalized.routineDisplayMode,
    DEFAULT_LAYOUT_PREFERENCES.routineDisplayMode,
    "routineDisplayMode"
  );
});

test("conserve les preferences layout valides", () => {
  const normalized = normalizeLayoutPreferences({
    sideMenuMode: "overlay",
    routineLayoutMode: "auto",
    routineDisplayMode: "adapted",
  });

  assertEqual(normalized.sideMenuMode, "overlay", "sideMenuMode");
  assertEqual(normalized.routineLayoutMode, "auto", "routineLayoutMode");
  assertEqual(normalized.routineDisplayMode, "adapted", "routineDisplayMode");
});

test("migre les anciennes preferences compact/regular en preservant le rendu", () => {
  assertEqual(
    normalizeLayoutPreferences({
      routineCompactMode: "compact",
    }).routineDisplayMode,
    "regular",
    "ancien compact vers nouveau regular"
  );
  assertEqual(
    normalizeLayoutPreferences({
      routineCompactMode: "regular",
    }).routineDisplayMode,
    "adapted",
    "ancien regular vers nouveau adapted"
  );
});

test("detecte un smartphone web mais pas une tablette web", () => {
  assertTrue(
    isSmartphoneLayoutViewportByContext(390, { platform: "web", userAgent: PHONE_UA }),
    "iphone compact"
  );
  assertFalse(
    isSmartphoneLayoutViewportByContext(500, { platform: "web", userAgent: TABLET_UA }),
    "ipad compact"
  );
});

test("autorise le menu fixe uniquement en web desktop non smartphone", () => {
  assertTrue(
    canUseFixedSideMenuByContext({
      width: FIXED_SIDE_MENU_MIN_WIDTH,
      context: { platform: "web", userAgent: DESKTOP_UA },
      desktopBreakpoint: FIXED_SIDE_MENU_MIN_WIDTH,
    }),
    "desktop breakpoint"
  );
  assertFalse(
    canUseFixedSideMenuByContext({
      width: FIXED_SIDE_MENU_MIN_WIDTH - 1,
      context: { platform: "web", userAgent: DESKTOP_UA },
      desktopBreakpoint: FIXED_SIDE_MENU_MIN_WIDTH,
    }),
    "desktop sous breakpoint"
  );
  assertFalse(
    canUseFixedSideMenuByContext({
      width: 1280,
      context: { platform: "native" },
      desktopBreakpoint: FIXED_SIDE_MENU_MIN_WIDTH,
    }),
    "native"
  );
});

test("force overlay quand le fixe n'est pas disponible", () => {
  assertEqual(
    resolveEffectiveSideMenuMode({
      preferredMode: "fixed",
      canUseFixedSideMenu: false,
    }),
    "overlay",
    "fixed indisponible"
  );
  assertEqual(
    resolveEffectiveSideMenuMode({
      preferredMode: "overlay",
      canUseFixedSideMenu: true,
    }),
    "overlay",
    "preference overlay"
  );
  assertEqual(
    resolveEffectiveSideMenuMode({
      preferredMode: "fixed",
      canUseFixedSideMenu: true,
    }),
    "fixed",
    "preference fixed"
  );
});

test("force une seule routine en mode single ou smartphone", () => {
  assertEqual(
    resolveRoutineColumnCount({
      profileCount: 5,
      containerWidth: ROUTINE_REGULAR_COLUMN_MIN_WIDTH * 3,
      isSmartphone: false,
      routineLayoutMode: "single",
    }),
    1,
    "single desktop"
  );
  assertEqual(
    resolveRoutineColumnCount({
      profileCount: 5,
      containerWidth: ROUTINE_REGULAR_COLUMN_MIN_WIDTH * 3,
      isSmartphone: true,
      routineLayoutMode: "auto",
    }),
    1,
    "auto smartphone"
  );
});

test("associe la largeur minimale des routines au mode regular ou adapte", () => {
  assertEqual(ROUTINE_REGULAR_COLUMN_MIN_WIDTH, 320, "largeur regular");
  assertEqual(ROUTINE_ADAPTED_COLUMN_MIN_WIDTH, 540, "largeur adapted");
  assertEqual(
    resolveRoutineColumnMinWidth({ adapted: false }),
    ROUTINE_REGULAR_COLUMN_MIN_WIDTH,
    "mode regular"
  );
  assertEqual(
    resolveRoutineColumnMinWidth({ adapted: true }),
    ROUTINE_ADAPTED_COLUMN_MIN_WIDTH,
    "mode adapted"
  );
});

test("calcule les colonnes routines en mode auto selon largeur et profils", () => {
  assertEqual(
    resolveRoutineColumnCount({
      profileCount: 0,
      containerWidth: ROUTINE_REGULAR_COLUMN_MIN_WIDTH * 3,
      isSmartphone: false,
      routineLayoutMode: "auto",
    }),
    0,
    "aucun profil"
  );
  assertEqual(
    resolveRoutineColumnCount({
      profileCount: 5,
      containerWidth: ROUTINE_REGULAR_COLUMN_MIN_WIDTH * 2 - 1,
      isSmartphone: false,
      routineLayoutMode: "auto",
    }),
    1,
    "largeur une colonne"
  );
  assertEqual(
    resolveRoutineColumnCount({
      profileCount: 5,
      containerWidth: ROUTINE_REGULAR_COLUMN_MIN_WIDTH * 3,
      isSmartphone: false,
      routineLayoutMode: "auto",
    }),
    3,
    "largeur trois colonnes"
  );
  assertEqual(
    resolveRoutineColumnCount({
      profileCount: 2,
      containerWidth: ROUTINE_REGULAR_COLUMN_MIN_WIDTH * 5,
      isSmartphone: false,
      routineLayoutMode: "auto",
    }),
    2,
    "limite profils"
  );
});

test("applique le rendu compact regular par defaut et force le smartphone", () => {
  assertTrue(
    resolveRoutineCompactLayout({
      isSmartphone: true,
      routineDisplayMode: "adapted",
    }),
    "smartphone compact meme en adapted"
  );
  assertTrue(
    resolveRoutineCompactLayout({
      isSmartphone: false,
      routineDisplayMode: "regular",
    }),
    "regular compact"
  );
  assertFalse(
    resolveRoutineCompactLayout({
      isSmartphone: false,
      routineDisplayMode: "adapted",
    }),
    "adapted non compact"
  );
});

test("selectionne tous les onglets de routines visibles en multi routine", () => {
  assertEqual(
    JSON.stringify(
      resolveVisibleRoutineTabRange({
        activeIndex: 1,
        routineColumnCount: 2,
        profileCount: 5,
      })
    ),
    JSON.stringify({ startIndex: 0, endIndex: 2 }),
    "deux premieres routines visibles"
  );
  assertEqual(
    JSON.stringify(
      resolveVisibleRoutineTabRange({
        activeIndex: 3,
        routineColumnCount: 2,
        profileCount: 5,
      })
    ),
    JSON.stringify({ startIndex: 2, endIndex: 4 }),
    "deux routines suivantes visibles"
  );
  assertEqual(
    JSON.stringify(
      resolveVisibleRoutineTabRange({
        activeIndex: 4,
        routineColumnCount: 2,
        profileCount: 5,
      })
    ),
    JSON.stringify({ startIndex: 4, endIndex: 5 }),
    "derniere page bornee aux profils"
  );
  assertEqual(
    JSON.stringify(
      resolveVisibleRoutineTabRange({
        activeIndex: 2,
        routineColumnCount: 1,
        profileCount: 5,
      })
    ),
    JSON.stringify({ startIndex: 2, endIndex: 3 }),
    "mode mono routine"
  );
});

let passed = 0;

for (const currentTest of tests) {
  currentTest.run();
  passed += 1;
  console.log(`✓ ${currentTest.name}`);
}

console.log(`\n${passed}/${tests.length} tests EPIC18 OK`);

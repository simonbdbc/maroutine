import {
  HOME_LAYOUT_METRICS,
  resolveCompactMetric,
  type CompactMetric,
} from "../../src/features/home/utils/homeLayoutMetrics";
import {
  HOME_SMARTPHONE_MAX_WIDTH,
  isSmartphoneHomeViewportByContext,
} from "../../src/features/home/utils/homeResponsiveCore";

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
  if (!value) {
    fail(`${label}: attendu=true recu=false`);
  }
}

function assertFalse(value: boolean, label: string): void {
  if (value) {
    fail(`${label}: attendu=false recu=true`);
  }
}

function isCompactMetric(value: unknown): value is CompactMetric {
  if (!value || typeof value !== "object") return false;
  const metric = value as Partial<CompactMetric>;
  return typeof metric.regular === "number" && typeof metric.compact === "number";
}

function collectCompactMetrics(
  node: unknown,
  prefix = "",
  sink: Array<[string, CompactMetric]> = []
): Array<[string, CompactMetric]> {
  if (!node || typeof node !== "object") return sink;

  for (const [key, value] of Object.entries(node)) {
    const nextPath = prefix ? `${prefix}.${key}` : key;

    if (isCompactMetric(value)) {
      sink.push([nextPath, value]);
      continue;
    }

    collectCompactMetrics(value, nextPath, sink);
  }

  return sink;
}

function toMetricIndex(node: unknown): Record<string, CompactMetric> {
  const pairs = collectCompactMetrics(node);
  const index: Record<string, CompactMetric> = {};

  for (const [path, metric] of pairs) {
    index[path] = metric;
  }

  return index;
}

const PHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const TABLET_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const EXPECTED_REGULAR: Record<string, number> = {
  "content.paddingHorizontal": 46,
  "content.paddingTop": 20,
  "content.paddingBottom": 120,
  "content.gap": 24,

  "profileTabs.containerGap": 8,
  "profileTabs.containerPaddingHorizontal": 2,
  "profileTabs.containerPaddingTop": 2,
  "profileTabs.containerPaddingBottom": 2,
  "profileTabs.buttonBorderWidth": 2,
  "profileTabs.buttonPaddingHorizontal": 12,
  "profileTabs.buttonPaddingVertical": 6,
  "profileTabs.buttonMaxWidth": 180,
  "profileTabs.labelFontSize": 12,

  "header.imageSize": 112,
  "header.ringBorderWidth": 4,
  "header.ringInset": 4,
  "header.avatarRowGap": 12,
  "header.settingsSize": 40,
  "header.settingsIconSize": 18,
  "header.badgeFontSize": 12,
  "header.badgeIconSize": 16,
  "header.badgesRowGap": 8,
  "header.headingFontSize": 20,
  "header.subtitleFontSize": 10,
  "header.subtitleLetterSpacing": 1.2,
  "header.borderRadius": 40,
  "header.paddingHorizontal": 16,
  "header.paddingTop": 16,
  "header.paddingBottom": 36,

  "dayProgressCard.marginHorizontal": 24,
  "dayProgressCard.marginTop": -24,
  "dayProgressCard.borderRadius": 16,
  "dayProgressCard.padding": 16,
  "dayProgressCard.rowMarginBottom": 8,
  "dayProgressCard.titleFontSize": 14,
  "dayProgressCard.subtitleFontSize": 9,
  "dayProgressCard.titleSubtitleGap": 2,
  "dayProgressCard.countFontSize": 16,
  "dayProgressCard.progressHeight": 16,
  "dayProgressCard.progressRadius": 8,

  "validateButton.containerPaddingHorizontal": 24,
  "validateButton.containerPaddingVertical": 16,
  "validateButton.buttonPaddingVertical": 16,
  "validateButton.buttonRadius": 24,
  "validateButton.buttonLabelFontSize": 20,
  "validateButton.buttonEmojiSize": 22,
  "validateButton.buttonGap": 8,
  "validateButton.minButtonHeight": 56,

  "momentSection.sectionRadius": 32,
  "momentSection.headerPaddingHorizontal": 24,
  "momentSection.headerPaddingVertical": 16,
  "momentSection.bodyPadding": 16,
  "momentSection.bodyGap": 24,
  "momentSection.activitiesGap": 24,
  "momentSection.titleSize": 18,
  "momentSection.countSize": 14,

  "activityCard.flowLeft": 20,
  "activityCard.flowTop": 60,
  "activityCard.flowBottom": 20,
  "activityCard.flowWidth": 4,
  "activityCard.headerPadding": 16,
  "activityCard.headerRadius": 16,
  "activityCard.leadingContainerSize": 40,
  "activityCard.statusSize": 36,
  "activityCard.titleFontSize": 16,
  "activityCard.taskIndent": 40,

  "stickerSlot.activitySize": 70,
  "stickerSlot.taskSize": 36,

  "taskRow.iconSize": 36,
  "taskRow.iconGlyphSize": 16,
  "taskRow.iconsGap": 8,
  "taskRow.paddingHorizontal": 12,
  "taskRow.paddingVertical": 10,
  "taskRow.borderRadius": 12,
  "taskRow.labelFontSize": 12,
  "taskRow.labelMarginRight": 8,
};

const EXPECTED_COMPACT: Record<string, number> = {
  "content.paddingHorizontal": 14,
  "content.paddingTop": 12,
  "content.paddingBottom": 108,
  "content.gap": 16,

  "profileTabs.containerGap": 6,
  "profileTabs.containerPaddingHorizontal": 1,
  "profileTabs.containerPaddingTop": 1,
  "profileTabs.containerPaddingBottom": 1,
  "profileTabs.buttonBorderWidth": 1.5,
  "profileTabs.buttonPaddingHorizontal": 7,
  "profileTabs.buttonPaddingVertical": 1,
  "profileTabs.buttonMaxWidth": 140,
  "profileTabs.labelFontSize": 11,

  "header.imageSize": 60,
  "header.ringBorderWidth": 3,
  "header.ringInset": 3,
  "header.avatarRowGap": 8,
  "header.settingsSize": 36,
  "header.settingsIconSize": 16,
  "header.badgeFontSize": 11,
  "header.badgeIconSize": 14,
  "header.badgesRowGap": 6,
  "header.headingFontSize": 18,
  "header.subtitleFontSize": 9,
  "header.subtitleLetterSpacing": 1,
  "header.borderRadius": 30,
  "header.paddingHorizontal": 14,
  "header.paddingTop": 10,
  "header.paddingBottom": 28,

  "dayProgressCard.marginHorizontal": 14,
  "dayProgressCard.marginTop": -18,
  "dayProgressCard.borderRadius": 12,
  "dayProgressCard.padding": 10,
  "dayProgressCard.rowMarginBottom": 4,
  "dayProgressCard.titleFontSize": 12,
  "dayProgressCard.subtitleFontSize": 8,
  "dayProgressCard.titleSubtitleGap": -2,
  "dayProgressCard.countFontSize": 14,
  "dayProgressCard.progressHeight": 12,
  "dayProgressCard.progressRadius": 6,

  "validateButton.containerPaddingHorizontal": 10,
  "validateButton.containerPaddingVertical": 8,
  "validateButton.buttonPaddingVertical": 10,
  "validateButton.buttonRadius": 20,
  "validateButton.buttonLabelFontSize": 16,
  "validateButton.buttonEmojiSize": 18,
  "validateButton.buttonGap": 6,
  "validateButton.minButtonHeight": 48,

  "momentSection.sectionRadius": 24,
  "momentSection.headerPaddingHorizontal": 16,
  "momentSection.headerPaddingVertical": 10,
  "momentSection.bodyPadding": 10,
  "momentSection.bodyGap": 14,
  "momentSection.activitiesGap": 6,
  "momentSection.titleSize": 15,
  "momentSection.countSize": 12,

  "activityCard.flowLeft": 16,
  "activityCard.flowTop": 50,
  "activityCard.flowBottom": 14,
  "activityCard.flowWidth": 3,
  "activityCard.headerPadding": 10,
  "activityCard.headerRadius": 14,
  "activityCard.headerMarginBottom": 4,
  "activityCard.leadingContainerSize": 34,
  "activityCard.statusSize": 28,
  "activityCard.titleFontSize": 12,
  "activityCard.taskIndent": 20,
  "activityCard.taskGap": 4,

  "stickerSlot.activitySize": 40,
  "stickerSlot.taskSize": 20,

  "taskRow.iconSize": 20,
  "taskRow.iconGlyphSize": 12,
  "taskRow.iconsGap": 5,
  "taskRow.paddingHorizontal": 6,
  "taskRow.paddingVertical": 6,
  "taskRow.borderRadius": 10,
  "taskRow.labelFontSize": 11,
  "taskRow.labelMarginRight": 6,
};

test("HOME smartphone threshold contract is fixed", () => {
  assertEqual(HOME_SMARTPHONE_MAX_WIDTH, 500, "HOME_SMARTPHONE_MAX_WIDTH");
});

test("homeResponsiveCore active compact on native smartphone width only", () => {
  assertTrue(isSmartphoneHomeViewportByContext(390, { platform: "native" }), "native 390");
  assertTrue(isSmartphoneHomeViewportByContext(500, { platform: "native" }), "native 500");
  assertFalse(isSmartphoneHomeViewportByContext(501, { platform: "native" }), "native 501");
  assertFalse(isSmartphoneHomeViewportByContext(0, { platform: "native" }), "native width 0");
});

test("homeResponsiveCore active compact on web phone UA only", () => {
  assertTrue(
    isSmartphoneHomeViewportByContext(390, {
      platform: "web",
      userAgent: PHONE_UA,
    }),
    "web phone"
  );
  assertTrue(
    isSmartphoneHomeViewportByContext(500, {
      platform: "web",
      userAgent: PHONE_UA,
    }),
    "web phone boundary"
  );
  assertFalse(
    isSmartphoneHomeViewportByContext(501, {
      platform: "web",
      userAgent: PHONE_UA,
    }),
    "web phone width over threshold"
  );
});

test("homeResponsiveCore keeps tablet/desktop web out of compact mode", () => {
  assertFalse(
    isSmartphoneHomeViewportByContext(390, {
      platform: "web",
      userAgent: TABLET_UA,
    }),
    "web tablet UA"
  );
  assertFalse(
    isSmartphoneHomeViewportByContext(390, {
      platform: "web",
      userAgent: DESKTOP_UA,
    }),
    "web desktop UA"
  );
  assertFalse(
    isSmartphoneHomeViewportByContext(390, {
      platform: "web",
      userAgent: "",
    }),
    "web empty UA"
  );
});

test("HOME layout metrics expose all compact pairs", () => {
  const pairs = collectCompactMetrics(HOME_LAYOUT_METRICS);
  assertEqual(pairs.length, 91, "nombre de metriques compactees");
});

test("HOME layout metrics keep compact strictly smaller than regular", () => {
  const pairs = collectCompactMetrics(HOME_LAYOUT_METRICS);

  for (const [path, metric] of pairs) {
    if (metric.regular < 0 || metric.compact < 0) {
      continue;
    }
    if (!(metric.compact < metric.regular)) {
      fail(`metric ${path}: compact (${metric.compact}) doit etre < regular (${metric.regular})`);
    }
  }
});

test("HOME layout metrics keep desktop/tablet regular values unchanged", () => {
  const index = toMetricIndex(HOME_LAYOUT_METRICS);

  for (const [path, expected] of Object.entries(EXPECTED_REGULAR)) {
    const metric = index[path];
    if (!metric) {
      fail(`metric manquante: ${path}`);
    }
    assertEqual(metric.regular, expected, `regular ${path}`);
  }
});

test("HOME layout metrics keep smartphone compact values aligned", () => {
  const index = toMetricIndex(HOME_LAYOUT_METRICS);

  for (const [path, expected] of Object.entries(EXPECTED_COMPACT)) {
    const metric = index[path];
    if (!metric) {
      fail(`metric manquante: ${path}`);
    }
    assertEqual(metric.compact, expected, `compact ${path}`);
  }
});

test("resolveCompactMetric picks expected branch", () => {
  const metric: CompactMetric = { regular: 100, compact: 80 };
  assertEqual(resolveCompactMetric(metric, false), 100, "resolve regular");
  assertEqual(resolveCompactMetric(metric, true), 80, "resolve compact");
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
